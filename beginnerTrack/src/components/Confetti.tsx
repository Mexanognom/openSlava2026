import { useEffect, useRef } from 'react'
import '../styles/confetti.css'

const PARTICLE_COUNT = 120
const COLOURS = ['#ffffff', '#ffdd00', '#00d2ff', '#ff7b00', '#ff4d94', '#a8ff3e']

function rand(min: number, max: number): number {
  return Math.random() * (max - min) + min
}

function spawnParticles(overlay: HTMLDivElement): void {
  let remaining = PARTICLE_COUNT

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const particle = document.createElement('span')
    particle.className = 'confetti-particle'

    const size = rand(4, 10)
    const drift = rand(-150, 150)

    particle.style.left = `${rand(0, 100)}vw`
    particle.style.width = `${size}px`
    particle.style.height = `${size}px`
    particle.style.background = COLOURS[Math.floor(Math.random() * COLOURS.length)]
    particle.style.borderRadius = Math.random() > 0.5 ? '50%' : '0%'
    particle.style.animationDuration = `${rand(1.2, 2.8).toFixed(2)}s`
    particle.style.animationDelay = `${rand(0, 0.8).toFixed(2)}s`
    // CSS custom property consumed by the @keyframes translateX
    particle.style.setProperty('--drift', `${drift.toFixed(1)}px`)

    particle.addEventListener(
      'animationend',
      () => {
        particle.remove()
        remaining -= 1
        if (remaining === 0) {
          overlay.remove()
        }
      },
      { once: true },
    )

    overlay.appendChild(particle)
  }
}

export default function Confetti() {
  const overlayRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const overlay = overlayRef.current
    if (!overlay) return
    spawnParticles(overlay)
  }, [])

  return <div className="confetti-overlay" ref={overlayRef} />
}
