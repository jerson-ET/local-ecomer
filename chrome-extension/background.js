// XuperBrain Chrome Extension Background Script
let pwaTabId = null;
let currentInstruction = "";
let geminiApiKey = null;
let geminiTabId = null;
let facebookTabId = null;
let generatedImageData = null; // Stores image base64
let agentTabId = null;
let isAgentRunning = false;

// Listen for messages from content scripts
chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
  console.log("📨 Message received in background.js:", message);

  // 1. Launch Mission triggered from PWA
  if (message.action === "launch_mission") {
    pwaTabId = sender.tab.id;
    currentInstruction = message.instruction;
    geminiApiKey = message.geminiApiKey;
    generatedImageData = null;
    isAgentRunning = false;
    
    // Check if default Gemini/Facebook flow
    const isDefaultFlow = currentInstruction.toLowerCase().includes("conecta") && 
                          currentInstruction.toLowerCase().includes("facebook") && 
                          currentInstruction.toLowerCase().includes("gemini");
    
    if (isDefaultFlow) {
      sendProgress("🚀 Iniciando Flujo Preprogramado Gemini -> Facebook...", "info");
      sendProgress("🌐 Abriendo pestaña de Gemini...", "info");
      chrome.tabs.create({ url: "https://gemini.google.com/app" }, (tab) => {
        geminiTabId = tab.id;
      });
    } else {
      // Run Autonomous Agent!
      sendProgress("🤖 Iniciando Agente de Navegación Autónomo XuperBrain...", "info");
      if (!geminiApiKey) {
        sendProgress("❌ Error: Se requiere una API Key de Gemini en el panel de conexiones para procesar instrucciones personalizadas de forma autónoma.", "error");
        return;
      }
      runAutonomousAgent();
    }
  }

  // 2. Tab reports it is ready (for hardcoded flow)
  else if (message.action === "page_ready") {
    const pageType = message.page;
    
    if (pageType === "gemini" && sender.tab.id === geminiTabId) {
      sendProgress("⏳ Gemini cargado. Solicitando generación de imagen de motivación...", "info");
      chrome.tabs.sendMessage(geminiTabId, {
        action: "start_gemini",
        prompt: "Genera una imagen cuadrada de motivación con fondo claro y texto oscuro que hable sobre el dinero"
      });
    }
    
    else if (pageType === "facebook" && sender.tab.id === facebookTabId) {
      sendProgress("⏳ Facebook cargado. Iniciando flujo de publicación...", "info");
      chrome.tabs.sendMessage(facebookTabId, {
        action: "start_facebook",
        imageData: generatedImageData,
        text: "¡El éxito es la suma de pequeños esfuerzos repetidos día tras día! 💪🥗 #motivacion #exito #vida #saludable #fyp"
      });
    }
  }

  // 3. Gemini progress logs
  else if (message.action === "gemini_log") {
    sendProgress(message.text, message.type);
  }

  // 4. Gemini completes and sends the generated image (base64)
  else if (message.action === "gemini_complete") {
    generatedImageData = message.imageData;
    sendProgress("✅ Imagen generada y capturada con éxito en Gemini.", "success", generatedImageData);
    
    if (geminiTabId) {
      chrome.tabs.remove(geminiTabId);
      geminiTabId = null;
    }
    
    sendProgress("🌐 Abriendo pestaña de Facebook...", "info");
    chrome.tabs.create({ url: "https://www.facebook.com" }, (tab) => {
      facebookTabId = tab.id;
    });
  }

  // 5. Facebook progress logs
  else if (message.action === "facebook_log") {
    sendProgress(message.text, message.type);
  }

  // 6. Facebook completes posting
  else if (message.action === "facebook_complete") {
    sendProgress("🎉 ¡Misión completada con éxito en Facebook!", "success");
    if (facebookTabId) {
      chrome.tabs.remove(facebookTabId);
      facebookTabId = null;
    }
  }

  // 7. Stop mission triggered from PWA
  else if (message.action === "stop_mission") {
    sendProgress("⏹️ Misión abortada por el usuario.", "warning");
    isAgentRunning = false;
    
    if (geminiTabId) {
      chrome.tabs.remove(geminiTabId);
      geminiTabId = null;
    }
    if (facebookTabId) {
      chrome.tabs.remove(facebookTabId);
      facebookTabId = null;
    }
    if (agentTabId) {
      chrome.tabs.remove(agentTabId);
      agentTabId = null;
    }
  }
});

// Helper to send progress updates to the PWA tab
function sendProgress(text, type, screenshotUrl = null) {
  if (pwaTabId) {
    chrome.tabs.sendMessage(pwaTabId, {
      action: "progress_update",
      text: text,
      type: type,
      screenshotUrl: screenshotUrl
    });
  }
}

