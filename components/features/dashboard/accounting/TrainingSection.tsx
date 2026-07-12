'use client'

import React, { useState, useEffect, useCallback } from 'react'
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  BookOpen,
  Clock,
  Award,
  Users,
  User,
  Landmark,
  Construction,
  Building2,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Check,
  X
} from 'lucide-react'
import { trainingModules, ContentBlock, Lesson, TrainingModule } from './trainingData'

const PROGRESS_KEY = 'training-progress'

const getCompletedLessons = (): string[] => {
  if (typeof window === 'undefined') return []
  try {
    const stored = localStorage.getItem(PROGRESS_KEY)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

const saveCompletedLessons = (lessons: string[]) => {
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(lessons))
}

// ─── Content Block Renderer ─────────────────────────────────────────────────

const renderContentBlock = (block: ContentBlock, index: number): React.ReactNode => {
  switch (block.type) {
    case 'text':
      return (
        <p
          key={index}
          style={{
            fontSize: 19,
            lineHeight: 1.8,
            color: '#334155',
            margin: '0 0 16px 0',
            fontWeight: 400,
          }}
        >
          {block.value || block.content}
        </p>
      )

    case 'heading':
      return (
        <h3
          key={index}
          style={{
            fontSize: 24,
            fontWeight: 800,
            color: '#0f172a',
            marginTop: 28,
            marginBottom: 12,
            letterSpacing: '-0.3px',
            lineHeight: 1.3,
          }}
        >
          {block.value || block.title}
        </h3>
      )

    case 'formula':
      return (
        <div
          key={index}
          style={{
            background: '#0f172a',
            borderRadius: 16,
            padding: '24px 28px',
            marginBottom: 20,
            marginTop: 8,
            boxShadow: '0 8px 32px rgba(15, 23, 42, 0.18)',
          }}
        >
          {block.label && (
            <div
              style={{
                fontSize: 14,
                fontWeight: 800,
                color: '#94a3b8',
                textTransform: 'uppercase',
                letterSpacing: '1.5px',
                marginBottom: 10,
              }}
            >
              {block.label}
            </div>
          )}
          <div
            style={{
              fontSize: 22,
              fontWeight: 700,
              color: '#ffffff',
              fontFamily: "'SF Mono', 'Fira Code', 'Cascadia Code', monospace",
              letterSpacing: '0.5px',
              lineHeight: 1.6,
            }}
          >
            {block.formula || block.value}
          </div>
        </div>
      )

    case 'example':
      return (
        <div
          key={index}
          style={{
            background: '#fffbeb',
            borderLeft: '4px solid #f59e0b',
            borderRadius: '0 16px 16px 0',
            padding: '20px 24px',
            marginBottom: 20,
          }}
        >
          {block.title && (
            <div
              style={{
                fontSize: 18,
                fontWeight: 800,
                color: '#92400e',
                marginBottom: 8,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              📋 {block.title}
            </div>
          )}
          <div
            style={{
              fontSize: 18,
              lineHeight: 1.7,
              color: '#78350f',
              whiteSpace: 'pre-line',
              fontWeight: 500,
            }}
          >
            {block.content || block.value}
          </div>
        </div>
      )

    case 'keypoint':
      return (
        <div
          key={index}
          style={{
            background: '#eef2ff',
            borderLeft: '4px solid #6366f1',
            borderRadius: '0 16px 16px 0',
            padding: '18px 24px',
            marginBottom: 20,
          }}
        >
          <div
            style={{
              fontSize: 18,
              fontWeight: 700,
              color: '#3730a3',
              lineHeight: 1.7,
            }}
          >
            {block.value || block.content}
          </div>
        </div>
      )

    case 'list':
      return (
        <div key={index} style={{ marginBottom: 20, paddingLeft: 4 }}>
          {(block.items || []).map((item, i) => {
            const emojiMatch = item.match(/^(\p{Emoji_Presentation}|\p{Extended_Pictographic})\s*/u)
            const hasEmoji = emojiMatch !== null
            const emoji = hasEmoji ? emojiMatch![0].trim() : null
            const text = hasEmoji ? item.slice(emojiMatch![0].length) : item
            
            const emojiToIconMap: Record<string, React.ReactNode> = {
              '👥': <Users size={20} color="#3b82f6" />, // blue-500
              '👩‍🦽': <User size={20} color="#eab308" />, // yellow-500
              '🏦': <Landmark size={20} color="#3b82f6" />, // blue-500
              '🏗️': <Construction size={20} color="#64748b" />, // slate-500
              '🏢': <Building2 size={20} color="#475569" />, // slate-600
              '📈': <TrendingUp size={20} color="#16a34a" />, // green-600
              '📉': <TrendingDown size={20} color="#dc2626" />, // red-600
              '💰': <DollarSign size={20} color="#eab308" />, // yellow-500
              '✅': <Check size={20} color="#16a34a" />,
              '❌': <X size={20} color="#dc2626" />,
              '1️⃣': <div style={{width: 20, height: 20, background: '#3b82f6', color: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 'bold'}}>1</div>,
              '2️⃣': <div style={{width: 20, height: 20, background: '#3b82f6', color: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 'bold'}}>2</div>,
              '3️⃣': <div style={{width: 20, height: 20, background: '#3b82f6', color: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 'bold'}}>3</div>,
              '4️⃣': <div style={{width: 20, height: 20, background: '#3b82f6', color: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 'bold'}}>4</div>,
              '5️⃣': <div style={{width: 20, height: 20, background: '#3b82f6', color: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 'bold'}}>5</div>,
              '6️⃣': <div style={{width: 20, height: 20, background: '#3b82f6', color: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 'bold'}}>6</div>,
              '7️⃣': <div style={{width: 20, height: 20, background: '#3b82f6', color: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 'bold'}}>7</div>,
            }
            
            const renderIcon = () => {
              if (hasEmoji && emoji && emojiToIconMap[emoji]) {
                return emojiToIconMap[emoji];
              }
              if (hasEmoji) {
                return <span style={{ fontSize: 18 }}>{emoji}</span>;
              }
              return (
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: '#6366f1',
                    display: 'inline-block',
                  }}
                />
              )
            }

            return (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 12,
                  padding: '8px 0',
                  fontSize: 18,
                  lineHeight: 1.7,
                  color: '#334155',
                }}
              >
                <div style={{ flexShrink: 0, marginTop: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {renderIcon()}
                </div>
                <span style={{ fontWeight: 500 }}>{text}</span>
              </div>
            )
          })}
        </div>
      )

    case 'tip':
      return (
        <div
          key={index}
          style={{
            background: '#f0fdf4',
            borderLeft: '4px solid #10b981',
            borderRadius: '0 16px 16px 0',
            padding: '18px 24px',
            marginBottom: 20,
            display: 'flex',
            alignItems: 'flex-start',
            gap: 12,
          }}
        >
          <span style={{ fontSize: 24, flexShrink: 0, marginTop: -2 }}>💡</span>
          <div
            style={{
              fontSize: 18,
              fontWeight: 600,
              color: '#065f46',
              lineHeight: 1.7,
            }}
          >
            {block.value || block.content}
          </div>
        </div>
      )

    case 'warning':
      return (
        <div
          key={index}
          style={{
            background: '#fef2f2',
            borderLeft: '4px solid #ef4444',
            borderRadius: '0 16px 16px 0',
            padding: '18px 24px',
            marginBottom: 20,
            display: 'flex',
            alignItems: 'flex-start',
            gap: 12,
          }}
        >
          <span style={{ fontSize: 24, flexShrink: 0, marginTop: -2 }}>⚠️</span>
          <div
            style={{
              fontSize: 18,
              fontWeight: 600,
              color: '#991b1b',
              lineHeight: 1.7,
            }}
          >
            {block.value || block.content}
          </div>
        </div>
      )

    case 'table':
      return (
        <div
          key={index}
          style={{
            marginBottom: 20,
            borderRadius: 16,
            overflow: 'hidden',
            border: '1px solid #e2e8f0',
          }}
        >
          <div style={{ overflowX: 'auto' }}>
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: 17,
              }}
            >
              {block.headers && (
                <thead>
                  <tr>
                    {block.headers.map((header, i) => (
                      <th
                        key={i}
                        style={{
                          background: '#0f172a',
                          color: '#ffffff',
                          padding: '12px 16px',
                          textAlign: 'left',
                          fontWeight: 700,
                          fontSize: 16,
                          letterSpacing: '0.3px',
                          whiteSpace: 'normal',
                        }}
                      >
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
              )}
              <tbody>
                {(block.rows || []).map((row, rowIdx) => (
                  <tr key={rowIdx}>
                    {row.map((cell, cellIdx) => (
                      <td
                        key={cellIdx}
                        style={{
                          padding: '11px 16px',
                          background: rowIdx % 2 === 0 ? '#ffffff' : '#f8fafc',
                          color: '#334155',
                          fontWeight: cellIdx === 0 ? 600 : 400,
                          borderBottom: '1px solid #f1f5f9',
                          whiteSpace: 'normal',
                        }}
                      >
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )

    case 'divider':
      return (
        <hr
          key={index}
          style={{
            border: 'none',
            borderTop: '2px solid #f1f5f9',
            margin: '28px 0',
          }}
        />
      )

    case 'highlight':
      return (
        <div
          key={index}
          style={{
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            borderRadius: 16,
            padding: '22px 28px',
            marginBottom: 20,
            display: 'flex',
            alignItems: 'flex-start',
            gap: 14,
            boxShadow: '0 8px 32px rgba(99, 102, 241, 0.25)',
          }}
        >
          <span style={{ fontSize: 26, flexShrink: 0 }}>✨</span>
          <div
            style={{
              fontSize: 19,
              fontWeight: 700,
              color: '#ffffff',
              lineHeight: 1.7,
            }}
          >
            {block.value || block.content}
          </div>
        </div>
      )

    case 'comparison':
      return (
        <div
          key={index}
          className="comparison-block"
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 16,
            marginBottom: 20,
          }}
        >
          <div
            style={{
              background: '#f0fdf4',
              borderRadius: 16,
              padding: '20px 22px',
              border: '1px solid #dcfce7',
            }}
          >
            <div
              style={{
                fontSize: 18,
                fontWeight: 800,
                color: '#065f46',
                marginBottom: 12,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              {block.leftTitle}
            </div>
            {(block.leftItems || []).map((item, i) => (
              <div
                key={i}
                style={{
                  fontSize: 17,
                  color: '#064e3b',
                  padding: '5px 0',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  fontWeight: 500,
                  lineHeight: 1.5,
                }}
              >
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    background: '#10b981',
                    flexShrink: 0,
                  }}
                />
                {item}
              </div>
            ))}
          </div>
          <div
            style={{
              background: '#fef2f2',
              borderRadius: 16,
              padding: '20px 22px',
              border: '1px solid #fecaca',
            }}
          >
            <div
              style={{
                fontSize: 18,
                fontWeight: 800,
                color: '#991b1b',
                marginBottom: 12,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              {block.rightTitle}
            </div>
            {(block.rightItems || []).map((item, i) => (
              <div
                key={i}
                style={{
                  fontSize: 17,
                  color: '#7f1d1d',
                  padding: '5px 0',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  fontWeight: 500,
                  lineHeight: 1.5,
                }}
              >
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    background: '#ef4444',
                    flexShrink: 0,
                  }}
                />
                {item}
              </div>
            ))}
          </div>
        </div>
      )

    default:
      return null
  }
}

// ─── Module Card ─────────────────────────────────────────────────────────────

const ModuleCard: React.FC<{
  module: TrainingModule
  completedCount: number
  totalLessons: number
  onClick: () => void
}> = ({ module, completedCount, totalLessons, onClick }) => {
  const progress = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0
  const isComplete = completedCount === totalLessons && totalLessons > 0

  return (
    <div
      onClick={onClick}
      style={{
        background: '#ffffff',
        borderRadius: 24,
        border: '1px solid #f1f5f9',
        padding: '28px',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
        position: 'relative',
        overflow: 'hidden',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-4px)'
        e.currentTarget.style.boxShadow = '0 12px 40px rgba(0,0,0,0.08)'
        e.currentTarget.style.borderColor = module.color
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)'
        e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.04)'
        e.currentTarget.style.borderColor = '#f1f5f9'
      }}
    >
      {/* Color accent bar */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 4,
          background: module.color,
          opacity: progress > 0 ? 1 : 0.3,
        }}
      />

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
        <span style={{ fontSize: 40 }}>{module.emoji}</span>
        {isComplete && (
          <div
            style={{
              background: '#f0fdf4',
              borderRadius: 12,
              padding: '4px 10px',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <CheckCircle2 size={14} color="#10b981" />
            <span style={{ fontSize: 11, fontWeight: 700, color: '#059669' }}>Completado</span>
          </div>
        )}
      </div>

      <h3
        style={{
          fontSize: 17,
          fontWeight: 800,
          color: '#0f172a',
          margin: '0 0 6px 0',
          letterSpacing: '-0.2px',
        }}
      >
        {module.title}
      </h3>

      <p
        style={{
          fontSize: 13,
          color: '#64748b',
          margin: '0 0 20px 0',
          lineHeight: 1.5,
          fontWeight: 500,
        }}
      >
        {module.description}
      </p>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <BookOpen size={14} color="#94a3b8" />
          <span style={{ fontSize: 12, fontWeight: 600, color: '#94a3b8' }}>
            {totalLessons} lecciones
          </span>
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ background: '#f1f5f9', borderRadius: 8, height: 6, overflow: 'hidden' }}>
        <div
          style={{
            width: `${progress}%`,
            height: '100%',
            background: isComplete ? '#10b981' : module.color,
            borderRadius: 8,
            transition: 'width 0.5s ease',
          }}
        />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8' }}>
          {completedCount}/{totalLessons} completadas
        </span>
        <span style={{ fontSize: 11, fontWeight: 800, color: isComplete ? '#10b981' : module.color }}>
          {progress}%
        </span>
      </div>
    </div>
  )
}

// ─── Lesson Sidebar Item ─────────────────────────────────────────────────────

const LessonNavItem: React.FC<{
  lesson: Lesson
  index: number
  isActive: boolean
  isCompleted: boolean
  onClick: () => void
}> = ({ lesson, index, isActive, isCompleted, onClick }) => (
  <button
    onClick={onClick}
    style={{
      width: '100%',
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      padding: '12px 16px',
      border: 'none',
      borderRadius: 14,
      cursor: 'pointer',
      background: isActive ? '#eef2ff' : 'transparent',
      transition: 'all 0.2s ease',
      textAlign: 'left',
    }}
    onMouseEnter={(e) => {
      if (!isActive) e.currentTarget.style.background = '#f8fafc'
    }}
    onMouseLeave={(e) => {
      if (!isActive) e.currentTarget.style.background = 'transparent'
    }}
  >
    <div
      style={{
        width: 28,
        height: 28,
        borderRadius: 10,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        background: isCompleted ? '#10b981' : isActive ? '#6366f1' : '#f1f5f9',
        color: isCompleted || isActive ? '#ffffff' : '#94a3b8',
        fontSize: 12,
        fontWeight: 800,
      }}
    >
      {isCompleted ? <CheckCircle2 size={14} /> : index + 1}
    </div>
    <div style={{ minWidth: 0, flex: 1 }}>
      <div
        style={{
          fontSize: 13,
          fontWeight: isActive ? 700 : 600,
          color: isActive ? '#6366f1' : '#334155',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        {lesson.title}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
        <Clock size={10} color="#cbd5e1" />
        <span style={{ fontSize: 10, color: '#94a3b8', fontWeight: 600 }}>{lesson.duration}</span>
      </div>
    </div>
  </button>
)

// ─── Main Component ──────────────────────────────────────────────────────────

export const TrainingSection: React.FC = () => {
  const [selectedModule, setSelectedModule] = useState<TrainingModule | null>(null)
  const [selectedLessonIndex, setSelectedLessonIndex] = useState(0)
  const [completedLessons, setCompletedLessons] = useState<string[]>([])
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
    setCompletedLessons(getCompletedLessons())
  }, [])

  const totalLessons = trainingModules.reduce((sum, m) => sum + m.lessons.length, 0)
  const totalCompleted = completedLessons.length

  const getLessonId = useCallback((moduleId: string, lessonId: string) => `${moduleId}-${lessonId}`, [])

  const isLessonCompleted = useCallback(
    (moduleId: string, lessonId: string) => completedLessons.includes(getLessonId(moduleId, lessonId)),
    [completedLessons, getLessonId]
  )

  const getModuleCompletedCount = useCallback(
    (module: TrainingModule) => module.lessons.filter((l) => isLessonCompleted(module.id, l.id)).length,
    [isLessonCompleted]
  )

  const toggleLessonComplete = useCallback(
    (moduleId: string, lessonId: string) => {
      const id = getLessonId(moduleId, lessonId)
      setCompletedLessons((prev) => {
        const updated = prev.includes(id) ? prev.filter((l) => l !== id) : [...prev, id]
        saveCompletedLessons(updated)
        return updated
      })
    },
    [getLessonId]
  )

  const handleSelectModule = (module: TrainingModule) => {
    setSelectedModule(module)
    setSelectedLessonIndex(0)
  }

  const handleBack = () => {
    setSelectedModule(null)
    setSelectedLessonIndex(0)
  }

  const handleNextLesson = () => {
    if (selectedModule && selectedLessonIndex < selectedModule.lessons.length - 1) {
      setSelectedLessonIndex((prev) => prev + 1)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const handlePrevLesson = () => {
    if (selectedLessonIndex > 0) {
      setSelectedLessonIndex((prev) => prev - 1)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  if (!isClient) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: '50%',
            border: '4px solid #f1f5f9',
            borderTopColor: '#6366f1',
            animation: 'spin 1s linear infinite',
          }}
        />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  // ─── Module Grid View ────────────────────────────────────────────────────

  if (!selectedModule) {
    const overallProgress = totalLessons > 0 ? Math.round((totalCompleted / totalLessons) * 100) : 0

    return (
      <div className="training-container" style={{ padding: '24px', maxWidth: 1100, margin: '0 auto', width: '100%' }}>
        {/* Header */}
        <div
          style={{
            background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
            borderRadius: 28,
            padding: '36px 40px',
            marginBottom: 40,
            color: '#ffffff',
            boxShadow: '0 20px 60px rgba(15, 23, 42, 0.2)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Decorative circles */}
          <div
            style={{
              position: 'absolute',
              top: -40,
              right: -40,
              width: 160,
              height: 160,
              borderRadius: '50%',
              background: 'rgba(99, 102, 241, 0.1)',
            }}
          />
          <div
            style={{
              position: 'absolute',
              bottom: -20,
              right: 80,
              width: 100,
              height: 100,
              borderRadius: '50%',
              background: 'rgba(16, 185, 129, 0.08)',
            }}
          />

          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 8 }}>
              <span style={{ fontSize: 36 }}>🎓</span>
              <h2
                style={{
                  fontSize: 30,
                  fontWeight: 900,
                  margin: 0,
                  letterSpacing: '-0.5px',
                }}
              >
                Academia Financiera
              </h2>
            </div>
            <p
              style={{
                fontSize: 15,
                color: '#94a3b8',
                margin: '0 0 28px 0',
                fontWeight: 500,
              }}
            >
              Todo lo que necesitas saber sobre finanzas y contabilidad
            </p>

            {/* Stats row */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 32,
                marginBottom: 20,
                flexWrap: 'wrap',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <BookOpen size={18} color="#6366f1" />
                <span style={{ fontSize: 14, fontWeight: 700 }}>
                  {totalCompleted} lecciones completadas de {totalLessons} total
                </span>
              </div>
              {totalCompleted > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Award size={18} color="#f59e0b" />
                  <span style={{ fontSize: 14, fontWeight: 700, color: '#f59e0b' }}>
                    {overallProgress}% completado
                  </span>
                </div>
              )}
            </div>

            {/* Overall progress bar */}
            <div
              style={{
                background: 'rgba(255,255,255,0.1)',
                borderRadius: 10,
                height: 10,
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: `${overallProgress}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg, #6366f1, #8b5cf6)',
                  borderRadius: 10,
                  transition: 'width 0.6s ease',
                }}
              />
            </div>
          </div>
        </div>

        {/* Module Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: 24,
          }}
        >
          {trainingModules.map((module) => (
            <ModuleCard
              key={module.id}
              module={module}
              completedCount={getModuleCompletedCount(module)}
              totalLessons={module.lessons.length}
              onClick={() => handleSelectModule(module)}
            />
          ))}
        </div>
      </div>
    )
  }

  // ─── Lesson View ─────────────────────────────────────────────────────────

  const currentLesson = selectedModule.lessons[selectedLessonIndex]
  if (!currentLesson) return null

  const moduleCompletedCount = getModuleCompletedCount(selectedModule)
  const moduleProgress = Math.round((moduleCompletedCount / selectedModule.lessons.length) * 100)
  const currentLessonCompleted = isLessonCompleted(selectedModule.id, currentLesson.id)

  return (
    <div className="training-container" style={{ padding: '24px', maxWidth: 1200, margin: '0 auto', width: '100%' }}>
      {/* Top bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          marginBottom: 24,
          flexWrap: 'wrap',
        }}
      >
        <button
          onClick={handleBack}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '10px 18px',
            background: '#f8fafc',
            border: '1px solid #f1f5f9',
            borderRadius: 14,
            cursor: 'pointer',
            fontSize: 14,
            fontWeight: 700,
            color: '#334155',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#f1f5f9'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '#f8fafc'
          }}
        >
          <ChevronLeft size={18} />
          Volver
        </button>

        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <span style={{ fontSize: 22 }}>{selectedModule.emoji}</span>
            <h2
              style={{
                fontSize: 20,
                fontWeight: 800,
                color: '#0f172a',
                margin: 0,
                letterSpacing: '-0.3px',
              }}
            >
              {selectedModule.title}
            </h2>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ flex: 1, background: '#f1f5f9', borderRadius: 6, height: 6, overflow: 'hidden' }}>
              <div
                style={{
                  width: `${moduleProgress}%`,
                  height: '100%',
                  background: selectedModule.color,
                  borderRadius: 6,
                  transition: 'width 0.5s ease',
                }}
              />
            </div>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#64748b', flexShrink: 0 }}>
              {moduleCompletedCount}/{selectedModule.lessons.length}
            </span>
          </div>
        </div>
      </div>

      {/* Mobile: Lesson tabs (horizontal scroll) */}
      <div
        style={{
          display: 'none',
          overflowX: 'auto',
          gap: 8,
          paddingBottom: 8,
          marginBottom: 20,
        }}
        className="mobile-lesson-tabs"
      >
        {selectedModule.lessons.map((lesson, idx) => (
          <button
            key={lesson.id}
            onClick={() => {
              setSelectedLessonIndex(idx)
            }}
            style={{
              flexShrink: 0,
              padding: '8px 16px',
              borderRadius: 12,
              border: 'none',
              background: idx === selectedLessonIndex ? '#6366f1' : '#f1f5f9',
              color: idx === selectedLessonIndex ? '#ffffff' : '#64748b',
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              whiteSpace: 'nowrap',
            }}
          >
            {isLessonCompleted(selectedModule.id, lesson.id) && (
              <CheckCircle2 size={12} />
            )}
            {idx + 1}. {lesson.title}
          </button>
        ))}
      </div>

      {/* Main layout: sidebar + content */}
      <div style={{ display: 'flex', gap: 28, alignItems: 'flex-start' }}>
        {/* Sidebar (desktop) */}
        <div
          className="lesson-sidebar"
          style={{
            width: 280,
            flexShrink: 0,
            background: '#ffffff',
            borderRadius: 24,
            border: '1px solid #f1f5f9',
            padding: '20px 12px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
            position: 'sticky',
            top: 24,
            maxHeight: 'calc(100vh - 48px)',
            overflowY: 'auto',
          }}
        >
          <div style={{ padding: '0 8px 12px', borderBottom: '1px solid #f1f5f9', marginBottom: 8 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px' }}>
              Lecciones
            </div>
          </div>
          {selectedModule.lessons.map((lesson, idx) => (
            <LessonNavItem
              key={lesson.id}
              lesson={lesson}
              index={idx}
              isActive={idx === selectedLessonIndex}
              isCompleted={isLessonCompleted(selectedModule.id, lesson.id)}
              onClick={() => {
                setSelectedLessonIndex(idx)
                window.scrollTo({ top: 0, behavior: 'smooth' })
              }}
            />
          ))}
        </div>

        {/* Content area */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Lesson header */}
          <div
            className="lesson-header-card"
            style={{
              background: '#ffffff',
              borderRadius: 24,
              border: '1px solid #f1f5f9',
              padding: '32px 36px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
              marginBottom: 24,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, flexWrap: 'wrap', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 10,
                    background: selectedModule.color,
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 14,
                    fontWeight: 800,
                  }}
                >
                  {selectedLessonIndex + 1}
                </div>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8' }}>
                  Lección {selectedLessonIndex + 1} de {selectedModule.lessons.length}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Clock size={14} color="#94a3b8" />
                <span style={{ fontSize: 12, fontWeight: 600, color: '#94a3b8' }}>
                  {currentLesson.duration}
                </span>
              </div>
            </div>
            <h2
              style={{
                fontSize: 24,
                fontWeight: 900,
                color: '#0f172a',
                margin: '0 0 0 0',
                letterSpacing: '-0.3px',
                lineHeight: 1.3,
              }}
            >
              {currentLesson.title}
            </h2>
          </div>

          {/* Lesson content */}
          <div
            className="lesson-content-card"
            style={{
              background: '#ffffff',
              borderRadius: 24,
              border: '1px solid #f1f5f9',
              padding: '36px 40px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
              marginBottom: 24,
            }}
          >
            {currentLesson.content.map((block, index) => renderContentBlock(block, index))}
          </div>

          {/* Complete + Navigation */}
          <div
            style={{
              background: '#ffffff',
              borderRadius: 24,
              border: '1px solid #f1f5f9',
              padding: '24px 36px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 16,
            }}
          >
            {/* Previous */}
            <button
              onClick={handlePrevLesson}
              disabled={selectedLessonIndex === 0}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '12px 20px',
                border: '1px solid #f1f5f9',
                borderRadius: 14,
                background: selectedLessonIndex === 0 ? '#f8fafc' : '#ffffff',
                color: selectedLessonIndex === 0 ? '#cbd5e1' : '#334155',
                fontSize: 14,
                fontWeight: 700,
                cursor: selectedLessonIndex === 0 ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease',
                opacity: selectedLessonIndex === 0 ? 0.5 : 1,
              }}
            >
              <ChevronLeft size={18} />
              Anterior
            </button>

            {/* Complete button */}
            <button
              onClick={() => toggleLessonComplete(selectedModule.id, currentLesson.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '14px 28px',
                borderRadius: 16,
                background: currentLessonCompleted
                  ? '#f0fdf4'
                  : 'linear-gradient(135deg, #10b981, #059669)',
                color: currentLessonCompleted ? '#059669' : '#ffffff',
                fontSize: 15,
                fontWeight: 800,
                cursor: 'pointer',
                boxShadow: currentLessonCompleted
                  ? 'none'
                  : '0 8px 24px rgba(16, 185, 129, 0.3)',
                transition: 'all 0.3s ease',
                border: currentLessonCompleted ? '2px solid #dcfce7' : 'none',
              }}
            >
              <CheckCircle2 size={20} />
              {currentLessonCompleted ? 'Completada ✓' : 'Completar Lección'}
            </button>

            {/* Next */}
            <button
              onClick={handleNextLesson}
              disabled={selectedLessonIndex >= selectedModule.lessons.length - 1}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '12px 20px',
                border: selectedLessonIndex >= selectedModule.lessons.length - 1 ? '1px solid #f1f5f9' : 'none',
                borderRadius: 14,
                background:
                  selectedLessonIndex >= selectedModule.lessons.length - 1
                    ? '#f8fafc'
                    : '#0f172a',
                color:
                  selectedLessonIndex >= selectedModule.lessons.length - 1
                    ? '#cbd5e1'
                    : '#ffffff',
                fontSize: 14,
                fontWeight: 700,
                cursor:
                  selectedLessonIndex >= selectedModule.lessons.length - 1
                    ? 'not-allowed'
                    : 'pointer',
                transition: 'all 0.2s ease',
                opacity: selectedLessonIndex >= selectedModule.lessons.length - 1 ? 0.5 : 1,
              }}
            >
              Siguiente
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Responsive CSS */}
      <style>{`
        @media (max-width: 768px) {
          .lesson-sidebar {
            display: none !important;
          }
          .mobile-lesson-tabs {
            display: flex !important;
          }
          .training-container {
            padding: 12px 0px !important;
          }
          .lesson-header-card {
            padding: 20px 16px !important;
            border-radius: 16px !important;
          }
          .lesson-content-card {
            padding: 20px 16px !important;
            border-radius: 16px !important;
          }
          .lesson-content-card table th,
          .lesson-content-card table td {
            padding: 8px 10px !important;
            font-size: 15px !important;
          }
          .comparison-block {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  )
}
