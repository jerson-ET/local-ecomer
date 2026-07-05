// XuperBrain Chrome Extension v3.0
// Motor Multi-Paso Avanzado para instrucciones complejas
let pwaTabId = null;
let agentTabId = null;
let isAgentRunning = false;

chrome.runtime.onMessage.addListener((message, sender) => {
  if (message.action === "launch_mission") {
    pwaTabId = sender.tab.id;
    isAgentRunning = true;
    sendProgress("🤖 Agente XuperBrain v3.0 activado.", "info");
    runMultiStepAgent(message.instruction);
  }
  else if (message.action === "stop_mission") {
    sendProgress("⏹️ Misión detenida.", "warning");
    isAgentRunning = false;
    if (agentTabId) { chrome.tabs.remove(agentTabId).catch(() => {}); agentTabId = null; }
  }
});

// ═══════════════════════════════════════════════════════════
// DESCOMPOSICIÓN DE INSTRUCCIONES EN PASOS
// ═══════════════════════════════════════════════════════════
function decomposeInstruction(text) {
  const steps = [];
  // Normalizar texto
  let t = text.toLowerCase().trim();
  
  // Dividir por conectores naturales manteniendo el verbo de acción
  // Primero separamos en fragmentos por conectores
  const fragments = splitByConnectors(t);
  
  for (const frag of fragments) {
    const f = frag.trim();
    if (!f || f.length < 3) continue;
    
    const step = classifyFragment(f);
    if (step) steps.push(step);
  }
  
  // Si no se pudo descomponer, intentar como búsqueda simple
  if (steps.length === 0) {
    steps.push({ action: "search_google", query: text, description: `Buscar en Google: "${text}"` });
  }
  
  return steps;
}

function splitByConnectors(text) {
  // Marcamos los puntos de corte antes de cada verbo de acción
  const actionVerbs = [
    "entra ", "entre ", "abre ", "ve a ", "navega ", "visita ",
    "busca ", "buscar ", "encuentra ",
    "reproduce ", "reproducir ", "pon ", "play ",
    "dejalo ", "déjalo ", "espera ", "esperalo ",
    "toca ", "tocalo ", "tócalo ", "haz clic ", "hazle clic ", "presiona ", "pulsa ", "clickea ", "cliquea ",
    "escribe ", "escribir ", "pon el texto ", "tipea ",
    "dale ", "darle ",
    "omitir ", "omite ", "salta ", "skip ",
    "suscribete ", "suscríbete ",
    "comparte ", "compartir ",
    "descarga ", "descargar ",
    "cierra ", "cerrar ",
    "regresa ", "vuelve ", "volver ",
    "scrollea ", "baja ", "sube ",
  ];
  
  let markedText = text;
  for (const verb of actionVerbs) {
    // Insertar un separador antes de cada verbo de acción (pero no al inicio)
    const regex = new RegExp(`(?<=.)(${verb})`, "gi");
    markedText = markedText.replace(regex, `|||$1`);
  }
  
  // También separar por "y " seguido de verbo, "luego ", "después ", "despues "
  markedText = markedText.replace(/\s+y\s+(entra|abre|busca|reproduce|pon|dejalo|toca|escribe|dale|omit|suscri|comparte|descarga|cierra|regresa|baja|sube|haz)/gi, "|||$1");
  markedText = markedText.replace(/\s+luego\s+/gi, "|||");
  markedText = markedText.replace(/\s+despu[eé]s\s+/gi, "|||");
  
  return markedText.split("|||").filter(s => s.trim().length > 2);
}