// Promise wrapper to sleep
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Promise wrapper to wait for a tab to finish loading
function waitTabLoad(tabId) {
  return new Promise((resolve) => {
    chrome.tabs.get(tabId, (tab) => {
      if (tab.status === "complete") {
        resolve();
      } else {
        const listener = (tid, changeInfo) => {
          if (tid === tabId && changeInfo.status === "complete") {
            chrome.tabs.onUpdated.removeListener(listener);
            resolve();
          }
        };
        chrome.tabs.onUpdated.addListener(listener);
      }
    });
  });
}

// 🤖 Autonomous Agent Loop using Gemini API
async function runAutonomousAgent() {
  isAgentRunning = true;
  
  sendProgress("🧠 Analizando instrucción inicial para determinar sitio de inicio...", "info");
  
  // Decide start URL
  const startUrl = await determineStartUrl(currentInstruction, geminiApiKey);
  sendProgress(`🌐 URL de inicio identificada: ${startUrl}. Navegando...`, "info");
  
  chrome.tabs.create({ url: startUrl }, async (tab) => {
    agentTabId = tab.id;
    
    let stepCount = 1;
    const maxSteps = 15;
    
    while (isAgentRunning && stepCount <= maxSteps) {
      sendProgress(`⏳ [Paso ${stepCount}] Esperando a que cargue la página...`, "info");
      await waitTabLoad(agentTabId);
      await sleep(3500); // Wait extra 3.5s for client-side JS/React elements to render
      
      if (!isAgentRunning) break;
      
      sendProgress(`🔍 Escaneando estructura de la página y elementos interactivos...`, "info");
      
      // Get interactive elements
      let elements = [];
      try {
        const results = await chrome.scripting.executeScript({
          target: { tabId: agentTabId },
          func: () => {
            const list = [];
            let counter = 1;
            const elementsToScan = document.querySelectorAll("input, textarea, button, a, [role='button'], [onclick]");
            
            elementsToScan.forEach(el => {
              const rect = el.getBoundingClientRect();
              const isVisible = rect.width > 0 && rect.height > 0 && window.getComputedStyle(el).display !== 'none';
              
              if (isVisible) {
                el.setAttribute("data-xuper-id", counter);
                let textContent = el.innerText || el.textContent || "";
                textContent = textContent.trim().substring(0, 80);
                
                list.push({
                  id: counter,
                  tag: el.tagName.toLowerCase(),
                  type: el.getAttribute("type") || "",
                  placeholder: el.getAttribute("placeholder") || "",
                  label: el.getAttribute("aria-label") || el.getAttribute("title") || "",
                  text: textContent
                });
                counter++;
              }
            });
            return list;
          }
        });
        elements = results[0].result;
      } catch (err) {
        console.error("DOM scan error:", err);
        sendProgress("⚠️ Error escaneando la página. Reintentando en 3 segundos...", "warning");
        await sleep(3000);
        continue;
      }
      
      sendProgress(`🧠 Planificando acción con Gemini (${elements.length} elementos encontrados)...`, "info");
      
      // Get current page URL
      let currentUrl = "";
      try {
        const tabInfo = await new Promise(r => chrome.tabs.get(agentTabId, r));
        currentUrl = tabInfo.url;
      } catch {
        currentUrl = "";
      }
      
      // Request action from Gemini API
      const geminiAction = await planNextAction(currentInstruction, currentUrl, elements, geminiApiKey);
      
      if (!geminiAction) {
        sendProgress("❌ Error de comunicación con Gemini. Abortando misión.", "error");
        break;
      }
      
      console.log("Decision from Gemini:", geminiAction);
      
      if (geminiAction.action === "complete") {
        sendProgress(`🎉 ¡Misión completada con éxito!: ${geminiAction.message || 'Objetivo logrado'}`, "success");
        break;
      }
      
      if (geminiAction.action === "wait") {
        sendProgress(`⏳ Esperando ${geminiAction.ms / 1000} segundos según lo indicado por la IA...`, "info");
        await sleep(geminiAction.ms);
      }
      
      else if (geminiAction.action === "goto") {
        sendProgress(`🌐 Redirigiendo a: ${geminiAction.url}...`, "info");
        chrome.tabs.update(agentTabId, { url: geminiAction.url });
      }
      
      else if (geminiAction.action === "click") {
        sendProgress(`🖱️ Haciendo clic en elemento #${geminiAction.id}...`, "info");
        try {
          await chrome.scripting.executeScript({
            target: { tabId: agentTabId },
            func: (elementId) => {
              const el = document.querySelector(`[data-xuper-id='${elementId}']`);
              if (el) {
                el.focus();
                el.click();
                return true;
              }
              return false;
            },
            args: [geminiAction.id]
          });
        } catch (e) {
          sendProgress(`⚠️ Falló el clic en #${geminiAction.id}.`, "warning");
        }
      }
      
      else if (geminiAction.action === "type") {
        sendProgress(`✍️ Escribiendo "${geminiAction.text}" en el campo #${geminiAction.id}...`, "info");
        try {
          await chrome.scripting.executeScript({
            target: { tabId: agentTabId },
            func: (elementId, val) => {
              const el = document.querySelector(`[data-xuper-id='${elementId}']`);
              if (el) {
                el.focus();
                if (el.tagName === "INPUT" || el.tagName === "TEXTAREA") {
                  el.value = val;
                } else {
                  el.innerText = val;
                }
                el.dispatchEvent(new Event("input", { bubbles: true }));
                el.dispatchEvent(new Event("change", { bubbles: true }));
                
                // Dispatch Enter keypress to trigger website actions/search
                const enterEvent = new KeyboardEvent("keydown", {
                  key: "Enter",
                  code: "Enter",
                  keyCode: 13,
                  which: 13,
                  bubbles: true,
                  cancelable: true
                });
                el.dispatchEvent(enterEvent);
                return true;
              }
              return false;
            },
            args: [geminiAction.id, geminiAction.text]
          });
        } catch (e) {
          sendProgress(`⚠️ Falló la escritura en #${geminiAction.id}.`, "warning");
        }
      }
      
      stepCount++;
      await sleep(2500); // 2.5s gap between steps for actions to process
    }
    
    isAgentRunning = false;
  });
}

