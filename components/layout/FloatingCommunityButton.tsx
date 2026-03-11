'use client'

import React, { useState, useRef } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Rocket } from 'lucide-react'
import './floating-community.css'

export default function FloatingCommunityButton() {
  const pathname = usePathname()
  const router = useRouter()

  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)

  const dragRef = useRef({
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0,
    isDragging: false,
    hasMoved: false,
  })

  const containerRef = useRef<HTMLDivElement>(null)

  if (pathname === '/community') {
    return null
  }

  const handlePointerDown = (e: React.PointerEvent) => {
    dragRef.current.isDragging = true
    dragRef.current.hasMoved = false
    dragRef.current.startX = e.clientX - position.x
    dragRef.current.startY = e.clientY - position.y

    if (containerRef.current) {
      containerRef.current.setPointerCapture(e.pointerId)
    }
  }

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragRef.current.isDragging) return

    const newX = e.clientX - dragRef.current.startX
    const newY = e.clientY - dragRef.current.startY

    if (Math.abs(newX - position.x) > 3 || Math.abs(newY - position.y) > 3) {
      dragRef.current.hasMoved = true
      if (!isDragging) setIsDragging(true)
    }

    setPosition({ x: newX, y: newY })
  }

  const handlePointerUp = (e: React.PointerEvent) => {
    dragRef.current.isDragging = false
    setIsDragging(false)
    if (containerRef.current) {
      containerRef.current.releasePointerCapture(e.pointerId)
    }
  }

  const handleClick = (e: React.MouseEvent) => {
    if (dragRef.current.hasMoved) {
      e.preventDefault()
      e.stopPropagation()
      return
    }
    router.push('/community')
  }

  return (
    <div
      ref={containerRef}
      className={`fcb-container pointer-events-auto ${isDragging ? 'fcb-dragging' : ''}`}
      style={{ transform: `translate(${position.x}px, ${position.y}px)` }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      aria-label="Ir a Dropshipping"
      onDragStart={(e) => e.preventDefault()}
    >
      <div className="fcb-button">
        <div className="fcb-icon-wrapper">
          <Rocket size={24} className="text-white" />
        </div>
        <span className="fcb-text">Dropship</span>
      </div>
    </div>
  )
}
