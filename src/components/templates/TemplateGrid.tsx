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
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: `repeat(auto-fit, minmax(350px, 1fr))`,
      gap,
      marginBottom: '3rem',
      ...style
    }}>
      {children}
    </div>
  )
}
