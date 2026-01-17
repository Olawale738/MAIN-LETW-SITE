import { ReactNode } from 'react'

interface HeroProps {
  title: string
  subtitle?: string
  backgroundImage?: string
  children?: ReactNode
  overlay?: boolean
  height?: 'small' | 'medium' | 'large'
}

export default function Hero({
  title,
  subtitle,
  backgroundImage = 'https://images.unsplash.com/photo-1438232992991-995b7058bbb3?w=1200',
  children,
  overlay = true,
  height = 'large'
}: HeroProps) {
  const heightClasses = {
    small: 'h-64',
    medium: 'h-96',
    large: 'h-[500px]'
  }

  return (
    <div className={`relative ${heightClasses[height]} flex items-center justify-center overflow-hidden`}>
      {/* Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat scale-105"
        style={{ backgroundImage: `url(${backgroundImage})` }}
      />



      {/* Content */}
      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
        <h1 className="text-4xl sm:text-5xl lg:text-7xl font-black text-white leading-[1.1] animate-in fade-in slide-in-from-bottom-4 duration-700">
          {title}
        </h1>
        {subtitle && (
          <p className="text-lg sm:text-xl text-white/80 max-w-2xl mx-auto font-medium animate-in fade-in slide-in-from-bottom-6 duration-1000">
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