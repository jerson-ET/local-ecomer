// XuperBrain Chrome Extension Background Script
// Agente Autónomo de Navegación - Sin APIs externas requeridas
let pwaTabId = null;
let currentInstruction = "";
let agentTabId = null;
let isAgentRunning = false;

// Listen for messages from content scripts
chrome.runtime.onMessage.addListener((message, sender) => {
  console.log("📨 Message received:", message);

  if (message.action === "launch_mission") {
    pwaTabId = sender.tab.id;
    currentInstruction = message.instruction;
    isAgentRunning = true;

    sendProgress("🤖 Agente XuperBrain activado. Analizando instrucción...", "info");
    runSmartAgent(currentInstruction);
  }

  else if (message.action === "stop_mission") {
    sendProgress("⏹️ Misión detenida por el usuario.", "warning");
    isAgentRunning = false;
    if (agentTabId) {
      chrome.tabs.remove(agentTabId).catch(() => {});
      agentTabId = null;
    }
  }
});

// ═══════════════════════════════════════════════════════════
// PARSER INTELIGENTE DE INSTRUCCIONES EN ESPAÑOL
// ═══════════════════════════════════════════════════════════
function parseInstruction(text) {
  const t = text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  
  // Detectar sitio objetivo
  let site = null;
  let searchQuery = "";
  let action = "search"; // search, navigate, play

  // --- YOUTUBE ---
  if (t.includes("youtube") || t.includes("you tube")) {
    site = "youtube";
    // Extraer qué buscar/reproducir
    searchQuery = extractAfter(t, ["pon ", "reproduce ", "busca ", "coloca ", "escucha ", "play ", "musica de ", "música de ", "video de ", "videos de ", "cancion de ", "canción de "]);
    if (!searchQuery) searchQuery = extractAfter(t, ["en youtube ", "de youtube "]);
    action = (t.includes("pon ") || t.includes("reproduce") || t.includes("play") || t.includes("escucha") || t.includes("coloca")) ? "play" : "search";
  }

  // --- GOOGLE ---
  else if (t.includes("google") || t.includes("busca ") || t.includes("buscar ") || t.includes("encuentra ")) {
    site = "google";
    searchQuery = extractAfter(t, ["busca ", "buscar ", "encuentra ", "busca en google ", "en google ", "googleea ", "googlea "]);
    if (!searchQuery) {
      // Tomar todo después de "google"
      const idx = t.indexOf("google");
      if (idx !== -1) searchQuery = text.substring(idx + 6).trim();
    }
  }

  // --- FACEBOOK ---
  else if (t.includes("facebook") || t.includes("face")) {
    site = "facebook";
    searchQuery = extractAfter(t, ["publica ", "postea ", "escribe ", "busca en facebook ", "en facebook "]);
    action = (t.includes("publica") || t.includes("postea")) ? "post" : "navigate";
  }

  // --- INSTAGRAM ---
  else if (t.includes("instagram") || t.includes("insta")) {
    site = "instagram";
    searchQuery = extractAfter(t, ["busca ", "en instagram "]);
  }

  // --- TIKTOK ---
  else if (t.includes("tiktok") || t.includes("tik tok")) {
    site = "tiktok";
    searchQuery = extractAfter(t, ["busca ", "en tiktok ", "videos de "]);
  }

  // --- TWITTER/X ---
  else if (t.includes("twitter") || t.includes(" x.com")) {
    site = "twitter";
    searchQuery = extractAfter(t, ["busca ", "en twitter "]);
  }

  // --- SPOTIFY ---
  else if (t.includes("spotify")) {
    site = "spotify";
    searchQuery = extractAfter(t, ["pon ", "reproduce ", "busca ", "escucha ", "musica de "]);
    action = "play";
  }

  // --- AMAZON ---
  else if (t.includes("amazon")) {
    site = "amazon";
    searchQuery = extractAfter(t, ["busca ", "en amazon ", "compra "]);
  }

  // --- MERCADOLIBRE ---
  else if (t.includes("mercado libre") || t.includes("mercadolibre")) {
    site = "mercadolibre";
    searchQuery = extractAfter(t, ["busca ", "en mercado libre ", "en mercadolibre "]);
  }

  // --- WIKIPEDIA ---
  else if (t.includes("wikipedia")) {
    site = "wikipedia";
    searchQuery = extractAfter(t, ["busca ", "en wikipedia ", "que es ", "qué es "]);
  }

  // --- URL DIRECTA ---
  else if (t.includes("http://") || t.includes("https://") || t.includes("www.") || t.includes(".com") || t.includes(".co") || t.includes(".org")) {
    site = "url";
    const urlMatch = text.match(/(https?:\/\/[^\s]+|www\.[^\s]+|[a-zA-Z0-9-]+\.(com|co|org|net|io|dev)[^\s]*)/i);
    if (urlMatch) {
      searchQuery = urlMatch[0];
      if (!searchQuery.startsWith("http")) searchQuery = "https://" + searchQuery;
    }
  }

  // --- GENÉRICO: buscar en Google como fallback ---
  else {
    site = "google";
    // Limpiar verbos comunes para extraer solo el tema
    searchQuery = t
      .replace(/^(hola\s*|oye\s*|por favor\s*|quiero que\s*|necesito que\s*|puedes\s*|podrias\s*|)/i, "")
      .replace(/^(busca|buscar|encuentra|abre|entra en|ve a|navega a|mira|muestra|dame|dime)\s*/i, "")
      .trim();
    if (!searchQuery) searchQuery = text;
  }

  // Limpiar query
  searchQuery = searchQuery
    .replace(/^(en |de |a |el |la |los |las |un |una |unos |unas )/i, "")
    .replace(/\s+/g, " ")
    .trim();

  return { site, searchQuery, action };
}

