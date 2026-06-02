import VolunteerDeptDashboard, { type DeptConfig } from '@/components/dept/VolunteerDeptDashboard'
import { Coffee } from 'lucide-react'

const cfg: DeptConfig = {
  dept: 'hospitality',
  name: 'Hospitality Team',
  nameShort: 'HOSPITALITY TEAM',
  primary: '#b45309',
  accent: '#f59e0b',
  gradientTo: '#d97706',
  bg: '#fffbeb',
  Icon: Coffee,
  activityTypes: ['catering', 'event-setup', 'cleanup', 'welcome-duty', 'meeting', 'training', 'other'],
  loginRedirect: '/services/hospitality',
  memberLabel: 'Hospitality Volunteer',
  coordinatorLabel: 'Hospitality Coordinator',
  chatPlaceholder: 'Message the hospitality team…',
}

export default function HospitalityDashboard() {
  return <VolunteerDeptDashboard cfg={cfg} />
}
