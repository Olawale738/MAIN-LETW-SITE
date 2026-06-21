/**
 * Registry of every public-facing page on letw.org and how it's edited.
 *
 * Each entry tells admins HOW to edit a page:
 *   - 'cms-blocks'    → uses PageRenderer; full block editor at /admin/pages/{slug}
 *   - 'dedicated'     → has its own admin page (link given)
 *   - 'overlay-only'  → page is mostly hardcoded; admin can still inject CMS blocks
 *                       above/below the existing content via /admin/pages/{slug}
 *
 * Pages with editorKind 'cms-blocks' or 'overlay-only' all funnel into the same
 * generic /admin/pages/{slug} block editor. 'dedicated' pages link off to a
 * purpose-built editor.
 */

export type EditorKind = 'cms-blocks' | 'dedicated' | 'overlay-only'

export interface PublicPage {
    slug: string                // CMS slug + URL path (without leading /)
    title: string               // Human-readable label
    path: string                // Public URL (with leading /)
    category: 'Home' | 'About' | 'Ministries' | 'Engage' | 'Resources' | 'Account' | 'Other'
    editorKind: EditorKind
    editorHref?: string         // override the default /admin/pages/{slug} link
    notes?: string              // shown in the admin index as a hint
}

export const PUBLIC_PAGES: PublicPage[] = [
    // Home & primary
    { slug: 'home',          title: 'Home',                path: '/',                  category: 'Home',       editorKind: 'cms-blocks' },
    { slug: 'about',         title: 'About',               path: '/about',             category: 'About',      editorKind: 'cms-blocks' },
    { slug: 'impact',        title: 'Our Impact',          path: '/impact',            category: 'About',      editorKind: 'cms-blocks' },
    { slug: 'sunday-service', title: 'Sunday Service',     path: '/services/sunday-service', category: 'Ministries', editorKind: 'cms-blocks' },
    { slug: 'evangelism',    title: 'Evangelism',          path: '/evangelism',        category: 'Ministries', editorKind: 'cms-blocks' },

    // Pages with dedicated editors
    { slug: 'testimony',     title: 'Testimony',           path: '/testimony',         category: 'Engage',     editorKind: 'dedicated', editorHref: '/admin/testimony-page', notes: 'Edit every section + manage approved testimonies.' },
    { slug: 'giving',        title: 'Giving (legacy)',     path: '/giving',            category: 'Engage',     editorKind: 'dedicated', editorHref: '/admin/giving-content', notes: 'Edit copy on the Giving page.' },
    { slug: 'leadership',    title: 'Leadership',          path: '/leadership',        category: 'About',      editorKind: 'dedicated', editorHref: '/admin/leadership-content', notes: 'Edit leadership profiles.' },
    { slug: 'statement-of-faith-section', title: 'Statement of Faith (on /about)', path: '/about#beliefs', category: 'About', editorKind: 'dedicated', editorHref: '/admin/statement-of-faith', notes: 'Articles & public visibility toggle.' },
    { slug: 'prayer',        title: 'Prayer',              path: '/prayer',            category: 'Engage',     editorKind: 'dedicated', editorHref: '/admin/prayer-content', notes: 'Hero, pillars, schedules — all sections.' },
    { slug: 'live',          title: 'Global Live',         path: '/live',              category: 'Engage',     editorKind: 'dedicated', editorHref: '/admin/online-campus', notes: 'Schedule services, social links, go live.' },
    { slug: 'sermons',       title: 'Sermons',             path: '/sermons',           category: 'Resources',  editorKind: 'dedicated', editorHref: '/admin/sermons', notes: 'Add/edit sermons + library.' },
    { slug: 'events',        title: 'Events',              path: '/events',            category: 'Resources',  editorKind: 'dedicated', editorHref: '/admin/events', notes: 'Add/edit events.' },
    { slug: 'blog',          title: "Pastor's Blog",       path: '/blog',              category: 'Resources',  editorKind: 'dedicated', editorHref: '/admin/blog', notes: 'Manage blog posts.' },
    { slug: 'outcomes',      title: 'Kingdom Outcomes',    path: '/outcomes',          category: 'Engage',     editorKind: 'dedicated', editorHref: '/admin/decisions', notes: 'Record salvations, baptisms, healings.' },
    { slug: 'missions',      title: 'Missions',            path: '/missions',          category: 'Ministries', editorKind: 'dedicated', editorHref: '/admin/missionaries', notes: 'Manage missionaries.' },
    { slug: 'apps',          title: 'Church Apps',         path: '/apps',              category: 'Resources',  editorKind: 'overlay-only' },

    // Hardcoded — inject CMS blocks above/below via overlay
    { slug: 'contact',       title: 'Contact',             path: '/contact',           category: 'Engage',     editorKind: 'overlay-only' },
    { slug: 'give',          title: 'Give',                path: '/give',              category: 'Engage',     editorKind: 'overlay-only' },
    { slug: 'join',          title: 'Become a Member',     path: '/join',              category: 'Engage',     editorKind: 'overlay-only' },
    { slug: 'prayer-request', title: 'Prayer Request',     path: '/prayer-request',    category: 'Engage',     editorKind: 'overlay-only' },
    { slug: 'counselling',   title: 'Counselling',         path: '/counselling',       category: 'Engage',     editorKind: 'overlay-only' },
    { slug: 'newsletter',    title: 'Newsletter',          path: '/newsletter',        category: 'Engage',     editorKind: 'overlay-only' },
    { slug: 'onboarding',    title: 'Welcome Flow',        path: '/onboarding',        category: 'Engage',     editorKind: 'overlay-only' },
    { slug: 'ministries',    title: 'Ministries',          path: '/ministries',        category: 'Ministries', editorKind: 'overlay-only' },
    { slug: 'men',           title: "Men's Ministry",      path: '/men',               category: 'Ministries', editorKind: 'overlay-only', editorHref: '/admin/men-content' },
    { slug: 'children',      title: "Children's Ministry", path: '/children',          category: 'Ministries', editorKind: 'overlay-only' },
    { slug: 'discipleship',  title: 'Discipleship',        path: '/discipleship',      category: 'Ministries', editorKind: 'overlay-only' },
    { slug: 'pathway',       title: 'Pathway',             path: '/pathway',           category: 'Ministries', editorKind: 'overlay-only' },
    { slug: 'lent',          title: 'Lent',                path: '/lent',              category: 'Ministries', editorKind: 'overlay-only' },
    { slug: 'charity',       title: 'Charity',             path: '/charity',           category: 'Ministries', editorKind: 'overlay-only' },
    { slug: 'life-events',   title: 'Life Events (Wedding · Baptism · Dedication)', path: '/life-events', category: 'Engage', editorKind: 'overlay-only' },
    { slug: 'education',     title: 'Education',           path: '/education',         category: 'Resources',  editorKind: 'overlay-only' },
    { slug: 'theology-school', title: 'Theology School',   path: '/theology-school',   category: 'Resources',  editorKind: 'overlay-only' },
    { slug: 'bible-study',   title: 'Bible Study',         path: '/bible-study',       category: 'Resources',  editorKind: 'overlay-only' },
    { slug: 'bible-reading', title: 'Bible Reading Plans', path: '/bible-reading',     category: 'Resources',  editorKind: 'overlay-only' },
    { slug: 'career-guidance', title: 'Career Guidance',   path: '/career-guidance',   category: 'Resources',  editorKind: 'overlay-only' },
    { slug: 'skill-development', title: 'Skill Development', path: '/skill-development', category: 'Resources', editorKind: 'overlay-only' },
    { slug: 'download',      title: 'Downloads',           path: '/download',          category: 'Resources',  editorKind: 'dedicated', editorHref: '/admin/downloads', notes: 'Upload PDFs / docs / audio / video / paste external links.' },
    { slug: 'privacy',       title: 'Privacy Policy',      path: '/privacy',           category: 'Account',    editorKind: 'dedicated', editorHref: '/admin/legal', notes: 'Edit at Legal Pages.' },
    { slug: 'intercessor',   title: 'Intercessor Portal',  path: '/intercessor',       category: 'Account',    editorKind: 'overlay-only' },
]

export function pageEditorHref(p: PublicPage): string {
    return p.editorHref || `/admin/pages/${p.slug}`
}
