// Next.js instrumentation hook — loads the right Sentry config per runtime.
// Auto-detected by Next.js on app start (no manual wiring needed).
export async function register() {
    if (process.env.NEXT_RUNTIME === 'nodejs') {
        await import('./sentry.server.config')
    }
    if (process.env.NEXT_RUNTIME === 'edge') {
        await import('./sentry.edge.config')
    }
}

export const onRequestError = async (err: unknown, request: any, context: any) => {
    const { captureRequestError } = await import('@sentry/nextjs')
    return captureRequestError(err, request, context)
}
