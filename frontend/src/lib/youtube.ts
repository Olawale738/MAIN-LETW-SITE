/**
 * Convert any common YouTube URL into the embeddable form.
 *
 * YouTube blocks iframe loads of /watch?v= URLs with X-Frame-Options DENY
 * — only /embed/ URLs are allowed. This helper normalises every URL admins
 * might paste (full watch URL, short youtu.be link, raw video id, an existing
 * embed URL) so the live stream iframe always works.
 *
 * Non-YouTube URLs (Vimeo, Mux, m3u8, etc.) pass through unchanged.
 */
const YT_ID_RE = /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/

export function toEmbedUrl(url: string | null | undefined, opts?: { autoplay?: boolean }): string {
    if (!url) return ''
    const trimmed = url.trim()
    if (!trimmed) return ''

    const m = trimmed.match(YT_ID_RE)
    if (!m) {
        // Possibly a bare 11-char video id?
        if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
            const params = opts?.autoplay ? '?autoplay=1' : ''
            return `https://www.youtube.com/embed/${trimmed}${params}`
        }
        return trimmed   // non-YouTube source — return as-is
    }
    const id = m[1]
    const params = new URLSearchParams()
    if (opts?.autoplay) params.set('autoplay', '1')
    // Quality-of-life: hide the related-videos overlay & branding.
    params.set('rel', '0')
    params.set('modestbranding', '1')
    return `https://www.youtube.com/embed/${id}?${params.toString()}`
}

export function isYouTubeUrl(url: string | null | undefined): boolean {
    if (!url) return false
    return YT_ID_RE.test(url) || /^[a-zA-Z0-9_-]{11}$/.test(url.trim())
}