function classifyFragment(frag) {
  const f = frag.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
  
  // --- NAVEGAR ---
  if (/^(entra|entre|abre|ve a|navega|visita)\s/.test(f)) {
    const site = extractSite(f);
    return { action: "navigate", site: site, description: `Navegar a ${site}` };
  }
  
  // --- BUSCAR ---
  if (/^(busca|buscar|encuentra)\s/.test(f)) {
    let query = f.replace(/^(busca|buscar|encuentra)\s+(en\s+\w+\s+)?(un |una |el |la |los |las )?/i, "").trim();
    // Limpiar frases auxiliares al final
    query = query.replace(/\s*(para\s+reproduc|para\s+que|para\s+ver|que\s+te\s+salga|el\s+primero).*$/i, "").trim();
    const site = extractSiteFromContext(f);
    if (site === "youtube") {
      return { action: "search_youtube", query: query, description: `Buscar en YouTube: "${query}"` };
    }
    return { action: "search_google", query: query, description: `Buscar: "${query}"` };
  }
  
  // --- REPRODUCIR / CLICK PRIMER RESULTADO ---
  if (/^(reproduce|reproducir|pon |play )/i.test(f)) {
    const query = f.replace(/^(reproduce|reproducir|pon|play)\s+(el\s+)?(primero|primer|primera)?\s*(que\s+te\s+salga|resultado|video)?\s*/i, "").trim();
    if (query.length > 2) {
      return { action: "search_and_play", query: query, description: `Buscar y reproducir: "${query}"` };
    }
    return { action: "click_first_result", description: "Reproducir el primer resultado" };
  }
  
  // --- DEJAR SONAR / ESPERAR ---
  if (/^(dejalo|dejalo que|esperalo|espera|esperalo que|dejalo que suene)/i.test(f)) {
    return { action: "wait_play", seconds: 8, description: "Dejando que reproduzca..." };
  }
  
  // --- DALE + ACCIÓN ---
  if (/^dale\s/i.test(f)) {
    const rest = f.replace(/^dale\s+/i, "").trim();
    
    // Dale like / me gusta
    if (/like|me\s*gusta|manito|pulgar|megusta/i.test(rest)) {
      return { action: "click_like", description: "Dar like / Me gusta" };
    }
    // Dale enviar / send / submit
    if (/enviar|send|publicar|submit|enter/i.test(rest)) {
      return { action: "click_send_comment", description: "Enviar comentario" };
    }
    // Dale suscribir
    if (/suscri/i.test(rest)) {
      return { action: "click_subscribe", description: "Suscribirse al canal" };
    }
    // Dale compartir
    if (/compartir|share/i.test(rest)) {
      return { action: "click_share", description: "Compartir" };
    }
    // Dale clic genérico
    return { action: "click_by_text", text: rest, description: `Clic en: "${rest}"` };
  }
  
  // --- TOCAR / HACER CLIC ---
  if (/^(toca|tocalo|haz clic|hazle clic|presiona|pulsa|clickea|cliquea)\s*/i.test(f)) {
    const target = f.replace(/^(toca|tocalo|haz clic en|hazle clic a|haz clic|presiona|pulsa|clickea|cliquea)\s*(el |la |los |las |al |a la |en el |en la )?\s*/i, "").trim();
    
    if (/comentario|comment/i.test(target)) {
      return { action: "click_comment_box", description: "Abrir caja de comentarios" };
    }
    if (/like|me\s*gusta|manito|megusta/i.test(target)) {
      return { action: "click_like", description: "Dar like" };
    }
    return { action: "click_by_text", text: target, description: `Clic en: "${target}"` };
  }
  
  // --- ESCRIBIR ---
  if (/^(escribe|escribir|tipea|pon el texto)\s/i.test(f)) {
    const text = f.replace(/^(escribe|escribir|tipea|pon el texto)\s+/i, "").trim();
    return { action: "type_text", text: text, description: `Escribir: "${text}"` };
  }
  
  // --- BUSCA LOS COMENTARIOS ---
  if (/comentario|comment/i.test(f) && /busca|encuentra|ve a|baja/i.test(f)) {
    return { action: "scroll_to_comments", description: "Ir a la sección de comentarios" };
  }
  if (/^(busca|encuentra)\s+(los |las |el |la )?(comentario|comment)/i.test(f)) {
    return { action: "scroll_to_comments", description: "Ir a la sección de comentarios" };
  }
  
  // --- OMITIR ---
  if (/^(omitir|omite|salta|skip)/i.test(f)) {
    return { action: "dismiss_popups", description: "Omitir/cerrar ventanas emergentes" };
  }
  
  // --- SUSCRIBIRSE ---
  if (/^suscri/i.test(f)) {
    return { action: "click_subscribe", description: "Suscribirse" };
  }
  
  // --- SI NADA COINCIDE: interpretar como búsqueda ---
  if (f.length > 5) {
    return { action: "click_by_text", text: f, description: `Intentar: "${f}"` };
  }
  
  return null;
}

