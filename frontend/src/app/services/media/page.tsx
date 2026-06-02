import VolunteerDeptDashboard, { type DeptConfig } from '@/components/dept/VolunteerDeptDashboard'
import { Camera } from 'lucide-react'

const cfg: DeptConfig = {
  dept: 'media',
  name: 'Media & Creative',
  nameShort: 'MEDIA & CREATIVE',
  emoji: '🎬',
  tagline: 'Every frame we capture carries eternity.',
  primary: '#7c3aed',
  accent: '#a855f7',
  gradientTo: '#6d28d9',
  bg: '#faf5ff',
  Icon: Camera,
  activityTypes: ['photoshoot', 'video-shoot', 'graphics', 'social-media', 'live-stream', 'training', 'meeting'],
  loginRedirect: '/services/media',
  memberLabel: 'Media Volunteer',
  coordinatorLabel: 'Media Coordinator',
  chatPlaceholder: 'Message the media team…',
  responsibilities: [
    'Capture photos and videos during church services, events, and outreach activities',
    'Design graphics for social media posts, announcements, and banners',
    'Manage and operate the live-stream setup for Sunday services',
    'Maintain and organise the church media archive and asset library',
    'Create compelling content that reflects the church\'s values and vision',
    'Collaborate with other departments to document their activities',
  ],
  quickLinks: [
    { label: 'Church Social Media', href: 'https://instagram.com' },
    { label: 'Google Drive (Media Assets)', href: 'https://drive.google.com' },
  ],
}

export default function MediaDashboard() {
  return <VolunteerDeptDashboard cfg={cfg} />
}
