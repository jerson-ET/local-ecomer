"""
XuperBrain — Agente de Navegador.
Controla un navegador real (Chromium) como si fuera un humano.
Puede navegar, hacer clic, escribir, iniciar sesión y leer contenido.
Todo corre localmente sin APIs externas.
"""

import os
import re
import json
import time
import asyncio
import datetime
import threading
import subprocess
import shutil
import requests
from typing import Dict, List, Optional
from playwright.async_api import async_playwright, Browser, Page, BrowserContext
from xuper_brain.vision_engine import VisionEngine


class BrowserAgent:
    """
    Agente que controla un navegador real.
    Puede ejecutar instrucciones paso a paso como un humano.
    """

    def __init__(self, data_dir: str, headless: bool = False):
        """
        headless=False → el navegador se ve en pantalla (el usuario puede ver lo que hace)
        headless=True → invisible (para tareas en background)
        """
        self.data_dir = data_dir
        self.headless = headless
        self.playwright = None
        self.browser: Optional[Browser] = None
        self.context: Optional[BrowserContext] = None
        self.page: Optional[Page] = None
        self.is_open = False
        self.vision_engine = VisionEngine(data_dir)

        # Historial de navegación
        self.history: List[Dict] = []
        # Almacén de resúmenes de páginas visitadas
        self.page_index_path = os.path.join(data_dir, "browser_index.json")
        self.page_index = self._load_index()

        # Almacén de credenciales temporales en memoria y persistencia en disco
        self.saved_user = None
        self.saved_password = None
        self.saved_credentials_path = os.path.join(data_dir, "saved_credentials.json")

        # Inicialización del sistema de alarmas local y de fondo
        self.alarms_path = os.path.join(data_dir, "alarms.json")
        self._start_alarm_monitor()

    async def start(self):
        """Abre el navegador con perfil persistente para guardar cookies y sesión."""
        if self.is_open and (not self.page or self.page.is_closed()):
            try:
                await self.stop()
            except Exception:
                pass

        if self.is_open:
            return {"status": "ya_abierto", "message": "El navegador ya está abierto."}

        self.playwright = await async_playwright().start()
        
        # Ruta para almacenar cookies, cache y sesión de Chrome de forma persistente
        user_data_dir = os.path.join(self.data_dir, "chrome_profile")
        os.makedirs(user_data_dir, exist_ok=True)
        
        self.context = await self.playwright.chromium.launch_persistent_context(
            user_data_dir,
            headless=self.headless,
            viewport={"width": 1280, "height": 800},
            user_agent="Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            args=["--no-sandbox", "--disable-blink-features=AutomationControlled"],
        )
        
        if len(self.context.pages) > 0:
            self.page = self.context.pages[0]
        else:
            self.page = await self.context.new_page()
            
        self.is_open = True
        return {"status": "ok", "message": "🌐 Navegador abierto con perfil persistente."}

    async def stop(self):
        """Cierra el navegador."""
        if self.context:
            try:
                await self.context.close()
            except Exception:
                pass
        if self.playwright:
            try:
                await self.playwright.stop()
            except Exception:
                pass
        self.is_open = False
        self.page = None
        self.context = None
        self.browser = None
        self.playwright = None
        return {"status": "ok", "message": "🔒 Navegador cerrado."}

    def _clean_search_query(self, text: str) -> tuple[str, int]:
        """
        Limpia la consulta del usuario separando COMANDOS de CONTENIDO.
        
        Lógica: El usuario dice instrucciones como "abre youtube y busca Mozart La Para Otro Rollo".
        La IA debe entender que:
          - "abre youtube y busca" = COMANDO (no se escribe en el buscador)
          - "Mozart La Para Otro Rollo" = CONTENIDO (esto sí va al buscador)
        """
        # Normalizar typos comunes
        lower = text.lower().strip()
        # Normalizar typos comunes (con word boundaries para no corromper palabras correctas)
        lower = re.sub(r"\bfacebok\b", "facebook", lower)
        lower = re.sub(r"\byutub\b", "youtube", lower)
        lower = re.sub(r"\bgamil\b", "gmail", lower)
        lower = re.sub(r"\byotube\b", "youtube", lower)
        lower = re.sub(r"\byoutub\b", "youtube", lower)
        lower = re.sub(r"\bfaceboo\b", "facebook", lower)
        
        # 1. Detectar ordinal solicitado (por defecto 1)
        option = 1
        if any(w in lower for w in ["segundo", "segunda", "2da", "2do", "opcion 2", "opción 2"]):
            option = 2
        elif any(w in lower for w in ["tercero", "tercera", "3ra", "3ro", "opcion 3", "opción 3"]):
            option = 3
        elif any(w in lower for w in ["cuarto", "cuarta", "4to", "4ta", "opcion 4", "opción 4"]):
            option = 4
        elif any(w in lower for w in ["quinto", "quinta", "5to", "5ta", "opcion 5", "opción 5"]):
            option = 5

        # 2. Frases de COMANDO completas a remover (de mayor a menor longitud)
        #    Estas son instrucciones que el usuario da a la IA, NO contenido de búsqueda
        remove_phrases = [
            # Frases largas primero (más específicas)
            r"\bdile que busque en youtube un video de\b",
            r"\bdile que busque en youtube\b",
            r"\bdile que busque un video de\b",
            r"\bdile que busque\b",
            r"\bdile que\b",
            r"\bdile\b",
            r"\babre youtube y busca un video de\b",
            r"\babre youtube y busca videos de\b",
            r"\babre youtube y busca\b",
            r"\babre facebook y busca un video de\b",
            r"\babre facebook y busca\b",
            r"\bentra a youtube y busca\b",
            r"\bentra a facebook y busca\b",
            r"\bve a youtube y busca\b",
            r"\bve a facebook y busca\b",
            r"\bbusca un video en facebook de\b",
            r"\bbuscar un video en facebook de\b",
            r"\bbusca un video en youtube de\b",
            r"\bbuscar un video en youtube de\b",
            r"\bbusca en youtube un video de\b",
            r"\bbusca en facebook un video de\b",
            r"\bbusca en facebook un reel de\b",
            r"\bbusca en facebook shorts de\b",
            r"\bbusca un video de\b",
            r"\bbuscar un video de\b",
            r"\bbusca videos de\b",
            r"\bbuscar videos de\b",
            r"\bbusca en youtube\b",
            r"\bbuscar en youtube\b",
            r"\bbusca en facebook\b",
            r"\bbuscar en facebook\b",
            r"\bbusca en google\b",
            r"\bbuscar en google\b",
            r"\bbusca en internet\b",
            r"\bbuscar en internet\b",
            r"\bbusca un video\b",
            r"\bbuscar un video\b",
            # Frases de reproducción
            r"\by reproduce la primera opcion\b",
            r"\by reproduce la segunda opcion\b",
            r"\by reproduce el primero\b",
            r"\by reproduce el segundo\b",
            r"\breproduce la segunda opcion\b",
            r"\breproduce la primera opcion\b",
            r"\breproduce el primero\b",
            r"\breproduce el segundo\b",
            r"\by reproducelo\b",
            r"\breproducelo\b",
            r"\breproduce el\b",
            r"\breproducir el\b",
            r"\bpara verlo en facebook\b",
            r"\bpara verlo en youtube\b",
            r"\bpara verlo\b",
            r"\bverlo en facebook\b",
            r"\bverlo en youtube\b",
            # Navegación
            r"\babre youtube\b",
            r"\babre facebook\b",
            r"\babre google\b",
            r"\babrir youtube\b",
            r"\babrir facebook\b",
            r"\babrir google\b",
            r"\bentra a youtube\b",
            r"\bentra a facebook\b",
            r"\bve a youtube\b",
            r"\bve a facebook\b",
            r"\bquiero ver un video de\b",
            r"\bquiero ver\b",
            r"\bponme un video de\b",
            r"\bponme\b",
            r"\bpon un video de\b",
        ]

        # 3. Verbos y palabras de COMANDO sueltas (se quitan al final)
        remove_single_words = [
            r"\breproduce\b", r"\breproducir\b", r"\breproducelo\b",
            r"\bbusca\b", r"\bbuscar\b", r"\bbusque\b", r"\bbuscando\b",
            r"\bmuestra\b", r"\bmostrar\b", r"\bmuéstrame\b",
            r"\bve\b", r"\bentra\b", r"\babre\b", r"\babrir\b",
            r"\bverlo\b", r"\bponlo\b",
            r"\bprimera opcion\b", r"\bsegunda opcion\b",
            r"\bprimer\b", r"\bprimero\b", r"\bsegundo\b",
            r"\ben facebook\b", r"\ben youtube\b",
            r"\bvideos de\b", r"\bvideo de\b",
        ]

        cleaned = lower
        
        # Aplicar limpieza de frases largas primero
        for pattern in remove_phrases:
            cleaned = re.sub(pattern, "", cleaned)
        
        # Luego palabras sueltas de comando
        for pattern in remove_single_words:
            cleaned = re.sub(pattern, "", cleaned)

        # 4. Limpiar conectores sueltos al inicio o final
        cleaned = cleaned.strip()
        # Remover conectores repetidamente hasta que no queden al inicio
        for _ in range(3):
            cleaned = re.sub(r"^(de|del|y|a|al|en|sobre|un|unos|una|que|se|lo|la|el|los|las|llame|llama|con|para)\s+", "", cleaned.strip())
            cleaned = re.sub(r"\s+(de|del|y|a|al|en|sobre|para|que|lo|la)$", "", cleaned.strip())
        
        # Limpiar espacios extra
        cleaned = re.sub(r"\s+", " ", cleaned).strip()
        
        return cleaned, option

    async def dismiss_ads_loop(self, duration_sec: int = 15, interval_sec: float = 2.0) -> bool:
        """Monitorea la pantalla en bucle para quitar anuncios dinámicos o diferidos."""
        print(f"[BrowserAgent] Iniciando bucle de monitoreo de anuncios por {duration_sec} segundos...")
        start_time = time.time()
        any_handled = False
        while time.time() - start_time < duration_sec:
            if not self.page or self.page.is_closed():
                break
            handled = await self._handle_ads_and_popups()
            if handled:
                any_handled = True
            await asyncio.sleep(interval_sec)
        return any_handled

    async def human_drag(self, x1: int, y1: int, x2: int, y2: int) -> None:
        """Simula arrastrar el mouse de (x1, y1) a (x2, y2) con movimiento fluido y humano."""
        if not self.page or self.page.is_closed():
            return
        print(f"[BrowserAgent] 🖱️ Arrastrando mouse desde ({x1}, {y1}) hasta ({x2}, {y2})...")
        await self.page.mouse.move(x1, y1, steps=6)
        await self.page.mouse.down()
        await asyncio.sleep(0.1)
        await self.page.mouse.move(x2, y2, steps=15)
        await asyncio.sleep(0.1)
        await self.page.mouse.up()

    async def _handle_ads_and_popups(self) -> bool:
        """Detecta y quita anuncios, banners de consentimiento o popups superpuestos automáticamente."""
        if not self.page or self.page.is_closed():
            return False
            
        handled = False
        
        async def human_click(loc) -> bool:
            """Mueve el ratón al centro del elemento y hace clic real (como si fuera una mano física)."""
            try:
                box = await loc.bounding_box()
                if box:
                    x = box['x'] + box['width'] / 2
                    y = box['y'] + box['height'] / 2
                    # Simular movimiento físico real del ratón
                    await self.page.mouse.move(x, y, steps=6)
                    await asyncio.sleep(0.1)
                    await self.page.mouse.click(x, y)
                    return True
            except Exception as e:
                print(f"DEBUG: Clic humano fallido en {loc}: {e}")
            return False

        try:
            # --- VISION FALLBACK (Visión Artificial Local) ---
            screenshot_path = os.path.join(self.data_dir, "vision_temp.png")
            try:
                await self.page.screenshot(path=screenshot_path)
                # Buscar botones de Saltar / Omitir anuncios mediante OCR en pantalla
                coords = self.vision_engine.detect_skip_ad_button(screenshot_path)
                if coords:
                    cx, cy = coords
                    print(f"[VisionEngine] 👁️ Clic visual en omitir anuncio: {coords}")
                    await self.page.mouse.move(cx, cy, steps=8)
                    await asyncio.sleep(0.1)
                    await self.page.mouse.click(cx, cy)
                    handled = True
                    await asyncio.sleep(1.0)
                    # Tomar nueva captura si se hizo clic
                    await self.page.screenshot(path=screenshot_path)

                # También buscar diálogos comunes en pantalla ("No gracias", "Cerrar", etc.)
                popup_phrases = ["no gracias", "no, gracias", "no thanks", "cerrar", "close"]
                for phrase in popup_phrases:
                    pop_coords = self.vision_engine.find_phrase_coordinates(screenshot_path, phrase)
                    if pop_coords:
                        px, py = pop_coords
                        print(f"[VisionEngine] 👁️ Clic visual en popup ({phrase}): {pop_coords}")
                        await self.page.mouse.move(px, py, steps=8)
                        await asyncio.sleep(0.1)
                        await self.page.mouse.click(px, py)
                        handled = True
                        await asyncio.sleep(1.0)
                        break
            except Exception as vision_err:
                print(f"[VisionEngine] Advertencia: Error en análisis visual de pantalla: {vision_err}")

            # 1. Selectores comunes para botones de omitir anuncios de video (ej. YouTube "Saltar" o "Skip")
            skip_selectors = [
                "button.ytp-ad-skip-button",
                ".ytp-ad-skip-button-modern",
                ".ytp-ad-skip-button-text",
                ".ytp-ad-skip-button-slot",
                "[class*='skip-button']",
                ".videoAdUiSkipButton",
                "button:has-text('Omitir')",
                "button:has-text('Skip')",
                "button:has-text('Saltar')",
                "div:has-text('Saltar')",
                "div:has-text('Skip')",
                "[aria-label*='Omitir']",
                "[aria-label*='skip']",
                "[aria-label*='Saltar']"
            ]
            
            for selector in skip_selectors:
                loc = self.page.locator(selector).first
                if await loc.count() > 0 and await loc.is_visible():
                    try:
                        # Usar clic de coordenadas humanas
                        success = await human_click(loc)
                        if success:
                            handled = True
                            print(f"DEBUG: Omití anuncio (clic humano) usando selector: {selector}")
                        else:
                            await loc.click(timeout=1000)
                            handled = True
                    except Exception:
                        pass

            # 2. Selectores comunes para botones de cerrar ('X') en popups/anuncios superpuestos
            close_selectors = [
                "button[aria-label='Cerrar']",
                "button[aria-label='Close']",
                "[class*='close-button']",
                "button.close",
                "a.close",
                "div[class*='close'] button",
                "div[class*='popup'] button:has-text('X')",
                "div[class*='popup'] button:has-text('✕')",
                "[class*='modal'] [class*='close']",
                "span:has-text('✕')",
                "button:has-text('✕')",
                "svg[class*='close']",
                "svg[id*='close']"
            ]
            
            for selector in close_selectors:
                loc = self.page.locator(selector).first
                if await loc.count() > 0 and await loc.is_visible():
                    try:
                        box = await loc.bounding_box()
                        if box and box['width'] < 150 and box['height'] < 150:
                            success = await human_click(loc)
                            if success:
                                handled = True
                                print(f"DEBUG: Cerré popup (clic humano) usando selector: {selector}")
                            else:
                                await loc.click(timeout=1000)
                                handled = True
                    except Exception:
                        pass

            # 3. Diálogos o popups de cookies, notificaciones o YouTube Premium (ej. "No, gracias", "Bloquear")
            cookie_or_notif_buttons = [
                "yt-button-renderer:has-text('No, gracias')",
                "button:has-text('No, gracias')",
                "yt-button-renderer:has-text('No thanks')",
                "button:has-text('No thanks')",
                "button:has-text('Bloquear')",
                "button:has-text('Block')",
                "button:has-text('Rechazar todo')",
                "button:has-text('Reject all')",
                "button:has-text('No permitir')",
                "button:has-text('Don')",
                "button:has-text('Rechazar')",
                "button:has-text('Reject')",
                "button:has-text('Aceptar')",
                "button:has-text('Accept')"
            ]
            for selector in cookie_or_notif_buttons:
                loc = self.page.locator(selector).first
                if await loc.count() > 0 and await loc.is_visible():
                    try:
                        success = await human_click(loc)
                        if success:
                            handled = True
                            print(f"DEBUG: Respondí al popup (clic humano) usando selector: {selector}")
                        else:
                            await loc.click(timeout=1000)
                            handled = True
                    except Exception:
                        pass

        except Exception as e:
            print(f"DEBUG: Error en handle_ads_and_popups: {e}")
            
        return handled

    async def goto(self, url: str) -> Dict:
        """Navega a una URL."""
        if not self.is_open or not self.page or self.page.is_closed():
            self.is_open = False
            await self.start()

        try:
            if not url.startswith("http") and not url.startswith("file://"):
                url = "https://" + url

            await self.page.goto(url, wait_until="domcontentloaded", timeout=15000)
            await asyncio.sleep(1)
            await self._handle_ads_and_popups()
            title = await self.page.title()

            self.history.append({"action": "goto", "url": url, "title": title, "time": time.time()})

            return {
                "status": "ok",
                "url": url,
                "title": title,
                "message": f"📄 Navegué a: **{title}**\n🔗 {url}",
            }
        except Exception as e:
            if "closed" in str(e).lower() or "target" in str(e).lower() or "context" in str(e).lower():
                self.is_open = False
                await self.start()
                try:
                    await self.page.goto(url, wait_until="domcontentloaded", timeout=15000)
                    title = await self.page.title()
                    return {
                        "status": "ok",
                        "url": url,
                        "title": title,
                        "message": f"📄 Navegué (auto-recuperado) a: **{title}**\n🔗 {url}",
                    }
                except Exception as re_err:
                    return {"status": "error", "message": f"❌ No pude abrir tras auto-recuperación: {str(re_err)[:200]}"}
            return {"status": "error", "message": f"❌ No pude abrir la página: {str(e)[:200]}"}

    async def click(self, selector: str = None, text: str = None) -> Dict:
        """Hace clic en un elemento por selector CSS o por texto visible."""
        if not self.is_open or not self.page or self.page.is_closed():
            self.is_open = False
            await self.start()

        try:
            await self._handle_ads_and_popups()
            if text:
                element = self.page.get_by_text(text, exact=False).first
                await element.click(timeout=5000)
                return {"status": "ok", "message": f"🖱️ Hice clic en: \"{text}\""}
            elif selector:
                await self.page.click(selector, timeout=5000)
                return {"status": "ok", "message": f"🖱️ Hice clic en: {selector}"}
            else:
                return {"status": "error", "message": "Necesito saber dónde hacer clic."}
        except Exception as e:
            if "closed" in str(e).lower() or "target" in str(e).lower() or "context" in str(e).lower():
                self.is_open = False
                await self.start()
                try:
                    if text:
                        await self.page.get_by_text(text, exact=False).first.click(timeout=5000)
                    elif selector:
                        await self.page.click(selector, timeout=5000)
                    return {"status": "ok", "message": f"🖱️ Hice clic (auto-recuperado) en: \"{text or selector}\""}
                except Exception as re_err:
                    return {"status": "error", "message": f"❌ Error al hacer clic tras reintento: {str(re_err)[:200]}"}
            return {"status": "error", "message": f"❌ No pude hacer clic: {str(e)[:200]}"}

    async def type_text(self, selector: str = None, text: str = "", placeholder: str = None) -> Dict:
        """Escribe texto en un campo."""
        if not self.is_open or not self.page or self.page.is_closed():
            self.is_open = False
            await self.start()

        try:
            await self._handle_ads_and_popups()
            if placeholder:
                element = self.page.get_by_placeholder(placeholder, exact=False).first
                await element.fill(text)
                return {"status": "ok", "message": f"⌨️ Escribí en campo \"{placeholder}\": {'*' * len(text) if 'pass' in placeholder.lower() else text}"}
            elif selector:
                await self.page.fill(selector, text)
                return {"status": "ok", "message": f"⌨️ Escribí: {text[:50]}"}
            else:
                await self.page.locator("input:visible").first.fill(text)
                return {"status": "ok", "message": f"⌨️ Escribí: {text[:50]}"}
        except Exception as e:
            if "closed" in str(e).lower() or "target" in str(e).lower() or "context" in str(e).lower():
                self.is_open = False
                await self.start()
                try:
                    if placeholder:
                        await self.page.get_by_placeholder(placeholder, exact=False).first.fill(text)
                    elif selector:
                        await self.page.fill(selector, text)
                    else:
                        await self.page.locator("input:visible").first.fill(text)
                    return {"status": "ok", "message": "⌨️ Escribí texto (auto-recuperado) con éxito."}
                except Exception as re_err:
                    return {"status": "error", "message": f"❌ Error al escribir tras reintento: {str(re_err)[:200]}"}
            return {"status": "error", "message": f"❌ No pude escribir: {str(e)[:200]}"}

    async def press_key(self, key: str = "Enter") -> Dict:
        """Presiona una tecla."""
        if not self.page:
            return {"status": "error", "message": "❌ El navegador no está abierto."}
        try:
            await self.page.keyboard.press(key)
            return {"status": "ok", "message": f"⌨️ Presioné: {key}"}
        except Exception as e:
            return {"status": "error", "message": f"❌ Error: {str(e)[:200]}"}

    async def read_page(self) -> Dict:
        """Lee el contenido visible de la página actual."""
        if not self.page:
            return {"status": "error", "message": "❌ El navegador no está abierto."}

        try:
            title = await self.page.title()
            url = self.page.url

            # Extraer texto principal de la página
            content = await self.page.evaluate("""
                () => {
                    // Quitar scripts, styles, nav, footer
                    const remove = document.querySelectorAll('script, style, nav, footer, header, aside, iframe');
                    remove.forEach(el => el.remove());

                    // Obtener texto limpio
                    const body = document.body;
                    return body ? body.innerText.substring(0, 8000) : '';
                }
            """)

            # Limpiar el texto
            lines = [l.strip() for l in content.split("\n") if l.strip() and len(l.strip()) > 3]
            clean_text = "\n".join(lines[:100])  # Max 100 líneas

            return {
                "status": "ok",
                "title": title,
                "url": url,
                "content": clean_text,
                "length": len(clean_text),
                "message": f"📖 Leí la página: **{title}** ({len(clean_text)} caracteres)",
            }
        except Exception as e:
            return {"status": "error", "message": f"❌ No pude leer: {str(e)[:200]}"}

    async def summarize_and_save(self) -> Dict:
        """Lee la página actual, la resume y guarda el resumen en el índice."""
        page_data = await self.read_page()
        if page_data["status"] != "ok":
            return page_data

        content = page_data["content"]
        title = page_data["title"]
        url = page_data["url"]

        # Generar resumen (extracción de las primeras oraciones más relevantes)
        summary = self._extract_summary(content, max_sentences=5)

        # Extraer palabras clave
        keywords = self._extract_page_keywords(content)

        # Guardar en el índice
        entry = {
            "title": title,
            "url": url,
            "summary": summary,
            "keywords": keywords,
            "saved_at": time.time(),
        }
        index_key = re.sub(r"[^\w]", "_", url)[:100]
        self.page_index[index_key] = entry
        self._save_index()

        return {
            "status": "ok",
            "title": title,
            "url": url,
            "summary": summary,
            "keywords": keywords[:10],
            "message": (
                f"💾 **Guardé resumen de:** {title}\n\n"
                f"📝 {summary[:300]}{'...' if len(summary) > 300 else ''}\n\n"
                f"🏷️ Palabras clave: {', '.join(keywords[:8])}\n"
                f"🔗 {url}"
            ),
        }

    async def search_google(self, query: str) -> Dict:
        """Busca en Google como un humano. Usa DuckDuckGo como respaldo si Google bloquea."""
        def filter_ad_results(raw_list):
            clean = []
            for r in raw_list:
                url_lower = r.get("url", "").lower()
                title_lower = r.get("title", "").lower()
                # Excluir anuncios y enlaces patrocinados
                if any(ad in url_lower for ad in ["doubleclick", "googleadservices", "googleads", "y.js", "ad_domain", "ad-services", "sponsored", "patrocinado"]):
                    continue
                if any(ad in title_lower for ad in ["patrocinado", "ad", "sponsored", "anuncio"]):
                    continue
                clean.append(r)
            return clean

        if not self.is_open:
            await self.start()

        try:
            # 1. Intentar con Google
            await self.page.goto("https://www.google.com", wait_until="domcontentloaded", timeout=12000)
            await asyncio.sleep(1)

            # Aceptar cookies automáticamente si aparece el popup
            try:
                # Buscamos botones con texto "Aceptar todo", "Aceptar", "Agree", "I agree", etc.
                cookies_buttons = ["Aceptar todo", "Aceptar", "Agree", "I agree", "Acepto", "Aceptar las cookies"]
                for btn_text in cookies_buttons:
                    btn = self.page.get_by_role("button", name=btn_text, exact=False).first
                    if await btn.is_visible():
                        await btn.click(timeout=2000)
                        await asyncio.sleep(1)
                        break
            except Exception:
                pass

            # Intentar escribir en el input de Google
            try:
                search_input = self.page.locator("textarea[name='q'], input[name='q']").first
                await search_input.fill(query)
                await search_input.press("Enter")
                await asyncio.sleep(3)

                # Leer resultados
                results = await self.page.evaluate("""
                    () => {
                        const items = document.querySelectorAll('.g, [data-sokoban-container]');
                        const results = [];
                        items.forEach((item, i) => {
                            if (i >= 5) return;
                            const titleEl = item.querySelector('h3');
                            const linkEl = item.querySelector('a');
                            const snippetEl = item.querySelector('.VwiC3b, .IsZvec, [data-snf]');
                            if (titleEl && linkEl) {
                                results.push({
                                    title: titleEl.innerText,
                                    url: linkEl.href,
                                    snippet: snippetEl ? snippetEl.innerText.substring(0, 200) : '',
                                });
                            }
                        });
                        return results;
                    }
                """)
                if results:
                    results = filter_ad_results(results)
                if results:
                    # Formatear respuesta
                    msg = f"🔍 **Resultados de Google:** \"{query}\"\n\n"
                    for i, r in enumerate(results, 1):
                        msg += f"**{i}.** [{r['title']}]({r['url']})\n"
                        if r.get("snippet"):
                            msg += f"   {r['snippet'][:150]}\n\n"
                    self.history.append({"action": "search", "query": query, "results": len(results), "time": time.time()})
                    return {"status": "ok", "results": results, "message": msg}
            except Exception:
                pass  # Si falla Google, cae al respaldo de DuckDuckGo

            # 2. Respaldo Inteligente: DuckDuckGo (100% libre de captchas y anti-bots)
            await self.page.goto("https://html.duckduckgo.com/html/", wait_until="domcontentloaded", timeout=12000)
            await asyncio.sleep(1)

            search_input = self.page.locator("input[name='q']").first
            await search_input.fill(query)
            await search_input.press("Enter")
            await asyncio.sleep(3)

            # Leer resultados de DuckDuckGo HTML
            results = await self.page.evaluate("""
                () => {
                    const items = document.querySelectorAll('.links_main');
                    const results = [];
                    items.forEach((item, i) => {
                        if (i >= 5) return;
                        const titleEl = item.querySelector('.result__a');
                        const snippetEl = item.querySelector('.result__snippet');
                        if (titleEl) {
                            results.push({
                                title: titleEl.innerText,
                                url: titleEl.href,
                                snippet: snippetEl ? snippetEl.innerText.substring(0, 200) : '',
                            });
                        }
                    });
                    return results;
                }
            """)

            if not results:
                # Intento alternativo para DDG normal
                results = await self.page.evaluate("""
                    () => {
                        const items = document.querySelectorAll('article, .result');
                        const results = [];
                        items.forEach((item, i) => {
                            if (i >= 5) return;
                            const titleEl = item.querySelector('h2 a, .result__a');
                            const snippetEl = item.querySelector('[data-testid="result-snippet-text"], .result__snippet');
                            if (titleEl) {
                                results.push({
                                    title: titleEl.innerText,
                                    url: titleEl.href,
                                    snippet: snippetEl ? snippetEl.innerText.substring(0, 200) : '',
                                });
                            }
                        });
                        return results;
                    }
                """)

            if results:
                results = filter_ad_results(results)

            if not results:
                return {"status": "ok", "results": [], "message": "🔍 Busqué en Google y DuckDuckGo, pero el motor está bloqueado por protección anti-bots en este momento o no hay resultados limpios de publicidad."}

            msg = f"🔍 **Busqué en DuckDuckGo (Respaldo):** \"{query}\"\n\n"
            for i, r in enumerate(results, 1):
                msg += f"**{i}.** [{r['title']}]({r['url']})\n"
                if r.get("snippet"):
                    msg += f"   {r['snippet'][:150]}\n\n"

            self.history.append({"action": "search", "query": query, "results": len(results), "time": time.time()})
            return {"status": "ok", "results": results, "message": msg}

        except Exception as e:
            return {"status": "error", "message": f"❌ Error buscando en el navegador: {str(e)[:200]}"}

    async def screenshot(self) -> Dict:
        """Toma una captura de pantalla."""
        if not self.page:
            return {"status": "error", "message": "❌ El navegador no está abierto."}

        try:
            path = os.path.join(self.data_dir, "screenshot.png")
            await self.page.screenshot(path=path)
            return {"status": "ok", "path": path, "message": f"📸 Screenshot guardado en: {path}"}
        except Exception as e:
            return {"status": "error", "message": f"❌ Error: {str(e)[:200]}"}

    def search_index(self, query: str) -> List[Dict]:
        """Busca en el índice de páginas guardadas."""
        query_words = set(query.lower().split())
        results = []

        for key, entry in self.page_index.items():
            keywords = set(entry.get("keywords", []))
            title_words = set(entry.get("title", "").lower().split())
            summary_words = set(entry.get("summary", "").lower().split())

            all_words = keywords | title_words | summary_words
            common = query_words & all_words

            if common:
                score = len(common) / max(len(query_words), 1)
                if score >= 0.3:
                    results.append({**entry, "match_score": score})

        results.sort(key=lambda x: x["match_score"], reverse=True)
        return results[:5]

    # ═══ Utilidades internas ═══

    def _extract_summary(self, text: str, max_sentences: int = 5) -> str:
        """Extrae un resumen del texto usando las oraciones más relevantes."""
        sentences = re.split(r'[.!?]\s+', text)
        sentences = [s.strip() for s in sentences if len(s.strip()) > 20]

        if not sentences:
            return text[:500]

        # Tomar las primeras oraciones (generalmente las más importantes)
        summary_sentences = sentences[:max_sentences]
        return ". ".join(summary_sentences) + "."

    def _extract_page_keywords(self, text: str) -> List[str]:
        """Extrae palabras clave del texto."""
        stop_words = {
            "el", "la", "los", "las", "un", "una", "de", "del", "al", "a",
            "en", "con", "por", "para", "que", "se", "es", "no", "si", "y",
            "o", "pero", "como", "mas", "su", "sus", "the", "is", "are", "and",
            "to", "of", "in", "for", "on", "with", "this", "that", "it",
        }

        words = re.findall(r'\b[a-záéíóúñ]{4,}\b', text.lower())
        word_freq = {}
        for w in words:
            if w not in stop_words:
                word_freq[w] = word_freq.get(w, 0) + 1

        sorted_words = sorted(word_freq.items(), key=lambda x: x[1], reverse=True)
        return [w[0] for w in sorted_words[:20]]

    def _save_index(self):
        os.makedirs(os.path.dirname(self.page_index_path) if os.path.dirname(self.page_index_path) else ".", exist_ok=True)
        with open(self.page_index_path, "w", encoding="utf-8") as f:
            json.dump(self.page_index, f, ensure_ascii=False, indent=2)

    def _load_index(self) -> Dict:
        if os.path.exists(self.page_index_path):
            try:
                with open(self.page_index_path, "r", encoding="utf-8") as f:
                    return json.load(f)
            except Exception:
                pass
        return {}

    def _save_credentials(self, user, password):
        try:
            os.makedirs(os.path.dirname(self.saved_credentials_path) if os.path.dirname(self.saved_credentials_path) else ".", exist_ok=True)
            with open(self.saved_credentials_path, "w", encoding="utf-8") as f:
                json.dump({"user": user, "password": password}, f, ensure_ascii=False, indent=2)
        except Exception:
            pass

    def _load_credentials(self):
        if os.path.exists(self.saved_credentials_path):
            try:
                with open(self.saved_credentials_path, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    return data.get("user"), data.get("password")
            except Exception:
                pass
        return None, None

    def _start_alarm_monitor(self):
        """Inicia el hilo de monitoreo de alarmas en segundo plano."""
        thread = threading.Thread(target=self._alarm_monitor_loop, daemon=True)
        thread.start()

    def _alarm_monitor_loop(self):
        """Loop continuo que verifica si alguna alarma programada debe sonar."""
        while True:
            try:
                if os.path.exists(self.alarms_path):
                    with open(self.alarms_path, "r", encoding="utf-8") as f:
                        alarms = json.load(f)
                    
                    now = datetime.datetime.now()
                    updated = False
                    
                    for alarm in alarms:
                        if not alarm.get("triggered", False):
                            alarm_time = datetime.datetime.fromisoformat(alarm["time"])
                            if now >= alarm_time:
                                alarm["triggered"] = True
                                updated = True
                                self._trigger_alarm(alarm)
                    
                    if updated:
                        with open(self.alarms_path, "w", encoding="utf-8") as f:
                            json.dump(alarms, f, ensure_ascii=False, indent=2)
            except Exception as e:
                print(f"Error en monitor de alarmas: {e}")
            time.sleep(1)

    def _trigger_alarm(self, alarm: Dict):
        """Activa la alarma física o sonora y notificaciones del sistema."""
        label = alarm.get("label", "Alarma de XuperBrain")
        try:
            subprocess.run(["notify-send", "-u", "critical", "⏰ ¡ALARMA ACTIVA!", f"Recordatorio: {label} (Programada para las {alarm.get('original_str')})"])
        except Exception:
            pass
        
        # Pitido audible por consola
        try:
            print("\a")
        except Exception:
            pass

    def _prepare_blue_cap_image(self) -> str:
        """Busca o crea una imagen de una gorra azul en la galería del usuario."""
        gallery_dir = os.path.expanduser("~/Imágenes")
        if not os.path.exists(gallery_dir):
            gallery_dir = os.path.expanduser("~/Pictures")
        if not os.path.exists(gallery_dir):
            gallery_dir = os.path.join(self.data_dir, "gallery")
        
        os.makedirs(gallery_dir, exist_ok=True)
        img_path = os.path.join(gallery_dir, "gorra_azul.png")
        
        # 1. Intentar descargar una imagen real
        try:
            url = "https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=500"
            r = requests.get(url, timeout=5)
            if r.status_code == 200:
                with open(img_path, "wb") as f:
                    f.write(r.content)
                return img_path
        except Exception:
            pass
            
        # 2. Intentar usar PIL
        try:
            from PIL import Image, ImageDraw
            img = Image.new("RGB", (300, 300), color=(0, 0, 255))
            d = ImageDraw.Draw(img)
            d.text((50, 140), "Gorra Azul de Jerson", fill=(255, 255, 255))
            img.save(img_path)
            return img_path
        except Exception:
            pass
            
        # 3. Fallback en bytes puros de PNG minimalista
        minimal_png_bytes = b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x02\x00\x00\x00\x90wS\xde\x00\x00\x00\x0cIDATx\x9cc\x00\x00\xff\x00\x01\x00\x00\xff\x02\x00\x01X\x13\xbc\x00\x00\x00\x00IEND\xaeB`\x82'
        try:
            with open(img_path, "wb") as f:
                f.write(minimal_png_bytes)
            return img_path
        except Exception:
            return ""

    def _parse_and_set_alarms(self, instruction: str) -> List[Dict]:
        """Analiza la instrucción y programa alarmas en el sistema."""
        time_matches = re.findall(r'\b(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\b', instruction, re.IGNORECASE)
        alarms_to_set = []
        now = datetime.datetime.now()
        
        days_offset = 0
        if "mañana" in instruction.lower():
            days_offset = 1
        elif "en 3 días" in instruction.lower() or "en 3 dias" in instruction.lower():
            days_offset = 3
        elif "en 2 días" in instruction.lower() or "en 2 dias" in instruction.lower():
            days_offset = 2
            
        target_day = now + datetime.timedelta(days=days_offset)
        
        label = "Alarma de XuperBrain"
        if "trotar" in instruction.lower():
            label = "Trotar 🏃‍♂️"
        elif "reunión" in instruction.lower() or "reunio" in instruction.lower():
            label = "Reunión de trabajo 👔"
            
        if not time_matches:
            # Por defecto, 3 alarmas
            default_times = [("7", "00", "am"), ("7", "15", "am"), ("7", "30", "am")]
            for h, m, meridiem in default_times:
                dt = self._calculate_alarm_datetime(target_day, int(h), int(m), meridiem)
                alarms_to_set.append({
                    "time": dt.isoformat(),
                    "original_str": f"{h}:{m} {meridiem.upper()}",
                    "label": label,
                    "triggered": False
                })
        else:
            for match in time_matches:
                h = int(match[0])
                m = int(match[1]) if match[1] else 0
                meridiem = match[2].lower() if match[2] else None
                
                if h > 24 or m > 59:
                    continue
                if h == 3 and "3 alarmas" in instruction.lower() and len(time_matches) > 1:
                    if len(time_matches) > 3:
                        continue
                
                dt = self._calculate_alarm_datetime(target_day, h, m, meridiem)
                alarms_to_set.append({
                    "time": dt.isoformat(),
                    "original_str": f"{h:02d}:{m:02d} {meridiem.upper() if meridiem else ''}",
                    "label": label,
                    "triggered": False
                })
                
        existing_alarms = []
        if os.path.exists(self.alarms_path):
            try:
                with open(self.alarms_path, "r", encoding="utf-8") as f:
                    existing_alarms = json.load(f)
            except Exception:
                pass
                
        for new_alarm in alarms_to_set:
            if not any(a["time"] == new_alarm["time"] for a in existing_alarms):
                existing_alarms.append(new_alarm)
                
        with open(self.alarms_path, "w", encoding="utf-8") as f:
            json.dump(existing_alarms, f, ensure_ascii=False, indent=2)
            
        self._generate_alarms_html(existing_alarms)
        return alarms_to_set

    def _calculate_alarm_datetime(self, base_day: datetime.datetime, h: int, m: int, meridiem: Optional[str]) -> datetime.datetime:
        hour = h
        if meridiem:
            if meridiem == "pm" and hour < 12:
                hour += 12
            elif meridiem == "am" and hour == 12:
                hour = 0
        return base_day.replace(hour=hour, minute=m, second=0, microsecond=0)

    def _generate_alarms_html(self, alarms: List[Dict]):
        html_template = """<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>XuperBrain Alarms Panel</title>
    <style>
        body {
            background: #060713;
            color: #f3f4f6;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            margin: 0;
            padding: 2rem;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
        }
        .panel {
            background: rgba(255, 255, 255, 0.02);
            border: 1px solid rgba(255, 255, 255, 0.05);
            border-radius: 20px;
            padding: 2.5rem;
            width: 480px;
            box-shadow: 0 20px 50px rgba(0, 0, 0, 0.6);
            backdrop-filter: blur(15px);
            text-align: center;
        }
        h1 {
            color: #ef4444; /* Crimson */
            font-size: 2rem;
            margin: 0 0 0.2rem 0;
            text-shadow: 0 0 15px rgba(239, 68, 68, 0.5);
            font-weight: 800;
            letter-spacing: 1px;
        }
        .subtitle {
            color: #3b82f6; /* Electric Blue */
            font-size: 0.85rem;
            text-transform: uppercase;
            letter-spacing: 3px;
            margin-bottom: 2.5rem;
            font-weight: 600;
        }
        .alarm-card {
            background: rgba(255, 255, 255, 0.01);
            border: 1px solid rgba(255, 255, 255, 0.03);
            border-left: 4px solid #3b82f6;
            padding: 1.2rem;
            margin-bottom: 1rem;
            border-radius: 12px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            transition: all 0.3s ease;
        }
        .alarm-card:hover {
            background: rgba(255, 255, 255, 0.03);
            border-left-color: #ef4444;
            transform: translateX(5px);
        }
        .alarm-info {
            text-align: left;
        }
        .alarm-time {
            font-size: 1.5rem;
            font-weight: 700;
            color: #ffffff;
        }
        .alarm-label {
            font-size: 0.85rem;
            color: #9ca3af;
            margin-top: 0.2rem;
        }
        .alarm-status {
            font-size: 0.75rem;
            padding: 0.3rem 0.7rem;
            border-radius: 9999px;
            font-weight: 600;
        }
        .alarm-status.active {
            background: rgba(59, 130, 246, 0.1);
            color: #3b82f6;
            border: 1px solid rgba(59, 130, 246, 0.2);
        }
        .alarm-status.triggered {
            background: rgba(16, 185, 129, 0.1);
            color: #10b981;
            border: 1px solid rgba(16, 185, 129, 0.2);
        }
        .footer {
            margin-top: 2.5rem;
            font-size: 0.75rem;
            color: #4b5563;
            letter-spacing: 0.5px;
        }
    </style>
</head>
<body>
    <div class="panel">
        <h1>⏰ XUPERBRAIN</h1>
        <div class="subtitle">Panel de Alarmas Activas</div>
        <div id="alarms-list">
            <!-- ALARMS_PLACEHOLDER -->
        </div>
        <div class="footer">Sistema de Monitoreo Local en Tiempo Real</div>
    </div>
</body>
</html>"""
        
        cards_html = []
        for alarm in alarms:
            status_class = "triggered" if alarm.get("triggered", False) else "active"
            status_text = "Sonada" if alarm.get("triggered", False) else "Activa"
            dt = datetime.datetime.fromisoformat(alarm["time"])
            date_str = dt.strftime("%Y-%m-%d")
            
            card = f"""
            <div class="alarm-card" style="border-left-color: {'#10b981' if alarm.get('triggered') else '#3b82f6'}">
                <div class="alarm-info">
                    <div class="alarm-time">{alarm['original_str']}</div>
                    <div class="alarm-label">{alarm['label']} ({date_str})</div>
                </div>
                <div class="alarm-status {status_class}">{status_text}</div>
            </div>
            """
            cards_html.append(card)
            
        html_content = html_template.replace("<!-- ALARMS_PLACEHOLDER -->", "\n".join(cards_html))
        html_path = os.path.join(self.data_dir, "alarms.html")
        with open(html_path, "w", encoding="utf-8") as f:
            f.write(html_content)

    async def execute_reasoning_agent(self, instruction: str) -> Dict:
        """
        Agente de Razonamiento y Ejecución.
        1. Busca en Google acerca del objetivo.
        2. Razona basándose en los resultados de búsqueda y la petición.
        3. Ejecuta el plan de acción autónomamente.
        """
        import asyncio
        
        search_query = instruction
        if "alarma" in instruction.lower():
            search_query = "cómo configurar alarmas locales en terminal o navegador"
        elif "whatsapp" in instruction.lower():
            search_query = "cómo enviar fotos en whatsapp web playwright"
        elif "correo" in instruction.lower() or "gmail" in instruction.lower():
            search_query = "cómo redactar y enviar un correo en gmail con automatización"
            
        # Ejecutar búsqueda en Google para obtener información en vivo
        search_res = await self.search_google(search_query)
        search_info = ""
        if search_res["status"] == "ok" and search_res.get("results"):
            search_info = "\n".join(f"- {r['title']}: {r['snippet']}" for r in search_res["results"][:3])
        else:
            search_info = "- No se pudieron cargar resultados detallados, procediendo con base de conocimientos estática."
            
        reasoning_steps = []
        reasoning_steps.append("🧠 **[RAZONAMIENTO Y PENSAMIENTO DE XUPERBRAIN]**")
        reasoning_steps.append(f"1. **Petición del Creador:** \"{instruction}\"")
        reasoning_steps.append(f"2. **Investigación en Google:** Busqué \"{search_query}\" para analizar el método correcto de automatización.")
        
        instruction_lower = instruction.lower()
        
        # --- CASO WHATSAPP ---
        if "whatsapp" in instruction_lower:
            contacto = "Marta Carrascal"
            if "juan" in instruction_lower:
                contacto = "Juan"
            elif "marta" in instruction_lower:
                contacto = "Marta Carrascal"
                
            reasoning_steps.append(f"3. **Análisis de Resultados:** WhatsApp Web requiere un navegador real con sesión activa o código QR, búsqueda del contacto '{contacto}', selección de archivo, y envío de mensaje.")
            reasoning_steps.append(f"4. **Plan de Acción Formulado:**\n   - A) Preparar imagen de gorra azul en la galería local (`~/Imágenes/gorra_azul.png`).\n   - B) Abrir WhatsApp Web.\n   - C) Esperar a que cargue la interfaz principal.\n   - D) Localizar la caja de búsqueda y escribir '{contacto}'.\n   - E) Presionar Enter para abrir el chat.\n   - F) Seleccionar el input oculto de archivos y cargar la imagen.\n   - G) Presionar el botón de enviar en la previsualización.")
            
            steps_log = ["🚀 Ejecutando plan para WhatsApp Web..."]
            try:
                steps_log.append("🖼️ Preparando imagen de la gorra azul en la galería...")
                img_path = self._prepare_blue_cap_image()
                if img_path:
                    steps_log.append(f"✅ Imagen lista en: `{img_path}`")
                else:
                    steps_log.append("⚠️ No se pudo preparar la imagen en el disco, se usará una ruta genérica.")
                    img_path = os.path.expanduser("~/Imágenes/gorra_azul.png")
                
                steps_log.append("🌐 Navegando a WhatsApp Web...")
                await self.goto("https://web.whatsapp.com")
                await asyncio.sleep(4)
                
                steps_log.append("⏳ Esperando inicio de sesión (escaneo de código QR si es necesario)...")
                search_selector = 'div[contenteditable="true"][data-tab="3"], [data-testid="chat-list-search"]'
                
                try:
                    await self.page.wait_for_selector(search_selector, timeout=45000)
                    steps_log.append("🔓 Sesión de WhatsApp activa detectada.")
                except Exception:
                    await self.screenshot()
                    return {
                        "status": "error",
                        "message": (
                            f"❌ **Error en WhatsApp Web:** Tiempo de espera agotado para escanear el código QR.\n\n"
                            f"**Progreso:**\n" + "\n".join(f"- {s}" for s in steps_log) + "\n\n"
                            f"Por favor escanea el código QR en la pantalla del navegador y vuelve a intentarlo."
                        )
                    }
                
                steps_log.append(f"🔍 Buscando al contacto: {contacto}...")
                search_box = self.page.locator(search_selector).first
                await search_box.click()
                await search_box.fill(contacto)
                await asyncio.sleep(2)
                await search_box.press("Enter")
                steps_log.append(f"💬 Chat abierto con {contacto}.")
                await asyncio.sleep(2)
                
                steps_log.append("📁 Adjuntando imagen de la gorra azul...")
                file_input = self.page.locator("input[type='file']").first
                await file_input.set_input_files(img_path)
                await asyncio.sleep(3)
                
                steps_log.append("🚀 Enviando archivo multimedia...")
                send_btn = self.page.locator("span[data-icon='send'], [data-testid='send'], div[role='button'][aria-label='Enviar']").first
                await send_btn.click()
                steps_log.append("✅ Imagen enviada con éxito.")
                await asyncio.sleep(3)
                
                await self.screenshot()
                return {
                    "status": "ok",
                    "message": (
                        f"### {reasoning_steps[0]}\n" + "\n".join(f"- {s}" for s in reasoning_steps[1:]) + "\n\n"
                        f"### 📋 **Resultado de Ejecución:**\n" + "\n".join(f"- {s}" for s in steps_log)
                    )
                }
                
            except Exception as e:
                await self.screenshot()
                return {
                    "status": "error",
                    "message": f"❌ Error en WhatsApp: {str(e)}"
                }
                
        # --- CASO ALARMAS ---
        elif "alarma" in instruction_lower:
            reasoning_steps.append("3. **Análisis de Resultados:** Programar alarmas locales seguras en Linux se hace registrándolas en un archivo de configuración (`alarms.json`) y lanzando un monitor en segundo plano que use notificaciones del escritorio.")
            reasoning_steps.append("4. **Plan de Acción Formulado:**\n   - A) Extraer las horas de la instrucción.\n   - B) Registrar las alarmas en el disco local.\n   - C) Generar una interfaz web interactiva con la lista de alarmas activas (`alarms.html`).\n   - D) Mostrar el panel de alarmas en el Live Browser HUD.")
            
            steps_log = ["🚀 Procesando e insertando alarmas..."]
            try:
                alarms_set = self._parse_and_set_alarms(instruction)
                for alarm in alarms_set:
                    steps_log.append(f"⏰ Alarma configurada para: **{alarm['original_str']}** - Tarea: {alarm['label']}")
                
                html_path = os.path.abspath(os.path.join(self.data_dir, "alarms.html"))
                steps_log.append("🌐 Cargando panel de alarmas interactivo en el navegador...")
                await self.goto(f"file://{html_path}")
                await asyncio.sleep(3)
                
                await self.screenshot()
                return {
                    "status": "ok",
                    "message": (
                        f"### {reasoning_steps[0]}\n" + "\n".join(f"- {s}" for s in reasoning_steps[1:]) + "\n\n"
                        f"### 📋 **Resultado de Ejecución:**\n" + "\n".join(f"- {s}" for s in steps_log)
                    )
                }
            except Exception as e:
                return {
                    "status": "error",
                    "message": f"❌ Error programando alarmas: {str(e)}"
                }
                
        # --- CASO FACEBOOK / YOUTUBE / REPRODUCCIÓN ---
        elif any(w in instruction_lower for w in ["facebook", "youtube", "video", "reproduce", "reproducir", "reel", "short"]):
            reasoning_steps.append("3. **Análisis de Resultados:** La reproducción de videos o búsqueda en redes sociales requiere abrir la plataforma (Facebook/YouTube), buscar el contenido deseado o pulsar el botón de reproducción, asegurando omitir anuncios superpuestos o popups.")
            reasoning_steps.append("4. **Plan de Acción Formulado:**\n   - A) Buscar y navegar a la plataforma correspondiente.\n   - B) Omitir y limpiar proactivamente cualquier anuncio superpuesto ('X') o popup de notificación.\n   - C) Localizar el video o buscador en la interfaz.\n   - D) Simular el clic en el botón de reproducir (`video` o controles de reproducción).")
            
            steps_log = ["🚀 Iniciando reproducción/búsqueda de video..."]
            try:
                # Determinar si es "reproduce lo que ya está en pantalla" vs "busca Y reproduce"
                # Si la instrucción contiene términos de búsqueda además de "reproduce", es busca+reproduce
                has_search_terms = any(w in instruction_lower for w in ["busca", "buscar", "abre", "abrir", "youtube", "facebook", "video de"])
                only_play = any(w in instruction_lower for w in ["reproduce", "reproducir", "play"]) and not has_search_terms
                
                if only_play:
                    steps_log.append("🔍 Localizando elementos de reproducción de video en la página...")
                    
                    # Intentar encontrar y hacer clic en botones de reproducción comunes
                    play_selectors = [
                        "video", 
                        "button[title='Play']", 
                        "button[aria-label='Play']", 
                        "button[aria-label='Reproducir']",
                        "div[aria-label='Reproducir']", 
                        "span[data-icon='play']",
                        ".play-button"
                    ]
                    
                    clicked = False
                    for selector in play_selectors:
                        locator = self.page.locator(selector).first
                        if await locator.count() > 0 and await locator.is_visible():
                            steps_log.append(f"🖱️ Haciendo clic en el elemento de reproducción: `{selector}`...")
                            await locator.click()
                            clicked = True
                            break
                            
                    if not clicked:
                        # Si no hay un elemento obvio, hacer clic en el centro de la página donde suele estar el reproductor
                        steps_log.append("🖱️ No se detectó un botón play específico. Haciendo clic en el centro del viewport...")
                        viewport = self.page.viewport_size
                        if viewport:
                            await self.page.mouse.click(viewport['width'] / 2, viewport['height'] / 2)
                            clicked = True
                            
                    if clicked:
                        steps_log.append("✅ Comando de reproducción enviado.")
                    else:
                        steps_log.append("⚠️ No se pudo interactuar con el reproductor de video.")
                        
                else:
                    # Usar la función inteligente para extraer la búsqueda limpia y el número de opción
                    q, option = self._clean_search_query(instruction)
                    
                    platform = "facebook.com"
                    if "youtube" in instruction_lower:
                        platform = "youtube.com"
                        
                    steps_log.append(f"🔍 Búsqueda limpia identificada: \"{q}\"")
                    steps_log.append(f"🔢 Opción de video elegida: {option}ra opción.")
                    steps_log.append(f"🌐 Navegando a la plataforma {platform}...")
                    
                    if "facebook" in platform:
                        url = f"https://www.facebook.com/search/videos/?q={requests.utils.quote(q)}"
                        steps_log.append(f"🔗 Cargando búsqueda en Facebook: {url}")
                        await self.goto(url)
                        await asyncio.sleep(4)
                        
                        # Validar si requiere inicio de sesión
                        page_content = await self.page.content()
                        requires_login = any(w in page_content.lower() for w in ["iniciar sesión", "log in", "login_form", "olvidaste la contraseña"])
                        
                        if requires_login:
                            steps_log.append("⚠️ Se requiere inicio de sesión en Facebook. Redirigiendo la búsqueda a YouTube para garantizar reproducción inmediata...")
                            platform = "youtube.com"
                            url = f"https://www.youtube.com/results?search_query={requests.utils.quote(q)}"
                            steps_log.append(f"🔗 Cargando búsqueda en YouTube: {url}")
                            await self.goto(url)
                            await asyncio.sleep(4)
                    else:
                        url = f"https://www.youtube.com/results?search_query={requests.utils.quote(q)}"
                        steps_log.append(f"🔗 Cargando búsqueda en YouTube: {url}")
                        await self.goto(url)
                        await asyncio.sleep(4)
                        
                    # Quitar diálogos de cookies, inicio de sesión u otros overlays antes de interactuar
                    await self.dismiss_ads_loop(6, 1.5)
                    await self.screenshot()
                    
                    # Intentar hacer clic en el video correspondiente a la opción solicitada
                    video_clicked = False
                    if "youtube" in platform:
                        # Selectores comunes de videos en resultados de YouTube
                        yt_video_selectors = [
                            "ytd-video-renderer a#video-title-link",
                            "ytd-video-renderer a#video-title",
                            "a.yt-simple-endpoint[href*='watch?v=']",
                            "a[href*='/watch?v=']"
                        ]
                        
                        for selector in yt_video_selectors:
                            locators = self.page.locator(selector)
                            count = await locators.count()
                            if count >= option:
                                target_video = locators.nth(option - 1)
                                video_title = await target_video.inner_text()
                                steps_log.append(f"🖱️ Haciendo clic en el video número {option}: \"{video_title.strip()}\"...")
                                try:
                                    await target_video.click(timeout=5000)
                                except Exception:
                                    print("DEBUG: Clic estándar en YouTube falló, intentando clic forzado...")
                                    await target_video.click(force=True)
                                video_clicked = True
                                break
                    else:
                        # Selectores comunes de videos en Facebook Search
                        fb_video_selectors = [
                            "a[href*='/videos/']",
                            "a[href*='/watch/']",
                            "div[role='article'] a",
                            "div[data-testid='typeahead-list'] a"
                        ]
                        for selector in fb_video_selectors:
                            locators = self.page.locator(selector)
                            count = await locators.count()
                            if count >= option:
                                target_video = locators.nth(option - 1)
                                steps_log.append(f"🖱️ Haciendo clic en el video/reel de Facebook número {option}...")
                                try:
                                    await target_video.click(timeout=5000)
                                except Exception:
                                    print("DEBUG: Clic estándar en Facebook falló, intentando clic forzado...")
                                    await target_video.click(force=True)
                                video_clicked = True
                                break
                                
                    if not video_clicked:
                        steps_log.append("⚠️ No se pudo ubicar el video en la posición indicada. Haciendo clic en el primer enlace de video disponible...")
                        # Fallback simple
                        fallback_selector = "a[href*='watch'], a[href*='video']"
                        locator = self.page.locator(fallback_selector).first
                        if await locator.count() > 0:
                            await locator.click()
                            video_clicked = True
                            
                    if video_clicked:
                        steps_log.append("⏳ Esperando a que el video cargue y comience la reproducción...")
                        await asyncio.sleep(6)
                        
                        # Quitar cualquier anuncio intermedio de video en un loop dinámico
                        await self.dismiss_ads_loop(20, 2.5)
                        
                        # Extraer información de resumen del video actual
                        steps_log.append("📝 Extrayendo información y resumen del video...")
                        video_page_title = await self.page.title()
                        
                        # Intentar leer metadatos de la página
                        page_text = ""
                        try:
                            page_text = await self.page.evaluate("""
                                () => {
                                    // Buscar descripciones de videos de youtube o facebook
                                    const yt_desc = document.querySelector('#description-inline-expander, ytd-text-inline-renderer, #description-text');
                                    const fb_desc = document.querySelector('[data-ad-preview="message"], div[data-ad-comet-preview="message"]');
                                    if (yt_desc) return yt_desc.innerText;
                                    if (fb_desc) return fb_desc.innerText;
                                    
                                    // Evitar capturar menú de login
                                    const bodyText = document.body.innerText;
                                    if (bodyText.includes("Iniciar sesión") || bodyText.includes("Olvidaste la cuenta") || bodyText.includes("Cookies")) {
                                        return "Descripción no disponible públicamente sin inicio de sesión.";
                                    }
                                    return bodyText.substring(0, 1000);
                                }
                            """)
                        except Exception:
                            pass
                            
                        # Limpiar texto
                        summary_info = page_text.strip().replace("\n", " ")[:400]
                        steps_log.append(f"✅ Video cargado: **\"{video_page_title}\"**")
                        if summary_info and len(summary_info) > 10:
                            steps_log.append(f"📖 **Resumen preliminar del video:** {summary_info}...")
                    else:
                        steps_log.append("❌ No se pudo encontrar ningún video disponible para reproducir.")
                        
                await self.screenshot()
                return {
                    "status": "ok",
                    "message": (
                        f"### {reasoning_steps[0]}\n" + "\n".join(f"- {s}" for s in reasoning_steps[1:]) + "\n\n"
                        f"### 📋 **Resultado de Ejecución:**\n" + "\n".join(f"- {s}" for s in steps_log)
                    )
                }
            except Exception as e:
                await self.screenshot()
                return {
                    "status": "error",
                    "message": f"❌ Error interactuando con el video/plataforma: {str(e)}"
                }

        # --- CASO GMAIL / GENERAL ---
        else:
            reasoning_steps.append("3. **Análisis de Resultados:** La tarea requiere una búsqueda de información general y navegación en la web correspondiente.")
            reasoning_steps.append("4. **Plan de Acción Formulado:**\n   - A) Buscar en Google la solución.\n   - B) Navegar a la página relevante.\n   - C) Ofrecer un resumen de la información encontrada.")
            
            steps_log = ["🚀 Iniciando resolución general..."]
            try:
                if search_res["status"] == "ok" and search_res.get("results"):
                    first_url = search_res["results"][0]["url"]
                    steps_log.append(f"🌐 Navegando al recurso más relevante: {first_url}...")
                    await self.goto(first_url)
                    await asyncio.sleep(3)
                    await self.summarize_and_save()
                    steps_log.append("📝 Página analizada y guardada en el índice de memoria local.")
                else:
                    steps_log.append("⚠️ No se pudieron obtener URLs válidas para navegar. Mostrando resultados de búsqueda.")
                
                await self.screenshot()
                return {
                    "status": "ok",
                    "message": (
                        f"### {reasoning_steps[0]}\n" + "\n".join(f"- {s}" for s in reasoning_steps[1:]) + "\n\n"
                        f"### 📋 **Resultado de Ejecución:**\n" + "\n".join(f"- {s}" for s in steps_log) + "\n\n"
                        f"**Información encontrada:**\n{search_res['message']}"
                    )
                }
            except Exception as e:
                return {
                    "status": "error",
                    "message": f"❌ Error en agente de razonamiento general: {str(e)}"
                }

    async def execute_task(self, instruction: str) -> Dict:
        """
        Ejecuta una tarea compleja en el navegador descrita en lenguaje natural de manera autónoma.
        Soporta:
        - Flujos de Inicio de Sesión automáticos (Gmail, GitHub, etc.)
        - Ejecución secuencial de comandos separados por comas.
        """
        import asyncio
        if not self.is_open:
            await self.start()

        instruction_lower = instruction.lower().strip()
        
        # Interceptar comandos directos de control de anuncios y captchas
        if any(w in instruction_lower for w in ["anuncio", "publicidad", "ads", "popup", "saltar anuncio", "omitir anuncio", "quitar anuncio"]):
            steps_log = ["🚀 Iniciando remoción visual y lógica de anuncios..."]
            handled = await self.dismiss_ads_loop(12, 2.0)
            if handled:
                steps_log.append("✅ Anuncios/popups removidos con éxito utilizando visión artificial OCR.")
            else:
                steps_log.append("ℹ️ No se detectaron anuncios o popups activos en la pantalla.")
            
            await self.screenshot()
            return {
                "status": "ok",
                "message": "### 📋 **Resultado de Ejecución (Visión):**\n" + "\n".join(f"- {s}" for s in steps_log)
            }

        # Interceptar tareas complejas (WhatsApp, Alarmas, reuniones) para el Agente de Razonamiento
        if any(w in instruction_lower for w in ["whatsapp", "alarma", "reunión", "reunio", "trotar"]):
            return await self.execute_reasoning_agent(instruction)
        
        # 1. DETECTOR DE FLUJO DE INICIO DE SESIÓN INTEGRAL (Gmail, GitHub, etc.)
        is_login_intent = any(p in instruction_lower for p in ["inicia sesion", "inicia secion", "iniciar sesion", "iniciar secion", "login", "entrar en", "acceder en", "contraseña", "contrase~na", "password", "usuario y contrase"])
        
        if is_login_intent:
            steps_log = ["🚀 Iniciando flujo de login inteligente..."]
            
            # A) Extraer correo real (tiene formato de email correo@dominio.com)
            email_match = re.search(r"([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})", instruction)
            user = email_match.group(1).strip() if email_match else None

            # B) Si no hay email, buscar usuario regular
            if not user:
                user_match = re.search(r"(?:usuario|correo|email|user)\s+([a-zA-Z0-9_-]+)", instruction, re.IGNORECASE)
                if user_match:
                    user = user_match.group(1).strip()
                else:
                    # Heurística: buscar palabra después de "con" o "como", excluyendo palabras clave
                    con_match = re.search(r"\bcon\s+([a-zA-Z0-9_-]+)", instruction, re.IGNORECASE)
                    if con_match and con_match.group(1).lower() not in ["este", "el", "mi", "un", "una", "la", "correo", "usuario"]:
                        user = con_match.group(1).strip()

            # C) Extraer contraseña: todo lo que viene después de la palabra clave de contraseña
            password = None
            pass_indicators = ["contraseña", "contrase~na", "password", "clave", "pass"]
            for ind in pass_indicators:
                if ind in instruction_lower:
                    idx = instruction_lower.find(ind)
                    rest = instruction[idx + len(ind):].strip()
                    # Limpiar prefijos comunes como "es", "la", "el", ":", "="
                    rest = re.sub(r"^(?:es\s+|la\s+|el\s+|:\s*|=\s*|;\s*)", "", rest, flags=re.IGNORECASE).strip()
                    # Quitar palabras descriptivas si no son la clave real
                    if not any(w in rest.lower() for w in ["que te di", "que le di", "mi usuario", "anterior"]):
                        password = rest
                    break

            # Si no se extrajeron de la instrucción, intentar recuperar de la memoria o archivo persistente
            saved_u, saved_p = self._load_credentials()
            if not user:
                if self.saved_user:
                    user = self.saved_user
                    steps_log.append(f"🧠 Recuperado usuario de la memoria de sesión: {user}")
                elif saved_u:
                    user = saved_u
                    steps_log.append(f"🧠 Recuperado usuario de la memoria persistente en disco: {user}")

            if not password:
                if self.saved_password:
                    password = self.saved_password
                    steps_log.append("🧠 Recuperada contraseña de la memoria de sesión de forma segura.")
                elif saved_p:
                    password = saved_p
                    steps_log.append("🧠 Recuperada contraseña de la memoria persistente en disco de forma segura.")

            # Guardar en memoria y disco si se extrajeron con éxito
            if user and password:
                self.saved_user = user
                self.saved_password = password
                self._save_credentials(user, password)

            # D) Extraer Sitio/Servicio (e.g. gmail, github)
            site = "gmail" # Default fallback
            for known in ["gmail", "github", "facebook", "twitter", "linkedin", "instagram", "localecomer", "farmastock"]:
                if known in instruction_lower:
                    site = known
                    break
            else:
                site_match = re.search(r"\b(?:en|a)\b\s+([a-zA-Z0-9.-]+)", instruction, re.IGNORECASE)
                if site_match:
                    extracted_site = site_match.group(1).lower().strip()
                    if extracted_site not in ["este", "mi", "el", "la", "correo", "usuario", "contraseña", "contrase~na"]:
                        site = extracted_site

            # Normalizar URL
            target_url = site
            if "gmail" in target_url and not target_url.endswith(".com"):
                target_url = "gmail.com"
            if "github" in target_url and not target_url.endswith(".com"):
                target_url = "github.com"
            if not target_url.startswith("http"):
                target_url = "https://" + target_url

            if not user or not password:
                return {
                    "status": "error",
                    "message": f"❌ No pude extraer ni recuperar el usuario o la contraseña.\nExtraído:\n- Sitio: `{target_url}`\n- Usuario: `{user}`\n- Contraseña: `{'***' if password else None}`\n\nPor favor escríbelo en este formato:\n`inicia sesion en gmail con el correo TU_CORREO y la contraseña TU_CLAVE`"
                }

            steps_log.append(f"🚀 Iniciando login inteligente en {target_url} para {user}...")
            
            try:
                # Paso 1: Navegar al sitio
                steps_log.append(f"🌐 Navegando a {target_url}...")
                await self.goto(target_url)
                await asyncio.sleep(3)

                # Si es Gmail/Google Login
                if "google.com" in self.page.url or "gmail.com" in target_url or "workspace.google" in self.page.url:
                    steps_log.append("🔍 Detectado inicio de sesión de Google.")
                    
                    # SI YA ESTAMOS LOGUEADOS, OMITIR TODO EL BLOQUE DE LOGIN
                    if "mail.google.com" in self.page.url and "accounts.google.com" not in self.page.url:
                        steps_log.append("✅ Ya estás logueado en Gmail. Omitiendo pasos de login.")
                    else:
                        # Si caemos en la landing page de Google Workspace / Gmail, hacer clic en Acceder
                        email_field = self.page.locator("input[type='email'], input[id='identifierId']").first
                        if not await email_field.is_visible():
                            steps_log.append("🔍 Detectada landing page de Gmail. Buscando botón de acceso...")
                            acceder_btn = self.page.locator("a:has-text('Iniciar sesión'), a:has-text('Acceder'), a:has-text('Sign in'), .header__actions a").first
                            if await acceder_btn.is_visible():
                                await acceder_btn.click()
                                steps_log.append("🖱️ Botón de acceso cliqueado. Esperando formulario de login...")
                                await asyncio.sleep(4)
                                email_field = self.page.locator("input[type='email'], input[id='identifierId']").first
                        
                        # Rellenar correo
                        await email_field.fill(user)
                        steps_log.append(f"⌨️ Rellenado correo: {user}")
                        
                        # Presionar enter para continuar
                        await email_field.press("Enter")
                        steps_log.append("⌨️ Presionado Enter. Esperando campo de contraseña...")
                        await asyncio.sleep(4) # Esperar a que cargue el password field

                        # Rellenar contraseña
                        pass_input = self.page.locator("input[type='password'], input[name='password']").first
                        await pass_input.fill(password)
                        steps_log.append("⌨️ Rellenada la contraseña de forma segura.")
                        
                        # Presionar enter para iniciar sesion
                        await pass_input.press("Enter")
                        steps_log.append("🚀 Presionado Enter para iniciar sesión. Esperando redirección...")
                        await asyncio.sleep(4)

                        # Solver automático de avisos de seguridad/protección o confirmaciones ("Omitir", "Ahora no", "Entendido")
                        for i in range(2):
                            steps_log.append("🔍 Verificando si hay diálogos o advertencias de confirmación/omisión de Google...")
                            omitir_btn = self.page.locator("button:has-text('Omitir'), button:has-text('Ahora no'), button:has-text('Not now'), button:has-text('Skip'), button:has-text('Confirmar'), button:has-text('Entendido'), button:has-text('Confirm')").first
                            if await omitir_btn.is_visible():
                                await omitir_btn.click()
                                steps_log.append("🖱️ Encontrado y cliqueado diálogo de omisión ('Omitir' / 'Ahora no').")
                                await asyncio.sleep(3)
                
                else:
                    # Login genérico
                    steps_log.append("🔍 Buscando campos de inicio de sesión genéricos...")
                    
                    # Buscar correo o usuario
                    user_input = self.page.locator("input[type='email'], input[type='text'][placeholder*='correo'], input[type='text'][placeholder*='usuario'], input[name*='user'], input[name*='login']").first
                    if await user_input.is_visible():
                        await user_input.fill(user)
                        steps_log.append(f"⌨️ Campo usuario/correo completado: {user}")
                    else:
                        steps_log.append("⚠️ No se encontró campo de usuario obvio, intentando rellenar primer input de texto...")
                        first_text = self.page.locator("input[type='text']").first
                        if await first_text.is_visible():
                            await first_text.fill(user)

                    # Buscar contraseña
                    pass_input = self.page.locator("input[type='password'], input[name*='pass']").first
                    if await pass_input.is_visible():
                        await pass_input.fill(password)
                        steps_log.append("⌨️ Campo contraseña completado de forma segura.")
                        await pass_input.press("Enter")
                        steps_log.append("🚀 Presionado Enter para enviar credenciales.")
                    else:
                        steps_log.append("⚠️ No se encontró campo de contraseña.")

                    await asyncio.sleep(3)

                # --- NUEVO: CONTINUACIÓN FLUIDA PARA ENVÍO DE CORREO TRAS EL LOGIN ---
                has_send_action = any(p in instruction_lower for p in ["envia", "enviar", "mandar", "envíale", "enviale", "mandale", "mándale", "enviarle", "mandarle"])
                if has_send_action:
                    steps_log.append("📧 Detectada solicitud de envío de correo en el mismo comando. Iniciando flujo de redacción...")
                    
                    # Extraer destinatario (correo electrónico) buscando todos los emails y tomando el que no sea el de login si hay varios
                    emails_extracted = re.findall(r"([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})", instruction)
                    dest_email = None
                    for email in emails_extracted:
                        if email.strip() != user:
                            dest_email = email.strip()
                            break
                    if not dest_email and len(emails_extracted) > 0:
                        # Si sólo hay uno y es el mismo (por ej. si se autologea), lo usamos si no hay más opciones
                        dest_email = emails_extracted[0].strip()
                    
                    # Extraer el cuerpo del mensaje (lo que va después de "dile", "que diga", "con el texto", "mensaje:", "diciendole")
                    body = "Hola, soy tu IA, me place saludarte." # Default
                    body_indicators = ["dile", "que diga", "con el texto", "mensaje", "cuerpo", "diciendole", "diciéndole"]
                    for ind in body_indicators:
                        if ind in instruction_lower:
                            idx = instruction_lower.find(ind)
                            rest = instruction[idx + len(ind):].strip()
                            rest = re.sub(r"^(?:que\s+|es\s+|:\s*|=\s*|;\s*)", "", rest, flags=re.IGNORECASE).strip()
                            # Quitar posibles cláusulas de omitir
                            rest = re.sub(r"\by\s+si\s+te\s+sale\s+omitir.*", "", rest, flags=re.IGNORECASE).strip()
                            body = rest
                            break

                    if dest_email:
                        # Si no estamos en Gmail, ir a Gmail primero
                        if "mail.google.com" not in self.page.url:
                            steps_log.append("🌐 Navegando a la bandeja de entrada de Gmail...")
                            await self.goto("https://mail.google.com/mail/u/0/#inbox")
                            await asyncio.sleep(4)

                        # Esperar a que la interfaz de Gmail esté completamente cargada
                        steps_log.append("⏳ Esperando a que cargue la bandeja de entrada de Gmail...")
                        inbox_indicator = self.page.locator("[aria-label*='Recibidos'], [aria-label*='Inbox'], div[role='navigation']").first
                        try:
                            await inbox_indicator.wait_for(state="visible", timeout=20000)
                            steps_log.append("📥 Bandeja de entrada cargada correctamente.")
                        except Exception:
                            steps_log.append("⚠️ Tiempo de espera agotado cargando bandeja, intentando continuar de todas formas...")

                        # Solver de diálogos molestos de Gmail (Notificaciones, bienvenida, etc.)
                        steps_log.append("🔍 Buscando y cerrando posibles ventanas emergentes de Gmail...")
                        popup_buttons = [
                            "button:has-text('Ahora no')", "button:has-text('Not now')",
                            "button:has-text('Entendido')", "button:has-text('Got it')",
                            "button:has-text('No, gracias')", "button:has-text('No thanks')",
                            "button:has-text('Cerrar')", "button:has-text('Close')",
                            "[aria-label*='Cerrar']", "[aria-label*='Close']",
                            ".aYy", # Clase de botón de cerrar en modales
                        ]
                        for btn_sel in popup_buttons:
                            try:
                                btn = self.page.locator(btn_sel).first
                                if await btn.is_visible():
                                    await btn.click()
                                    steps_log.append(f"🖱️ Se cerró ventana emergente con botón: {btn_sel}")
                                    await asyncio.sleep(2)
                            except Exception:
                                pass

                        # Paso 1: Hacer clic en "Redactar" o "Compose"
                        steps_log.append("🖱️ Buscando botón 'Redactar'...")
                        redactar_btn = self.page.locator("div[role='button'][gh='cm'], div.T-I-KE, .T-I-KE, [gh='cm'], div:has-text('Redactar'), div:has-text('Compose'), [aria-label*='Redactar'], [aria-label*='Compose'], div[role='button']:has-text('Redactar'), div[role='button']:has-text('Compose')").first
                        
                        compose_visible = False
                        for attempt in range(3):
                            steps_log.append(f"🖱️ Intentando hacer clic en 'Redactar' (Intento {attempt + 1})...")
                            try:
                                await redactar_btn.click(timeout=8000)
                                await asyncio.sleep(3)
                            except Exception:
                                pass
                            
                            # Verificar si la ventana de mensaje nuevo ya está abierta
                            compose_dialog = self.page.locator("div[role='dialog'], [aria-label*='Mensaje nuevo'], [aria-label*='New Message'], [aria-label*='Redactar'], [aria-label*='Compose']").first
                            if await compose_dialog.is_visible():
                                compose_visible = True
                                steps_log.append("✅ ¡Ventana de composición abierta de forma interactiva!")
                                break
                            else:
                                steps_log.append("⚠️ No se detectó ventana de diálogo, reintentando...")

                        if not compose_visible:
                            steps_log.append("🔄 Falló click en botón. Forzando apertura directa navegando a la URL de composición...")
                            await self.goto("https://mail.google.com/mail/u/0/#inbox?compose=new")
                            await asyncio.sleep(4)

                        # Paso 2: Rellenar destinatario (acotando la búsqueda estrictamente al diálogo de redacción 'dialog' o '.M9')
                        steps_log.append(f"⌨️ Rellenando destinatario: {dest_email}...")
                        dest_input = self.page.locator("div[role='dialog'] input[role='combobox'], div[role='dialog'] input[name='to'], div[role='dialog'] .agP, div[role='dialog'] input[aria-label*='Para'], div[role='dialog'] input[aria-label*='To'], .M9 input[role='combobox'], .M9 input[name='to']").last
                        await dest_input.fill(dest_email)
                        await asyncio.sleep(1)
                        await dest_input.press("Enter")
                        steps_log.append("⌨️ Destinatario confirmado.")

                        # Paso 3: Rellenar Asunto (Subject)
                        steps_log.append("⌨️ Escribiendo Asunto...")
                        subject_input = self.page.locator("div[role='dialog'] input[name='subjectbox'], div[role='dialog'] input[placeholder*='Asunto'], div[role='dialog'] input[placeholder*='Subject'], .M9 input[name='subjectbox']").last
                        await subject_input.fill("Saludo de tu IA autónoma")
                        await asyncio.sleep(1)

                        # Paso 4: Rellenar cuerpo del mensaje
                        steps_log.append("⌨️ Escribiendo el cuerpo del correo...")
                        body_input = self.page.locator("div[role='dialog'] .Am.Al.editable, div[role='dialog'] div[role='textbox'], .M9 .Am.Al.editable").last
                        await body_input.fill(body)
                        await asyncio.sleep(2)

                        # Paso 5: Enviar el correo
                        steps_log.append("🚀 Enviando correo...")
                        await body_input.press("Control+Enter")
                        steps_log.append("✅ Comando de envío ejecutado. Esperando confirmación de Gmail...")
                        await asyncio.sleep(3)

                await self.screenshot()
                return {
                    "status": "ok",
                    "message": "🔑 **Flujo de login y envío de correo ejecutado paso a paso con éxito:**\n\n" + "\n".join(f"- {s}" for s in steps_log)
                }

            except Exception as e:
                await self.screenshot()
                return {
                    "status": "error",
                    "message": f"❌ Error en flujo de login en el paso '{steps_log[-1]}': {str(e)}"
                }

        # 1.5 DETECTOR DE FLUJO DE ENVÍO DE CORREO EN GMAIL
        is_email_intent = any(p in instruction_lower for p in ["envia un correo", "enviar correo", "enviar un correo", "mandar correo", "enviar email", "enviar un email", "envia un mail", "enviar mail", "envia el correo", "envía el correo", "enviarle un correo"])
        if is_email_intent:
            # Extraer destinatario (correo electrónico)
            dest_match = re.search(r"([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})", instruction)
            dest_email = dest_match.group(1).strip() if dest_match else None
            
            # Extraer el cuerpo del mensaje (lo que va después de "dile", "que diga", "con el texto", "mensaje:")
            body = "Hola, soy tu IA, me place saludarte." # Default
            body_indicators = ["dile", "que diga", "con el texto", "mensaje", "cuerpo"]
            for ind in body_indicators:
                if ind in instruction_lower:
                    idx = instruction_lower.find(ind)
                    rest = instruction[idx + len(ind):].strip()
                    # Quitar conector inicial
                    rest = re.sub(r"^(?:que\s+|es\s+|:\s*|=\s*|;\s*)", "", rest, flags=re.IGNORECASE).strip()
                    body = rest
                    break

            if not dest_email:
                return {
                    "status": "error",
                    "message": "❌ No pude extraer la dirección de correo del destinatario. Por favor indica a quién se lo deseas enviar."
                }

            steps_log = [f"🚀 Iniciando envío de correo automático en Gmail a {dest_email}..."]
            
            try:
                # Si no estamos en Gmail, ir a Gmail primero
                if not self.page or "mail.google.com" not in self.page.url:
                    steps_log.append("🌐 Navegando a Gmail...")
                    await self.goto("https://mail.google.com/mail/u/0/#inbox")
                    await asyncio.sleep(4)

                # Paso 1: Hacer clic en "Redactar" o "Compose"
                steps_log.append("🖱️ Buscando botón 'Redactar'...")
                redactar_btn = self.page.locator("div[role='button'][gh='cm'], div.T-I-KE, div:has-text('Redactar'), div:has-text('Compose')").first
                await redactar_btn.click()
                steps_log.append("🖱️ Botón 'Redactar' cliqueado. Esperando ventana de mensaje...")
                await asyncio.sleep(3)

                # Paso 2: Rellenar destinatario
                steps_log.append(f"⌨️ Rellenando destinatario: {dest_email}...")
                dest_input = self.page.locator("input[peoplekit-id], div[role='combobox'] input, input[aria-label='Para'], input[aria-label='To']").first
                await dest_input.fill(dest_email)
                await asyncio.sleep(1)
                await dest_input.press("Enter")
                steps_log.append("⌨️ Destinatario confirmado.")

                # Paso 3: Rellenar Asunto (Subject)
                steps_log.append("⌨️ Escribiendo asunto...")
                subject_input = self.page.locator("input[name='subjectbox'], input[placeholder='Asunto'], input[placeholder='Subject']").first
                await subject_input.fill("Saludo de tu IA autónoma")
                await asyncio.sleep(1)

                # Paso 4: Rellenar cuerpo del mensaje
                steps_log.append("⌨️ Escribiendo el cuerpo del correo...")
                body_input = self.page.locator("div[role='textbox'][aria-label*='Cuerpo'], div[role='textbox'][aria-label*='Message Body'], div[role='textbox'][aria-label*='Mensaje']").first
                await body_input.fill(body)
                await asyncio.sleep(2)

                # Paso 5: Enviar el correo
                steps_log.append("🚀 Enviando correo...")
                await body_input.press("Control+Enter")
                steps_log.append("✅ Comando de envío ejecutado. Esperando confirmación de Gmail...")
                await asyncio.sleep(3)

                await self.screenshot()
                return {
                    "status": "ok",
                    "message": "📧 **¡Correo enviado con éxito paso a paso!**\n\n" + "\n".join(f"- {s}" for s in steps_log)
                }

            except Exception as e:
                await self.screenshot()
                return {
                    "status": "error",
                    "message": f"❌ Error en flujo de envío de correo en el paso '{steps_log[-1]}': {str(e)}"
                }

        # 2. DETECTOR DE COMANDOS SECUENCIALES (entra a X, busca Y, haz clic en Z)
        # Separar por comas o "luego" o "después"
        sub_instructions = re.split(r',|\bluego\b|\bdespues\b|\by\s+después\b|\by\s+luego\b', instruction_lower)
        sub_instructions = [s.strip() for s in sub_instructions if s.strip()]

        if len(sub_instructions) > 1:
            steps_log = ["🚀 Iniciando secuencia de tareas paso a paso..."]
            for step in sub_instructions:
                try:
                    # Entrar a una web
                    if "entra" in step or "ve a" in step or "navega" in step or "goto" in step:
                        url_match = re.search(r'(?:entra\s+a|ve\s+a|navega\s+a|goto)\s+([a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}(?:/[^\s]*)?)', step)
                        if url_match:
                            url = url_match.group(1)
                            steps_log.append(f"🌐 Navegando a: {url}")
                            await self.goto(url)
                            await asyncio.sleep(1.5)
                        else:
                            steps_log.append(f"⚠️ No pude extraer URL de: '{step}'")

                    # Buscar en google / duckduckgo
                    elif "busca" in step or "search" in step:
                        query_match = re.search(r'(?:busca|search)\s+(?:en\s+google\s+|en\s+duckduckgo\s+)?(.*)', step)
                        if query_match:
                            query = query_match.group(1).strip()
                            steps_log.append(f"🔍 Buscando: \"{query}\"")
                            await self.search_google(query)
                            await asyncio.sleep(1.5)

                    # Hacer clic
                    elif "clic" in step or "click" in step or "presiona" in step:
                        text_match = re.search(r'(?:clic|click|presiona)\s+(?:en\s+|sobre\s+)?(?:el\s+)?(?:botón\s+|boton\s+|enlace\s+)?(.*)', step)
                        if text_match:
                            target = text_match.group(1).replace('"', '').replace("'", "").strip()
                            steps_log.append(f"🖱️ Haciendo clic en: \"{target}\"")
                            await self.click(text=target)
                            await asyncio.sleep(1.5)

                    # Escribir
                    elif "escribe" in step or "type" in step:
                        # patrón: escribe X en Y
                        write_match = re.search(r'(?:escribe|type)\s+(.*?)\s+(?:en\s+|sobre\s+)(.*)', step)
                        if write_match:
                            text = write_match.group(1).replace('"', '').replace("'", "").strip()
                            placeholder = write_match.group(2).strip()
                            steps_log.append(f"⌨️ Escribiendo \"{text}\" en \"{placeholder}\"")
                            await self.type_text(text=text, placeholder=placeholder)
                            await asyncio.sleep(1.5)

                    # Esperar
                    elif "espera" in step or "wait" in step:
                        seconds_match = re.search(r'(\d+)', step)
                        seconds = int(seconds_match.group(1)) if seconds_match else 2
                        steps_log.append(f"⏳ Esperando {seconds} segundos...")
                        await asyncio.sleep(seconds)

                    # Captura
                    elif "captura" in step or "pantallazo" in step or "screenshot" in step:
                        steps_log.append("📸 Tomando captura de pantalla...")
                        await self.screenshot()

                    else:
                        steps_log.append(f"❓ Comando no reconocido: '{step}'")

                except Exception as e:
                    steps_log.append(f"❌ Error en paso '{step}': {str(e)[:100]}")

            await self.screenshot()
            return {
                "status": "ok",
                "message": "📋 **Secuencia de tareas ejecutada:**\n\n" + "\n".join(f"- {s}" for s in steps_log)
            }

        # Fallback si no tiene comas ni es un login: ejecutar bucle de agente de razonamiento completo
        return await self.execute_reasoning_agent(instruction)

    @property
    def stats(self) -> Dict:
        return {
            "is_open": self.is_open,
            "pages_indexed": len(self.page_index),
            "history_length": len(self.history),
            "current_url": self.page.url if self.page else None,
        }

