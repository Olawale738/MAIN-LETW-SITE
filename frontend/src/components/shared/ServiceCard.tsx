import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { ReactNode } from 'react'

interface ServiceCardProps {
  title: string
  description: string
  buttonText: string
  buttonLink: string
  icon?: ReactNode
}

export default function ServiceCard({
  title,
  description,
  buttonText,
  buttonLink,
  icon
}: ServiceCardProps) {
  return (
    <div className="h-full flex flex-col group bg-white rounded-2xl overflow-hidden border border-gray-100 hover:border-[#140152]/20 shadow-sm hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
      {/* Top accent bar that reveals on hover */}
      <div className="h-1 bg-gradient-to-r from-[#140152] to-[#1d0175] transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300" />

      <div className="p-7 flex flex-col flex-1">
        {icon && (
          <div className="w-14 h-14 bg-[#140152]/5 rounded-2xl flex items-center justify-center mb-5 text-[#140152] transition-all duration-300 group-hover:bg-[#140152] group-hover:text-white group-hover:scale-110 group-hover:rotate-3 group-hover:shadow-lg group-hover:shadow-[#140152]/20">
            {icon}
          </div>
        )}
        <h3 className="text-[#140152] text-xl font-bold leading-tight mb-3 group-hover:text-[#1d0175] transition-colors tracking-tight">{title}</h3>
        <p className="text-gray-500 font-medium leading-relaxed text-sm flex-1 mb-6">{description}</p>
        <Link
          href={buttonLink}
          className="inline-flex items-center gap-2 text-sm font-bold text-[#140152] group-hover:gap-3 transition-all"
        >
          <span className="border-b border-[#140152]/30 group-hover:border-[#f5bb00] transition-colors pb-0.5 group-hover:text-[#f5bb00]">
            {buttonText}
          </span>
          <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>
    </div>
  )
}