function extractSite(text) {
  if (/youtube|you tube/i.test(text)) return "youtube";
  if (/google/i.test(text)) return "google";
  if (/facebook|face/i.test(text)) return "facebook";
  if (/instagram|insta/i.test(text)) return "instagram";
  if (/tiktok/i.test(text)) return "tiktok";
  if (/twitter|x\.com/i.test(text)) return "twitter";
  if (/spotify/i.test(text)) return "spotify";
  if (/amazon/i.test(text)) return "amazon";
  if (/mercado\s*libre/i.test(text)) return "mercadolibre";
  if (/wikipedia/i.test(text)) return "wikipedia";
  return "google";
}

function extractSiteFromContext(text) {
  return extractSite(text);
}

function getSiteUrl(site) {
  const urls = {
    youtube: "https://www.youtube.com",
    google: "https://www.google.com",
    facebook: "https://www.facebook.com",
    instagram: "https://www.instagram.com",
    tiktok: "https://www.tiktok.com",
    twitter: "https://x.com",
    spotify: "https://open.spotify.com",
    amazon: "https://www.amazon.com",
    mercadolibre: "https://www.mercadolibre.com.co",
    wikipedia: "https://es.wikipedia.org",
  };
  return urls[site] || "https://www.google.com";
}

// ═══════════════════════════════════════════════════════════
// MOTOR DE EJECUCIÓN MULTI-PASO
// ═══════════════════════════════════════════════════════════
async function runMultiStepAgent(instruction) {
  const steps = decomposeInstruction(instruction);
  
  sendProgress(`📋 Misión descompuesta en ${steps.length} paso(s):`, "info");
  steps.forEach((s, i) => sendProgress(`   ${i+1}. ${s.description}`, "info"));
  
  for (let i = 0; i < steps.length; i++) {
    if (!isAgentRunning) { sendProgress("⏹️ Misión cancelada.", "warning"); return; }
    
    const step = steps[i];
    sendProgress(`\n🔄 ══ PASO ${i+1}/${steps.length}: ${step.description} ══`, "info");
    
    try {
      await executeStep(step);
    } catch (err) {
      sendProgress(`⚠️ Error en paso ${i+1}: ${err.message}. Continuando...`, "warning");
    }
    
    // Pausa entre pasos
    if (i < steps.length - 1) {
      await sleep(2000);
    }
  }
  
  if (isAgentRunning) {
    sendProgress("🎉 ¡Todos los pasos completados! Misión finalizada.", "success");
    isAgentRunning = false;
  }
}

async function executeStep(step) {
  switch (step.action) {
    case "navigate":
      await doNavigate(step.site);
      break;
    case "search_youtube":
      await doSearchYouTube(step.query);
      break;
    case "search_google":
      await doSearchGoogle(step.query);
      break;
    case "search_and_play":
      await doSearchYouTube(step.query);
      await sleep(3000);
      await doClickFirstVideo();
      break;
    case "click_first_result":
      await doClickFirstVideo();
      break;
    case "wait_play":
      sendProgress(`⏳ Esperando ${step.seconds}s para que reproduzca...`, "info");
      await sleep(step.seconds * 1000);
      await doDismissPopups();
      break;
    case "scroll_to_comments":
      await doScrollToComments();
      break;
    case "click_comment_box":
      await doClickCommentBox();
      break;
    case "type_text":
      await doTypeInActiveElement(step.text);
      break;
    case "click_send_comment":
      await doClickSendComment();
      break;
    case "click_like":
      await doClickLike();
      break;
    case "click_subscribe":
      await doClickSubscribe();
      break;
    case "click_share":
      await doClickShare();
      break;
    case "click_by_text":
      await doClickByText(step.text);
      break;
    case "dismiss_popups":
      await doDismissPopups();
      break;
    default:
      sendProgress(`⚠️ Acción desconocida: ${step.action}`, "warning");
  }
}

// ═══════════════════════════════════════════════════════════
// ACCIONES DEL AGENTE
// ═══════════════════════════════════════════════════════════

// --- NAVEGAR ---
async function doNavigate(site) {
  const url = getSiteUrl(site);
  sendProgress(`🌐 Abriendo ${site}...`, "info");
  if (agentTabId) {
    await chrome.tabs.update(agentTabId, { url });
  } else {
    const tab = await chrome.tabs.create({ url });
    agentTabId = tab.id;
  }
  await waitTabComplete(agentTabId);
  await sleep(2500);
  await doDismissPopups();
}

