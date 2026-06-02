import VolunteerDeptDashboard, { type DeptConfig } from '@/components/dept/VolunteerDeptDashboard'
import { Users } from 'lucide-react'

const cfg: DeptConfig = {
  dept: 'ushering',
  name: 'Ushering & Welcome',
  nameShort: 'USHERING & WELCOME',
  primary: '#0369a1',
  accent: '#38bdf8',
  gradientTo: '#0284c7',
  bg: '#f0f9ff',
  Icon: Users,
  activityTypes: ['sunday-service', 'special-event', 'briefing', 'training', 'meeting', 'other'],
  loginRedirect: '/services/ushering',
  memberLabel: 'Usher',
  coordinatorLabel: 'Head Usher',
  chatPlaceholder: 'Message the ushering team…',
}

export default function UsheringDashboard() {
  return <VolunteerDeptDashboard cfg={cfg} />
}
