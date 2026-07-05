// XuperBrain Chrome Extension v4.0 - Cloud Reasoning Agent
let pwaTabId = null;
let agentTabId = null;
let isAgentRunning = false;
const API_URL = "https://localecomer.store/api/ai/browser-agent";

chrome.runtime.onMessage.addListener((message, sender) => {
  if (message.action === "launch_mission") {
    pwaTabId = sender.tab.id;
    isAgentRunning = true;
    sendProgress("🧠 Conectando con XuperBrain en la nube...", "info");
    runCloudAgent(message.instruction);
  } else if (message.action === "stop_mission") {
    sendProgress("⏹️ Misión detenida.", "warning");
    isAgentRunning = false;
    if (agentTabId) { chrome.tabs.remove(agentTabId).catch(() => {}); agentTabId = null; }
  }
});

function sendProgress(message, type = "info") {
  if (pwaTabId) {
    chrome.tabs.sendMessage(pwaTabId, { action: "agent_progress", message, type }).catch(() => {});
  }
}

async function runCloudAgent(instruction) {
  let stepCount = 0;
  
  while (isAgentRunning && stepCount < 20) {
    stepCount++;
    
    // 1. Obtener estado actual (URL y elementos)
    let currentUrl = "Nueva Pestaña";
    let elements = [];
    
    if (agentTabId) {
      try {
        const tab = await chrome.tabs.get(agentTabId);
        currentUrl = tab.url || "Desconocida";
        
        if (currentUrl.startsWith("http")) {
          // Extraer elementos interactivos
          const results = await chrome.scripting.executeScript({
            target: { tabId: agentTabId },
            func: () => {
              // Limpiar marcas anteriores
              document.querySelectorAll("[data-ai-id]").forEach(el => el.removeAttribute("data-ai-id"));
              
              const interactables = document.querySelectorAll("a, button, input, textarea, [role='button'], [tabindex='0']");
              const elements = [];
              let idCounter = 1;
              
              for (const el of interactables) {
                // Filtrar elementos invisibles
                const rect = el.getBoundingClientRect();
                if (rect.width === 0 || rect.height === 0 || rect.top < 0 || rect.top > window.innerHeight) continue;
                
                const text = (el.innerText || el.value || el.getAttribute("aria-label") || el.getAttribute("placeholder") || "").trim().substring(0, 50);
                if (!text && el.tagName !== "INPUT") continue;
                
                const id = idCounter++;
                el.setAttribute("data-ai-id", id);
                elements.push({ id, tag: el.tagName.toLowerCase(), type: el.type || "", text });
                
                if (elements.length >= 80) break; // Límite para no saturar el LLM
              }
              return elements;
            }
          });
          if (results && results[0] && results[0].result) {
            elements = results[0].result;
          }
        }
      } catch (e) {
        console.error(e);
      }
    }
    
    sendProgress(`☁️ Analizando pantalla actual...`, "info");
    
    // 2. Consultar a la nube
    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ instruction, currentUrl, elements })
      });
      
      const data = await response.json();
      
      if (data.error) {
        sendProgress(`⚠️ Error en la nube: ${data.error}`, "warning");
        await sleep(3000);
        continue;
      }
      
      const action = data.action;
      if (!action) {
        sendProgress(`⚠️ La IA no devolvió una acción válida.`, "warning");
        break;
      }
      
      // 3. Ejecutar acción dictada por la nube
      const success = await executeCloudAction(action);
      if (action.action === "complete") {
        sendProgress(`🎉 ¡Misión cumplida! ${action.message || ""}`, "success");
        isAgentRunning = false;
        break;
      }
      
      if (!success) {
        // Retry logic o esperar
        await sleep(2000);
      }
      
    } catch (err) {
      sendProgress(`⚠️ Fallo de conexión con la nube. Reintentando...`, "warning");
      await sleep(3000);
    }
  }
  
  if (isAgentRunning && stepCount >= 20) {
    sendProgress("⏹️ Límite de pasos alcanzado. Misión detenida por seguridad.", "warning");
    isAgentRunning = false;
  }
}

async function executeCloudAction(actionObj) {
  const { action, url, id, text, ms, message } = actionObj;
  
  switch (action) {
    case "goto":
      sendProgress(`🌐 Navegando a: ${url}`, "info");
      if (agentTabId) {
        await chrome.tabs.update(agentTabId, { url });
      } else {
        const tab = await chrome.tabs.create({ url });
        agentTabId = tab.id;
      }
      await waitTabComplete(agentTabId);
      await sleep(3000);
      return true;
      
    case "click":
      sendProgress(`🖱️ Haciendo clic en elemento #${id}...`, "info");
      return await executeInTab((targetId) => {
        const el = document.querySelector(`[data-ai-id='${targetId}']`);
        if (el) { el.click(); return true; }
        return false;
      }, id);
      
    case "type":
      sendProgress(`✍️ Escribiendo "${text}"...`, "info");
      return await executeInTab((params) => {
        const el = document.querySelector(`[data-ai-id='${params.id}']`);
        if (el) {
          el.focus();
          el.value = params.text;
          el.dispatchEvent(new Event("input", { bubbles: true }));
          el.dispatchEvent(new Event("change", { bubbles: true }));
          // Intentar enviar formulario (Enter)
          setTimeout(() => {
            el.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", code: "Enter", keyCode: 13, bubbles: true }));
            if (el.form) el.form.submit();
          }, 300);
          return true;
        }
        return false;
      }, { id, text });
      
    case "scroll":
      sendProgress(`📜 Desplazando página...`, "info");
      return await executeInTab(() => {
        window.scrollBy(0, window.innerHeight * 0.8);
        return true;
      });
      
    case "wait":
      sendProgress(`⏳ Esperando...`, "info");
      await sleep(ms || 3000);
      return true;
      
    case "complete":
      return true;
      
    default:
      sendProgress(`⚠️ Acción desconocida enviada por la nube: ${action}`, "warning");
      return false;
  }
}

async function executeInTab(func, args) {
  if (!agentTabId) return false;
  try {
    const results = await chrome.scripting.executeScript({
      target: { tabId: agentTabId },
      func: func,
      args: [args]
    });
    return results[0]?.result || false;
  } catch (e) {
    return false;
  }
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function waitTabComplete(tabId) {
  return new Promise((resolve) => {
    let limit = 0;
    const interval = setInterval(() => {
      chrome.tabs.get(tabId, (tab) => {
        limit++;
        if (chrome.runtime.lastError || !tab || tab.status === "complete" || limit > 30) {
          clearInterval(interval);
          resolve();
        }
      });
    }, 500);
  });
}