// --- BUSCAR EN YOUTUBE ---
async function doSearchYouTube(query) {
  // Si no estamos en YouTube, navegar primero
  const tab = agentTabId ? await chrome.tabs.get(agentTabId) : null;
  if (!tab || !tab.url || !tab.url.includes("youtube.com")) {
    await doNavigate("youtube");
  }
  
  sendProgress(`🔍 Buscando en YouTube: "${query}"...`, "info");
  
  try {
    await chrome.scripting.executeScript({
      target: { tabId: agentTabId },
      func: (q) => {
        // Método 1: Usar la barra de búsqueda directamente
        const searchInput = document.querySelector("input#search, input[name='search_query']");
        if (searchInput) {
          searchInput.focus();
          searchInput.value = q;
          searchInput.dispatchEvent(new Event("input", { bubbles: true }));
          
          // Click en botón de buscar
          setTimeout(() => {
            const searchBtn = document.querySelector("button#search-icon-legacy, button.ytd-searchbox");
            if (searchBtn) searchBtn.click();
            else {
              // Fallback: Enter key
              searchInput.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", code: "Enter", keyCode: 13, bubbles: true }));
              searchInput.form && searchInput.form.submit();
            }
          }, 500);
          return true;
        }
        // Método 2: Navegar directamente a la URL de búsqueda
        window.location.href = `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`;
        return true;
      },
      args: [query]
    });
  } catch (e) {
    // Fallback: navegar directamente
    await chrome.tabs.update(agentTabId, { url: `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}` });
  }
  
  await waitTabComplete(agentTabId);
  await sleep(3000);
  await doDismissPopups();
  sendProgress("✅ Resultados de búsqueda cargados.", "success");
}

// --- BUSCAR EN GOOGLE ---
async function doSearchGoogle(query) {
  sendProgress(`🔍 Buscando en Google: "${query}"...`, "info");
  const url = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
  if (agentTabId) {
    await chrome.tabs.update(agentTabId, { url });
  } else {
    const tab = await chrome.tabs.create({ url });
    agentTabId = tab.id;
  }
  await waitTabComplete(agentTabId);
  await sleep(2000);
  sendProgress("✅ Resultados de Google cargados.", "success");
}

// --- CLICK EN PRIMER VIDEO ---
async function doClickFirstVideo() {
  sendProgress("▶️ Buscando primer video para reproducir...", "info");
  await sleep(1500);
  
  try {
    const results = await chrome.scripting.executeScript({
      target: { tabId: agentTabId },
      func: () => {
        // YouTube selectors para videos en resultados
        const selectors = [
          "ytd-video-renderer a#video-title",
          "a#video-title",
          "ytd-video-renderer a#thumbnail",
          "a.ytd-video-renderer[href*='/watch']",
          "a[href*='/watch?v=']",
          // Google video results
          "a[href*='youtube.com/watch']",
        ];
        
        for (const sel of selectors) {
          const el = document.querySelector(sel);
          if (el) {
            el.click();
            return { success: true, text: el.textContent?.trim()?.substring(0, 60) || "video" };
          }
        }
        return { success: false };
      }
    });
    
    if (results[0].result?.success) {
      sendProgress(`✅ Reproduciendo: "${results[0].result.text}"`, "success");
      await waitTabComplete(agentTabId);
      await sleep(4000);
      await doDismissPopups();
    } else {
      sendProgress("⚠️ No se encontró un video para reproducir.", "warning");
    }
  } catch (e) {
    sendProgress("⚠️ Error al intentar reproducir video.", "warning");
  }
}

// --- SCROLL A COMENTARIOS ---
async function doScrollToComments() {
  sendProgress("📜 Bajando a la sección de comentarios...", "info");
  
  try {
    await chrome.scripting.executeScript({
      target: { tabId: agentTabId },
      func: () => {
        // Scroll progresivo hacia los comentarios
        const scrollDown = (iterations, current = 0) => {
          if (current >= iterations) return;
          window.scrollBy(0, 400);
          setTimeout(() => scrollDown(iterations, current + 1), 400);
        };
        
        // Intentar encontrar la sección de comentarios
        const comments = document.querySelector("#comments, ytd-comments, #comment-section-renderer");
        if (comments) {
          comments.scrollIntoView({ behavior: "smooth", block: "center" });
        } else {
          // Scroll manual hacia abajo
          scrollDown(8);
        }
      }
    });
    
    await sleep(4000);
    sendProgress("✅ Sección de comentarios visible.", "success");
  } catch (e) {
    sendProgress("⚠️ Error al buscar comentarios.", "warning");
  }
}

