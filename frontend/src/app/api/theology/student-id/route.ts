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
    const body = await request.text()
    const key = request.headers.get('x-api-key') ?? ''
    try {
        const upstream = await fetch(`${BACKEND}/theology/integrations/student-id`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-API-Key': key,
                // Passed through so the backend can de-duplicate retries.
                ...(request.headers.get('idempotency-key')
                    ? { 'Idempotency-Key': request.headers.get('idempotency-key') as string }
                    : {}),
            },
            body,
            signal: AbortSignal.timeout(20_000),
        })
        return new Response(await upstream.text(), {
            status: upstream.status,
            headers: { 'Content-Type': 'application/json' },
        })
    } catch (e) {
        return Response.json(
            { error: `Could not reach the letw.org API: ${(e as Error).message}` },
            { status: 502 },
        )
    }
}

export function GET() {
    return Response.json({ service: 'letw.org Student ID intake', ready: true, method: 'POST' })
}
