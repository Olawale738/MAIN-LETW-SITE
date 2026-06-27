// Podcast 2.0 RSS feed for sermon audio. Lives at /sermons/podcast.xml so you
// can submit one URL to Apple Podcasts, Spotify, Google Podcasts, Pocket Casts,
// Overcast, etc.

export const dynamic = 'force-dynamic'
export const revalidate = 600

const SITE = 'https://letw.org'
const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'

function esc(s: string): string {
    return (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;')
}
function rfc822(d: string | null | undefined): string {
    if (!d) return new Date().toUTCString()
    try { return new Date(d).toUTCString() } catch { return new Date().toUTCString() }
}

interface Sermon {
    id: string
    title: string
    description: string | null
    preacher: string
    sermon_date: string
    series: string | null
    video_url: string | null
    audio_size: number | null
    audio_mime_type: string | null
    audio_filename: string | null
    created_at: string
}

function fmtTimecode(seconds: number): string {
    // Apple Podcast chapter format expects HH:MM:SS.fff. We don't bother with ms.
    const s = Math.max(0, Math.floor(seconds || 0))
    const hh = String(Math.floor(s / 3600)).padStart(2, '0')
    const mm = String(Math.floor((s % 3600) / 60)).padStart(2, '0')
    const ss = String(s % 60).padStart(2, '0')
    return `${hh}:${mm}:${ss}.000`
}

export async function GET() {
    let sermons: Sermon[] = []
    try {
        const res = await fetch(`${API}/sermons/public?limit=200`, { next: { revalidate: 600 } })
        if (res.ok) {
            const data = await res.json()
            sermons = data.sermons || []
        }
    } catch { /* graceful empty feed */ }

    const lastBuild = sermons.length > 0 ? rfc822(sermons[0].sermon_date) : new Date().toUTCString()

    // Fetch chapter markers for every sermon in parallel. Each call may 404 if
    // automation hasn't been run for that sermon yet — we just skip and emit
    // the item without chapters.
    const chaptersBySermon = new Map<string, { start_seconds: number; title: string }[]>()
    await Promise.all(sermons.map(async s => {
        try {
            const r = await fetch(`${API}/sunday-automation/${s.id}/chapters`, { next: { revalidate: 600 } })
            if (!r.ok) return
            const data = await r.json()
            if (Array.isArray(data?.chapters) && data.chapters.length > 0) {
                chaptersBySermon.set(s.id, data.chapters)
            }
        } catch { /* skip */ }
    }))

    const items = sermons.map(s => {
        const url = `${SITE}/sermons/${s.id}`
        const audioUrl = `${API.replace(/\/api$/, '')}/api/sermons/${s.id}/audio`
        const hasAudio = !!(s.audio_size && s.audio_size > 0)
        const enclosure = hasAudio
            ? `<enclosure url="${audioUrl}" length="${s.audio_size}" type="${s.audio_mime_type || 'audio/mpeg'}" />`
            : ''
        const desc = (s.description || '').slice(0, 800)
        const chapters = chaptersBySermon.get(s.id) || []

        // Chapter markers in two formats:
        //  - Apple Podcasts native (Podcasting 2.0 spec: <psc:chapters>)
        //  - In-text fallback inside the description so clients without
        //    chapter support still see the outline.
        const pscChapters = chapters.length > 0
            ? `<psc:chapters version="1.2">${chapters.map(c =>
                `<psc:chapter start="${fmtTimecode(c.start_seconds)}" title="${esc(c.title || '')}" />`
              ).join('')}</psc:chapters>`
            : ''
        const chapterTextOutline = chapters.length > 0
            ? '\n\nChapters:\n' + chapters.map(c => {
                const m = Math.floor(c.start_seconds / 60)
                const s = c.start_seconds % 60
                return `  ${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}  ${c.title}`
            }).join('\n')
            : ''

        return `
    <item>
      <title>${esc(s.title)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <pubDate>${rfc822(s.sermon_date)}</pubDate>
      <author>noreply@letw.org (${esc(s.preacher)})</author>
      <itunes:author>${esc(s.preacher)}</itunes:author>
      <itunes:summary>${esc(desc)}</itunes:summary>
      <itunes:explicit>false</itunes:explicit>
      ${s.series ? `<itunes:season>1</itunes:season><itunes:episodeType>full</itunes:episodeType>` : ''}
      <description><![CDATA[${desc}${s.video_url ? `\n\nVideo: ${s.video_url}` : ''}${chapterTextOutline}]]></description>
      ${enclosure}
      ${pscChapters}
    </item>`
    }).join('')

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:psc="http://podlove.org/simple-chapters">
  <channel>
    <title>LETW Sermons</title>
    <link>${SITE}/sermons</link>
    <atom:link href="${SITE}/sermons/podcast.xml" rel="self" type="application/rss+xml" />
    <description>Spirit-filled sermons from Light Encounter Tabernacle Worldwide — teaching the Word with simplicity, clarity, and power.</description>
    <language>en-us</language>
    <copyright>© Light Encounter Tabernacle Worldwide</copyright>
    <lastBuildDate>${lastBuild}</lastBuildDate>
    <itunes:author>Light Encounter Tabernacle Worldwide</itunes:author>
    <itunes:owner>
      <itunes:name>LETW</itunes:name>
      <itunes:email>info@letw.org</itunes:email>
    </itunes:owner>
    <itunes:summary>Spirit-filled sermons from Light Encounter Tabernacle Worldwide.</itunes:summary>
    <itunes:category text="Religion &amp; Spirituality">
      <itunes:category text="Christianity" />
    </itunes:category>
    <itunes:explicit>false</itunes:explicit>
    <itunes:image href="${SITE}/logo.png" />
    ${items}
  </channel>
</rss>`

    return new Response(xml, {
        headers: {
            'Content-Type': 'application/rss+xml; charset=utf-8',
            'Cache-Control': 'public, max-age=0, s-maxage=600, stale-while-revalidate=86400',
        },
    })
}
