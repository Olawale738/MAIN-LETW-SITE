import Link from 'next/link'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import PremiumButton from '@/components/ui/PremiumButton'
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
    <Card className="h-full flex flex-col group p-2 border-none shadow-xl hover:shadow-xl transition-all duration-300 bg-white rounded-2xl overflow-hidden hover:-translate-y-1">
      <CardHeader className="pt-6 px-6">
        {icon && (
          <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mb-4 text-[#140152] transition-all duration-300 group-hover:bg-[#140152] group-hover:text-white group-hover:scale-110 shadow-sm group-hover:shadow-md">
            {icon}
          </div>
        )}
        <CardTitle className="text-[#140152] text-xl font-bold leading-tight group-hover:text-blue-700 transition-colors tracking-tight">{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex-grow px-6 pb-2">
        <p className="text-gray-500 font-medium leading-relaxed text-sm">{description}</p>
      </CardContent>
      <CardFooter className="pt-2 px-6 pb-6">
        <PremiumButton href={buttonLink} className="justify-center text-sm">
          {buttonText}
        </PremiumButton>
      </CardFooter>
    </Card>
  )
}