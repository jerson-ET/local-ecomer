"use client";

import React, { useState, useEffect } from "react";

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

  // Cargar credenciales previas si existen
  useEffect(() => {
    const savedGmail = localStorage.getItem("ai_gmail_user") || "";
    const savedFb = localStorage.getItem("ai_fb_user") || "";
    setGmailUser(savedGmail);
    setFbUser(savedFb);
  }, []);

  const saveCredentials = () => {
    localStorage.setItem("ai_gmail_user", gmailUser);
    localStorage.setItem("ai_fb_user", fbUser);
    addLog("Credenciales guardadas localmente en la tienda.", "success");
  };

  const addLog = (text: string, type: "info" | "success" | "warning" | "error" = "info") => {
    const time = new Date().toLocaleTimeString();
    setLogs((prev) => [...prev, { text, type, time }]);
  };

  const handleLaunchMission = async () => {
    if (!gmailUser || !gmailPass) {
      addLog("Faltan las credenciales de Gmail/Google para conectar a Gemini.", "error");
      return;
    }
    
    setIsLoading(true);
    setLogs([]);
    setStatusMessage(null);
    setScreenshotUrl(null);
    addLog("Iniciando Misión de IA Autónoma...", "info");
    saveCredentials();

    try {
      const response = await fetch("http://localhost:8000/api/browser", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          instruction: `${missionInput} (Gmail: ${gmailUser}, Contraseña: ${gmailPass}, Facebook: ${fbUser || gmailUser}, ClaveFb: ${fbPass || gmailPass})`,
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

  return (
    <div className="space-y-8 p-6 text-slate-100 max-w-6xl mx-auto">
      {/* Header - Gradiente Morado Fuerte a Azul Corporativo Cielo */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-purple-800 via-indigo-900 to-sky-500 p-8 border border-sky-400/20 shadow-2xl">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-sky-400/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-40 h-40 bg-purple-500/20 rounded-full blur-3xl"></div>
        
        <div className="relative z-10 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-400/10 text-sky-200 border border-sky-400/20 text-xs font-semibold uppercase tracking-wider">
            🔮 Sistema Avanzado
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-white drop-shadow-md">
            Misión de IA Autónoma
          </h1>
          <p className="text-sky-100/90 max-w-2xl leading-relaxed text-sm font-medium">
            Controla tu agente de navegación de forma directa. Vincula tus cuentas y configura flujos dinámicos similares a n8n. La IA iniciará sesión, generará contenido visual en Gemini y lo posteará en tus redes sociales por ti.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Side: Credentials and Input */}
        <div className="lg:col-span-7 space-y-8">
          {/* Credentials Panel - Morado Fuerte e Indigo */}
          <div className="bg-gradient-to-br from-purple-950/80 to-indigo-950/80 border border-indigo-500/30 rounded-2xl p-6 shadow-xl backdrop-blur-md">
            <h2 className="text-lg font-bold text-sky-200 mb-4 flex items-center gap-2">
              🔑 Conexión Segura de Cuentas
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Google Connection */}
              <div className="space-y-4 p-4 rounded-xl bg-purple-950/40 border border-purple-500/20">
                <h3 className="text-xs font-bold text-sky-300 uppercase tracking-widest flex items-center gap-1">
                  Google / Gemini
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-[11px] text-indigo-300 mb-1">Correo de Gmail</label>
                    <input
                      type="email"
                      value={gmailUser}
                      onChange={(e) => setGmailUser(e.target.value)}
                      placeholder="ejemplo@gmail.com"
                      className="w-full text-xs px-3 py-2 bg-indigo-950/60 border border-indigo-500/30 rounded-lg focus:outline-none focus:border-sky-400 text-slate-100 placeholder-indigo-400/50"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-indigo-300 mb-1">Contraseña</label>
                    <input
                      type="password"
                      value={gmailPass}
                      onChange={(e) => setGmailPass(e.target.value)}
                      placeholder="••••••••"
                      className="w-full text-xs px-3 py-2 bg-indigo-950/60 border border-indigo-500/30 rounded-lg focus:outline-none focus:border-sky-400 text-slate-100 placeholder-indigo-400/50"
                    />
                  </div>
                </div>
              </div>

              {/* Facebook Connection */}
              <div className="space-y-4 p-4 rounded-xl bg-purple-950/40 border border-purple-500/20">
                <h3 className="text-xs font-bold text-sky-300 uppercase tracking-widest flex items-center gap-1">
                  Facebook
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-[11px] text-indigo-300 mb-1">Usuario / Celular</label>
                    <input
                      type="text"
                      value={fbUser}
                      onChange={(e) => setFbUser(e.target.value)}
                      placeholder="Correo o Celular"
                      className="w-full text-xs px-3 py-2 bg-indigo-950/60 border border-indigo-500/30 rounded-lg focus:outline-none focus:border-sky-400 text-slate-100 placeholder-indigo-400/50"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-indigo-300 mb-1">Contraseña</label>
                    <input
                      type="password"
                      value={fbPass}
                      onChange={(e) => setFbPass(e.target.value)}
                      placeholder="••••••••"
                      className="w-full text-xs px-3 py-2 bg-indigo-950/60 border border-indigo-500/30 rounded-lg focus:outline-none focus:border-sky-400 text-slate-100 placeholder-indigo-400/50"
                    />
                  </div>
                </div>
              </div>
            </div>
            
            <p className="text-[10px] text-indigo-300/70 mt-4 leading-normal">
              🔒 <strong>Privacidad:</strong> Tus contraseñas y correos se procesan y almacenan de forma local en tu computadora. Ningún dato sale a servidores externos, garantizando privacidad absoluta.
            </p>
          </div>

          {/* Mission Config */}
          <div className="bg-gradient-to-br from-purple-950/80 to-indigo-950/80 border border-indigo-500/30 rounded-2xl p-6 shadow-xl backdrop-blur-md space-y-4">
            <h2 className="text-lg font-bold text-sky-200 flex items-center gap-2">
              📝 Instrucciones de la Misión
            </h2>

            <div className="space-y-2">
              <label className="block text-xs text-indigo-300 font-medium">Instrucción en Lenguaje Natural</label>
              <textarea
                value={missionInput}
                onChange={(e) => setMissionInput(e.target.value)}
                rows={5}
                className="w-full text-xs px-4 py-3 bg-indigo-950/60 border border-indigo-500/30 rounded-xl focus:outline-none focus:border-sky-400 text-slate-100 leading-relaxed resize-none"
              />
            </div>

            <div className="flex gap-3 justify-end pt-2">
              {/* Botón Secundario Cielo */}
              <button
                onClick={saveCredentials}
                className="px-4 py-2 border border-sky-400/30 hover:border-sky-400 hover:bg-sky-400/10 text-sky-200 rounded-xl text-xs font-semibold transition"
              >
                Guardar Conexiones
              </button>
              {/* Botón Principal Verde Claro */}
              <button
                disabled={isLoading}
                onClick={handleLaunchMission}
                className={`px-6 py-2 bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-400 hover:to-green-400 text-indigo-950 rounded-xl text-xs font-black shadow-lg shadow-emerald-500/20 transition flex items-center gap-2 ${
                  isLoading ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                {isLoading ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-indigo-950/30 border-t-indigo-950 rounded-full animate-spin"></span>
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
          <div className="bg-indigo-950/90 border border-indigo-500/30 rounded-2xl shadow-xl flex flex-col h-[320px] overflow-hidden">
            <div className="px-4 py-3 bg-purple-950/70 border-b border-indigo-500/30 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span className="text-xs font-bold text-sky-200 tracking-wider">Terminal de Control de IA</span>
              </div>
              <button
                onClick={() => setLogs([])}
                className="text-[10px] text-indigo-300 hover:text-indigo-200"
              >
                Limpiar
              </button>
            </div>
            
            <div className="flex-1 p-4 overflow-y-auto font-mono text-[11px] space-y-2.5 scrollbar-thin scrollbar-thumb-indigo-800">
              {logs.length === 0 ? (
                <div className="text-indigo-300/50 italic flex items-center justify-center h-full">
                  Esperando el lanzamiento de la misión...
                </div>
              ) : (
                logs.map((log, idx) => (
                  <div key={idx} className="flex gap-2 leading-relaxed">
                    <span className="text-indigo-400 select-none">[{log.time}]</span>
                    <span
                      className={
                        log.type === "success"
                          ? "text-emerald-400 font-bold"
                          : log.type === "error"
                          ? "text-rose-400 font-bold"
                          : log.type === "warning"
                          ? "text-amber-400"
                          : "text-sky-100"
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
          <div className="bg-gradient-to-br from-purple-950/80 to-indigo-950/80 border border-indigo-500/30 rounded-2xl p-6 shadow-xl backdrop-blur-md space-y-4">
            <h3 className="text-xs font-bold text-sky-200 uppercase tracking-widest flex items-center gap-1.5">
              👁️ Vista en Vivo del Agente (Playwright)
            </h3>
            
            <div className="relative aspect-video rounded-xl bg-indigo-950/60 border border-indigo-500/30 overflow-hidden flex items-center justify-center">
              {screenshotUrl ? (
                <img
                  src={screenshotUrl}
                  alt="Navegador en vivo de la IA"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-center space-y-2 p-4">
                  <div className="text-2xl text-sky-400">🌐</div>
                  <div className="text-xs text-sky-300 font-medium">Navegador offline</div>
                  <div className="text-[10px] text-indigo-200/60 max-w-xs leading-normal">
                    La transmisión en vivo de la pantalla se mostrará aquí cuando el agente empiece a navegar.
                  </div>
                </div>
              )}
            </div>
            
            {statusMessage && (
              <div className="p-3.5 bg-indigo-950/80 border border-indigo-500/20 rounded-xl text-xs text-sky-200 leading-relaxed font-mono">
                {statusMessage}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