function extractAfter(text, keywords) {
  for (const kw of keywords) {
    const idx = text.indexOf(kw);
    if (idx !== -1) {
      const result = text.substring(idx + kw.length).trim();
      // Limpiar hasta el siguiente comando si hay
      return result.split(/\s+(y luego|despues|después|y después)\s+/)[0].trim();
    }
  }
  return "";
}

// ═══════════════════════════════════════════════════════════
// MAPEO DE SITIOS A URLS
// ═══════════════════════════════════════════════════════════
function getSiteUrl(site, query) {
  const q = encodeURIComponent(query);
  const urls = {
    google: query ? `https://www.google.com/search?q=${q}` : "https://www.google.com",
    youtube: query ? `https://www.youtube.com/results?search_query=${q}` : "https://www.youtube.com",
    facebook: "https://www.facebook.com",
    instagram: query ? `https://www.instagram.com/explore/tags/${q}/` : "https://www.instagram.com",
    tiktok: query ? `https://www.tiktok.com/search?q=${q}` : "https://www.tiktok.com",
    twitter: query ? `https://x.com/search?q=${q}` : "https://x.com",
    spotify: query ? `https://open.spotify.com/search/${q}` : "https://open.spotify.com",
    amazon: query ? `https://www.amazon.com/s?k=${q}` : "https://www.amazon.com",
    mercadolibre: query ? `https://listado.mercadolibre.com.co/${q}` : "https://www.mercadolibre.com.co",
    wikipedia: query ? `https://es.wikipedia.org/wiki/Special:Search?search=${q}` : "https://es.wikipedia.org",
    url: query,
  };
  return urls[site] || `https://www.google.com/search?q=${q}`;
}

// ═══════════════════════════════════════════════════════════
// AGENTE INTELIGENTE PRINCIPAL
// ═══════════════════════════════════════════════════════════
async function runSmartAgent(instruction) {
  const parsed = parseInstruction(instruction);
  
  sendProgress(`🧠 Sitio detectado: ${parsed.site?.toUpperCase() || "GOOGLE"}`, "info");
  sendProgress(`🔍 Búsqueda: "${parsed.searchQuery || "(navegación directa)"}"`, "info");
  sendProgress(`⚡ Acción: ${parsed.action}`, "info");

  const targetUrl = getSiteUrl(parsed.site, parsed.searchQuery);
  sendProgress(`🌐 Navegando a: ${targetUrl}`, "info");

  // Abrir la pestaña
  chrome.tabs.create({ url: targetUrl }, (tab) => {
    agentTabId = tab.id;

    // Esperar a que cargue y ejecutar acciones post-carga
    const onUpdated = (tabId, changeInfo) => {
      if (tabId === agentTabId && changeInfo.status === "complete") {
        chrome.tabs.onUpdated.removeListener(onUpdated);
        
        // Esperar un poco más para que el JS del sitio cargue
        setTimeout(() => {
          if (!isAgentRunning) return;
          executePostLoadActions(parsed);
        }, 3000);
      }
    };
    chrome.tabs.onUpdated.addListener(onUpdated);
  });
}

