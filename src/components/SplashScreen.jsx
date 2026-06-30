import { useState, useEffect } from 'react'

export default function SplashScreen({ onFinish }) {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false)
      setTimeout(onFinish, 400)
    }, 1800)
    return () => clearTimeout(timer)
  }, [onFinish])

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100,
      background: 'linear-gradient(135deg, #6D4FF0 0%, #9B7AFF 50%, #FF7AA8 100%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      opacity: visible ? 1 : 0,
      transition: 'opacity 0.4s ease',
      pointerEvents: visible ? 'auto' : 'none'
    }}>
      <div style={{
        width: 64, height: 64, borderRadius: 18, background: 'white',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'Sora, sans-serif', fontWeight: 800, color: '#6D4FF0', fontSize: 30,
        marginBottom: 16,
        animation: 'splashLogo 0.8s cubic-bezier(.34,1.56,.64,1) forwards'
      }}>Z</div>
      <p style={{ color: 'white', fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: 20, letterSpacing: '0.02em' }}>ZaboniAI</p>
      <style>{`
        @keyframes splashLogo {
          0% { transform: scale(0.6) rotate(-10deg); opacity: 0; }
          50% { transform: scale(1.1) rotate(5deg); opacity: 1; }
          100% { transform: scale(1) rotate(0deg); opacity: 1; }
        }
      `}</style>
    </div>
  )
}