// --- CLICK EN CAJA DE COMENTARIOS ---
async function doClickCommentBox() {
  sendProgress("💬 Abriendo caja de comentarios...", "info");
  
  // Primero scrollear a los comentarios
  await doScrollToComments();
  await sleep(2000);
  
  try {
    await chrome.scripting.executeScript({
      target: { tabId: agentTabId },
      func: () => {
        // Selectores para la caja de comentarios de YouTube
        const selectors = [
          "#placeholder-area",
          "#simplebox-placeholder", 
          "ytd-comment-simplebox-renderer #placeholder-area",
          "tp-yt-paper-input-container input",
          "#contenteditable-root",
          "[contenteditable='true']",
          "div[id='contenteditable-root']",
        ];
        
        for (const sel of selectors) {
          const el = document.querySelector(sel);
          if (el) {
            el.click();
            el.focus();
            return true;
          }
        }
        
        // Buscar por texto placeholder
        const allElements = document.querySelectorAll("div, span, input, yt-formatted-string");
        for (const el of allElements) {
          const text = (el.textContent || "").toLowerCase();
          if (text.includes("añade un comentario") || text.includes("add a comment") || text.includes("agregar comentario") || text.includes("añadir un comentario")) {
            el.click();
            el.focus();
            return true;
          }
        }
        return false;
      }
    });
    
    await sleep(2000);
    sendProgress("✅ Caja de comentarios activada.", "success");
  } catch (e) {
    sendProgress("⚠️ No se pudo activar la caja de comentarios.", "warning");
  }
}

// --- ESCRIBIR TEXTO ---
async function doTypeInActiveElement(text) {
  sendProgress(`✍️ Escribiendo: "${text}"...`, "info");
  await sleep(1000);
  
  try {
    await chrome.scripting.executeScript({
      target: { tabId: agentTabId },
      func: (textToType) => {
        // Buscar el campo activo o editable
        const editableSelectors = [
          "#contenteditable-root",
          "[contenteditable='true']",
          "div[contenteditable='']",
          "textarea:focus",
          "input:focus",
          "textarea",
        ];
        
        let target = document.activeElement;
        
        // Si el elemento activo no es editable, buscar uno
        if (!target || (target.tagName === "BODY" || target.tagName === "HTML")) {
          for (const sel of editableSelectors) {
            const el = document.querySelector(sel);
            if (el) { target = el; break; }
          }
        }
        
        if (target) {
          target.focus();
          
          if (target.getAttribute("contenteditable") !== null || target.id === "contenteditable-root") {
            // Contenteditable div (YouTube comments)
            target.textContent = "";
            target.focus();
            document.execCommand("insertText", false, textToType);
            target.dispatchEvent(new Event("input", { bubbles: true }));
          } else if (target.tagName === "TEXTAREA" || target.tagName === "INPUT") {
            target.value = textToType;
            target.dispatchEvent(new Event("input", { bubbles: true }));
            target.dispatchEvent(new Event("change", { bubbles: true }));
          } else {
            // Fallback
            target.textContent = textToType;
            target.dispatchEvent(new Event("input", { bubbles: true }));
          }
          return true;
        }
        return false;
      },
      args: [text]
    });
    
    await sleep(1500);
    sendProgress(`✅ Texto escrito: "${text}"`, "success");
  } catch (e) {
    sendProgress("⚠️ No se pudo escribir el texto.", "warning");
  }
}

