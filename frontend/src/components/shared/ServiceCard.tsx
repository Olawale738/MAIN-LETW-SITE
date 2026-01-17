import Link from 'next/link'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import PremiumButton from '@/components/ui/PremiumButton'
import { ReactNode } from 'react'
import { ArrowRight } from 'lucide-react'

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
    <Card className="h-full flex flex-col group p-2">
      <CardHeader>
        {icon && (
          <div className="w-14 h-14 bg-[#140152]/5 rounded-2xl flex items-center justify-center mb-6 text-[#140152] transition-colors group-hover:bg-[#f5bb00] group-hover:text-[#140152]">
            {icon}
          </div>
        )}
        <CardTitle className="text-[#140152] text-2xl font-black leading-tight group-hover:text-[#f5bb00] transition-colors">{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex-grow">
        <p className="text-[#140152]/60 font-medium leading-relaxed">{description}</p>
      </CardContent>
      <CardFooter className="pt-4">
        <PremiumButton href={buttonLink} className="w-full">
          {buttonText}
        </PremiumButton>
      </CardFooter>
    </Card>
  )
}