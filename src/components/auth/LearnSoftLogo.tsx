interface LogoProps {
  variant?: 'default' | 'glow' | 'mono' | 'glass'
  size?: 'sm' | 'md' | 'lg' | 'xl'
  withText?: boolean
  className?: string
}

const sizes = {
  sm: { container: 'h-8 w-8',   text: 'text-[10px]', name: 'text-sm'  },
  md: { container: 'h-10 w-10', text: 'text-xs',     name: 'text-base' },
  lg: { container: 'h-12 w-12', text: 'text-sm',     name: 'text-lg'  },
  xl: { container: 'h-16 w-16', text: 'text-base',   name: 'text-2xl' },
}

export default function LearnSoftLogo({
  variant = 'default',
  size = 'md',
  withText = false,
  className = '',
}: LogoProps) {
  const s = sizes[size]

  const containerStyle: React.CSSProperties =
    variant === 'glow'
      ? {
          background: 'linear-gradient(135deg, hsl(221,80%,44%), hsl(221,80%,58%))',
          boxShadow: '0 0 18px hsla(221,80%,50%,0.45), 0 0 36px hsla(221,80%,50%,0.15)',
        }
      : variant === 'glass'
      ? {
          background: 'hsla(221,80%,50%,0.1)',
          border: '1px solid hsla(221,80%,50%,0.3)',
          backdropFilter: 'blur(8px)',
        }
      : variant === 'mono'
      ? { background: 'rgba(0,0,0,0.06)', border: '1px solid rgba(0,0,0,0.1)' }
      : {
          background: 'linear-gradient(135deg, hsl(221,80%,44%), hsl(221,80%,56%))',
          boxShadow: '0 2px 8px hsla(221,80%,50%,0.3)',
        }

  const textColor = variant === 'mono' ? 'hsl(221,80%,44%)' : '#FFFFFF'

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div
        className={`${s.container} flex items-center justify-center rounded-xl select-none flex-shrink-0`}
        style={containerStyle}
      >
        <span className={`${s.text} font-black`} style={{ color: textColor, letterSpacing: '-0.5px' }}>
          {'</>'}
        </span>
      </div>
      {withText && (
        <span className={`${s.name} font-bold tracking-tight`} style={{ color: '#0F172A' }}>
          LearnSoft
        </span>
      )}
    </div>
  )
}
