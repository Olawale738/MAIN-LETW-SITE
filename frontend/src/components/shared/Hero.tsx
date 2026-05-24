import { ReactNode } from 'react'

interface HeroProps {
  title: string
  subtitle?: string
  backgroundImage?: string
  children?: ReactNode
  overlay?: boolean
  height?: 'small' | 'medium' | 'large'
  badge?: string
}

export default function Hero({
  title,
  subtitle,
  backgroundImage = 'https://images.unsplash.com/photo-1438232992991-995b7058bbb3?w=1200',
  children,
  overlay = true,
  height = 'large',
  badge,
}: HeroProps) {
  const heightClasses = {
    small: 'h-72',
    medium: 'h-[480px]',
    large: 'min-h-[580px]'
  }

  return (
    <div className={`relative ${heightClasses[height]} flex items-center justify-center overflow-hidden`}>
      {/* Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat scale-105 transition-transform duration-[8s] hover:scale-100"
        style={{ backgroundImage: `url(${backgroundImage})` }}
      />

      {/* Dark overlay */}
      {overlay && (
        <div className="absolute inset-0 bg-gradient-to-b from-[#140152]/70 via-[#140152]/55 to-[#140152]/80" />
      )}

      {/* Decorative gold accent line */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#f5bb00] to-transparent opacity-60" />

      {/* Content */}
      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-5">
        {badge && (
          <span className="inline-block bg-[#f5bb00]/20 border border-[#f5bb00]/40 text-[#f5bb00] text-xs font-bold uppercase tracking-widest px-5 py-2 rounded-full animate-in fade-in slide-in-from-bottom-2 duration-500">
            {badge}
          </span>
        )}
        <h1 className="text-4xl sm:text-5xl lg:text-7xl font-black text-white leading-[1.1] animate-in fade-in slide-in-from-bottom-4 duration-700"
            style={{ textShadow: '0 2px 20px rgba(0,0,0,0.3)' }}>
          {title}
        </h1>
        {subtitle && (
          <p className="text-lg sm:text-xl text-white/80 max-w-2xl mx-auto font-medium animate-in fade-in slide-in-from-bottom-6 duration-1000 leading-relaxed">
            {subtitle}
          </p>
        )}
        {children && (
          <div className="pt-4 animate-in fade-in slide-in-from-bottom-8 duration-[1200ms]">
            {children}
          </div>
        )}
      </div>
    </div>
  )
}