// 🤖 Query Gemini API to decide the first URL
async function determineStartUrl(instruction, apiKey) {
  const prompt = `Analiza esta instrucción de navegación web: "${instruction}". ¿A qué dirección URL de inicio debería ir el navegador para resolverla? Responde ÚNICAMENTE con la dirección URL limpia (por ejemplo: https://www.youtube.com). No incluyas etiquetas de formato ni explicaciones.`;
  
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    });
    const data = await response.json();
    let url = data.candidates[0].content.parts[0].text.trim();
    url = url.replace(/`/g, "").trim();
    if (!url.startsWith("http")) {
      url = "https://" + url;
    }
    return url;
  } catch (e) {
    console.error(e);
    return "https://www.google.com";
  }
}

// 🤖 Query Gemini API to decide the next action step
async function planNextAction(goal, currentUrl, elements, apiKey) {
  const systemPrompt = `
Eres un Agente Autónomo de Navegación Web que ayuda al usuario a cumplir sus objetivos en el navegador.
Recibirás:
1. El objetivo del usuario (Goal).
2. La URL actual de la página.
3. Una lista de elementos interactivos en la página en formato JSON, cada uno con un 'id'.

Tu tarea es analizar el estado de la página y decidir la SIGUIENTE acción a realizar para acercarte al objetivo.
Elige EXACTAMENTE una de las siguientes acciones en formato JSON:

1. Ir a una URL inicial o cambiar de página:
   {"action": "goto", "url": "https://..."}

2. Hacer clic en un elemento:
   {"action": "click", "id": 12}

3. Escribir texto en un campo de entrada:
   {"action": "type", "id": 5, "text": "texto a escribir"}

4. Esperar unos segundos (útil para que cargue contenido, reproducir música o videos):
   {"action": "wait", "ms": 5000}

5. Misión completada con éxito:
   {"action": "complete", "message": "Breve descripción de lo logrado"}

Reglas estrictas:
- Elige el elemento más lógico para avanzar. Por ejemplo, si hay una barra de búsqueda, escribe en ella primero, luego haz clic en el botón de buscar.
- Si ves que un video o música ya se está reproduciendo o el objetivo se ha cumplido, responde con la acción "complete".
- Responde ÚNICAMENTE con el objeto JSON de la acción, sin textos explicativos ni bloques de código Markdown.
`;

  const userContent = `
Objetivo del usuario: "${goal}"
URL actual: "${currentUrl}"
Elementos interactivos en pantalla:
${JSON.stringify(elements, null, 2)}
`;

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          { role: "user", parts: [{ text: systemPrompt + "\n\n" + userContent }] }
        ],
        generationConfig: {
          responseMimeType: "application/json"
        }
      })
    });
    
    const data = await response.json();
    let text = data.candidates[0].content.parts[0].text.trim();
    text = text.replace(/```json/g, "").replace(/```/g, "").trim();
    return JSON.parse(text);
  } catch (e) {
    console.error("Gemini decision parsing failed:", e);
    return null;
  }
}
