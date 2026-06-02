import VolunteerDeptDashboard, { type DeptConfig } from '@/components/dept/VolunteerDeptDashboard'
import { Camera } from 'lucide-react'

const cfg: DeptConfig = {
  dept: 'media',
  name: 'Media & Creative',
  nameShort: 'MEDIA & CREATIVE',
  primary: '#7c3aed',
  accent: '#f59e0b',
  gradientTo: '#a855f7',
  bg: '#faf5ff',
  Icon: Camera,
  activityTypes: ['photoshoot', 'video-shoot', 'graphics', 'social-media', 'live-stream', 'training', 'meeting'],
  loginRedirect: '/services/media',
  memberLabel: 'Media Volunteer',
  coordinatorLabel: 'Media Coordinator',
  chatPlaceholder: 'Message the media team…',
}

export default function MediaDashboard() {
  return <VolunteerDeptDashboard cfg={cfg} />
}
