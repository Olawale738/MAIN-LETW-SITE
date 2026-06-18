'use client'
import { useEffect, useState } from 'react'
import { Scale } from 'lucide-react'
import { ministryContentApi } from '@/lib/api'

const DEFAULTS = {
    title: 'Terms of Service',
    last_updated: new Date().toISOString().slice(0, 10),
    body_html: `
<p>Welcome to the website of Light Encounter Tabernacle Worldwide ("LETW", "we"). By using letw.org you agree to these terms. Please read them.</p>

<h2>Who can use the site</h2>
<p>The site is open to all who wish to know God or be part of our church family. By creating an account you confirm you are at least 13 years old (or have parental consent), the information you provide is accurate, and you will use the site in good faith.</p>

<h2>Acceptable use</h2>
<ul>
<li>Do not post content that is unlawful, abusive, threatening, deceptive, or that infringes someone else's rights.</li>
<li>Do not impersonate another person.</li>
<li>Do not attempt to break into the site, scrape it at high volume, or interfere with how it runs.</li>
<li>Treat prayer wall posts, chat conversations, and shared spaces with respect.</li>
</ul>

<h2>Your content</h2>
<p>You keep ownership of anything you post (prayer requests, testimonies, photos). By posting, you grant LETW a non-exclusive licence to display it on the site and use it in church communications. You can ask us to remove anything you posted at any time.</p>

<h2>Giving and refunds</h2>
<p>Gifts made through the site are processed by Paystack, Flutterwave, Stripe, or other providers we list on the giving page. Gifts to the church are generally not refundable. If you made a gift by mistake, email <a href="mailto:giving@letw.org">giving@letw.org</a> within 7 days and we will work with you.</p>

<h2>Account suspension</h2>
<p>We may suspend or remove an account that breaks these terms or that puts other members at risk. We will tell you why where appropriate.</p>

<h2>Disclaimers</h2>
<p>The site is provided "as is". We do our best to keep it secure and available, but we cannot guarantee it will always be free of errors or interruptions. The site is not a substitute for emergency services — if you or someone else is in danger, call your local emergency number.</p>

<h2>Limitation of liability</h2>
<p>To the extent permitted by law, LETW is not liable for any indirect or consequential loss arising from your use of the site.</p>

<h2>Changes</h2>
<p>We may update these terms occasionally. The latest version will always live here with the date below. Continuing to use the site after changes means you accept them.</p>

<h2>Governing law</h2>
<p>These terms are governed by the laws of the Federal Republic of Nigeria, unless local law in your jurisdiction requires otherwise.</p>

<h2>Contact</h2>
<p>Questions about these terms? Email <a href="mailto:office@letw.org">office@letw.org</a>.</p>
`.trim(),
}

export default function TermsPage() {
    const [c, setC] = useState(DEFAULTS)
    useEffect(() => {
        ministryContentApi.get('terms-of-service')
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
                <p className="inline-flex items-center gap-2 text-[#f5bb00] font-bold tracking-[0.3em] text-xs uppercase mb-3"><Scale className="w-3.5 h-3.5" /> The fine print</p>
                <h1 className="text-4xl md:text-5xl font-black text-[#140152] leading-tight">{c.title}</h1>
                <p className="text-gray-500 mt-3 text-sm">Last updated: {c.last_updated}</p>
            </section>
            <article className="max-w-3xl mx-auto px-4 sm:px-6 pb-24">
                <div className="bg-white rounded-3xl shadow-xl p-6 sm:p-10 prose prose-lg max-w-none text-gray-800" dangerouslySetInnerHTML={{ __html: c.body_html }} />
            </article>
        </main>
    )
}
