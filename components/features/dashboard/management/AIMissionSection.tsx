"use client";

import { useState, useEffect } from "react";

interface LogStep {
  text: string;
  type: "info" | "success" | "warning" | "error";
  time: string;
}

export default function AIMissionSection() {
  const [gmailUser, setGmailUser] = useState("");
  const [gmailPass, setGmailPass] = useState("");
  const [fbUser, setFbUser] = useState("");
  const [fbPass, setFbPass] = useState("");
  
  const [missionInput, setMissionInput] = useState(
    "Conecta mi cuenta de Gmail y mi cuenta de Facebook. En Gemini crea una imagen de motivación con fondo claro y texto oscuro que hable sobre el dinero. Cuando esté listo descárgala en Descargas. Verifica que sí esté en mi almacenamiento y luego entra en Facebook con mi cuenta y sube la imagen con etiquetas virales."
  );

  const [isLoading, setIsLoading] = useState(false);
  const [logs, setLogs] = useState<LogStep[]>([]);
  const [screenshotUrl, setScreenshotUrl] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isExtensionInstalled, setIsExtensionInstalled] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [geminiApiKey, setGeminiApiKey] = useState("");

  // Cargar credenciales previas si existen
  useEffect(() => {
    const savedGmail = localStorage.getItem("ai_gmail_user") || "";
    const savedFb = localStorage.getItem("ai_fb_user") || "";
    const savedApiKey = localStorage.getItem("ai_gemini_api_key") || "";
    setGmailUser(savedGmail);
    setFbUser(savedFb);
    setGeminiApiKey(savedApiKey);
  }, []);

  // Detectar si la extensión está instalada
  useEffect(() => {
    const handlePong = () => setIsExtensionInstalled(true);
    const handleActive = () => setIsExtensionInstalled(true);

    window.addEventListener("XuperBrain_Pong", handlePong);
    window.addEventListener("XuperBrain_Extension_Active", handleActive);

    // Trigger ping
    window.dispatchEvent(new CustomEvent("XuperBrain_Ping"));

    return () => {
      window.removeEventListener("XuperBrain_Pong", handlePong);
      window.removeEventListener("XuperBrain_Extension_Active", handleActive);
    };
  }, []);

  // Escuchar logs y progreso enviados por la extensión
  useEffect(() => {
    const handleProgress = (event: any) => {
      if (!event.detail) return;
      const { text, type, screenshotUrl } = event.detail;
      
      const time = new Date().toLocaleTimeString();
      setLogs((prev) => [...prev, { text, type, time }]);

      if (screenshotUrl) {
        setScreenshotUrl(screenshotUrl);
      }
      if (type === "success" && text.includes("Misión completada")) {
        setIsLoading(false);
        setStatusMessage("La misión se completó con éxito.");
      }
      if (type === "error") {
        setIsLoading(false);
        setStatusMessage("Ocurrió un error en la misión.");
      }
    };

    window.addEventListener("XuperBrain_Progress", handleProgress);
    return () => {
      window.removeEventListener("XuperBrain_Progress", handleProgress);
    };
  }, []);

  const saveCredentials = () => {
    localStorage.setItem("ai_gmail_user", gmailUser);
    localStorage.setItem("ai_fb_user", fbUser);
    localStorage.setItem("ai_gemini_api_key", geminiApiKey);
    addLog("Credenciales guardadas localmente en la tienda.", "success");
  };

  const addLog = (text: string, type: "info" | "success" | "warning" | "error" = "info") => {
    const time = new Date().toLocaleTimeString();
    setLogs((prev) => [...prev, { text, type, time }]);
  };

  const handleLaunchMission = async () => {
    setIsLoading(true);
    setLogs([]);
    setStatusMessage(null);
    setScreenshotUrl(null);
    addLog("Iniciando Misión de IA Autónoma...", "info");
    saveCredentials();

    let finalInstruction = missionInput;
    const credsList: string[] = [];
    if (gmailUser) credsList.push(`Gmail: ${gmailUser}`);
    if (gmailPass) credsList.push(`Contraseña: ${gmailPass}`);
    if (fbUser) credsList.push(`Facebook: ${fbUser}`);
    if (fbPass) credsList.push(`ClaveFb: ${fbPass}`);
    
    if (credsList.length > 0) {
      finalInstruction += ` (${credsList.join(", ")})`;
    }

    if (isExtensionInstalled) {
      addLog("🔌 Extensión XuperBrain detectada. Enviando comando de misión...", "success");
      window.dispatchEvent(new CustomEvent("XuperBrain_Launch", {
        detail: { 
          instruction: finalInstruction,
          geminiApiKey: geminiApiKey
        }
      }));
      return; // El progreso se manejará por los event listeners
    }

    addLog("⚠️ Extensión no detectada. Intentando con el backend Python local...", "warning");

    try {
      const response = await fetch("http://localhost:8000/api/browser", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "task",
          text: finalInstruction,
          instruction: finalInstruction,
        }),
      });

      const data = await response.json();
      
      if (response.ok && data.status === "ok") {
        addLog("¡Misión completada con éxito!", "success");
        setStatusMessage(data.message || "La misión se completó.");
        setScreenshotUrl(`http://localhost:8000/api/browser/screenshot?t=${Date.now()}`);
      } else {
        addLog(`La misión falló: ${data.message || "Error desconocido"}`, "error");
        setStatusMessage(data.message || "Ocurrió un error.");
        setScreenshotUrl(`http://localhost:8000/api/browser/screenshot?t=${Date.now()}`);
      }
    } catch (error: any) {
      addLog(`Error de conexión con el backend de XuperBrain: ${error.message}`, "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleStopMission = async () => {
    addLog("⏹️ Deteniendo misión a petición del usuario...", "warning");
    
    if (isExtensionInstalled) {
      window.dispatchEvent(new CustomEvent("XuperBrain_Stop"));
      setIsLoading(false);
      setStatusMessage("Misión cancelada por el usuario.");
      return;
    }

    try {
      await fetch("http://localhost:8000/api/browser", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "stop",
        }),
      });
      addLog("✅ Agente de navegación local cerrado.", "success");
    } catch (error: any) {
      addLog(`Error al detener el backend local: ${error.message}`, "error");
    } finally {
      setIsLoading(false);
      setStatusMessage("Misión cancelada.");
    }
  };

  return (
    <div className="space-y-8 p-8 text-slate-100 max-w-6xl mx-auto bg-[#020617] border border-[#1e293b] rounded-3xl shadow-2xl">
      {/* Header - Solid Dark Navy Background with Purple Border */}
      <div className="relative overflow-hidden rounded-3xl bg-[#090e1a] p-8 border border-[#581c87] shadow-xl">
        <div className="relative z-10 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1e293b] text-[#38bdf8] border border-[#38bdf8]/20 text-xs font-semibold uppercase tracking-wider">
            🔮 Sistema Avanzado
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-white">
            Misión de IA Autónoma
          </h1>
          <p className="text-slate-300 max-w-2xl leading-relaxed text-sm font-medium">
            Controla tu agente de navegación de forma directa. Vincula tus cuentas y configura flujos dinámicos similares a n8n. La IA iniciará sesión, generará contenido visual en Gemini y lo posteará en tus redes sociales por ti.
          </p>
        </div>
      </div>

      {/* Connection Indicator */}
      <div className={`p-4 rounded-xl border flex flex-col md:flex-row md:items-center md:justify-between text-xs gap-3 ${
        isExtensionInstalled 
          ? "bg-emerald-950/20 border-emerald-500/30 text-emerald-400" 
          : "bg-amber-950/20 border-amber-500/30 text-amber-400"
      }`}>
        <div className="flex items-center gap-2 font-bold">
          <span className={`w-2.5 h-2.5 rounded-full ${isExtensionInstalled ? "bg-emerald-400 animate-pulse" : "bg-amber-400 animate-pulse"}`}></span>
          <span>{isExtensionInstalled ? "Conexión Activa con Extensión de Chrome" : "Extensión de Chrome no detectada"}</span>
        </div>
        <div className="flex flex-col md:flex-row md:items-center gap-3">
          <span className="text-[10px] text-slate-400 font-medium">
            {isExtensionInstalled 
              ? "Misión se ejecutará de forma gratuita en tu navegador local con tus cuentas iniciadas."
              : "Instala la extensión en chrome-extension/ para ejecutar misiones gratis y sin contraseñas."}
          </span>
          <button
            onClick={() => setIsGuideOpen(true)}
            className="px-3 py-1.5 bg-[#1e293b] hover:bg-[#334155] border border-slate-700 rounded-lg text-[10px] text-slate-300 font-bold transition flex items-center gap-1.5 cursor-pointer shrink-0"
          >
            🧩 {isExtensionInstalled ? "Ver Guía" : "Cómo Instalar"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Side: Credentials and Input */}
        <div className="lg:col-span-7 space-y-8">
          {/* Credentials Panel - Solid Deep Slate-Blue Background with Violet Border */}
          <div className="bg-[#090e1a] border border-[#581c87] rounded-2xl p-6 shadow-xl">
            <h2 className="text-lg font-bold text-[#38bdf8] mb-4 flex items-center gap-2">
              🔑 Conexión Segura de Cuentas
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Google Connection */}
              <div className="space-y-4 p-4 rounded-xl bg-[#05070f] border border-[#1d4ed8]">
                <h3 className="text-xs font-bold text-[#60a5fa] uppercase tracking-widest flex items-center gap-1">
                  Google / Gemini
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Correo de Gmail</label>
                    <input
                      type="email"
                      value={gmailUser}
                      onChange={(e) => setGmailUser(e.target.value)}
                      placeholder="ejemplo@gmail.com"
                      className="w-full text-xs px-3 py-2 bg-[#0c0f1d] border border-[#1d4ed8]/50 rounded-lg focus:outline-none focus:border-[#3b82f6] text-slate-100 placeholder-slate-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Contraseña</label>
                    <input
                      type="password"
                      value={gmailPass}
                      onChange={(e) => setGmailPass(e.target.value)}
                      placeholder="••••••••"
                      className="w-full text-xs px-3 py-2 bg-[#0c0f1d] border border-[#1d4ed8]/50 rounded-lg focus:outline-none focus:border-[#3b82f6] text-slate-100 placeholder-slate-500 mb-3"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Gemini API Key (Opcional - Para Agente Autónomo)</label>
                    <input
                      type="password"
                      value={geminiApiKey}
                      onChange={(e) => setGeminiApiKey(e.target.value)}
                      placeholder="AIzaSy..."
                      className="w-full text-xs px-3 py-2 bg-[#0c0f1d] border border-[#1d4ed8]/50 rounded-lg focus:outline-none focus:border-[#3b82f6] text-slate-100 placeholder-slate-500 font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Facebook Connection */}
              <div className="space-y-4 p-4 rounded-xl bg-[#05070f] border border-[#6b21a8]">
                <h3 className="text-xs font-bold text-[#c084fc] uppercase tracking-widest flex items-center gap-1">
                  Facebook
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Usuario / Celular</label>
                    <input
                      type="text"
                      value={fbUser}
                      onChange={(e) => setFbUser(e.target.value)}
                      placeholder="Correo o Celular"
                      className="w-full text-xs px-3 py-2 bg-[#0c0f1d] border border-[#6b21a8]/50 rounded-lg focus:outline-none focus:border-[#a855f7] text-slate-100 placeholder-slate-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Contraseña</label>
                    <input
                      type="password"
                      value={fbPass}
                      onChange={(e) => setFbPass(e.target.value)}
                      placeholder="••••••••"
                      className="w-full text-xs px-3 py-2 bg-[#0c0f1d] border border-[#6b21a8]/50 rounded-lg focus:outline-none focus:border-[#a855f7] text-slate-100 placeholder-slate-500"
                    />
                  </div>
                </div>
              </div>
            </div>
            
            <p className="text-[10px] text-slate-400 mt-4 leading-normal">
              🔒 <strong>Privacidad:</strong> Tus contraseñas y correos se procesan y almacenan de forma local en tu computadora. Ningún dato sale a servidores externos, garantizando privacidad absoluta.
            </p>
          </div>

          {/* Mission Config */}
          <div className="bg-[#090e1a] border border-[#b45309] rounded-2xl p-6 shadow-xl space-y-4">
            <h2 className="text-lg font-bold text-[#fbbf24] flex items-center gap-2">
              📝 Instrucciones de la Misión
            </h2>

            <div className="space-y-2">
              <label className="block text-xs text-slate-400 font-medium">Instrucción en Lenguaje Natural</label>
              <textarea
                value={missionInput}
                onChange={(e) => setMissionInput(e.target.value)}
                rows={5}
                className="w-full text-xs px-4 py-3 bg-[#0c0f1d] border border-[#b45309]/50 rounded-xl focus:outline-none focus:border-[#fbbf24] text-slate-100 leading-relaxed resize-none"
              />
            </div>

            <div className="flex flex-wrap gap-3 justify-end pt-2">
              <button
                disabled={isLoading}
                onClick={saveCredentials}
                className={`px-4 py-2 border border-[#38bdf8]/30 hover:border-[#38bdf8] hover:bg-[#38bdf8]/10 text-[#38bdf8] rounded-xl text-xs font-semibold transition ${
                  isLoading ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
                }`}
              >
                Guardar Conexiones
              </button>
              
              {isLoading && (
                <button
                  onClick={handleStopMission}
                  className="px-4 py-2 bg-rose-700 hover:bg-rose-600 border border-rose-500 text-white rounded-xl text-xs font-bold shadow-lg transition flex items-center gap-1.5 cursor-pointer animate-pulse"
                >
                  ⏹️ Detener Misión
                </button>
              )}

              <button
                disabled={isLoading}
                onClick={handleLaunchMission}
                className={`px-6 py-2 bg-[#059669] hover:bg-[#10b981] text-white rounded-xl text-xs font-black shadow-lg transition flex items-center gap-2 ${
                  isLoading ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
                }`}
              >
                {isLoading ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                    Ejecutando Misión...
                  </>
                ) : (
                  <>🚀 Ejecutar Misión de IA</>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Right Side: Logs & Screenshot */}
        <div className="lg:col-span-5 space-y-8">
          {/* Real-time Console */}
          <div className="bg-[#090e1a] border border-[#0891b2] rounded-2xl shadow-xl flex flex-col h-[320px] overflow-hidden">
            <div className="px-4 py-3 bg-[#05070f] border-b border-[#0891b2]/50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#10b981] animate-pulse"></span>
                <span className="text-xs font-bold text-[#22d3ee] tracking-wider">Terminal de Control de IA</span>
              </div>
              <button
                onClick={() => setLogs([])}
                className="text-[10px] text-slate-400 hover:text-slate-200"
              >
                Limpiar
              </button>
            </div>
            
            <div className="flex-1 p-4 overflow-y-auto font-mono text-[11px] space-y-2.5 bg-[#030408] scrollbar-thin scrollbar-thumb-slate-800">
              {logs.length === 0 ? (
                <div className="text-slate-500 italic flex items-center justify-center h-full">
                  Esperando el lanzamiento de la misión...
                </div>
              ) : (
                logs.map((log, idx) => (
                  <div key={idx} className="flex gap-2 leading-relaxed">
                    <span className="text-slate-500 select-none">[{log.time}]</span>
                    <span
                      className={
                        log.type === "success"
                          ? "text-emerald-400 font-bold"
                          : log.type === "error"
                          ? "text-rose-400 font-bold"
                          : log.type === "warning"
                          ? "text-amber-400"
                          : "text-slate-300"
                      }
                    >
                      {log.text}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Browser HUD screenshot */}
          <div className="bg-[#090e1a] border border-[#0891b2] rounded-2xl p-6 shadow-xl space-y-4">
            <h3 className="text-xs font-bold text-[#22d3ee] uppercase tracking-widest flex items-center gap-1.5">
              👁️ Vista en Vivo del Agente (Playwright)
            </h3>
            
            <div className="relative aspect-video rounded-xl bg-[#030408] border border-[#0891b2]/30 overflow-hidden flex items-center justify-center">
              {screenshotUrl ? (
                <img
                  src={screenshotUrl}
                  alt="Navegador en vivo de la IA"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-center space-y-2 p-4">
                  <div className="text-2xl text-[#22d3ee]">🌐</div>
                  <div className="text-xs text-[#22d3ee] font-medium">Navegador offline</div>
                  <div className="text-[10px] text-slate-500 max-w-xs leading-normal">
                    La transmisión en vivo de la pantalla se mostrará aquí cuando el agente empiece a navegar.
                  </div>
                </div>
              )}
            </div>
            
            {statusMessage && (
              <div className="p-3.5 bg-[#030408] border border-[#0891b2]/20 rounded-xl text-xs text-slate-300 leading-relaxed font-mono">
                {statusMessage}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal de Guía de Instalación */}
      {isGuideOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[9999] flex items-center justify-center p-4">
          <div className="bg-[#090e1a] border border-[#581c87] rounded-3xl p-6 max-w-lg w-full space-y-6 shadow-2xl relative">
            <button 
              onClick={() => setIsGuideOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white text-lg font-bold"
            >
              ✕
            </button>

            <div className="space-y-2">
              <h2 className="text-xl font-black text-white flex items-center gap-2">
                🧩 Guía de Instalación de la Extensión
              </h2>
              <p className="text-xs text-slate-400">
                Sigue estos sencillos pasos para activar la automatización local gratuita en tu navegador.
              </p>
            </div>

            {/* Paso 1: Descargar ZIP */}
            <div className="bg-[#05070f] border border-[#581c87]/40 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-md">
              <div className="space-y-1">
                <p className="text-xs font-bold text-white flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-[#581c87] flex items-center justify-center font-bold text-white text-[10px]">1</span>
                  Descarga el archivo ZIP
                </p>
                <p className="text-[10px] text-slate-400">Descarga y descomprime el archivo de la extensión en tu computadora.</p>
              </div>
              <a
                href="/chrome-extension.zip"
                download="xuperbrain-extension.zip"
                className="px-4 py-2 bg-[#581c87] hover:bg-[#6b21a8] text-white text-xs font-black rounded-xl text-center transition flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
              >
                📥 Descargar ZIP
              </a>
            </div>

            <div className="space-y-4 text-xs leading-relaxed text-slate-300">
              <div className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-[#1e293b] flex items-center justify-center font-bold text-[#38bdf8] shrink-0">2</div>
                <div>
                  <p className="font-bold text-white">Abre la página de extensiones</p>
                  <p className="text-[11px] text-slate-400">
                    Copia y pega este enlace en una nueva pestaña de tu navegador Chrome:
                  </p>
                  <div className="mt-1 flex items-center gap-2 bg-[#05070f] border border-slate-800 p-2 rounded-lg">
                    <code className="text-[#38bdf8] select-all font-mono">chrome://extensions/</code>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-[#1e293b] flex items-center justify-center font-bold text-[#38bdf8] shrink-0">3</div>
                <div>
                  <p className="font-bold text-white">Activa el "Modo de desarrollador"</p>
                  <p className="text-[11px] text-slate-400">
                    Enciende el interruptor ubicado en la esquina superior derecha de la página de extensiones.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-[#1e293b] flex items-center justify-center font-bold text-[#38bdf8] shrink-0">4</div>
                <div>
                  <p className="font-bold text-white">Carga la extensión</p>
                  <p className="text-[11px] text-slate-400">
                    Haz clic en el botón <strong>"Cargar descomprimida"</strong> (Load unpacked) y selecciona la carpeta descomprimida (o la carpeta local de tu repositorio).
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-[#1e293b] flex items-center justify-center font-bold text-[#38bdf8] shrink-0">5</div>
                <div className="flex-1">
                  <p className="font-bold text-white">Ruta de Carpeta Local (Opcional)</p>
                  <p className="text-[11px] text-slate-400 mb-1.5">
                    Si estás trabajando localmente en tu repositorio, puedes cargar la extensión desde esta ruta:
                  </p>
                  <div className="flex items-center justify-between bg-[#05070f] border border-slate-800 p-2.5 rounded-lg gap-2">
                    <code className="text-slate-300 font-mono break-all select-all text-[10px]">
                      /home/jerson/Documentos/local-ecomer/chrome-extension
                    </code>
                    <button 
                      onClick={() => {
                        navigator.clipboard.writeText("/home/jerson/Documentos/local-ecomer/chrome-extension");
                        alert("¡Ruta copiada al portapapeles!");
                      }}
                      className="px-2.5 py-1 bg-[#1e293b] hover:bg-[#334155] border border-slate-700 rounded text-[9px] font-bold text-white shrink-0 cursor-pointer"
                    >
                      Copiar
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800 flex justify-end">
              <button 
                onClick={() => setIsGuideOpen(false)}
                className="px-5 py-2 bg-[#581c87] hover:bg-[#6b21a8] text-white rounded-xl font-bold text-xs transition cursor-pointer"
              >
                Entendido, Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
