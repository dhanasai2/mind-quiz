import { useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'

/* === LIGHTWEIGHT PARTICLE BACKGROUND === */
function ParticleField() {
  const canvasRef = useRef(null)
  const animationRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    // Fewer particles — 20 max instead of 60
    const nodeCount = Math.min(20, Math.floor((window.innerWidth * window.innerHeight) / 50000))
    const nodes = []
    for (let i = 0; i < nodeCount; i++) {
      nodes.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        radius: 1.5 + Math.random() * 1.5,
        hue: Math.random() > 0.5 ? 190 : 270,
        brightness: 0.3 + Math.random() * 0.4,
      })
    }

    let lastTime = 0
    const targetFPS = 30 // Cap at 30fps to save resources
    const frameInterval = 1000 / targetFPS

    const animate = (timestamp) => {
      animationRef.current = requestAnimationFrame(animate)

      // Throttle to 30fps
      if (timestamp - lastTime < frameInterval) return
      lastTime = timestamp

      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Update + draw nodes
      for (const node of nodes) {
        node.x += node.vx
        node.y += node.vy

        // Bounds wrap
        if (node.x < 0) node.x = canvas.width
        if (node.x > canvas.width) node.x = 0
        if (node.y < 0) node.y = canvas.height
        if (node.y > canvas.height) node.y = 0

        // Simple dot — no radial gradient per node
        ctx.beginPath()
        ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2)
        ctx.fillStyle = `hsla(${node.hue}, 80%, 65%, ${node.brightness})`
        ctx.fill()
      }

      // Draw connections — only check nearby pairs with a smaller range
      const connectionDist = 140
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x
          const dy = nodes[i].y - nodes[j].y
          const distSq = dx * dx + dy * dy
          if (distSq < connectionDist * connectionDist) {
            const dist = Math.sqrt(distSq)
            const alpha = (1 - dist / connectionDist) * 0.1
            ctx.beginPath()
            ctx.moveTo(nodes[i].x, nodes[i].y)
            ctx.lineTo(nodes[j].x, nodes[j].y)
            ctx.strokeStyle = `hsla(${nodes[i].hue}, 60%, 50%, ${alpha})`
            ctx.lineWidth = 0.6
            ctx.stroke()
          }
        }
      }
    }

    animationRef.current = requestAnimationFrame(animate)

    return () => {
      window.removeEventListener('resize', resize)
      if (animationRef.current) cancelAnimationFrame(animationRef.current)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      style={{ opacity: 0.6 }}
    />
  )
}

/* === SUBTLE GRID OVERLAY (CSS only — zero JS cost) === */
function GridOverlay() {
  return (
    <div
      className="fixed inset-0 pointer-events-none z-0"
      style={{
        backgroundImage: `
          linear-gradient(rgba(124,58,237,0.03) 1px, transparent 1px),
          linear-gradient(90deg, rgba(124,58,237,0.03) 1px, transparent 1px)
        `,
        backgroundSize: '50px 50px',
        maskImage: 'radial-gradient(ellipse at center, black 30%, transparent 80%)',
        WebkitMaskImage: 'radial-gradient(ellipse at center, black 30%, transparent 80%)',
      }}
    />
  )
}

/* === AMBIENT GLOW (CSS only — no blur filters, no JS animation) === */
function AmbientGlow() {
  return (
    <div className="fixed inset-0 pointer-events-none z-0">
      <div
        className="absolute w-[500px] h-[500px] rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(124,58,237,0.08) 0%, transparent 70%)',
          left: '15%',
          top: '20%',
        }}
      />
      <div
        className="absolute w-[400px] h-[400px] rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(0,245,255,0.05) 0%, transparent 70%)',
          right: '10%',
          top: '40%',
        }}
      />
      <div
        className="absolute w-[350px] h-[350px] rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(191,0,255,0.04) 0%, transparent 70%)',
          left: '50%',
          bottom: '10%',
        }}
      />
    </div>
  )
}

export default function Layout({ children }) {
  return (
    <div className="min-h-screen relative" style={{ background: '#0a0a0f' }}>
      {/* Lightweight background — CSS-only layers + throttled canvas */}
      <GridOverlay />
      <AmbientGlow />
      <ParticleField />

      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  )
}
