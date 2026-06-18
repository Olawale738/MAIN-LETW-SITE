// Sentry client-side init. Loaded by @sentry/nextjs in the browser.
// DSN comes from NEXT_PUBLIC_SENTRY_DSN env var set in Vercel.
import * as Sentry from '@sentry/nextjs'

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN

if (dsn) {
    Sentry.init({
        dsn,
        environment: process.env.NEXT_PUBLIC_APP_ENV || 'production',
        tracesSampleRate: 0.1,
        // Capture 10% of all sessions, 100% of sessions with an error
        replaysSessionSampleRate: 0.0,
        replaysOnErrorSampleRate: 1.0,
        // Don't send PII by default — privacy-friendly for a church platform
        sendDefaultPii: false,
    })
}
