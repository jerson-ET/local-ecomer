'use client'

import React, { useState, useEffect, FormEvent } from 'react'
import { XuperBrainSection } from '../XuperBrainSection'

import {
  Search,
  Image as ImageIcon,
  FolderOpen,
  Video,
  Youtube,
  Facebook,
  Instagram,
  Mail,
  Key,
  Play,
  Terminal,
  Loader2,
  Sparkles,
  Zap,
  Info,
  X,
  ShieldCheck,
  AlertTriangle
} from 'lucide-react'

// Interfaces
interface N8nApp {
  app_id: string;
  name: string;
  icon: React.ComponentType<any>;
  color: string;
  connected: boolean;
  username?: string;
  password?: string;
}

export function N8nSection() {
  const [n8nApps, setN8nApps] = useState<N8nApp[]>([
    { app_id: 'google', name: 'Google Search', icon: Search, color: '#4285f4', connected: true },
    { app_id: 'gallery', name: 'Galería Interna', icon: ImageIcon, color: '#10b981', connected: true },
    { app_id: 'explorer', name: 'Explorador de Archivos', icon: FolderOpen, color: '#f59e0b', connected: true },
    { app_id: 'capcut', name: 'CapCut AI', icon: Video, color: '#06b6d4', connected: true },
    { app_id: 'youtube', name: 'YouTube Shorts', icon: Youtube, color: '#ff0000', connected: false, username: 'mazaabor22@gmail.com', password: 'J1e2r3s4;777' },
    { app_id: 'tiktok', name: 'TikTok', icon: SmartphoneIcon, color: '#ffffff', connected: false },
    { app_id: 'facebook', name: 'Facebook Reels', icon: Facebook, color: '#1877f2', connected: false },
    { app_id: 'instagram', name: 'Instagram Reels', icon: Instagram, color: '#e1306c', connected: false },
    { app_id: 'gmail', name: 'Gmail API', icon: Mail, color: '#ea4335', connected: false, username: 'mazaabor22@gmail.com', password: 'J1e2r3s4;777' },
  ]);

  const [activeModalApp, setActiveModalApp] = useState<N8nApp | null>(null);
  const [modalUsername, setModalUsername] = useState<string>('');
  const [modalPassword, setModalPassword] = useState<string>('');

  const [workflowInstruction, setWorkflowInstruction] = useState<string>('');
  const [workflowTemplate, setWorkflowTemplate] = useState<string>('');
  const [isExecutingWorkflow, setIsExecutingWorkflow] = useState<boolean>(false);
  const [workflowLogs, setWorkflowLogs] = useState<string[]>([]);
  const [workflowProgress, setWorkflowProgress] = useState<number>(0);
  const [backendOnline, setBackendOnline] = useState<boolean>(false);
  const [loadingBackend, setLoadingBackend] = useState<boolean>(true);

  // Check backend and load saved credentials
  useEffect(() => {
    const checkBackendAndLoad = async () => {
      try {
        setLoadingBackend(true);
        const resCheck = await fetch('http://localhost:8000/');
        if (resCheck.ok) {
          setBackendOnline(true);
          const resCreds = await fetch('http://localhost:8000/api/n8n/credentials');
          if (resCreds.ok) {
            const data = await resCreds.json();
            setN8nApps(prev => prev.map(app => {
              if (data[app.app_id]) {
                return {
                  ...app,
                  connected: data[app.app_id].connected,
                  username: data[app.app_id].username,
                  password: data[app.app_id].password,
                };
              }
              return app;
            }));
          }
        } else {
          setBackendOnline(false);
        }
      } catch (err) {
        console.error('Error connecting to local backend:', err);
        setBackendOnline(false);
      } finally {
        setLoadingBackend(false);
      }
    };
    checkBackendAndLoad();
  }, []);

  const handleTemplateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setWorkflowTemplate(val);
    setWorkflowInstruction(val);
  };

  const handleOpenConfigure = (app: N8nApp) => {
    setActiveModalApp(app);
    setModalUsername(app.username || '');
    setModalPassword(app.password || '');
  };

  const handleSaveCredentials = async () => {
    if (!activeModalApp) return;
    const updatedApp = {
      ...activeModalApp,
      username: modalUsername,
      password: modalPassword,
      connected: true
    };

    setN8nApps(prev => prev.map(a => a.app_id === activeModalApp.app_id ? updatedApp : a));
    setActiveModalApp(null);

    if (backendOnline) {
      try {
        await fetch('http://localhost:8000/api/n8n/credentials', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedApp)
        });
      } catch (err) {
        console.error('Error saving credentials to backend:', err);
      }
    }
  };

  const handleToggleConnect = async (app: N8nApp) => {
    const updatedApp = {
      ...app,
      connected: !app.connected
    };
    setN8nApps(prev => prev.map(a => a.app_id === app.app_id ? updatedApp : a));

    if (backendOnline) {
      try {
        await fetch('http://localhost:8000/api/n8n/credentials', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedApp)
        });
      } catch (err) {
        console.error('Error updating connection status on backend:', err);
      }
    }
  };

  const handleExecuteWorkflow = async (e: FormEvent) => {
    e.preventDefault();
    if (!workflowInstruction.trim()) return;

    setIsExecutingWorkflow(true);
    setWorkflowProgress(5);
    setWorkflowLogs(['[INFO] Inicializando motor de automatización n8n de XuperIA...']);

    const connectedApps = n8nApps.filter(a => a.connected).map(a => a.app_id);

    if (backendOnline) {
      try {
        const res = await fetch('http://localhost:8000/api/n8n/execute', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            instruction: workflowInstruction,
            connected_apps: connectedApps
          })
        });

        if (res.ok) {
          const data = await res.json();
          let currentLogIndex = 0;
          const interval = setInterval(() => {
            if (currentLogIndex < data.logs.length) {
              setWorkflowLogs(prev => [...prev, data.logs[currentLogIndex]]);
              setWorkflowProgress(Math.min(10 + Math.floor((currentLogIndex / data.logs.length) * 90), 99));
              currentLogIndex++;
            } else {
              clearInterval(interval);
              setWorkflowProgress(100);
              setIsExecutingWorkflow(false);
            }
          }, 800);
          return;
        }
      } catch (err) {
        console.error('Error executing workflow on backend:', err);
      }
    }

    // Offline simulation fallback
    let simLogs = [
      '[10:45:00] 🧠 XuperBrain n8n Engine: Analizando instrucción...',
      `[10:45:01] ⚙️ Flujo configurado con ${connectedApps.length} aplicaciones activas.`,
    ];

    if (connectedApps.includes('google')) {
      simLogs.push('[10:45:02] 🔍 [Google Search] Buscando textos y nichos virales relacionados en internet...');
      simLogs.push("[10:45:04] 🔍 [Google Search] Encontrado nicho viral: 'Mitos nutricionales desmentidos en 30 segundos'");
      simLogs.push("[10:45:05] 🔍 [Google Search] Tendencia: Búsquedas de 'Buena y mala alimentación' con +250% de incremento esta semana.");
    }

    if (connectedApps.includes('gallery')) {
      simLogs.push('[10:45:06] 📂 [Galería Interna] Extrayendo 5 imágenes del portafolio local.');
    }

    if (connectedApps.includes('capcut')) {
      simLogs.push('[10:45:07] 🎬 [CapCut AI] Abriendo aplicación y cargando recursos de video...');
      simLogs.push("[10:45:09] 🎬 [CapCut AI] Generando voz en off sintética de IA: 'Comer sano no tiene que ser aburrido...'");
      simLogs.push('[10:45:11] 🎬 [CapCut AI] Ajustando formato horizontal a vertical 9:16.');
      simLogs.push('[10:45:13] 🎬 [CapCut AI] Renderizando clip corto (duración: 30s) en alta definición...');
      simLogs.push('[10:45:15] 🎬 [CapCut AI] Guardando video renderizado en Galería.');
    }

    const socials = ['youtube', 'tiktok', 'facebook', 'instagram'];
    socials.forEach((social, idx) => {
      if (connectedApps.includes(social)) {
        simLogs.push(`[10:45:${16 + idx * 2}] 🌐 [${social.toUpperCase()}] Iniciando sesión en la red social...`);
        const appObj = n8nApps.find(a => a.app_id === social);
        if (appObj?.username) {
          simLogs.push(`[10:45:${17 + idx * 2}] 🌐 [${social.toUpperCase()}] Logueado como: ${appObj.username}`);
        }
        simLogs.push(`[10:45:${18 + idx * 2}] 🛫 [${social.toUpperCase()}] Subiendo clip y aplicando metadatos virales.`);
      }
    });

    if (connectedApps.includes('gmail')) {
      simLogs.push('[10:45:25] 📧 [Gmail API] Enviando correo con reporte de subidas a redes...');
    }

    simLogs.push('[10:45:26] 🏆 Flujo de automatización completado con éxito. (Modo Simulado)');

    let curIdx = 0;
    const interval = setInterval(() => {
      if (curIdx < simLogs.length) {
        setWorkflowLogs(prev => [...prev, simLogs[curIdx]]);
        setWorkflowProgress(Math.min(10 + Math.floor((curIdx / simLogs.length) * 90), 99));
        curIdx++;
      } else {
        clearInterval(interval);
        setWorkflowProgress(100);
        setIsExecutingWorkflow(false);
      }
    }, 800);
  };

  return (
    <div className="n8n-container" style={{ padding: '24px 0', maxWidth: '1200px', margin: '0 auto', width: '95%' }}>
      {/* Control Bar: Instruction & Presets */}
      <div className="n8n-control-bar glass-card">
        <h3 className="panel-title-db" style={{ fontSize: '1.1rem', color: 'var(--neon-cyan)', display: 'flex', alignItems: 'center', gap: '8px', margin: 0, fontWeight: 800 }}>
          <Sparkles size={18} /> Ejecutar Instrucción Única IA (Zero-Touch Workflow)
        </h3>
        <form onSubmit={handleExecuteWorkflow} className="n8n-instruction-row" style={{ marginTop: '12px' }}>
          <input
            type="text"
            className="n8n-instruction-input"
            placeholder="Ej: Coje imágenes de mi galería y haz un video motivacional de 30s en CapCut que hable de la buena alimentación y súbelo a YouTube y TikTok con títulos virales..."
            value={workflowInstruction}
            onChange={(e) => setWorkflowInstruction(e.target.value)}
            disabled={isExecutingWorkflow}
          />
          <button type="submit" className="premium-btn-main" style={{ padding: '0.8rem 2rem', borderRadius: '8px', background: 'var(--accent, #f43f5e)', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }} disabled={isExecutingWorkflow}>
            {isExecutingWorkflow ? 'Ejecutando...' : 'Iniciar IA'} <Play size={16} fill="white" />
          </button>
        </form>

        <div className="n8n-templates-row" style={{ marginTop: '12px', display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}>
            Plantillas Rápidas:
          </span>
          <select
            className="n8n-templates-select"
            value={workflowTemplate}
            onChange={handleTemplateChange}
            disabled={isExecutingWorkflow}
            style={{ minWidth: '280px' }}
          >
            <option value="">-- Seleccionar Plantilla --</option>
            <option value="Coje imágenes de mi galería, busca en Google temas virales sobre buena y mala alimentación, haz un video de motivación con voz de IA usando CapCut (shorts 30s) y súbelo a YouTube, TikTok y Facebook con título viral, descripción y hashtags.">
              Video Viral de Nutrición (Galería + Google + CapCut → YouTube + TikTok + Facebook)
            </option>
            <option value="Busca en Google textos e imágenes virales de motivación personal, genera un short de 30s en CapCut y guárdalo en mi galería.">
              Generador de Motivación Personal (Google + CapCut → Galería)
            </option>
            <option value="Busca tendencias de nichos de emprendimiento digital en Google, crea un video educativo en CapCut, súbelo a YouTube Shorts y notifícame por Gmail.">
              Emprendimiento Digital (Google + CapCut → YouTube + Gmail)
            </option>
          </select>
          {workflowInstruction && (
            <button
              onClick={() => { setWorkflowInstruction(''); setWorkflowTemplate(''); }}
              style={{
                padding: '0.4rem 0.8rem',
                fontSize: '0.75rem',
                borderRadius: '6px',
                border: '1px solid #003ebd',
                background: '#030a18',
                color: '#ffffff',
                cursor: 'pointer'
              }}
            >
              Limpiar
            </button>
          )}
          {!loadingBackend && (
            <span style={{ fontSize: '0.75rem', marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '6px', color: backendOnline ? '#10b981' : '#f43f5e', fontWeight: 'bold' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: backendOnline ? '#10b981' : '#f43f5e', display: 'inline-block' }}></span>
              {backendOnline ? 'Motor IA Conectado' : 'Motor IA Desconectado (Simulando)'}
            </span>
          )}
        </div>
      </div>

      {/* Main Panel Grid */}
      <div className="n8n-main-grid" style={{ marginTop: '20px' }}>
        {/* Left Column: Integrations List */}
        <div className="glass-card" style={{ height: 'auto', minHeight: '520px', padding: '1.5rem', background: '#0a1c3e', border: '1px solid #003ebd', borderRadius: '16px' }}>
          <div style={{ marginBottom: '1.5rem' }}>
            <h3 className="panel-title-db" style={{ margin: 0, fontSize: '1.1rem', fontWeight: '800', color: '#ffffff' }}>
              Aplicaciones e Integraciones
            </h3>
            <span style={{ fontSize: '0.75rem', color: '#ffffff', opacity: 0.8 }}>Conecta tus cuentas locales</span>
          </div>
          <div className="n8n-integrations-panel">
            {n8nApps.map((app) => {
              const AppIcon = app.icon;
              return (
                <div className={`n8n-app-card ${app.connected ? 'connected' : ''}`} key={app.app_id}>
                  <div className="n8n-app-info">
                    <div
                      className="n8n-app-icon-container"
                      style={{
                        background: `rgba(${app.color === '#ffffff' ? '255,255,255' : '99,102,241'}, 0.08)`,
                        color: app.color,
                        border: `1px solid ${app.connected ? app.color : 'rgba(255,255,255,0.05)'}`,
                        boxShadow: app.connected ? `0 0 10px ${app.color}44` : 'none'
                      }}
                    >
                      <AppIcon size={20} />
                    </div>
                    <div className="n8n-app-details">
                      <span className="n8n-app-name">{app.name}</span>
                      <span className={`n8n-app-status ${app.connected ? 'connected' : ''}`}>
                        <span
                          className="pulse-dot"
                          style={{
                            width: '6px',
                            height: '6px',
                            borderRadius: '50%',
                            background: app.connected ? 'var(--neon-green)' : '#64748b',
                            boxShadow: app.connected ? '0 0 6px var(--neon-green)' : 'none',
                          }}
                        ></span>
                        {app.connected ? 'Conectado' : 'Desconectado'}
                      </span>
                    </div>
                  </div>
                  <div className="n8n-app-actions">
                    {['gmail', 'youtube', 'facebook', 'instagram', 'tiktok'].includes(app.app_id) && (
                      <button
                        className="n8n-btn-configure"
                        onClick={() => handleOpenConfigure(app)}
                        disabled={isExecutingWorkflow}
                        style={{ border: '1px solid #003ebd', background: '#030a18', color: '#ffffff', padding: '0.4rem 0.8rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                      >
                        <Key size={12} /> Credenciales
                      </button>
                    )}
                    <button
                      className={app.connected ? 'btn btn-secondary' : 'btn btn-primary'}
                      style={{
                        padding: '0.4rem 0.8rem',
                        fontSize: '0.75rem',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        border: 'none',
                        background: app.connected ? 'rgba(255,255,255,0.08)' : 'var(--accent, #f43f5e)',
                        color: 'white',
                        fontWeight: 'bold'
                      }}
                      onClick={() => handleToggleConnect(app)}
                      disabled={isExecutingWorkflow}
                    >
                      {app.connected ? 'Desconectar' : 'Conectar'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Visual Canvas Flow */}
        <div className="n8n-canvas-panel glass-card">
          {/* SVG Connections Canvas */}
          <svg className="n8n-canvas-svg" viewBox="0 0 800 500">
            {/* Google -> CapCut */}
            <path
              d="M 200 105 C 257 105, 257 235, 315 235"
              stroke={isExecutingWorkflow && n8nApps.find(a => a.app_id === 'google')?.connected ? 'var(--neon-cyan)' : n8nApps.find(a => a.app_id === 'google')?.connected && n8nApps.find(a => a.app_id === 'capcut')?.connected ? 'rgba(6, 182, 212, 0.4)' : 'rgba(255,255,255,0.06)'}
              strokeWidth={isExecutingWorkflow && n8nApps.find(a => a.app_id === 'google')?.connected ? '3' : '1.5'}
              fill="none"
              className={`n8n-flow-line ${isExecutingWorkflow && n8nApps.find(a => a.app_id === 'google')?.connected ? 'active' : ''}`}
              style={{ filter: isExecutingWorkflow && n8nApps.find(a => a.app_id === 'google')?.connected ? 'drop-shadow(0 0 5px var(--neon-cyan))' : 'none' }}
            />
            {/* Gallery -> CapCut */}
            <path
              d="M 200 235 C 257 235, 257 235, 315 235"
              stroke={isExecutingWorkflow && n8nApps.find(a => a.app_id === 'gallery')?.connected ? 'var(--neon-green)' : n8nApps.find(a => a.app_id === 'gallery')?.connected && n8nApps.find(a => a.app_id === 'capcut')?.connected ? 'rgba(16, 185, 129, 0.4)' : 'rgba(255,255,255,0.06)'}
              strokeWidth={isExecutingWorkflow && n8nApps.find(a => a.app_id === 'gallery')?.connected ? '3' : '1.5'}
              fill="none"
              className={`n8n-flow-line ${isExecutingWorkflow && n8nApps.find(a => a.app_id === 'gallery')?.connected ? 'active' : ''}`}
              style={{ filter: isExecutingWorkflow && n8nApps.find(a => a.app_id === 'gallery')?.connected ? 'drop-shadow(0 0 5px var(--neon-green))' : 'none' }}
            />
            {/* Explorer -> CapCut */}
            <path
              d="M 200 365 C 257 365, 257 235, 315 235"
              stroke={isExecutingWorkflow && n8nApps.find(a => a.app_id === 'explorer')?.connected ? 'var(--neon-orange)' : n8nApps.find(a => a.app_id === 'explorer')?.connected && n8nApps.find(a => a.app_id === 'capcut')?.connected ? 'rgba(245, 158, 11, 0.4)' : 'rgba(255,255,255,0.06)'}
              strokeWidth={isExecutingWorkflow && n8nApps.find(a => a.app_id === 'explorer')?.connected ? '3' : '1.5'}
              fill="none"
              className={`n8n-flow-line ${isExecutingWorkflow && n8nApps.find(a => a.app_id === 'explorer')?.connected ? 'active' : ''}`}
              style={{ filter: isExecutingWorkflow && n8nApps.find(a => a.app_id === 'explorer')?.connected ? 'drop-shadow(0 0 5px var(--neon-orange))' : 'none' }}
            />

            {/* CapCut -> YouTube */}
            <path
              d="M 485 235 C 542 235, 542 55, 600 55"
              stroke={isExecutingWorkflow && n8nApps.find(a => a.app_id === 'youtube')?.connected ? 'var(--neon-red)' : n8nApps.find(a => a.app_id === 'capcut')?.connected && n8nApps.find(a => a.app_id === 'youtube')?.connected ? 'rgba(239, 68, 68, 0.4)' : 'rgba(255,255,255,0.06)'}
              strokeWidth={isExecutingWorkflow && n8nApps.find(a => a.app_id === 'youtube')?.connected ? '3' : '1.5'}
              fill="none"
              className={`n8n-flow-line ${isExecutingWorkflow && n8nApps.find(a => a.app_id === 'youtube')?.connected ? 'active' : ''}`}
              style={{ filter: isExecutingWorkflow && n8nApps.find(a => a.app_id === 'youtube')?.connected ? 'drop-shadow(0 0 5px var(--neon-red))' : 'none' }}
            />
            {/* CapCut -> TikTok */}
            <path
              d="M 485 235 C 542 235, 542 140, 600 140"
              stroke={isExecutingWorkflow && n8nApps.find(a => a.app_id === 'tiktok')?.connected ? '#ffffff' : n8nApps.find(a => a.app_id === 'capcut')?.connected && n8nApps.find(a => a.app_id === 'tiktok')?.connected ? 'rgba(255, 255, 255, 0.4)' : 'rgba(255,255,255,0.06)'}
              strokeWidth={isExecutingWorkflow && n8nApps.find(a => a.app_id === 'tiktok')?.connected ? '3' : '1.5'}
              fill="none"
              className={`n8n-flow-line ${isExecutingWorkflow && n8nApps.find(a => a.app_id === 'tiktok')?.connected ? 'active' : ''}`}
              style={{ filter: isExecutingWorkflow && n8nApps.find(a => a.app_id === 'tiktok')?.connected ? 'drop-shadow(0 0 5px #fff)' : 'none' }}
            />
            {/* CapCut -> Facebook */}
            <path
              d="M 485 235 C 542 235, 542 225, 600 225"
              stroke={isExecutingWorkflow && n8nApps.find(a => a.app_id === 'facebook')?.connected ? '#1877f2' : n8nApps.find(a => a.app_id === 'capcut')?.connected && n8nApps.find(a => a.app_id === 'facebook')?.connected ? 'rgba(24, 119, 242, 0.4)' : 'rgba(255,255,255,0.06)'}
              strokeWidth={isExecutingWorkflow && n8nApps.find(a => a.app_id === 'facebook')?.connected ? '3' : '1.5'}
              fill="none"
              className={`n8n-flow-line ${isExecutingWorkflow && n8nApps.find(a => a.app_id === 'facebook')?.connected ? 'active' : ''}`}
              style={{ filter: isExecutingWorkflow && n8nApps.find(a => a.app_id === 'facebook')?.connected ? 'drop-shadow(0 0 5px #1877f2)' : 'none' }}
            />
            {/* CapCut -> Instagram */}
            <path
              d="M 485 235 C 542 235, 542 310, 600 310"
              stroke={isExecutingWorkflow && n8nApps.find(a => a.app_id === 'instagram')?.connected ? '#e1306c' : n8nApps.find(a => a.app_id === 'capcut')?.connected && n8nApps.find(a => a.app_id === 'instagram')?.connected ? 'rgba(225, 48, 108, 0.4)' : 'rgba(255,255,255,0.06)'}
              strokeWidth={isExecutingWorkflow && n8nApps.find(a => a.app_id === 'instagram')?.connected ? '3' : '1.5'}
              fill="none"
              className={`n8n-flow-line ${isExecutingWorkflow && n8nApps.find(a => a.app_id === 'instagram')?.connected ? 'active' : ''}`}
              style={{ filter: isExecutingWorkflow && n8nApps.find(a => a.app_id === 'instagram')?.connected ? 'drop-shadow(0 0 5px #e1306c)' : 'none' }}
            />
            {/* CapCut -> Gmail */}
            <path
              d="M 485 235 C 542 235, 542 395, 600 395"
              stroke={isExecutingWorkflow && n8nApps.find(a => a.app_id === 'gmail')?.connected ? '#ea4335' : n8nApps.find(a => a.app_id === 'capcut')?.connected && n8nApps.find(a => a.app_id === 'gmail')?.connected ? 'rgba(234, 67, 53, 0.4)' : 'rgba(255,255,255,0.06)'}
              strokeWidth={isExecutingWorkflow && n8nApps.find(a => a.app_id === 'gmail')?.connected ? '3' : '1.5'}
              fill="none"
              className={`n8n-flow-line ${isExecutingWorkflow && n8nApps.find(a => a.app_id === 'gmail')?.connected ? 'active' : ''}`}
              style={{ filter: isExecutingWorkflow && n8nApps.find(a => a.app_id === 'gmail')?.connected ? 'drop-shadow(0 0 5px #ea4335)' : 'none' }}
            />
          </svg>

          {/* Nodes Container */}
          <div className="n8n-canvas-nodes-container">
            {/* Column 1: Inputs */}
            <div className="n8n-canvas-column">
              <span className="n8n-canvas-column-title">Fuentes de Entrada</span>

              {/* Google Node */}
              {(() => {
                const app = n8nApps.find(a => a.app_id === 'google')!;
                const Icon = app.icon;
                return (
                  <div
                    className={`n8n-node ${app.connected ? 'connected' : 'disconnected'}`}
                    style={{
                      '--border-color-node': app.color + '33',
                      '--glow-color-node': app.color + '1a',
                      '--node-color': app.color
                    } as React.CSSProperties}
                  >
                    <Icon className="n8n-node-icon" size={16} />
                    <span className="n8n-node-name">{app.name}</span>
                    <span className="n8n-node-socket output"></span>
                  </div>
                );
              })()}

              {/* Gallery Node */}
              {(() => {
                const app = n8nApps.find(a => a.app_id === 'gallery')!;
                const Icon = app.icon;
                return (
                  <div
                    className={`n8n-node ${app.connected ? 'connected' : 'disconnected'}`}
                    style={{
                      '--border-color-node': app.color + '33',
                      '--glow-color-node': app.color + '1a',
                      '--node-color': app.color
                    } as React.CSSProperties}
                  >
                    <Icon className="n8n-node-icon" size={16} />
                    <span className="n8n-node-name">{app.name}</span>
                    <span className="n8n-node-socket output"></span>
                  </div>
                );
              })()}

              {/* Explorer Node */}
              {(() => {
                const app = n8nApps.find(a => a.app_id === 'explorer')!;
                const Icon = app.icon;
                return (
                  <div
                    className={`n8n-node ${app.connected ? 'connected' : 'disconnected'}`}
                    style={{
                      '--border-color-node': app.color + '33',
                      '--glow-color-node': app.color + '1a',
                      '--node-color': app.color
                    } as React.CSSProperties}
                  >
                    <Icon className="n8n-node-icon" size={16} />
                    <span className="n8n-node-name">{app.name}</span>
                    <span className="n8n-node-socket output"></span>
                  </div>
                );
              })()}
            </div>

            {/* Column 2: Processor */}
            <div className="n8n-canvas-column">
              <span className="n8n-canvas-column-title">Generación & Edición</span>
              {(() => {
                const app = n8nApps.find(a => a.app_id === 'capcut')!;
                const Icon = app.icon;
                return (
                  <div
                    className={`n8n-node ${app.connected ? 'connected' : 'disconnected'}`}
                    style={{
                      '--border-color-node': app.color + '33',
                      '--glow-color-node': app.color + '1a',
                      '--node-color': app.color
                    } as React.CSSProperties}
                  >
                    <span className="n8n-node-socket input"></span>
                    <Icon className="n8n-node-icon" size={16} />
                    <span className="n8n-node-name">{app.name}</span>
                    <span className="n8n-node-socket output"></span>
                  </div>
                );
              })()}
            </div>

            {/* Column 3: Outputs */}
            <div className="n8n-canvas-column" style={{ gap: '0.8rem' }}>
              <span className="n8n-canvas-column-title">Publicación / Canales</span>

              {/* YouTube Node */}
              {(() => {
                const app = n8nApps.find(a => a.app_id === 'youtube')!;
                const Icon = app.icon;
                return (
                  <div
                    className={`n8n-node ${app.connected ? 'connected' : 'disconnected'}`}
                    style={{
                      '--border-color-node': app.color + '33',
                      '--glow-color-node': app.color + '1a',
                      '--node-color': app.color,
                      padding: '0.6rem 1rem'
                    } as React.CSSProperties}
                  >
                    <span className="n8n-node-socket input"></span>
                    <Icon className="n8n-node-icon" size={16} />
                    <span className="n8n-node-name">{app.name}</span>
                  </div>
                );
              })()}

              {/* TikTok Node */}
              {(() => {
                const app = n8nApps.find(a => a.app_id === 'tiktok')!;
                const Icon = app.icon;
                return (
                  <div
                    className={`n8n-node ${app.connected ? 'connected' : 'disconnected'}`}
                    style={{
                      '--border-color-node': 'rgba(255,255,255,0.2)',
                      '--glow-color-node': 'rgba(255,255,255,0.05)',
                      '--node-color': app.color,
                      padding: '0.6rem 1rem'
                    } as React.CSSProperties}
                  >
                    <span className="n8n-node-socket input"></span>
                    <Icon className="n8n-node-icon" size={16} />
                    <span className="n8n-node-name">{app.name}</span>
                  </div>
                );
              })()}

              {/* Facebook Node */}
              {(() => {
                const app = n8nApps.find(a => a.app_id === 'facebook')!;
                const Icon = app.icon;
                return (
                  <div
                    className={`n8n-node ${app.connected ? 'connected' : 'disconnected'}`}
                    style={{
                      '--border-color-node': app.color + '33',
                      '--glow-color-node': app.color + '1a',
                      '--node-color': app.color,
                      padding: '0.6rem 1rem'
                    } as React.CSSProperties}
                  >
                    <span className="n8n-node-socket input"></span>
                    <Icon className="n8n-node-icon" size={16} />
                    <span className="n8n-node-name">{app.name}</span>
                  </div>
                );
              })()}

              {/* Instagram Node */}
              {(() => {
                const app = n8nApps.find(a => a.app_id === 'instagram')!;
                const Icon = app.icon;
                return (
                  <div
                    className={`n8n-node ${app.connected ? 'connected' : 'disconnected'}`}
                    style={{
                      '--border-color-node': app.color + '33',
                      '--glow-color-node': app.color + '1a',
                      '--node-color': app.color,
                      padding: '0.6rem 1rem'
                    } as React.CSSProperties}
                  >
                    <span className="n8n-node-socket input"></span>
                    <Icon className="n8n-node-icon" size={16} />
                    <span className="n8n-node-name">{app.name}</span>
                  </div>
                );
              })()}

              {/* Gmail Node */}
              {(() => {
                const app = n8nApps.find(a => a.app_id === 'gmail')!;
                const Icon = app.icon;
                return (
                  <div
                    className={`n8n-node ${app.connected ? 'connected' : 'disconnected'}`}
                    style={{
                      '--border-color-node': app.color + '33',
                      '--glow-color-node': app.color + '1a',
                      '--node-color': app.color,
                      padding: '0.6rem 1rem'
                    } as React.CSSProperties}
                  >
                    <span className="n8n-node-socket input"></span>
                    <Icon className="n8n-node-icon" size={16} />
                    <span className="n8n-node-name">{app.name}</span>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      </div>

      {/* Execution logs terminal console */}
      <div className="glass-card" style={{ height: 'auto', padding: '1.5rem', background: '#0a1c3e', border: '1px solid #003ebd', borderRadius: '16px', marginTop: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 className="panel-title-db" style={{ margin: 0, fontSize: '1.1rem', fontWeight: '800', color: '#ffffff', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Terminal size={18} /> Consola del Flujo Autónomo
          </h3>
          {isExecutingWorkflow && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--neon-orange, #ff9f1c)', border: '1px solid #ff9f1c', background: '#030a18', padding: '4px 10px', borderRadius: '20px', fontWeight: 'bold' }}>
              <span className="pulse-dot orange-dot" style={{ backgroundColor: 'var(--neon-orange, #ff9f1c)', width: '6px', height: '6px', borderRadius: '50%' }}></span>
              <span>AI Procesando Flujo - {workflowProgress}%</span>
            </div>
          )}
        </div>

        {isExecutingWorkflow && (
          <div style={{ height: '6px', marginBottom: '1rem', borderRadius: '3px', backgroundColor: '#030a18' }}>
            <div style={{ width: `${workflowProgress}%`, background: 'linear-gradient(90deg, var(--neon-purple) 0%, var(--neon-cyan) 100%)', borderRadius: '3px', height: '100%' }}></div>
          </div>
        )}

        <div className="server-logs-console" style={{ height: '240px', color: '#ffffff', background: '#030a18', border: '1px solid #003ebd', borderRadius: '8px', padding: '12px', overflowY: 'auto', fontFamily: 'monospace', fontSize: '0.85rem', lineHeight: '1.5' }}>
          {workflowLogs.map((log, idx) => {
            let logColor = 'inherit';
            if (log.includes('🏆') || log.includes('🎉') || log.includes('✅')) logColor = 'var(--neon-green, #10b981)';
            if (log.includes('⚠️')) logColor = 'var(--neon-orange, #f59e0b)';
            if (log.includes('❌')) logColor = 'var(--neon-red, #ef4444)';

            return (
              <div key={idx} style={{ color: logColor, marginBottom: '6px' }}>
                {log}
              </div>
            );
          })}
          {workflowLogs.length === 0 && (
            <div style={{ color: '#64748b', textAlign: 'center', paddingTop: '5rem' }}>
              Consola lista. Conecta las aplicaciones del flujo, ingresa la instrucción y presiona "Iniciar IA" para observar la ejecución.
            </div>
          )}
        </div>
      </div>

      {/* XuperBrain AI Engine Section */}
      <XuperBrainSection />

      {/* Credentials Modal Popup */}
      {activeModalApp && (
        <div className="n8n-modal-overlay" onClick={() => setActiveModalApp(null)}>
          <div className="n8n-modal" onClick={(e) => e.stopPropagation()} style={{ background: '#071126', border: '1px solid #003ebd', borderRadius: '16px', color: 'white' }}>
            <div className="n8n-modal-header" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div className="n8n-modal-icon" style={{ background: activeModalApp.color + '1a', color: activeModalApp.color, border: `1px solid ${activeModalApp.color}33`, width: '42px', height: '42px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {(() => {
                  const Icon = activeModalApp.icon;
                  return <Icon size={20} />;
                })()}
              </div>
              <div style={{ flex: 1 }}>
                <h4 className="n8n-modal-title" style={{ margin: 0, fontSize: '1.2rem', fontWeight: '800' }}>Configurar {activeModalApp.name}</h4>
                <p style={{ fontSize: '0.75rem', color: '#ffffff', opacity: 0.8, marginTop: '0.1rem', margin: 0 }}>Ingresa las credenciales para la automatización local.</p>
              </div>
              <button onClick={() => setActiveModalApp(null)} style={{ background: 'transparent', border: 'none', color: '#ffffff', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>
            <div className="n8n-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
              <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#ffffff' }}>Usuario o Correo Electrónico</label>
                <input
                  type="text"
                  value={modalUsername}
                  onChange={(e) => setModalUsername(e.target.value)}
                  placeholder="ejemplo@correo.com"
                  style={{ background: '#030a18', border: '1px solid #003ebd', color: '#fff', padding: '0.6rem 0.8rem', borderRadius: '6px', width: '100%', outline: 'none', fontSize: '0.85rem' }}
                />
              </div>
              <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#ffffff' }}>Contraseña / Clave de Acceso</label>
                <input
                  type="password"
                  value={modalPassword}
                  onChange={(e) => setModalPassword(e.target.value)}
                  placeholder="••••••••••••"
                  style={{ background: '#030a18', border: '1px solid #003ebd', color: '#fff', padding: '0.6rem 0.8rem', borderRadius: '6px', width: '100%', outline: 'none', fontSize: '0.85rem' }}
                />
              </div>
              <p style={{ fontSize: '0.7rem', color: 'var(--neon-orange, #ff9f1c)', background: '#030a18', border: '1px solid #ff9f1c', padding: '0.5rem 0.8rem', borderRadius: '6px', margin: 0, display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <Info size={16} />
                Las credenciales se almacenan localmente de forma encriptada en la carpeta de xuper_brain para iniciar sesión automáticamente si expira la sesión de tu navegador emulado.
              </p>
            </div>
            <div className="n8n-modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px' }}>
              <button
                className="btn btn-secondary"
                style={{ padding: '0.5rem 1rem', fontSize: '0.8rem', borderRadius: '6px', border: '1px solid #003ebd', background: 'transparent', color: '#ffffff', cursor: 'pointer' }}
                onClick={() => setActiveModalApp(null)}
              >
                Cancelar
              </button>
              <button
                className="btn btn-primary"
                style={{ padding: '0.5rem 1.2rem', fontSize: '0.8rem', borderRadius: '6px', border: 'none', background: 'var(--accent, #f43f5e)', color: 'white', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                onClick={handleSaveCredentials}
              >
                <ShieldCheck size={14} /> Guardar y Conectar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper Smartphone icon component since it might not be imported as SmartphoneIcon
function SmartphoneIcon(props: any) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <rect width="14" height="20" x="5" y="2" rx="2" ry="2" />
      <path d="M12 18h.01" />
    </svg>
  );
}
