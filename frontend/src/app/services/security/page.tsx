'use client'
import VolunteerDeptDashboard, { type DeptConfig } from '@/components/dept/VolunteerDeptDashboard'
import { Shield } from 'lucide-react'

const cfg: DeptConfig = {
  dept: 'security',
  name: 'Security & Safety',
  nameShort: 'SECURITY & SAFETY',
  emoji: '🛡️',
  tagline: 'Protecting God\'s house so His people can worship freely.',
  primary: '#374151',
  accent: '#4b5563',
  gradientTo: '#1f2937',
  bg: '#f9fafb',
  Icon: Shield,
  activityTypes: ['duty-shift', 'patrol', 'special-event', 'briefing', 'training', 'incident-review', 'drill', 'meeting'],
  loginRedirect: '/services/security',
  memberLabel: 'Security Volunteer',
  coordinatorLabel: 'Security Coordinator',
  chatPlaceholder: 'Message the security team…',
  responsibilities: [
    'Monitor entrances, exits, and the church perimeter before, during, and after services',
    'Ensure only authorised individuals access restricted areas of the premises',
    'Identify and de-escalate potential conflicts or disturbances in a calm, firm manner',
    'Coordinate emergency procedures including evacuation plans and first-aid response',
    'Maintain a duty log and report any incidents to the Security Coordinator promptly',
    'Dress professionally and conduct yourself as a representative of the church at all times',
  ],
  quickLinks: [
    { label: 'Emergency Contacts', href: '/contact' },
  ],
}

export default function SecurityDashboard() {
  return <VolunteerDeptDashboard cfg={cfg} />
}