// --- CLICK EN ENVIAR COMENTARIO ---
async function doClickSendComment() {
  sendProgress("📤 Enviando comentario...", "info");
  await sleep(1000);
  
  try {
    await chrome.scripting.executeScript({
      target: { tabId: agentTabId },
      func: () => {
        const selectors = [
          "#submit-button button",
          "#submit-button",
          "ytd-button-renderer#submit-button button",
          "tp-yt-paper-button#submit-button",
          "button[aria-label*='Enviar']",
          "button[aria-label*='Submit']",
          "button[aria-label*='Comment']",
          "button[aria-label*='Comentar']",
        ];
        
        for (const sel of selectors) {
          const el = document.querySelector(sel);
          if (el && !el.disabled) {
            el.click();
            return true;
          }
        }
        
        // Buscar por texto del botón
        const buttons = document.querySelectorAll("button, tp-yt-paper-button, yt-button-renderer");
        for (const btn of buttons) {
          const text = (btn.textContent || btn.getAttribute("aria-label") || "").toLowerCase();
          if (text.includes("comentar") || text.includes("enviar") || text.includes("comment") || text.includes("submit") || text.includes("send")) {
            btn.click();
            return true;
          }
        }
        return false;
      }
    });
    
    await sleep(2000);
    sendProgress("✅ Comentario enviado.", "success");
  } catch (e) {
    sendProgress("⚠️ No se pudo enviar el comentario.", "warning");
  }
}

// --- CLICK EN LIKE ---
async function doClickLike() {
  sendProgress("👍 Dando like...", "info");
  await sleep(1000);
  
  try {
    const results = await chrome.scripting.executeScript({
      target: { tabId: agentTabId },
      func: () => {
        // YouTube like button selectors (actualizado para 2025+)
        const selectors = [
          "like-button-view-model button",
          "#segmented-like-button button",
          "ytd-toggle-button-renderer#button[aria-label*='like' i] button",
          "button[aria-label*='Me gusta']",
          "button[aria-label*='me gusta']",
          "button[aria-label*='like' i]",
          "#top-level-buttons-computed ytd-toggle-button-renderer:first-child button",
          "ytd-menu-renderer ytd-toggle-button-renderer:first-child button",
          "segmented-like-dislike-button-view-model like-button-view-model button",
        ];
        
        for (const sel of selectors) {
          const el = document.querySelector(sel);
          if (el) {
            el.click();
            return { success: true };
          }
        }
        
        // Buscar el SVG del pulgar arriba y hacer clic en su contenedor
        const svgs = document.querySelectorAll("svg, yt-icon");
        for (const svg of svgs) {
          const parent = svg.closest("button");
          if (parent) {
            const label = (parent.getAttribute("aria-label") || "").toLowerCase();
            if (label.includes("like") || label.includes("gusta")) {
              parent.click();
              return { success: true };
            }
          }
        }
        
        return { success: false };
      }
    });
    
    if (results[0].result?.success) {
      sendProgress("✅ ¡Like dado con éxito! 👍", "success");
    } else {
      sendProgress("⚠️ No se encontró el botón de like.", "warning");
    }
  } catch (e) {
    sendProgress("⚠️ Error al dar like.", "warning");
  }
}

// --- CLICK EN SUSCRIBIRSE ---
async function doClickSubscribe() {
  sendProgress("🔔 Suscribiéndose al canal...", "info");
  
  try {
    await chrome.scripting.executeScript({
      target: { tabId: agentTabId },
      func: () => {
        const selectors = [
          "#subscribe-button button",
          "#subscribe-button",
          "ytd-subscribe-button-renderer button",
          "button[aria-label*='Suscri']",
          "button[aria-label*='Subscribe']",
        ];
        
        for (const sel of selectors) {
          const el = document.querySelector(sel);
          if (el) { el.click(); return true; }
        }
        return false;
      }
    });
    
    await sleep(1500);
    sendProgress("✅ Suscripción realizada.", "success");
  } catch (e) {
    sendProgress("⚠️ Error al suscribirse.", "warning");
  }
}

// --- CLICK EN COMPARTIR ---
async function doClickShare() {
  sendProgress("📢 Compartiendo...", "info");
  
  try {
    await chrome.scripting.executeScript({
      target: { tabId: agentTabId },
      func: () => {
        const buttons = document.querySelectorAll("button, yt-button-view-model button");
        for (const btn of buttons) {
          const label = (btn.getAttribute("aria-label") || btn.textContent || "").toLowerCase();
          if (label.includes("compartir") || label.includes("share")) {
            btn.click();
            return true;
          }
        }
        return false;
      }
    });
    
    await sleep(1500);
    sendProgress("✅ Menú de compartir abierto.", "success");
  } catch (e) {
    sendProgress("⚠️ Error al compartir.", "warning");
  }
}

