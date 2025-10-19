import { useState, useEffect } from 'react'
import { brandColors } from '../../stylings'

interface TemplateGridProps {
  children: React.ReactNode
  columns?: number
  gap?: string
  style?: React.CSSProperties
}

export default function TemplateGrid({ 
  children, 
  columns = 3,
  gap = '2rem',
  style 
}: TemplateGridProps) {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: isMobile ? '1fr' : `repeat(auto-fit, minmax(350px, 1fr))`,
      gap: isMobile ? '1rem' : gap,
      marginBottom: isMobile ? '1.5rem' : '3rem',
      ...style
    }}>
      {children}
    </div>
  )
}
