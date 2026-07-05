// Notify background script that Facebook page is ready
console.log("🤖 Facebook Automation Script Loaded");
chrome.runtime.sendMessage({ action: "page_ready", page: "facebook" });

chrome.runtime.onMessage.addListener((message) => {
  if (message.action === "start_facebook") {
    executeFacebook(message.imageData, message.text);
  }
});

async function executeFacebook(imageData, postText) {
  chrome.runtime.sendMessage({ action: "facebook_log", text: "🔍 Verificando estado de la sesión de Facebook...", type: "info" });
  
  // Check if we are on the login page
  const pageContent = document.body.innerText.toLowerCase();
  if (pageContent.includes("iniciar sesión") || pageContent.includes("log in") || document.querySelector("input[id='email'], input[name='email']")) {
    chrome.runtime.sendMessage({ action: "facebook_log", text: "⚠️ Se requiere iniciar sesión en Facebook. Por favor, ingresa tus datos en la ventana abierta. Esperando 10 segundos...", type: "warning" });
    await sleep(10000);
  }

  chrome.runtime.sendMessage({ action: "facebook_log", text: "📝 Abriendo el cuadro de publicación de Facebook...", type: "info" });
  
  // Try to find the "What's on your mind?" button
  let publishBox = null;
  const elements = Array.from(document.querySelectorAll("span, div[role='button']"));
  
  for (const el of elements) {
    const text = el.textContent || "";
    if (text.includes("¿Qué estás pensando") || text.includes("What's on your mind") || text.includes("Crear publicación") || text.includes("Create post")) {
      publishBox = el;
      break;
    }
  }

  if (publishBox) {
    publishBox.click();
    await sleep(4000);
  } else {
    // Try visiting the user's profile to find the box
    chrome.runtime.sendMessage({ action: "facebook_log", text: "⚠️ No se encontró la caja de publicación en el feed. Redirigiendo a tu perfil...", type: "warning" });
    window.location.href = "https://www.facebook.com/me";
    await sleep(6000);
    
    const profileElements = Array.from(document.querySelectorAll("span, div[role='button']"));
    for (const el of profileElements) {
      const text = el.textContent || "";
      if (text.includes("¿Qué estás pensando") || text.includes("What's on your mind")) {
        publishBox = el;
        break;
      }
    }
    
    if (publishBox) {
      publishBox.click();
      await sleep(4000);
    } else {
      chrome.runtime.sendMessage({ action: "facebook_log", text: "❌ No se pudo abrir la ventana de publicación.", type: "error" });
      return;
    }
  }

  chrome.runtime.sendMessage({ action: "facebook_log", text: "📁 Cargando imagen generada...", type: "info" });
  
  // Convert base64 image data to a file
  const imageFile = base64ToFile(imageData, "motivation.png");
  
  // Find file input element
  const fileInput = document.querySelector("input[type='file']");
  if (fileInput) {
    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(imageFile);
    fileInput.files = dataTransfer.files;
    fileInput.dispatchEvent(new Event("change", { bubbles: true }));
    await sleep(4000);
  } else {
    chrome.runtime.sendMessage({ action: "facebook_log", text: "⚠️ No se encontró el cargador de imágenes estándar. Intentando buscar botón de fotos...", type: "warning" });
    
    // Look for image/video upload icon button
    const photoIcon = document.querySelector("div[aria-label*='Foto/video'], div[aria-label*='Photo/video']");
    if (photoIcon) {
      photoIcon.click();
      await sleep(3000);
      
      const newFileInput = document.querySelector("input[type='file']");
      if (newFileInput) {
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(imageFile);
        newFileInput.files = dataTransfer.files;
        newFileInput.dispatchEvent(new Event("change", { bubbles: true }));
        await sleep(4000);
      } else {
        chrome.runtime.sendMessage({ action: "facebook_log", text: "❌ No se pudo localizar el campo de carga de archivos.", type: "error" });
        return;
      }
    } else {
      chrome.runtime.sendMessage({ action: "facebook_log", text: "❌ No se pudo localizar el botón para subir fotos.", type: "error" });
      return;
    }
  }

  chrome.runtime.sendMessage({ action: "facebook_log", text: "✍️ Escribiendo mensaje y hashtags...", type: "info" });
  
  // Find contenteditable text box
  const textBox = document.querySelector("div[role='textbox'][contenteditable='true'], div[aria-label*='¿Qué estás pensando'], div[aria-label*='Create a post']");
  if (textBox) {
    textBox.focus();
    // Simulate real text insertion in contenteditable
    document.execCommand("insertText", false, postText);
    textBox.dispatchEvent(new Event("input", { bubbles: true }));
    await sleep(2000);
  } else {
    chrome.runtime.sendMessage({ action: "facebook_log", text: "⚠️ No se encontró la caja de texto. Publicando solo la imagen...", type: "warning" });
  }

  chrome.runtime.sendMessage({ action: "facebook_log", text: "🚀 Publicando imagen en Facebook...", type: "info" });
  
  // Find Post/Publicar button
  let postButton = null;
  const buttons = Array.from(document.querySelectorAll("div[role='button'], button"));
  for (const btn of buttons) {
    const text = btn.textContent || "";
    if (text === "Publicar" || text === "Post" || text === "Compartir" || text === "Share") {
      // Avoid clicking other buttons like "Publico" (privacy dropdown)
      const isPrivacyDropdown = btn.getAttribute("aria-haspopup") || btn.querySelector("i[class*='privacy']");
      if (!isPrivacyDropdown) {
        postButton = btn;
        break;
      }
    }
  }

  if (postButton) {
    postButton.click();
    chrome.runtime.sendMessage({ action: "facebook_log", text: "⏳ Procesando publicación...", type: "info" });
    await sleep(6000);
    chrome.runtime.sendMessage({ action: "facebook_complete" });
  } else {
    chrome.runtime.sendMessage({ action: "facebook_log", text: "❌ No se encontró el botón de publicar. Por favor haz clic en 'Publicar' manualmente en la pestaña abierta.", type: "error" });
  }
}

// Helpers
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function base64ToFile(dataurl, filename) {
  let arr = dataurl.split(','),
      mime = arr[0].match(/:(.*?);/)[1],
      bstr = atob(arr[1]),
      n = bstr.length,
      u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new File([u8arr], filename, { type: mime });
}