// ═══════════════════════════════════════════════════════════
// ACCIONES POST-CARGA SEGÚN EL SITIO
// ═══════════════════════════════════════════════════════════
async function executePostLoadActions(parsed) {
  if (!agentTabId || !isAgentRunning) return;

  // --- YOUTUBE: Clic en el primer video ---
  if (parsed.site === "youtube" && parsed.action === "play") {
    sendProgress("⏳ Esperando resultados de YouTube...", "info");
    await sleep(2000);
    
    sendProgress("▶️ Buscando el primer video para reproducirlo...", "info");
    try {
      await chrome.scripting.executeScript({
        target: { tabId: agentTabId },
        func: () => {
          // Buscar el primer enlace de video en los resultados
          const videoLinks = document.querySelectorAll("a#video-title, ytd-video-renderer a#thumbnail, a.ytd-video-renderer");
          if (videoLinks.length > 0) {
            videoLinks[0].click();
            return true;
          }
          // Fallback: cualquier thumbnail
          const thumbnails = document.querySelectorAll("a[href*='/watch']");
          if (thumbnails.length > 0) {
            thumbnails[0].click();
            return true;
          }
          return false;
        }
      });
      sendProgress("🎵 ¡Video reproduciéndose! Misión completada.", "success");
    } catch (e) {
      sendProgress("⚠️ No se pudo hacer clic automático en el video. Los resultados están en pantalla.", "warning");
    }
  }

  // --- YOUTUBE: Solo búsqueda ---
  else if (parsed.site === "youtube" && parsed.action === "search") {
    sendProgress("✅ Resultados de YouTube cargados. Misión completada.", "success");
  }

  // --- GOOGLE: Resultados de búsqueda ---
  else if (parsed.site === "google") {
    sendProgress("✅ Resultados de Google cargados con éxito. Misión completada.", "success");
  }

  // --- FACEBOOK: Navegación o publicación ---
  else if (parsed.site === "facebook") {
    if (parsed.action === "post" && parsed.searchQuery) {
      sendProgress("📝 Abriendo editor de publicación en Facebook...", "info");
      await sleep(3000);
      try {
        await chrome.scripting.executeScript({
          target: { tabId: agentTabId },
          func: (textToPost) => {
            // Buscar la caja de "¿Qué estás pensando?"
            const boxes = document.querySelectorAll("span, div[role='button']");
            for (const el of boxes) {
              if ((el.textContent || "").includes("¿Qué estás pensando") || (el.textContent || "").includes("What's on your mind")) {
                el.click();
                return true;
              }
            }
            return false;
          },
          args: [parsed.searchQuery]
        });
        sendProgress("✅ Editor de Facebook abierto. Escribe tu publicación.", "success");
      } catch (e) {
        sendProgress("⚠️ No se pudo abrir el editor. Facebook está cargado en la pestaña.", "warning");
      }
    } else {
      sendProgress("✅ Facebook cargado. Misión completada.", "success");
    }
  }

  // --- SPOTIFY: Reproducir ---
  else if (parsed.site === "spotify") {
    sendProgress("⏳ Esperando resultados de Spotify...", "info");
    await sleep(3000);
    try {
      await chrome.scripting.executeScript({
        target: { tabId: agentTabId },
        func: () => {
          const playButtons = document.querySelectorAll("[data-testid='play-button'], button[aria-label*='Play'], button[aria-label*='Reproducir']");
          if (playButtons.length > 0) {
            playButtons[0].click();
            return true;
          }
          // Click first result
          const firstResult = document.querySelector("[data-testid='tracklist-row'], [data-testid='search-category-card']");
          if (firstResult) {
            firstResult.click();
            return true;
          }
          return false;
        }
      });
      sendProgress("🎵 ¡Reproduciendo en Spotify! Misión completada.", "success");
    } catch (e) {
      sendProgress("✅ Spotify cargado con los resultados. Misión completada.", "success");
    }
  }

  // --- GENÉRICO: Solo confirmar carga ---
  else {
    sendProgress("✅ Página cargada con éxito. Misión completada.", "success");
  }
}

// ═══════════════════════════════════════════════════════════
// UTILIDADES
// ═══════════════════════════════════════════════════════════
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function sendProgress(text, type, screenshotUrl = null) {
  if (pwaTabId) {
    chrome.tabs.sendMessage(pwaTabId, {
      action: "progress_update",
      text: text,
      type: type,
      screenshotUrl: screenshotUrl
    }).catch(() => {});
  }
}
