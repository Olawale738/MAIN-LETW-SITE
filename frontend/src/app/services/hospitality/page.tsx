'use client'
import VolunteerDeptDashboard, { type DeptConfig } from '@/components/dept/VolunteerDeptDashboard'
import { Coffee } from 'lucide-react'

const cfg: DeptConfig = {
  dept: 'hospitality',
  name: 'Hospitality Team',
  nameShort: 'HOSPITALITY TEAM',
  emoji: '☕',
  tagline: 'Where every person feels welcomed and valued.',
  primary: '#b45309',
  accent: '#d97706',
  gradientTo: '#92400e',
  bg: '#fffbeb',
  Icon: Coffee,
  activityTypes: ['catering', 'event-setup', 'cleanup', 'welcome-duty', 'fellowship', 'training', 'meeting'],
  loginRedirect: '/services/hospitality',
  memberLabel: 'Hospitality Volunteer',
  coordinatorLabel: 'Hospitality Coordinator',
  chatPlaceholder: 'Message the hospitality team…',
  responsibilities: [
    'Set up and prepare refreshments, meals, and dining areas before services and events',
    'Welcome visitors, guests, and members with a warm and friendly atmosphere',
    'Coordinate food drives, fellowship meals, and community outreach catering',
    'Manage supplies, inventory, and kitchen hygiene in line with health standards',
    'Assist with clean-up and restore all hospitality areas after every event',
    'Plan and execute special hospitality for conferences, guests, and church celebrations',
  ],
  quickLinks: [
    { label: 'Event Calendar', href: '/events' },
  ],
}

export default function HospitalityDashboard() {
  return <VolunteerDeptDashboard cfg={cfg} />
}
