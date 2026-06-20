// RSS 2.0 feed for the Pastor's blog. Lives at /blog/rss.xml (and aliased
// at /rss.xml). Re-validates every 10 min via the Next.js fetch cache.

// `force-dynamic` ensures the route handler always runs at request time
// instead of being treated as a static asset (the `.xml` segment can
// confuse some build pipelines into 404'ing this).
export const dynamic = 'force-dynamic'
export const revalidate = 600

const SITE = 'https://letw.org'
const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'

function esc(s: string): string {
    return (s || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;')
}

function rfc822(date: string | null): string {
    if (!date) return new Date().toUTCString()
    try { return new Date(date).toUTCString() } catch { return new Date().toUTCString() }
}

interface Post {
    id: string
    slug: string
    title: string
    excerpt: string | null
    body_html: string
    author_name: string
    published_at: string | null
    tags: string | null
    hero_image_url: string | null
}

export async function GET() {
    let posts: Post[] = []
    try {
        const res = await fetch(`${API}/blog/posts?limit=40`, { next: { revalidate: 600 } })
        if (res.ok) posts = await res.json()
    } catch { /* fall through with empty feed */ }

    const lastBuild = posts.length > 0 ? rfc822(posts[0].published_at) : new Date().toUTCString()

    const itemsXml = posts.map(p => {
        const url = `${SITE}/blog/${p.slug}`
        const tags = (p.tags || '').split(',').map(t => t.trim()).filter(Boolean)
        return `
    <item>
      <title>${esc(p.title)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <pubDate>${rfc822(p.published_at)}</pubDate>
      <author>noreply@letw.org (${esc(p.author_name)})</author>
      ${tags.map(t => `<category>${esc(t)}</category>`).join('\n      ')}
      <description>${esc(p.excerpt || (p.body_html || '').slice(0, 300))}</description>
      <content:encoded><![CDATA[${p.body_html || ''}]]></content:encoded>
    </item>`
    }).join('')

    const xml = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>LETW · Pastor's Blog</title>
    <link>${SITE}/blog</link>
    <atom:link href="${SITE}/blog/rss.xml" rel="self" type="application/rss+xml" />
    <description>Weekly reflections, devotionals, and pastoral notes from Light Encounter Tabernacle Worldwide.</description>
    <language>en-us</language>
    <lastBuildDate>${lastBuild}</lastBuildDate>
    ${itemsXml}
  </channel>
</rss>`

    return new Response(xml, {
        headers: {
            'Content-Type': 'application/rss+xml; charset=utf-8',
            'Cache-Control': 'public, max-age=0, s-maxage=600, stale-while-revalidate=86400',
        },
    })
}
