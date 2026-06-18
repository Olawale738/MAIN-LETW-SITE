'use client'
import { useEffect, useState } from 'react'
import { ShieldCheck } from 'lucide-react'
import { ministryContentApi } from '@/lib/api'

const DEFAULTS = {
    title: 'Privacy Policy',
    last_updated: new Date().toISOString().slice(0, 10),
    body_html: `
<p>Light Encounter Tabernacle Worldwide ("LETW", "we", "our") respects your privacy. This policy explains what we collect, how we use it, and the choices you have.</p>

<h2>What we collect</h2>
<ul>
<li><strong>Account data</strong> — your name and email when you register, plus any profile details you choose to add.</li>
<li><strong>Prayer requests, testimonies, and form submissions</strong> — the content you submit and the time you submitted it.</li>
<li><strong>Giving records</strong> — donation amount, fund, reference, and the email you provided. Card details are handled directly by our payment providers (Paystack, Flutterwave, Stripe) and are not stored on our servers.</li>
<li><strong>Technical data</strong> — IP address, browser type, and pages visited. Used for security and to improve the site.</li>
</ul>

<h2>How we use it</h2>
<ul>
<li>To run the services you ask for (logging you in, processing your gift, confirming bookings).</li>
<li>To send service announcements, newsletters, and welcome emails. You can unsubscribe at any time.</li>
<li>To improve the site and protect it from abuse.</li>
</ul>

<h2>Who we share it with</h2>
<p>We do not sell or rent your data. We share only with the providers necessary to operate the site — Vercel (hosting), Render (backend), Supabase (database), Resend (email), and the payment processor you choose. Each has its own privacy policy.</p>

<h2>Your rights</h2>
<ul>
<li>You can ask for a copy of the data we hold about you.</li>
<li>You can ask us to correct or delete it.</li>
<li>You can withdraw consent for marketing emails at any time using the unsubscribe link.</li>
</ul>
<p>To make any of these requests, email <a href="mailto:privacy@letw.org">privacy@letw.org</a>.</p>

<h2>Cookies</h2>
<p>We use essential cookies to keep you signed in. Analytics cookies are only used if you accept the banner; you can change your mind in your browser.</p>

<h2>Children</h2>
<p>Members under 13 require parental consent to register. We do not knowingly collect data from children under 13 without it.</p>

<h2>Changes to this policy</h2>
<p>We may update this policy occasionally. We will post the new version here with the date of the last update.</p>

<h2>Contact</h2>
<p>Questions? Email <a href="mailto:privacy@letw.org">privacy@letw.org</a> or write to the LETW office.</p>
`.trim(),
}

export default function PrivacyPage() {
    const [c, setC] = useState(DEFAULTS)
    useEffect(() => {
        ministryContentApi.get('privacy-policy')
            .then(r => {
                const x = r.content || {}
                setC({
                    title: x.title || DEFAULTS.title,
                    last_updated: x.last_updated || DEFAULTS.last_updated,
                    body_html: x.body_html || DEFAULTS.body_html,
                })
            })
            .catch(() => { /* defaults stay */ })
    }, [])

    return (
        <main className="min-h-screen bg-[#fbf5e6]">
            <section className="max-w-3xl mx-auto px-4 sm:px-6 pt-24 pb-12 text-center">
                <p className="inline-flex items-center gap-2 text-[#f5bb00] font-bold tracking-[0.3em] text-xs uppercase mb-3"><ShieldCheck className="w-3.5 h-3.5" /> Your privacy</p>
                <h1 className="text-4xl md:text-5xl font-black text-[#140152] leading-tight">{c.title}</h1>
                <p className="text-gray-500 mt-3 text-sm">Last updated: {c.last_updated}</p>
            </section>
            <article className="max-w-3xl mx-auto px-4 sm:px-6 pb-24">
                <div className="bg-white rounded-3xl shadow-xl p-6 sm:p-10 prose prose-lg max-w-none text-gray-800" dangerouslySetInnerHTML={{ __html: c.body_html }} />
            </article>
        </main>
    )
}
