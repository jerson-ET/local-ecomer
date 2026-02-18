'use client'

import React, { useState, useRef, useEffect } from 'react'
import { X, Sparkles, Bot, ChevronRight, Upload, CheckCircle, Store, Megaphone, PlusCircle, ArrowLeft } from 'lucide-react'

import { TASK_FLOWS, TaskFlow, TaskStep } from '@/lib/ai/task-engine'

interface Message {
    role: 'user' | 'assistant'
    content: string
    type?: TaskStep['type']
    options?: string[] | undefined
}

export default function AIChatWidget() {
    const [isOpen, setIsOpen] = useState(false)
    const [activeFlow, setActiveFlow] = useState<TaskFlow | null>(null)
    const [currentStep, setCurrentStep] = useState<TaskStep | null>(null)
    const [messages, setMessages] = useState<Message[]>([
        {
            role: 'assistant',
            content: '¡Hola! Soy tu Asistente de Gestión.\nSelecciona una tarea para comenzar:',
        }
    ])
    const [input, setInput] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const messagesEndRef = useRef<HTMLDivElement>(null)

    const scrollToBottom = () => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
        }
    }

    useEffect(() => {
        scrollToBottom()
    }, [messages, isOpen, currentStep])

    // Start a specific flow
    const startFlow = (flowId: string) => {
        const flow = TASK_FLOWS[flowId]
        if (!flow) return

        setActiveFlow(flow)
        const firstStep = flow.steps[flow.initialStep]

        if (!firstStep) return

        setCurrentStep(firstStep)

        setMessages(prev => [
            ...prev,
            { role: 'user', content: `Iniciar: ${flow.name}` },
            {
                role: 'assistant',
                content: firstStep.message,
                type: firstStep.type,
                options: firstStep.options || undefined
            }
        ])

        // Auto-advance detail for DISPLAY type steps
        if (firstStep.type === 'DISPLAY') {
            setTimeout(() => handleNext(null, firstStep), 2000)
        }
    }

    // Handle user input/choice to proceed to next step
    const handleNext = (userInput: string | null, step: TaskStep = currentStep!) => {
        if (!step || !activeFlow) return

        // Add user response to chat if it's an input/choice
        if (step.type !== 'DISPLAY' && userInput !== null) {
            setMessages(prev => [...prev, { role: 'user', content: userInput.toString() }])
        }

        setIsLoading(true)

        // Simulate processing
        setTimeout(() => {
            const nextStepId = step.next ? step.next(userInput) : null

            if (nextStepId && activeFlow.steps[nextStepId]) {
                const nextStep = activeFlow.steps[nextStepId]
                setCurrentStep(nextStep)
                setMessages(prev => [...prev, {
                    role: 'assistant',
                    content: nextStep.message,
                    type: nextStep.type,
                    options: nextStep.options || undefined
                }])
                setIsLoading(false)

                if (nextStep.type === 'DISPLAY') {
                    setTimeout(() => handleNext(null, nextStep), 2000)
                }
            } else {
                // End of flow
                setActiveFlow(null)
                setCurrentStep(null)
                setMessages(prev => [...prev, {
                    role: 'assistant',
                    content: '¡Tarea completada! ¿Qué más te gustaría hacer?',
                }])
                setIsLoading(false)
            }
        }, 800)
    }

    const handleCreate = (e: React.FormEvent) => {
        e.preventDefault()
        if (!input.trim() || !currentStep) return
        handleNext(input)
        setInput('')
    }

    const resetChat = () => {
        setActiveFlow(null)
        setCurrentStep(null)
        setMessages([{
            role: 'assistant',
            content: '¡Hola! Soy tu Asistente de Gestión.\nSelecciona una tarea para comenzar:',
        }])
    }

    return (
        <div className={`fixed bottom-24 left-4 z-50 flex flex-col items-start gap-4 ${isOpen ? 'pointer-events-auto' : 'pointer-events-none'}`}>

            {/* Bot Window */}
            {isOpen && (
                <div className="bg-black/90 backdrop-blur-xl border border-white/10 rounded-3xl w-[90vw] md:w-96 shadow-2xl flex flex-col h-[600px] animate-in slide-in-from-bottom-5 fade-in duration-300 overflow-hidden text-left relative">

                    {/* Header */}
                    <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-4 shrink-0 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm border border-white/10">
                                <Bot size={20} className="text-white" />
                            </div>
                            <div>
                                <h3 className="font-bold text-white text-sm">Asistente Pro</h3>
                                <p className="text-white/80 text-[10px] font-medium uppercase tracking-wider">
                                    {activeFlow ? activeFlow.name : 'Panel de Control'}
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            {activeFlow && (
                                <button onClick={resetChat} className="p-2 hover:bg-white/20 rounded-full text-white/80 transition-colors" title="Cancelar Tarea">
                                    <ArrowLeft size={18} />
                                </button>
                            )}
                            <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-white/20 rounded-full text-white transition-colors">
                                <X size={18} />
                            </button>
                        </div>
                    </div>

                    {/* Messages Area */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth bg-black/50">
                        {messages.map((msg, idx) => (
                            <div
                                key={idx}
                                className={`flex w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                                <div
                                    className={`max-w-[85%] p-3.5 rounded-2xl text-sm leading-relaxed shadow-sm whitespace-pre-line ${msg.role === 'user'
                                        ? 'bg-emerald-600 text-white rounded-tr-none'
                                        : 'bg-white/10 text-gray-100 rounded-tl-none border border-white/5'
                                        }`}
                                >
                                    {msg.content}
                                </div>
                            </div>
                        ))}

                        {isLoading && (
                            <div className="flex justify-start w-full">
                                <div className="bg-white/5 border border-white/5 px-4 py-3 rounded-2xl rounded-tl-none flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce"></span>
                                    <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce delay-150"></span>
                                    <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce delay-300"></span>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Quick Actions (Home) */}
                    {!activeFlow && !isLoading && (
                        <div className="p-4 bg-white/5 border-t border-white/10 shrink-0 grid grid-cols-1 gap-2">
                            <p className="text-xs text-gray-400 mb-2 font-bold uppercase">Tareas Disponibles</p>
                            {Object.values(TASK_FLOWS).map((flow) => (
                                <button
                                    key={flow.id}
                                    onClick={() => startFlow(flow.id)}
                                    className="flex items-center gap-3 p-3 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-emerald-500/50 rounded-xl transition-all group text-left"
                                >
                                    <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                                        {flow.icon === 'PlusCircle' && <PlusCircle size={18} />}
                                        {flow.icon === 'Store' && <Store size={18} />}
                                        {flow.icon === 'Megaphone' && <Megaphone size={18} />}
                                    </div>
                                    <div className="flex-1">
                                        <span className="block text-sm font-bold text-gray-200 group-hover:text-white">{flow.name}</span>
                                    </div>
                                    <ChevronRight size={16} className="text-gray-500 group-hover:text-emerald-400" />
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Interactive Inputs (During Flow) */}
                    {activeFlow && !isLoading && currentStep && (
                        <div className="p-4 bg-black/40 border-t border-white/10 shrink-0">

                            {/* CHOICE */}
                            {currentStep.type === 'CHOICE' && (
                                <div className="grid grid-cols-1 gap-2">
                                    {currentStep.options?.map((opt) => (
                                        <button
                                            key={opt}
                                            onClick={() => handleNext(opt)}
                                            className="w-full text-left p-3 text-sm bg-white/5 hover:bg-emerald-600/20 border border-white/10 hover:border-emerald-500/50 text-emerald-100 hover:text-white rounded-xl transition-all"
                                        >
                                            {opt}
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* FILE UPLOAD */}
                            {currentStep.type === 'FILE_UPLOAD' && (
                                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-white/20 rounded-xl cursor-pointer hover:border-emerald-500 hover:bg-emerald-500/5 transition-all group">
                                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                        <Upload size={24} className="text-gray-400 group-hover:text-emerald-400 mb-2" />
                                        <p className="mb-2 text-sm text-gray-400 group-hover:text-emerald-300 font-bold">Toca para subir imágenes</p>
                                        <p className="text-xs text-gray-500">JPG, PNG (Max 5MB)</p>
                                    </div>
                                    <input
                                        type="file"
                                        className="hidden"
                                        onChange={(e) => {
                                            if (e.target.files && e.target.files[0]) {
                                                handleNext(`[Imagen subida: ${e.target.files[0].name}]`)
                                            }
                                        }}
                                    />
                                </label>
                            )}

                            {/* CONFIRMATION */}
                            {currentStep.type === 'CONFIRMATION' && (
                                <button
                                    onClick={() => handleNext('Confirmado')}
                                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
                                >
                                    <CheckCircle size={18} /> Confirmar Acción
                                </button>
                            )}

                            {/* TEXT / NUMBER INPUT */}
                            {(currentStep.type === 'TEXT_INPUT' || currentStep.type === 'NUMBER_INPUT') && (
                                <form onSubmit={handleCreate} className="flex gap-2">
                                    <input
                                        type={currentStep.type === 'NUMBER_INPUT' ? 'number' : 'text'}
                                        value={input}
                                        onChange={(e) => setInput(e.target.value)}
                                        placeholder="Escribe aquí..."
                                        className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors"
                                        autoFocus
                                    />
                                    <button
                                        type="submit"
                                        disabled={!input.trim()}
                                        className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white p-3 rounded-xl transition-colors"
                                    >
                                        <ChevronRight size={20} />
                                    </button>
                                </form>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* Toggle Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="pointer-events-auto group relative w-14 h-14 bg-gradient-to-br from-emerald-600 to-teal-600 rounded-full shadow-2xl shadow-emerald-600/30 flex items-center justify-center hover:scale-105 active:scale-95 transition-all z-50 hover:shadow-emerald-600/50"
            >
                {isOpen ? (
                    <X size={26} className="text-white" />
                ) : (
                    <div className="relative">
                        <Sparkles size={26} className="text-white fill-white/20" />
                        <span className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 border-2 border-emerald-600 rounded-full animate-bounce"></span>
                    </div>
                )}
            </button>
        </div>
    )
}
