// XuperBrain Chrome Extension Background Script
let pwaTabId = null;
let currentInstruction = "";
let geminiTabId = null;
let facebookTabId = null;
let generatedImageData = null; // Stores image base64

// Listen for messages from content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("📨 Message received in background.js:", message);

  // 1. Launch Mission triggered from PWA
  if (message.action === "launch_mission") {
    pwaTabId = sender.tab.id;
    currentInstruction = message.instruction;
    generatedImageData = null;
    
    sendProgress("🚀 Extensión XuperBrain conectada. Iniciando Misión de IA...", "info");
    
    // Open Gemini tab
    sendProgress("🌐 Abriendo pestaña de Gemini...", "info");
    chrome.tabs.create({ url: "https://gemini.google.com/app" }, (tab) => {
      geminiTabId = tab.id;
    });
  }

  // 2. Tab reports it is ready
  else if (message.action === "page_ready") {
    const pageType = message.page;
    
    if (pageType === "gemini" && sender.tab.id === geminiTabId) {
      sendProgress("⏳ Gemini cargado. Solicitando generación de imagen de motivación...", "info");
      
      // Send start instruction to Gemini content script
      chrome.tabs.sendMessage(geminiTabId, {
        action: "start_gemini",
        prompt: "Genera una imagen cuadrada de motivación con fondo claro y texto oscuro que hable sobre el dinero"
      });
    }
    
    else if (pageType === "facebook" && sender.tab.id === facebookTabId) {
      sendProgress("⏳ Facebook cargado. Iniciando flujo de publicación...", "info");
      
      // Send start instruction to Facebook content script
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
    
    // Close Gemini tab
    if (geminiTabId) {
      chrome.tabs.remove(geminiTabId);
      geminiTabId = null;
    }
    
    // Open Facebook tab
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
    
    // Close Facebook tab
    if (facebookTabId) {
      chrome.tabs.remove(facebookTabId);
      facebookTabId = null;
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
