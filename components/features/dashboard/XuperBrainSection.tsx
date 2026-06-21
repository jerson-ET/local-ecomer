'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Brain, Cpu, MessageSquare, Calculator, Languages, BookOpen, Eye, Database, Zap, Send, Loader2, ChevronDown, ChevronUp, Activity } from 'lucide-react'

/* ── XuperBrain Engine Modules ── */
const ENGINE_MODULES = [
  { id: 'conversation', name: 'Motor de Conversación', file: 'conversation_engine.py', icon: MessageSquare, color: '#6366f1', desc: 'Lenguaje natural bilingüe (ES/EN) con memoria persistente', lines: 794, size: '39KB' },
  { id: 'math', name: 'Motor Matemático', file: 'math_engine.py', icon: Calculator, color: '#10b981', desc: 'Cálculos, álgebra y expresiones matemáticas', lines: 350, size: '12KB' },
  { id: 'spanish', name: 'Motor de Español', file: 'spanish_engine.py', icon: Languages, color: '#f59e0b', desc: 'Conjugación de verbos y gramática española', lines: 580, size: '21KB' },
  { id: 'knowledge', name: 'Motor RAG (Knowledge)', file: 'rag_engine.py', icon: BookOpen, color: '#ec4899', desc: 'Retrieval-Augmented Generation: TF-IDF + coseno', lines: 403, size: '13KB' },
  { id: 'vision', name: 'Motor de Visión', file: 'vision_engine.py', icon: Eye, color: '#06b6d4', desc: 'Procesamiento de imágenes y visión computacional', lines: 250, size: '9KB' },
  { id: 'tokenizer', name: 'Tokenizador BPE', file: 'tokenizer_bpe.py', icon: Database, color: '#8b5cf6', desc: 'Byte Pair Encoding para tokenización de texto', lines: 220, size: '7KB' },
  { id: 'browser', name: 'Agente de Navegador', file: 'browser_agent.py', icon: Zap, color: '#ef4444', desc: 'Automatización web con Selenium/Playwright', lines: 2800, size: '103KB' },
]

