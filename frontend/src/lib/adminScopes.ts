/**
 * Maps admin routes → permission scopes.
 *
 * Full admins see everything. Moderators and deputy admins see only the areas
 * an admin has granted them. Anything NOT in this map is treated as
 * admin-only (default deny) — the safe default for a permission system.
 */
export const ROUTE_SCOPES: Record<string, string> = {
    // Communication
    '/admin/announcements': 'announcements',
    '/admin/chat': 'chat',
    '/admin/newsletter': 'newsletter',
    '/admin/welcome-flow': 'welcome_flow',
    // Worship & teaching
    '/admin/alter-sound': 'alter_sound',
    '/admin/bible-study': 'bible_study',
    '/admin/daily-verse': 'daily_verse',
    '/admin/live-stream': 'live_stream',
    '/admin/prayer': 'prayer',
    '/admin/intercessors': 'prayer',
    '/admin/sermons': 'sermons',
    // Ministries
    '/admin/children-checkin': 'children',
    '/children/coordinator': 'children',
    '/admin/coordinators': 'coordinators',
    '/admin/discipleship': 'discipleship',
    '/admin/leadership': 'leadership',
    '/admin/leadership-content': 'leadership',
    '/admin/men': 'men',
    '/admin/ministries': 'ministries',
    '/admin/theology-school': 'theology',
    '/admin/volunteer-departments': 'volunteer_depts',
    '/admin/women': 'women',
    '/admin/youth': 'youth',
    '/youth/coordinator': 'youth',
    // People
    '/admin/approvals': 'approvals',
    '/admin/counselling': 'counselling',
    '/admin/evangelism-signups': 'evangelism_signups',
    '/admin/life-events': 'life_events',
    '/admin/nominations': 'nominations',
    '/admin/service-requests': 'service_requests',
    '/admin/volunteers': 'volunteers',
    '/admin/volunteer-rota': 'volunteers',
    '/admin/volunteer-page': 'volunteers',
    '/dashboard/volunteer': 'volunteers',
    // Events & content
    '/admin/career': 'career',
    '/admin/events': 'events',
    '/admin/pages': 'pages',
    '/admin/page-copy': 'pages',
    '/admin/site-content': 'pages',
    '/admin/skills': 'skills',
    // Site
    '/admin/branding': 'branding',
    '/admin/giving-content': 'giving_content',
    '/admin/statement-of-faith': 'statement_of_faith',
    // Giving
    '/admin/donations': 'donations',
    '/admin/payments': 'payments',
    // Oversight & newer areas
    '/admin/analytics': 'analytics',
    '/admin/marriage-prep': 'marriage_prep',
    '/admin/evangelism-leaflets': 'evangelism_leaflets',
    '/admin/blog': 'blog',
    '/admin/sanctuary': 'sanctuary',
    '/admin/sms': 'sms',
    '/admin/integrations': 'integrations',
    '/admin/users': 'users',
}

/** The dashboard home is always visible to anyone who can open /admin. */
const ALWAYS_ALLOWED = new Set(['/admin'])

/** Longest-prefix match so nested routes inherit their section's scope. */
export function scopeForHref(href: string): string | null {
    if (ALWAYS_ALLOWED.has(href)) return null
    if (ROUTE_SCOPES[href]) return ROUTE_SCOPES[href]
    let best: string | null = null
    let bestLen = 0
    for (const [route, scope] of Object.entries(ROUTE_SCOPES)) {
        if (href.startsWith(route + '/') && route.length > bestLen) { best = scope; bestLen = route.length }
    }
    return best
}

/** Can this user open the given admin route? */
export function canAccess(href: string, isAdmin: boolean, scopes: string[]): boolean {
    if (isAdmin || scopes.includes('*')) return true
    if (ALWAYS_ALLOWED.has(href)) return true
    const scope = scopeForHref(href)
    return scope ? scopes.includes(scope) : false   // unmapped ⇒ admin-only
}
