'use client'
import VolunteerDeptDashboard, { type DeptConfig } from '@/components/dept/VolunteerDeptDashboard'
import { Globe } from 'lucide-react'

const cfg: DeptConfig = {
  dept: 'evangelism',
  name: 'Evangelism Team',
  nameShort: 'EVANGELISM',
  emoji: '📣',
  tagline: 'Share the Gospel and reach souls for Christ with love and boldness.',
  primary: '#dc2626',
  accent: '#ef4444',
  gradientTo: '#991b1b',
  bg: '#fef2f2',
  Icon: Globe,
  activityTypes: ['outreach', 'street-evangelism', 'community-event', 'personal-witness', 'prayer-walk', 'gospel-share', 'follow-up', 'training'],
  loginRedirect: '/services/evangelism',
  memberLabel: 'Evangelism Volunteer',
  coordinatorLabel: 'Evangelism Coordinator',
  chatPlaceholder: 'Message the evangelism team…',
  responsibilities: [
    'Share the Gospel message with people in the community with clarity and compassion',
    'Engage in street evangelism, community outreach, and personal witness opportunities',
    'Participate in scheduled outreach events and prayer walks in the community',
    'Follow up with new believers and connect them with the church',
    'Pray regularly for the lost and intercede for souls to come to Christ',
    'Work with the coordinator to plan and execute evangelistic initiatives',
    'Maintain sensitivity and respect when sharing faith with people of different backgrounds',
  ],
  quickLinks: [
    { label: 'Gospel Resources', href: '/resources' },
    { label: 'Prayer Requests', href: '/prayer-request' },
  ],
}

export default function EvangelismDashboard() {
  return <VolunteerDeptDashboard cfg={cfg} />
}