// --- CLICK POR TEXTO ---
async function doClickByText(text) {
  sendProgress(`🖱️ Buscando y haciendo clic en: "${text}"...`, "info");
  
  try {
    const results = await chrome.scripting.executeScript({
      target: { tabId: agentTabId },
      func: (searchText) => {
        const normalizedSearch = searchText.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        
        // Buscar en botones, links y elementos clickeables
        const clickables = document.querySelectorAll("button, a, [role='button'], [onclick], input[type='submit'], input[type='button']");
        
        for (const el of clickables) {
          const elText = (el.textContent || el.getAttribute("aria-label") || el.getAttribute("title") || "")
            .toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
          
          if (elText.includes(normalizedSearch)) {
            el.click();
            return { success: true, found: elText.substring(0, 40) };
          }
        }
        
        // Búsqueda más amplia
        const allElements = document.querySelectorAll("*");
        for (const el of allElements) {
          if (el.children.length === 0) {
            const elText = (el.textContent || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            if (elText.includes(normalizedSearch)) {
              el.click();
              return { success: true, found: elText.substring(0, 40) };
            }
          }
        }
        
        return { success: false };
      },
      args: [text]
    });
    
    if (results[0].result?.success) {
      sendProgress(`✅ Clic exitoso en: "${results[0].result.found}"`, "success");
    } else {
      sendProgress(`⚠️ No se encontró el elemento: "${text}"`, "warning");
    }
  } catch (e) {
    sendProgress(`⚠️ Error buscando: "${text}"`, "warning");
  }
  
  await sleep(2000);
}

// --- OMITIR POPUPS / ANIMACIONES ---
async function doDismissPopups() {
  try {
    await chrome.scripting.executeScript({
      target: { tabId: agentTabId },
      func: () => {
        // Lista de textos de botones de popup a cerrar automáticamente
        const dismissTexts = [
          "omitir", "skip", "no gracias", "no thanks", "cerrar", "close",
          "dismiss", "got it", "entendido", "aceptar", "accept",
          "rechazar todo", "reject all", "ahora no", "not now",
          "tal vez luego", "maybe later", "continuar", "continue",
          "omitir anuncio", "skip ad", "skip ads", "saltar anuncio",
          "i agree", "agree", "acepto",
        ];
        
        const clickables = document.querySelectorAll("button, [role='button'], a.ytp-ad-skip-button, .ytp-ad-skip-button-modern, .ytp-skip-ad-button");
        
        let dismissed = 0;
        for (const el of clickables) {
          const text = (el.textContent || el.getAttribute("aria-label") || "").toLowerCase().trim();
          for (const dt of dismissTexts) {
            if (text.includes(dt)) {
              el.click();
              dismissed++;
              break;
            }
          }
        }
        
        // YouTube specific: skip ad overlay
        const skipBtns = document.querySelectorAll(".ytp-ad-skip-button, .ytp-ad-skip-button-modern, .ytp-skip-ad-button, button.ytp-ad-skip-button-modern");
        for (const btn of skipBtns) {
          btn.click();
          dismissed++;
        }
        
        // Cookie consent banners
        const consentBtns = document.querySelectorAll("[aria-label*='cookie' i] button, [aria-label*='consent' i] button, #onetrust-accept-btn-handler, .cookie-consent-accept");
        for (const btn of consentBtns) {
          btn.click();
          dismissed++;
        }
        
        return dismissed;
      }
    });
  } catch (e) {
    // Silently fail - popups may not exist
  }
}

// ═══════════════════════════════════════════════════════════
// UTILIDADES
// ═══════════════════════════════════════════════════════════
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

function waitTabComplete(tabId) {
  return new Promise((resolve) => {
    const check = () => {
      chrome.tabs.get(tabId, (tab) => {
        if (chrome.runtime.lastError || !tab) { resolve(); return; }
        if (tab.status === "complete") { resolve(); return; }
        const listener = (tid, info) => {
          if (tid === tabId && info.status === "complete") {
            chrome.tabs.onUpdated.removeListener(listener);
            resolve();
          }
        };
        chrome.tabs.onUpdated.addListener(listener);
        // Timeout safety
        setTimeout(resolve, 15000);
      });
    };
    check();
  });
}

function sendProgress(text, type) {
  if (pwaTabId) {
    chrome.tabs.sendMessage(pwaTabId, {
      action: "progress_update", text, type
    }).catch(() => {});
  }
}
