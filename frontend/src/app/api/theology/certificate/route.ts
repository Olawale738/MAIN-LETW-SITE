/**
 * POST /api/theology/certificate — the letw.org address SharePoints posts an
 * issued certificate to, and every later revocation, restoration or replacement.
 *
 * Same reason as the Student ID receiver next door: SharePoints only calls a
 * URL whose hostname matches its configured letw.org public site, and our API
 * lives on Render under a different hostname. This forwards the call — method,
 * raw body, auth and idempotency headers untouched — and returns the upstream
 * status and JSON verbatim, so the caller sees the real receipt rather than a
 * proxy's opinion of it.
 */
export const runtime = 'nodejs'

const BACKEND = (process.env.NEXT_PUBLIC_API_URL || 'https://letw-backend.onrender.com/api').replace(/\/$/, '')

const FORWARD = [
    'x-api-key',
    'idempotency-key',
    'x-correlation-id',
    'x-letw-signature',
    'x-letw-signature-version',
    'x-letw-timestamp',
    'x-letw-nonce',
    'x-letw-content-sha256',
    'x-letw-source',
]

export async function POST(request: Request) {
    // Read the body as raw text: any re-serialisation would change the bytes a
    // content hash or HMAC was computed over.
    const body = await request.text()

    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    for (const h of FORWARD) {
        const v = request.headers.get(h)
        if (v) headers[h] = v
    }

    try {
        const upstream = await fetch(`${BACKEND}/theology/integrations/certificate`, {
            method: 'POST',
            headers,
            body,
            signal: AbortSignal.timeout(25_000),
        })
        return new Response(await upstream.text(), {
            status: upstream.status,
            headers: { 'Content-Type': 'application/json' },
        })
    } catch (e) {
        // 502, never 200 — a caller must not read a proxy failure as stored.
        return Response.json(
            { received: false, stored: false, error: `Could not reach the letw.org API: ${(e as Error).message}` },
            { status: 502 },
        )
    }
}

export function GET() {
    return Response.json({
        service: 'letw.org theology certificate receiver',
        ready: true,
        method: 'POST',
        credentialType: 'CERTIFICATE',
    })
}
