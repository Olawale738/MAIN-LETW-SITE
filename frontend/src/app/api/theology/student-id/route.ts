/**
 * POST /api/theology/student-id — the letw.org address SharePoints posts an
 * issued Student ID to.
 *
 * SharePoints will only call a URL whose hostname matches its configured
 * letw.org public site (www.letw.org), and our API lives on Render under a
 * different hostname. Rather than making the school office maintain a second
 * environment variable, this forwards the call — headers and body untouched —
 * to the backend, which does the authentication.
 */
export const runtime = 'nodejs'

const BACKEND = (process.env.NEXT_PUBLIC_API_URL || 'https://letw-backend.onrender.com/api').replace(/\/$/, '')

export async function POST(request: Request) {
    // Raw text, never re-serialised: any change to the bytes would invalidate a
    // content hash or HMAC computed over them.
    const body = await request.text()

    const FORWARD = [
        'x-api-key', 'idempotency-key', 'x-correlation-id',
        'x-letw-signature', 'x-letw-signature-version', 'x-letw-timestamp',
        'x-letw-nonce', 'x-letw-content-sha256', 'x-letw-source',
    ]
    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    for (const h of FORWARD) {
        const v = request.headers.get(h)
        if (v) headers[h] = v
    }
    try {
        const upstream = await fetch(`${BACKEND}/theology/integrations/student-id`, {
            method: 'POST',
            headers,
            body,
            signal: AbortSignal.timeout(20_000),
        })
        return new Response(await upstream.text(), {
            status: upstream.status,
            headers: { 'Content-Type': 'application/json' },
        })
    } catch (e) {
        return Response.json(
            { received: false, stored: false, error: `Could not reach the letw.org API: ${(e as Error).message}` },
            { status: 502 },
        )
    }
}

export function GET() {
    return Response.json({ service: 'letw.org Student ID intake', ready: true, method: 'POST' })
}
