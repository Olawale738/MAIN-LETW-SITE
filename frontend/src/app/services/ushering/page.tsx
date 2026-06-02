'use client'
import VolunteerDeptDashboard, { type DeptConfig } from '@/components/dept/VolunteerDeptDashboard'
import { Users } from 'lucide-react'

const cfg: DeptConfig = {
  dept: 'ushering',
  name: 'Ushering & Welcome',
  nameShort: 'USHERING & WELCOME',
  emoji: '🤝',
  tagline: 'Your smile is the first sermon they experience.',
  primary: '#0369a1',
  accent: '#0284c7',
  gradientTo: '#075985',
  bg: '#f0f9ff',
  Icon: Users,
  activityTypes: ['sunday-service', 'special-event', 'conference', 'briefing', 'training', 'welfare-check', 'meeting'],
  loginRedirect: '/services/ushering',
  memberLabel: 'Usher',
  coordinatorLabel: 'Head Usher',
  chatPlaceholder: 'Message the ushering team…',
  responsibilities: [
    'Welcome and direct all members and visitors as they arrive at church services',
    'Maintain orderly seating, distribute programmes, and manage crowd flow',
    'Monitor exits, entrances, and aisles throughout the service for safety',
    'Assist latecomers to seats without disrupting the service in progress',
    'Take up offering in a dignified and organised manner as directed',
    'Stay alert, professional, and approachable for the entire service duration',
  ],
  quickLinks: [
    { label: 'Service Schedule', href: '/services/sunday-service' },
  ],
}

export default function UsheringDashboard() {
  return <VolunteerDeptDashboard cfg={cfg} />
}
