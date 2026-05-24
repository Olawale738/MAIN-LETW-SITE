import { ReactNode } from 'react'

interface SectionWrapperProps {
  children: ReactNode
  className?: string
  background?: 'white' | 'gray' | 'dark'
  padding?: 'small' | 'medium' | 'large'
  id?: string
}

export default function SectionWrapper({
  children,
  className = '',
  background = 'white',
  padding = 'large',
  id,
}: SectionWrapperProps) {
  const bgClasses = {
    white: 'bg-white',
    gray: 'bg-[#f8f8fb] border-y border-gray-100',
    dark: 'bg-[#140152] text-white'
  }

  const paddingClasses = {
    small: 'py-10',
    medium: 'py-14',
    large: 'py-20'
  }

  return (
    <section id={id} className={`${bgClasses[background]} ${paddingClasses[padding]} ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {children}
      </div>
    </section>
  )
}