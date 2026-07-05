// Notify background script that Gemini page is ready
console.log("🤖 Gemini Automation Script Loaded");
chrome.runtime.sendMessage({ action: "page_ready", page: "gemini" });

chrome.runtime.onMessage.addListener((message) => {
  if (message.action === "start_gemini") {
    executeGemini(message.prompt);
  }
});

async function executeGemini(prompt) {
  chrome.runtime.sendMessage({ action: "gemini_log", text: "✍️ Buscando cuadro de chat en Gemini...", type: "info" });
  
  const chatArea = document.querySelector("textarea, div[role='textbox'], [placeholder*='Escribe aquí']");
  if (!chatArea) {
    chrome.runtime.sendMessage({ action: "gemini_log", text: "❌ No se encontró el cuadro de chat de Gemini. Asegúrate de estar logueado.", type: "error" });
    return;
  }
  
  // Focus and input the prompt
  chatArea.focus();
  if (chatArea.tagName === "TEXTAREA" || chatArea.tagName === "INPUT") {
    chatArea.value = prompt;
    chatArea.dispatchEvent(new Event("input", { bubbles: true }));
  } else {
    chatArea.innerText = prompt;
    chatArea.dispatchEvent(new Event("input", { bubbles: true }));
  }
  
  await sleep(1000);
  
  // Send prompt
  chrome.runtime.sendMessage({ action: "gemini_log", text: "✉️ Enviando prompt a Gemini...", type: "info" });
  
  const sendButton = document.querySelector("button[aria-label*='Enviar'], button[aria-label*='Send'], button.send-button");
  if (sendButton) {
    sendButton.click();
  } else {
    const enterEvent = new KeyboardEvent("keydown", {
      key: "Enter",
      code: "Enter",
      keyCode: 13,
      which: 13,
      bubbles: true,
      cancelable: true
    });
    chatArea.dispatchEvent(enterEvent);
  }
  
  chrome.runtime.sendMessage({ action: "gemini_log", text: "⏳ Esperando 25 segundos para la generación de la imagen...", type: "info" });
  await sleep(25000);
  
  chrome.runtime.sendMessage({ action: "gemini_log", text: "📥 Buscando imagen generada...", type: "info" });
  
  // Find images
  const imgs = Array.from(document.querySelectorAll("img[src*='googleusercontent'], img[src*='blob:'], img[src*='google.com/img']"));
  if (imgs.length > 0) {
    const targetImg = imgs[imgs.length - 1]; // Get latest generated image
    chrome.runtime.sendMessage({ action: "gemini_log", text: "📸 Imagen localizada. Procesando descarga...", type: "info" });
    
    imageToBase64(targetImg, (base64) => {
      if (base64) {
        chrome.runtime.sendMessage({ action: "gemini_complete", imageData: base64 });
      } else {
        chrome.runtime.sendMessage({ action: "gemini_log", text: "⚠️ Falló la conversión. Usando imagen motivacional de respaldo...", type: "warning" });
        const fallback = generateFallbackImage();
        chrome.runtime.sendMessage({ action: "gemini_complete", imageData: fallback });
      }
    });
  } else {
    chrome.runtime.sendMessage({ action: "gemini_log", text: "⚠️ No se encontró la imagen en pantalla. Generando imagen de motivación de respaldo...", type: "warning" });
    const fallback = generateFallbackImage();
    chrome.runtime.sendMessage({ action: "gemini_complete", imageData: fallback });
  }
}

// Helpers
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function imageToBase64(imgEl, callback) {
  const canvas = document.createElement("canvas");
  canvas.width = imgEl.naturalWidth || imgEl.width || 800;
  canvas.height = imgEl.naturalHeight || imgEl.height || 800;
  const ctx = canvas.getContext("2d");
  
  // Enable cross-origin for canvas
  imgEl.crossOrigin = "Anonymous";
  
  try {
    ctx.drawImage(imgEl, 0, 0);
    const dataURL = canvas.toDataURL("image/png");
    callback(dataURL);
  } catch (e) {
    // Fallback: try fetching the image source directly as a blob
    fetch(imgEl.src)
      .then(res => res.blob())
      .then(blob => {
        const reader = new FileReader();
        reader.onloadend = () => callback(reader.result);
        reader.readAsDataURL(blob);
      })
      .catch(() => callback(null));
  }
}

function generateFallbackImage() {
  const canvas = document.createElement("canvas");
  canvas.width = 800;
  canvas.height = 800;
  const ctx = canvas.getContext("2d");
  
  // Background
  ctx.fillStyle = "#0c0f1d";
  ctx.fillRect(0, 0, 800, 800);
  
  // Border
  ctx.strokeStyle = "#581c87";
  ctx.lineWidth = 10;
  ctx.strokeRect(20, 20, 760, 760);
  
  // Text
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 38px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("EL DINERO TRABAJA PARA MI,", 400, 360);
  ctx.fillText("NO YO PARA EL DINERO.", 400, 440);
  
  // Subtext
  ctx.fillStyle = "#38bdf8";
  ctx.font = "bold 24px sans-serif";
  ctx.fillText("LocalEcomer Misión de IA", 400, 520);
  
  return canvas.toDataURL("image/png");
}
