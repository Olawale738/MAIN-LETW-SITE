import VolunteerDeptDashboard, { type DeptConfig } from '@/components/dept/VolunteerDeptDashboard'
import { Shield } from 'lucide-react'

const cfg: DeptConfig = {
  dept: 'security',
  name: 'Security & Safety',
  nameShort: 'SECURITY & SAFETY',
  primary: '#374151',
  accent: '#6b7280',
  gradientTo: '#4b5563',
  bg: '#f9fafb',
  Icon: Shield,
  activityTypes: ['duty-shift', 'patrol', 'special-event', 'briefing', 'training', 'incident-review', 'meeting'],
  loginRedirect: '/services/security',
  memberLabel: 'Security Volunteer',
  coordinatorLabel: 'Security Coordinator',
  chatPlaceholder: 'Message the security team…',
}

export default function SecurityDashboard() {
  return <VolunteerDeptDashboard cfg={cfg} />
}
