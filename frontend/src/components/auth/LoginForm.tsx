import React, { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { authApi, tokenManager, wakeBackend } from '@/lib/api'
import { Loader2, AlertCircle, RefreshCw } from 'lucide-react'

export default function LoginForm() {
    const router = useRouter()
    const searchParams = useSearchParams()
    // Two names are in use across the app ('redirect' and 'next'); honour both.
    // Only same-site relative paths — a full URL here would be an open redirect.
    const requested = searchParams.get('redirect') || searchParams.get('next') || ''
    const redirectPath = /^\/(?!\/)/.test(requested) ? requested : '/dashboard'

    const [formData, setFormData] = useState({ email: '', password: '' })
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [waking, setWaking] = useState(false)
    const [serverReady, setServerReady] = useState<boolean | null>(null)

    // Pre-warm Render the moment the login page loads so the backend is
    // awake by the time the user finishes typing their password.
    // Cached per browser tab so we don't ping repeatedly.
    useEffect(() => {
        try {
            if (sessionStorage.getItem('auth-prewarmed') === '1') { setServerReady(true); return }
        } catch { /* noop */ }
        let alive = true
        wakeBackend(60_000).then(ok => {
            if (!alive) return
            setServerReady(ok)
            if (ok) { try { sessionStorage.setItem('auth-prewarmed', '1') } catch { /* noop */ } }
        })
        return () => { alive = false }
    }, [])

    const doLogin = async () => {
        const response = await authApi.login({ email: formData.email, password: formData.password })
        tokenManager.saveTokens(response)
        let finalRedirect = redirectPath
        try {
            const user = await authApi.getCurrentUser()
            localStorage.setItem('userName', user.name)
            localStorage.setItem('userEmail', user.email)
            if (user.role === 'admin') finalRedirect = '/admin'
        } catch (error) {
            console.error('Failed to fetch user details', error)
        }
        window.location.href = finalRedirect
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError('')

        try {
            await doLogin()
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : 'Login failed. Please try again.'
            // Cold-start case: backend was asleep and didn't wake in time
            if (/couldn'?t reach the server|failed to fetch/i.test(errorMessage)) {
                setLoading(false); setWaking(true)
                const ok = await wakeBackend(75_000)
                setWaking(false)
                if (ok) {
                    setLoading(true)
                    try { await doLogin(); return }
                    catch (e2) {
                        setError((e2 instanceof Error ? e2.message : 'Login failed.'))
                    } finally { setLoading(false) }
                } else {
                    setError("Backend still not responding after 75 seconds. Try again in a moment.")
                }
                return
            }
            setError(errorMessage)
        } finally {
            setLoading(false)
        }
    }

    const wakeRetry = async () => {
        setError(''); setWaking(true)
        const ok = await wakeBackend(75_000)
        setWaking(false)
        if (ok) {
            setLoading(true)
            try { await doLogin() }
            catch (e) { setError((e instanceof Error ? e.message : 'Login failed.')) }
            finally { setLoading(false) }
        } else {
            setError("Backend still not responding after 75 seconds.")
        }
    }

    return (
        <div className="w-full">
            {/* Subtle status pill so the user knows what's happening before they submit */}
            {serverReady === null && !error && (
                <div className="bg-gray-50 border border-gray-200 text-gray-600 px-3 py-2 rounded-lg mb-3 text-xs inline-flex items-center gap-1.5">
                    <Loader2 className="w-3 h-3 animate-spin" /> Preparing the server (one-time wake-up)…
                </div>
            )}
            {waking && (
                <div className="bg-amber-50 border border-amber-200 text-amber-900 px-4 py-3 rounded-xl mb-4 text-sm inline-flex items-start gap-2">
                    <Loader2 className="w-4 h-4 animate-spin mt-0.5 flex-shrink-0" />
                    <div>
                        <p className="font-bold">Waking the server…</p>
                        <p className="text-xs mt-0.5">Render free-tier cold start — up to 60 seconds. We&apos;ll log you in automatically once it&apos;s awake.</p>
                    </div>
                </div>
            )}
            {error && !waking && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-4 text-sm">
                    <div className="flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                            <p>{error}</p>
                            {/couldn'?t reach|failed to fetch|not responding/i.test(error) && (
                                <button onClick={wakeRetry} type="button"
                                    className="mt-2 inline-flex items-center gap-1.5 bg-red-700 hover:bg-red-800 text-white text-xs font-bold px-3 py-1.5 rounded-lg">
                                    <RefreshCw className="w-3.5 h-3.5" /> Wake server &amp; try again
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700">Email Address</label>
                    <input
                        required
                        type="email"
                        className="w-full p-3 border border-gray-200 rounded-lg bg-gray-50 focus:bg-white text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-[#140152] focus:border-transparent transition-all"
                        placeholder="you@example.com"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700">Password</label>
                    <input
                        required
                        type="password"
                        className="w-full p-3 border border-gray-200 rounded-lg bg-gray-50 focus:bg-white text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-[#140152] focus:border-transparent transition-all"
                        placeholder="••••••••"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    />
                </div>

                <div className="flex justify-end">
                    <Link
                        href="/auth/forgot-password"
                        className="text-sm text-[#140152] hover:text-[#f5bb00] transition-colors"
                    >
                        Forgot password?
                    </Link>
                </div>

                <Button
                    type="submit"
                    disabled={loading}
                    className="w-full py-6 text-lg bg-[#140152] hover:bg-[#1d0175] text-white mt-2 shadow-lg shadow-indigo-900/20"
                >
                    {loading ? (
                        <>
                            <Loader2 className="w-5 h-5 animate-spin mr-2" />
                            Signing In...
                        </>
                    ) : (
                        'Sign In'
                    )}
                </Button>
            </form>

            <p className="text-center text-sm text-gray-500 mt-8">
                Don&apos;t have an account? <Link href="/auth/register" className="text-[#140152] font-semibold hover:text-[#f5bb00] transition-colors">Register</Link>
            </p>
        </div>
    )
}

