import { ReactNode } from 'react'

interface SectionWrapperProps {
  children: ReactNode
  className?: string
  background?: 'white' | 'gray' | 'dark'
  padding?: 'small' | 'medium' | 'large'
}

export default function SectionWrapper({ 
  children, 
  className = '',
  background = 'white',
  padding = 'large'
}: SectionWrapperProps) {
  const bgClasses = {
    white: 'bg-white',
    gray: 'bg-gray-50',
    dark: 'bg-[#140152] text-white'
  }

  const paddingClasses = {
    small: 'py-8',
    medium: 'py-12',
    large: 'py-16'
  }

  return (
    <section className={`${bgClasses[background]} ${paddingClasses[padding]} ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {children}
      </div>
    </section>
  )
}