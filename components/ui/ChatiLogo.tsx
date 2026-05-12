'use client'

import React from 'react'
import { motion } from 'framer-motion'

interface ChatiLogoProps {
  size?: number
  className?: string
  showNotification?: boolean
}

/**
 * ChatiLogo Component
 * A premium, WhatsApp-inspired logo for the Chati messenger.
 * Features a green speech bubble, a white inner circle with typing dots,
 * and a red notification badge.
 */
export default function ChatiLogo({ 
  size = 40, 
  className = "",
  showNotification = true 
}: ChatiLogoProps) {
  const innerCircleSize = size * 0.65
  const dotSize = size * 0.08
  const badgeSize = size * 0.4

  return (
    <div 
      className={`relative flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
    >
      {/* Green Bubble Background (#25D366 is the WhatsApp green) */}
      <div 
        className="absolute inset-0 bg-[#25D366] shadow-lg flex items-center justify-center"
        style={{ borderRadius: size * 0.35 }}
      >
        {/* The "Beak" of the speech bubble (at the bottom-left) */}
        <div 
          className="absolute -bottom-[2%] -left-[2%] bg-[#25D366] transform rotate-45"
          style={{ 
            width: size * 0.35, 
            height: size * 0.35, 
            borderRadius: size * 0.05 
          }}
        />
        
        {/* White Inner Circle (Replaces the phone icon) */}
        <div 
          className="relative bg-white rounded-full flex items-center justify-center"
          style={{ width: innerCircleSize, height: innerCircleSize }}
        >
          {/* Three Dots (Animated Typing Indicator) */}
          <div className="flex gap-[2px]">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="bg-gray-400 rounded-full"
                style={{ width: dotSize, height: dotSize }}
                animate={{
                  opacity: [0.4, 1, 0.4],
                  y: [0, -1, 0]
                }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  delay: i * 0.2,
                  ease: "easeInOut"
                }}
              />
            ))}
          </div>
          
          {/* Notification Badge '1' */}
          {showNotification && (
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute bg-red-600 text-white font-black flex items-center justify-center border-2 border-white shadow-sm"
              style={{ 
                width: badgeSize, 
                height: badgeSize, 
                top: -size * 0.08, 
                right: -size * 0.08, 
                borderRadius: '50%',
                fontSize: size * 0.22,
                lineHeight: 1
              }}
            >
              1
            </motion.div>
          )}
        </div>
      </div>
    </div>
  )
}
