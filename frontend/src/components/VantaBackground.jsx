import { useEffect, useRef } from 'react'

export default function VantaBackground() {
  const ref = useRef(null)
  const vantaRef = useRef(null)

  useEffect(() => {
    if (!ref.current || !window.VANTA || !window.THREE) return

    vantaRef.current = window.VANTA.GLOBE({
      el: ref.current,
      THREE: window.THREE,
      mouseControls: true,
      touchControls: true,
      gyroControls: false,
      minHeight: 200,
      minWidth: 200,
      scale: 1.0,
      scaleMobile: 1.0,
      color: 0xc8b560,
      color2: 0x2a1f10,
      backgroundColor: 0x0a0a0f,
    })

    return () => {
      if (vantaRef.current) vantaRef.current.destroy()
    }
  }, [])

  return (
    <div
      ref={ref}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 0,
        pointerEvents: 'none',
      }}
    >
      {/* gradient overlay */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: `
          radial-gradient(ellipse 80% 60% at 50% 0%, rgba(200,181,96,0.04) 0%, transparent 60%),
          linear-gradient(180deg, rgba(10,10,15,0.55) 0%, rgba(10,10,15,0.78) 100%)
        `,
      }} />
    </div>
  )
}
