// Bridge between the Next.js PWA and the Chrome Extension
console.log("🔌 XuperBrain PWA Connector Active");

// Notify the PWA that the extension is installed and active
document.addEventListener("DOMContentLoaded", () => {
  window.dispatchEvent(new CustomEvent("XuperBrain_Extension_Active"));
});

// Ping/Pong check to let Next.js detect the extension dynamically
window.addEventListener("XuperBrain_Ping", () => {
  window.dispatchEvent(new CustomEvent("XuperBrain_Pong"));
});

// Listen to Launch events from the PWA and forward them to the background worker
window.addEventListener("XuperBrain_Launch", (event) => {
  console.log("🚀 Launch event intercepted from PWA:", event.detail);
  chrome.runtime.sendMessage({
    action: "launch_mission",
    instruction: event.detail.instruction
  });
});

// Listen to Stop events from the PWA and forward them to the background worker
window.addEventListener("XuperBrain_Stop", () => {
  console.log("⏹️ Stop event intercepted from PWA");
  chrome.runtime.sendMessage({
    action: "stop_mission"
  });
});

// Listen to messages from background.js and forward them to the PWA page
chrome.runtime.onMessage.addListener((message) => {
  if (message.action === "progress_update") {
    window.dispatchEvent(new CustomEvent("XuperBrain_Progress", {
      detail: {
        text: message.text,
        type: message.type,
        screenshotUrl: message.screenshotUrl || null
      }
    }));
  }
});