export function XuperBrainSection() {
  const [backendOnline, setBackendOnline] = useState(false)
  const [checking, setChecking] = useState(true)
  const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'ai'; text: string }[]>([])
  const [inputMsg, setInputMsg] = useState('')
  const [sending, setSending] = useState(false)
  const [expandedModule, setExpandedModule] = useState<string | null>(null)
  const [memoryStats, setMemoryStats] = useState<{ concepts: number; facts: number; dictionary_words: number; total_learned: number } | null>(null)
  const chatEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const check = async () => {
      try {
        setChecking(true)
        const res = await fetch('http://localhost:8000/', { signal: AbortSignal.timeout(3000) })
        if (res.ok) {
          setBackendOnline(true)
          // Try to get memory stats
          try {
            const statsRes = await fetch('http://localhost:8000/api/brain/stats')
            if (statsRes.ok) {
              const data = await statsRes.json()
              setMemoryStats(data)
            }
          } catch { /* ignore */ }
        } else {
          setBackendOnline(false)
        }
      } catch {
        setBackendOnline(false)
      } finally {
        setChecking(false)
      }
    }
    check()
  }, [])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages])

  const sendMessage = async () => {
    if (!inputMsg.trim()) return
    const userMsg = inputMsg.trim()
    setInputMsg('')
    setChatMessages(prev => [...prev, { role: 'user', text: userMsg }])
    setSending(true)

    if (backendOnline) {
      try {
        const res = await fetch('http://localhost:8000/api/brain/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: userMsg })
        })
        if (res.ok) {
          const data = await res.json()
          setChatMessages(prev => [...prev, { role: 'ai', text: data.response || 'Sin respuesta' }])
          setSending(false)
          return
        }
      } catch { /* fallback to simulation */ }
    }

    // Simulated response
    await new Promise(r => setTimeout(r, 800))
    const simResponses = [
      `🧠 [Modo Simulado] XuperBrain recibió: "${userMsg}"\n\nEl motor de conversación no está conectado. Inicia el servidor Python en localhost:8000 para activar las respuestas reales.`,
      `⚡ [Simulación] Procesando: "${userMsg}"\n\nPara conectar XuperBrain en vivo, ejecuta:\n\`python server.py\` en /programador-de-mundos/backend/`,
    ]
    setChatMessages(prev => [...prev, { role: 'ai', text: simResponses[Math.floor(Math.random() * simResponses.length)] }])
    setSending(false)
  }

  return (
    <div style={{ marginTop: 24, padding: 0 }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)',
        border: '1px solid rgba(99,102,241,0.2)',
        borderRadius: 16,
        padding: '24px 28px',
        marginBottom: 20,
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 20% 50%, rgba(99,102,241,0.08) 0%, transparent 70%)' }} />
        <div style={{ position: 'relative', zIndex: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{
              width: 52, height: 52,
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              borderRadius: 14,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 30px rgba(99,102,241,0.3)',
            }}>
              <Brain size={26} color="#fff" />
            </div>
            <div>
              <h2 style={{ fontSize: 20, fontWeight: 900, margin: 0, color: '#e0e7ff', letterSpacing: '-0.5px' }}>
                XuperBrain — Motor de IA Local
              </h2>
              <p style={{ fontSize: 11, color: '#6366f1', margin: 0, fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase' }}>
                Transformer + BPE + RAG · Construido desde cero por Jerson
              </p>
            </div>
          </div>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: backendOnline ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
            border: `1px solid ${backendOnline ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
            borderRadius: 10, padding: '8px 14px',
          }}>
            {checking ? (
              <Loader2 size={14} color="#6366f1" className="animate-spin" />
            ) : (
              <div style={{
                width: 8, height: 8, borderRadius: '50%',
                background: backendOnline ? '#10b981' : '#ef4444',
                boxShadow: backendOnline ? '0 0 8px #10b981' : '0 0 8px #ef4444',
              }} />
            )}
            <span style={{ fontSize: 11, fontWeight: 700, color: backendOnline ? '#10b981' : '#ef4444', fontFamily: 'monospace' }}>
              {checking ? 'Conectando...' : backendOnline ? 'MOTOR ONLINE · localhost:8000' : 'MOTOR OFFLINE'}
            </span>
          </div>
        </div>

        {memoryStats && (
          <div style={{ position: 'relative', zIndex: 2, display: 'flex', gap: 16, marginTop: 16, flexWrap: 'wrap' }}>
            {[
              { label: 'Conceptos', value: memoryStats.concepts, color: '#6366f1' },
              { label: 'Hechos', value: memoryStats.facts, color: '#10b981' },
              { label: 'Diccionario', value: memoryStats.dictionary_words, color: '#f59e0b' },
              { label: 'Total Aprendido', value: memoryStats.total_learned, color: '#ec4899' },
            ].map((s, i) => (
              <div key={i} style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 10, color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{s.label}:</span>
                <span style={{ fontSize: 16, fontWeight: 900, color: s.color }}>{s.value}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modules Grid + Chat */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Engine Modules */}
        <div style={{
          background: 'rgba(15, 23, 42, 0.45)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 16, padding: '20px',
        }}>
          <h3 style={{ fontSize: 14, fontWeight: 800, color: '#e0e7ff', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Cpu size={16} color="#6366f1" /> Módulos del Motor ({ENGINE_MODULES.length})
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {ENGINE_MODULES.map(mod => {
              const Icon = mod.icon
              const expanded = expandedModule === mod.id
              return (
                <div key={mod.id}
                  onClick={() => setExpandedModule(expanded ? null : mod.id)}
                  style={{
                    background: expanded ? 'rgba(99,102,241,0.08)' : 'rgba(0,0,0,0.2)',
                    border: `1px solid ${expanded ? 'rgba(99,102,241,0.3)' : 'rgba(255,255,255,0.05)'}`,
                    borderRadius: 12, padding: '12px 14px', cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: 8,
                      background: `${mod.color}15`, border: `1px solid ${mod.color}30`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    }}>
                      <Icon size={16} color={mod.color} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#e0e7ff' }}>{mod.name}</div>
                      <div style={{ fontSize: 10, color: '#64748b', fontWeight: 600 }}>{mod.file}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Activity size={10} color="#10b981" />
                      <span style={{ fontSize: 10, color: '#10b981', fontWeight: 700 }}>Activo</span>
                      {expanded ? <ChevronUp size={14} color="#64748b" /> : <ChevronDown size={14} color="#64748b" />}
                    </div>
                  </div>
                  {expanded && (
                    <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                      <p style={{ fontSize: 11, color: '#94a3b8', margin: '0 0 6px 0', lineHeight: 1.5 }}>{mod.desc}</p>
                      <div style={{ display: 'flex', gap: 12, fontSize: 10, color: '#64748b' }}>
                        <span>📄 {mod.lines} líneas</span>
                        <span>📦 {mod.size}</span>
                        <span style={{ color: mod.color }}>● Python</span>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Chat Interface */}
        <div style={{
          background: 'rgba(15, 23, 42, 0.45)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 16, padding: '20px',
          display: 'flex', flexDirection: 'column',
        }}>
          <h3 style={{ fontSize: 14, fontWeight: 800, color: '#e0e7ff', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
            <MessageSquare size={16} color="#6366f1" /> Chat con XuperBrain
          </h3>
          {/* Messages */}
          <div style={{
            flex: 1, minHeight: 350, maxHeight: 420, overflowY: 'auto',
            background: 'rgba(0,0,0,0.4)', borderRadius: 12, padding: 14, marginBottom: 12,
            border: '1px solid rgba(255,255,255,0.05)',
          }}>
            {chatMessages.length === 0 && (
              <div style={{ textAlign: 'center', color: '#4a5568', paddingTop: 100 }}>
                <Brain size={36} color="#4a5568" style={{ margin: '0 auto 12px' }} />
                <p style={{ fontSize: 12, fontWeight: 600, margin: 0 }}>Escribe algo para hablar con XuperBrain</p>
                <p style={{ fontSize: 10, color: '#374151', margin: '4px 0 0' }}>
                  {backendOnline ? 'Motor conectado — Respuestas reales' : 'Motor desconectado — Modo simulación'}
                </p>
              </div>
            )}
            {chatMessages.map((msg, i) => (
              <div key={i} style={{
                display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                marginBottom: 8,
              }}>
                <div style={{
                  maxWidth: '80%',
                  background: msg.role === 'user' ? 'rgba(99,102,241,0.2)' : 'rgba(16,185,129,0.1)',
                  border: `1px solid ${msg.role === 'user' ? 'rgba(99,102,241,0.3)' : 'rgba(16,185,129,0.2)'}`,
                  borderRadius: 12, padding: '10px 14px',
                  fontSize: 12, color: '#e0e7ff', lineHeight: 1.6,
                  whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                }}>
                  {msg.text}
                </div>
              </div>
            ))}
            {sending && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#6366f1', fontSize: 12, padding: '8px 0' }}>
                <Loader2 size={14} className="animate-spin" /> XuperBrain pensando...
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={e => { e.preventDefault(); sendMessage() }} style={{ display: 'flex', gap: 8 }}>
            <input
              type="text"
              value={inputMsg}
              onChange={e => setInputMsg(e.target.value)}
              placeholder="Escribe un mensaje..."
              disabled={sending}
              style={{
                flex: 1, background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 10, padding: '10px 14px', color: '#e0e7ff', fontSize: 13,
                fontWeight: 600, outline: 'none', boxSizing: 'border-box',
              }}
            />
            <button type="submit" disabled={sending || !inputMsg.trim()} style={{
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              border: 'none', borderRadius: 10, padding: '10px 16px',
              color: '#fff', cursor: sending ? 'wait' : 'pointer',
              display: 'flex', alignItems: 'center', gap: 6,
              fontSize: 12, fontWeight: 700, opacity: sending || !inputMsg.trim() ? 0.5 : 1,
            }}>
              <Send size={14} /> Enviar
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
