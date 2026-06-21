import { Block } from './api';

export const DEFAULT_HOME_BLOCKS: Block[] = [
    {
        id: 'home-slider',
        type: 'hero-slider',
        data: {
            autoplay: true,
            interval: 6,
            height: 'tall',
            slides: [
                {
                    eyebrow: "Welcome to LETW",
                    title: "Encounter the <span style='color:#f5bb00;'>Light</span> of God",
                    subtitle: "A worldwide family where the Word of God is taught with simplicity, clarity, and power. Come as you are - leave forever changed.",
                    bg_image: "/9.png",
                    cta_text: "Plan to Become Our Member",
                    cta_link: "/join",
                    cta2_text: "Watch Live",
                    cta2_link: "/sermons",
                    align: 'center'
                },
                {
                    eyebrow: "Sunday Gatherings",
                    title: "Come and <span style='color:#f5bb00;'>Worship</span> With Us",
                    subtitle: "Experience Spirit-filled worship and life-changing teaching that meets you exactly where you are.",
                    bg_image: "https://images.unsplash.com/photo-1493836512294-502baa1986e2?w=1600&q=80",
                    cta_text: "Plan Your Sunday",
                    cta_link: "/services/sunday-service",
                    cta2_text: "Our Services",
                    cta2_link: "/services",
                    align: 'center'
                },
                {
                    eyebrow: "Your Purpose",
                    title: "Discover Your <span style='color:#f5bb00;'>Destiny</span>",
                    subtitle: "From discipleship to outreach, find your place in a community committed to raising you into the fullness of God's purpose.",
                    bg_image: "https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=1600&q=80",
                    cta_text: "Explore Ministries",
                    cta_link: "/services",
                    cta2_text: "Give",
                    cta2_link: "/giving",
                    align: 'center'
                }
            ]
        }
    },
    {
        id: 'home-actions',
        type: 'button-group',
        data: {
            bg_color: 'dark',
            title: "How Can We Help You Today?",
            subtitle: "Take your next step with us.",
            buttons: [
                { text: "Become a Member", link: "/join", type: 'solid' },
                { text: "Prayer Request", link: "/prayer-request", type: 'solid' },
                { text: "Watch Sermons", link: "/sermons", type: 'solid' },
                { text: "Give", link: "/giving", type: 'solid' }
            ]
        }
    },
    {
        id: 'home-marquee',
        type: 'scripture-marquee',
        data: {
            bg: 'brand',
            speed: 8,
            verses: [
                { text: "For with You is the fountain of life; in Your light we see light.", reference: "Psalm 36:9" },
                { text: "You are the light of the world. A town built on a hill cannot be hidden.", reference: "Matthew 5:14" },
                { text: "Let your light shine before others, that they may see your good deeds and glorify your Father in heaven.", reference: "Matthew 5:16" }
            ]
        }
    },
    {
        id: 'home-services',
        type: 'service-times',
        data: {
            title: "When We Gather",
            subtitle: "There's a seat saved for you. Join us in person or online.",
            bg: 'brand',
            location: "",
            map_link: "",
            services: [
                { day: "Sunday", time: "9:00 AM", title: "Sunday Service", description: "Our main worship gathering - Spirit-filled praise and life-giving teaching for the whole family." },
                { day: "Wednesday", time: "6:00 PM", title: "Bible Study", description: "Mid-week deep-dive into the Word, with prayer and practical application." },
                { day: "Friday", time: "6:00 PM", title: "Prayer Meeting", description: "Stand in faith together - corporate prayer that moves heaven and shifts atmospheres." }
            ]
        }
    },
    {
        id: 'home-welcome',
        type: 'content',
        data: {
            title: "We Are More Than <br /><span style='color:#f5bb00;'>A Church</span>",
            content: `
                <p class="text-lg text-gray-600 leading-relaxed font-medium mb-4">We are a movement - built on unshakeable faith, genuine love, and sacrificial service. Light Encounter Tabernacle exists to awaken destinies, restore the broken, and release people into the fullness of God's purpose through the living, life-changing power of His Word.</p>
                <p class="text-lg text-gray-600 leading-relaxed font-medium">Every message preached, every hand extended, every life touched is a declaration that God's light is real and His Kingdom is advancing - one transformed life at a time.</p>
            `,
            width: 'standard',
            bg_color: 'white',
            padding: 'medium'
        }
    },
    {
        id: 'home-video',
        type: 'video',
        data: {
            title: "A Word From Our Founder",
            subtitle: "Apostle Olawale N. Sanni shares the heart of Light Encounter Tabernacle.",
            url: "",
            aspect: '16:9',
            bg: 'gray'
        }
    },
    {
        id: 'home-founder',
        type: 'content',
        data: {
            title: "Meet Apostle Olawale N. Sanni",
            content: `
                <div class="grid md:grid-cols-2 gap-10 items-center max-w-5xl mx-auto">
                    <div class="rounded-3xl overflow-hidden shadow-2xl ring-1 ring-black/5">
                        <img src="/Founder.png" alt="Apostle Olawale N. Sanni" class="w-full h-auto object-cover" />
                    </div>
                    <div>
                        <p class="text-xs font-bold uppercase tracking-[0.3em] text-[#f5bb00] mb-3">Founder &amp; President</p>
                        <h3 class="text-3xl font-black text-[#140152] mb-4">Apostle Olawale N. Sanni</h3>
                        <p class="text-lg text-gray-600 leading-relaxed mb-4">Carrying a deep mandate to awaken destinies and release people into God's purpose, Apostle Olawale leads Light Encounter Tabernacle with a heart aflame for the gospel and a passion for genuine, transformative discipleship.</p>
                        <a href="/about" class="inline-flex items-center gap-2 bg-[#140152] hover:bg-[#1d0175] text-white font-bold px-6 py-3 rounded-full transition-all hover:scale-105">Read Our Story →</a>
                    </div>
                </div>
            `,
            width: 'wide',
            bg_color: 'white',
            padding: 'medium'
        }
    },
    {
        id: 'discover-features',
        type: 'features',
        data: {
            title: "Discover Your Place",
            subtitle: "Ministries &amp; Pathways",
            columns: 3,
            style: 'cards',
            features: [
                { title: "Worship & Music", description: "Lift your voice with our worship and Alter Sound ministry.", image: "https://images.unsplash.com/photo-1493836512294-502baa1986e2?w=800&q=80" },
                { title: "Bible Study", description: "Go deeper in the Word through our reading plans and study groups.", image: "https://images.unsplash.com/photo-1438232992991-995b7058bbb3?w=800&q=80" },
                { title: "Prayer", description: "Stand in faith with a community devoted to fervent, believing prayer.", image: "https://images.unsplash.com/photo-1545987796-200677ee1011?w=800&q=80" },
                { title: "Youth Ministry", description: "A vibrant space for the next generation to know and follow Jesus.", image: "https://images.unsplash.com/photo-1529070538774-1843cb3265df?w=800&q=80" },
                { title: "Children's Ministry", description: "Safe, fun, and faith-filled ministry for our youngest hearts.", image: "https://images.unsplash.com/photo-1559027615-cd4628902d4a?w=800&q=80" },
                { title: "Evangelism", description: "Carry the light beyond our walls to a world that needs hope.", image: "https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?w=800&q=80" }
            ]
        }
    },
    {
        id: 'home-gallery',
        type: 'gallery',
        data: {
            title: "Glimpses of Glory",
            subtitle: "A walk through our journey of worship, fellowship, and Kingdom impact.",
            layout: 'marquee',
            bg: 'white',
            images: [
                { src: "https://images.unsplash.com/photo-1438232992991-995b7058bbb3?w=900&q=80", caption: "Worship" },
                { src: "https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=900&q=80", caption: "Fellowship" },
                { src: "https://images.unsplash.com/photo-1493836512294-502baa1986e2?w=900&q=80", caption: "Praise" },
                { src: "https://images.unsplash.com/photo-1517677208171-0bc6725a3e60?w=900&q=80", caption: "Together" },
                { src: "https://images.unsplash.com/photo-1545987796-200677ee1011?w=900&q=80", caption: "Prayer" },
                { src: "https://images.unsplash.com/photo-1529070538774-1843cb3265df?w=900&q=80", caption: "Outreach" }
            ]
        }
    },
    {
        id: 'latest-sermons',
        type: 'sermon-list',
        data: { title: "Latest Sermons", count: 3 }
    },
    {
        id: 'upcoming-events',
        type: 'upcoming-events',
        data: { title: "Upcoming Events", count: 3 }
    },
    {
        id: 'home-newsletter',
        type: 'newsletter',
        data: {
            title: "Stay Connected",
            subtitle: "Get weekly devotionals, sermon highlights, and church updates straight to your inbox.",
            button_text: "Subscribe",
            bg: 'brand'
        }
    },
    {
        id: 'home-cta',
        type: 'cta',
        data: {
            title: "Ready to Take Your Next Step?",
            text: "Whether it's your very first visit or your forever church home, there's a place for you. Join us this week and encounter the light of God.",
            button_text: "Plan to Become Our Member",
            button_link: "/join",
            bg_image: "/9.png",
            style: 'banner'
        }
    }
];

export const DEFAULT_ABOUT_BLOCKS: Block[] = [
    // ── 1. Cinematic single hero ─────────────────────────────────────────
    {
        id: 'about-hero',
        type: 'hero',
        data: {
            title: "More Than a Building.<br /><span style='color:#f5bb00;'>A Family.</span>",
            subtitle: "We are a worldwide community awakening destinies, restoring the broken, and releasing every soul into the fullness of God's purpose.",
            bg_image: "https://images.unsplash.com/photo-1517842645767-c639042777db?w=1800&q=80",
            cta_text: "Come Visit Us",
            cta_link: "/contact",
            align: 'center'
        }
    },

    // ── 2. Mission Manifesto Band — bold full-width statement ───────────
    {
        id: 'about-manifesto',
        type: 'content',
        data: {
            title: "",
            content: `
                <div class="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#140152] via-[#1a0270] to-[#0d0138] p-10 md:p-16 text-center">
                    <div class="absolute -top-16 -right-16 w-72 h-72 rounded-full bg-[#f5bb00]/15 blur-3xl pointer-events-none"></div>
                    <div class="absolute -bottom-16 -left-16 w-72 h-72 rounded-full bg-[#7c3aed]/20 blur-3xl pointer-events-none"></div>
                    <div class="relative max-w-3xl mx-auto">
                        <p style="font-size:0.75rem;letter-spacing:0.35em;font-weight:800;text-transform:uppercase;color:#f5bb00;margin-bottom:1.5rem;">Our Manifesto</p>
                        <p style="font-family:'Cormorant Garamond','Playfair Display',Georgia,serif;font-style:italic;font-size:clamp(1.75rem, 3.5vw, 2.75rem);line-height:1.25;color:#ffffff;font-weight:600;">We exist to <span style="color:#f5bb00;">awaken destinies</span>, restore what was broken, and release every soul into the <span style="color:#f5bb00;">fullness of God's purpose</span> — through the living, life-changing power of His Word.</p>
                        <div class="mt-10 flex flex-wrap justify-center gap-8 text-white">
                            <div><p style="font-size:2rem;font-weight:900;color:#f5bb00;">Awaken.</p></div>
                            <div><p style="font-size:2rem;font-weight:900;color:#f5bb00;">Restore.</p></div>
                            <div><p style="font-size:2rem;font-weight:900;color:#f5bb00;">Release.</p></div>
                        </div>
                    </div>
                </div>
            `,
            width: 'wide',
            bg_color: 'white',
            padding: 'medium'
        }
    },

    // ── 3. The Founder's Heart — cinematic asymmetric layout ────────────
    {
        id: 'about-founder',
        type: 'content',
        data: {
            title: "",
            content: `
                <div class="grid md:grid-cols-12 gap-10 items-center max-w-6xl mx-auto">
                    <div class="md:col-span-5 relative">
                        <div class="rounded-[2rem] overflow-hidden shadow-2xl ring-1 ring-black/5">
                            <img src="/Founder.png" alt="Apostle Olawale N. Sanni" style="width:100%;height:auto;display:block;" />
                        </div>
                        <div class="absolute -bottom-5 -right-5 hidden md:flex items-center justify-center w-24 h-24 rounded-2xl bg-[#f5bb00] text-[#140152] font-black text-sm tracking-wider rotate-6 shadow-xl">
                            FOUNDER<br/>& PRESIDENT
                        </div>
                    </div>
                    <div class="md:col-span-7">
                        <p style="font-size:0.75rem;letter-spacing:0.35em;font-weight:800;text-transform:uppercase;color:#f5bb00;margin-bottom:0.75rem;">The Heart Behind the House</p>
                        <h2 style="font-size:clamp(2rem,4vw,3rem);font-weight:900;color:#140152;line-height:1.1;margin-bottom:1.5rem;">Apostle Olawale N. Sanni</h2>
                        <div class="relative pl-6 border-l-4 border-[#f5bb00]">
                            <p style="font-family:'Cormorant Garamond',Georgia,serif;font-style:italic;font-size:1.4rem;line-height:1.5;color:#140152;">"My burden has never been to gather a crowd. My burden is to raise sons and daughters of light — people whose lives carry heaven into every place they walk."</p>
                        </div>
                        <p class="mt-6 text-base text-gray-600 leading-relaxed">Carrying a deep mandate to awaken destinies and release people into God's purpose, Apostle Olawale leads Light Encounter Tabernacle with a heart aflame for the gospel and a tireless passion for genuine, transformative discipleship.</p>
                    </div>
                </div>
            `,
            width: 'wide',
            bg_color: 'white',
            padding: 'medium'
        }
    },

    // ── 3b. Our Mission & Vision — clearly labeled, side-by-side cards ──
    {
        id: 'about-mission-vision',
        type: 'content',
        data: {
            title: "",
            content: `
                <div class="max-w-6xl mx-auto">
                    <div class="text-center mb-12">
                        <p style="font-size:0.75rem;letter-spacing:0.35em;font-weight:800;text-transform:uppercase;color:#f5bb00;margin-bottom:0.75rem;">Who We Are · Where We're Going</p>
                        <h2 style="font-size:clamp(2rem,4vw,3rem);font-weight:900;color:#140152;line-height:1.1;">Our Mission &amp; Vision</h2>
                        <div style="margin:1.5rem auto 0;height:6px;width:6rem;border-radius:9999px;background:linear-gradient(to right,#140152,#7c3aed,#f5bb00);"></div>
                    </div>

                    <div class="grid md:grid-cols-2 gap-6 md:gap-8">
                        <!-- OUR MISSION -->
                        <div class="relative group rounded-3xl bg-white border border-gray-100 shadow-lg p-8 md:p-10 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 overflow-hidden">
                            <div style="position:absolute;top:0;left:0;right:0;height:6px;background:linear-gradient(to right,#140152,#7c3aed);"></div>
                            <div style="position:absolute;top:-30px;right:-30px;width:140px;height:140px;border-radius:9999px;background:rgba(124,58,237,0.08);pointer-events:none;"></div>
                            <div style="display:inline-flex;align-items:center;justify-content:center;width:64px;height:64px;border-radius:18px;background:linear-gradient(135deg,#140152,#7c3aed);box-shadow:0 14px 30px rgba(20,1,82,0.25);margin-bottom:1.25rem;">
                                <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#f5bb00" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>
                            </div>
                            <p style="font-size:0.7rem;letter-spacing:0.35em;font-weight:800;text-transform:uppercase;color:#7c3aed;margin-bottom:0.5rem;">Our Mission</p>
                            <h3 style="font-size:1.75rem;font-weight:900;color:#140152;margin-bottom:1rem;line-height:1.2;">What we are sent to do.</h3>
                            <p style="font-size:1.0625rem;line-height:1.7;color:#4a4a64;">To <strong style="color:#140152;">awaken destinies</strong>, restore what is broken, and release every soul into the <strong style="color:#140152;">fullness of God's purpose</strong> — through the living power of His Word, Spirit-filled worship, and the genuine love of His family.</p>
                        </div>

                        <!-- OUR VISION -->
                        <div class="relative group rounded-3xl bg-white border border-gray-100 shadow-lg p-8 md:p-10 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 overflow-hidden">
                            <div style="position:absolute;top:0;left:0;right:0;height:6px;background:linear-gradient(to right,#f5bb00,#ffd633);"></div>
                            <div style="position:absolute;top:-30px;right:-30px;width:140px;height:140px;border-radius:9999px;background:rgba(245,187,0,0.12);pointer-events:none;"></div>
                            <div style="display:inline-flex;align-items:center;justify-content:center;width:64px;height:64px;border-radius:18px;background:linear-gradient(135deg,#f5bb00,#d97706);box-shadow:0 14px 30px rgba(245,187,0,0.35);margin-bottom:1.25rem;">
                                <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#140152" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/></svg>
                            </div>
                            <p style="font-size:0.7rem;letter-spacing:0.35em;font-weight:800;text-transform:uppercase;color:#d97706;margin-bottom:0.5rem;">Our Vision</p>
                            <h3 style="font-size:1.75rem;font-weight:900;color:#140152;margin-bottom:1rem;line-height:1.2;">Where we are headed.</h3>
                            <p style="font-size:1.0625rem;line-height:1.7;color:#4a4a64;">A worldwide community of believers <strong style="color:#140152;">walking in the light of God</strong> — a people who carry heaven into every home, marketplace, and nation, raising the next generation to <strong style="color:#140152;">shine brighter than the last</strong>.</p>
                        </div>
                    </div>

                    <!-- The three Mission verbs as a quiet anchor under the cards -->
                    <div class="mt-10 flex flex-wrap items-center justify-center gap-x-10 gap-y-2 text-center">
                        <p style="font-size:0.7rem;letter-spacing:0.35em;font-weight:800;text-transform:uppercase;color:#140152;opacity:0.5;">In Three Words</p>
                        <p style="font-family:'Cormorant Garamond',Georgia,serif;font-style:italic;font-size:1.5rem;font-weight:600;color:#140152;">Awaken. Restore. Release.</p>
                    </div>
                </div>
            `,
            width: 'wide',
            bg_color: 'gray',
            padding: 'medium'
        }
    },

    // ── 4. Vertical Story Timeline ──────────────────────────────────────
    {
        id: 'about-timeline',
        type: 'timeline',
        data: {
            eyebrow: 'A Journey of Faith',
            title: 'Our Story',
            subtitle: 'Every chapter has been written by grace.',
            bg: 'brand',
            milestones: [
                { year: 'The Spark',  title: 'A Vision Was Birthed', description: 'Born of a single, burning conviction: that the light of God is meant to be carried into the darkest places. Out of prayer, a movement began.', image: 'https://images.unsplash.com/photo-1438232992991-995b7058bbb3?w=1100&q=80' },
                { year: 'First Gathering', title: 'The Family Begins',       description: 'A small group of hungry hearts answered the call — hungry for God, hungry for purpose, hungry for impact.',                                  image: '' },
                { year: 'Built On The Word', title: 'Anchored, Unmovable',  description: 'We chose then, and choose every day since, to stand firmly on the uncompromised Word of God — preaching the gospel boldly, raising disciples intentionally.', image: 'https://images.unsplash.com/photo-1545987796-200677ee1011?w=1100&q=80' },
                { year: 'A Worldwide Family', title: 'Light Goes Beyond Walls', description: 'What began in one city now reaches lives across cities and nations — through teaching, outreach, and a community of carriers of the Light.', image: 'https://images.unsplash.com/photo-1529070538774-1843cb3265df?w=1100&q=80' },
                { year: 'Today', title: 'And the Story Continues',           description: 'Every day a new heart is touched, a new destiny awakens, a new chapter is written. We are still being written into His story.', image: '' }
            ]
        }
    },

    // ── 5. What Defines Us — 6 Pillars (premium animated) ──────────────
    {
        id: 'about-pillars',
        type: 'features',
        data: {
            title: "What Defines Us",
            subtitle: "Our DNA",
            columns: 3,
            style: 'pillars',
            features: [
                { title: "Christ-Centered",      description: "Jesus is the center of everything we are and everything we do.",                       icon: "Crown" },
                { title: "Word-Anchored",        description: "We stand firmly on the uncompromised, life-giving Word of God.",                       icon: "BookOpen" },
                { title: "Spirit-Empowered",     description: "We depend on the Holy Spirit to lead, teach, and empower us daily.",                    icon: "Flame" },
                { title: "Family-Hearted",       description: "Every person is known, valued, and loved — never just a number in a crowd.",           icon: "HandHeart" },
                { title: "Kingdom-Minded",       description: "We carry the gospel beyond our walls into homes, streets, schools, and nations.",      icon: "Globe" },
                { title: "Excellence-Driven",    description: "We give God our very best — in worship, in serving, in stewardship.",                  icon: "Sparkles" }
            ]
        }
    },

    // ── 6. Statement of Faith ──────────────────────────────────────────
    {
        id: 'about-beliefs',
        type: 'features',
        data: {
            title: "What We Believe",
            subtitle: "Our Statement of Faith",
            columns: 3,
            style: 'icons',
            features: [
                { title: "The Word of God",      description: "The Bible is the inspired, infallible, and authoritative Word of God — our guide for faith and living.",          icon: "BookOpen" },
                { title: "Jesus Christ",         description: "Salvation is a gift of grace through faith in Jesus Christ alone — fully God, fully man, crucified and risen.",    icon: "Cross" },
                { title: "The Holy Spirit",      description: "The Holy Spirit empowers every believer for holy living, gifts, and bold witness.",                                 icon: "Flame" },
                { title: "The Trinity",          description: "One God eternally existing in three persons — Father, Son, and Holy Spirit.",                                       icon: "Sparkles" },
                { title: "The Church",           description: "The body of Christ on earth — a family commissioned to make disciples of all nations.",                             icon: "Users" },
                { title: "The Return of Christ", description: "Jesus will return personally and visibly to gather His own and reign forever.",                                      icon: "Sunrise" }
            ]
        }
    },

    // ── 7. A single bold scripture — DIFFERENT from homepage marquee ───
    {
        id: 'about-scripture',
        type: 'scripture',
        data: {
            verse: "By this everyone will know that you are my disciples, if you love one another.",
            reference: "John 13:35",
            context: "Our Calling",
            bg: 'gold',
            align: 'center'
        }
    },

    // ── 8. Vision Going Forward — bold full-bleed dark band ────────────
    {
        id: 'about-vision',
        type: 'content',
        data: {
            title: "",
            content: `
                <div class="relative overflow-hidden rounded-3xl bg-gradient-to-br from-black via-[#0d0138] to-[#140152] px-6 md:px-16 py-16 md:py-24 text-center">
                    <div class="absolute top-1/2 -translate-y-1/2 left-1/2 -translate-x-1/2 w-[140%] h-[140%] rounded-full bg-[radial-gradient(closest-side,rgba(245,187,0,0.18),transparent_70%)] pointer-events-none"></div>
                    <div class="relative max-w-3xl mx-auto">
                        <p style="font-size:0.75rem;letter-spacing:0.35em;font-weight:800;text-transform:uppercase;color:#f5bb00;margin-bottom:1rem;">Where We Are Headed</p>
                        <h2 style="font-size:clamp(2.25rem,5vw,4rem);font-weight:900;color:#ffffff;line-height:1.05;margin-bottom:2rem;">A people of <span style="color:#f5bb00;">light</span>, sent into every <span style="color:#f5bb00;">darkness</span>.</h2>
                        <p style="font-size:1.125rem;line-height:1.7;color:rgba(255,255,255,0.8);">Our prayer for the road ahead is simple and unshakeable: that every life we touch would carry the light of God further than we ever could — into homes, communities, marketplaces, and nations. Every soul matters. Every story counts. The story continues.</p>
                    </div>
                </div>
            `,
            width: 'wide',
            bg_color: 'white',
            padding: 'medium'
        }
    },

    // ── 9. Closing Invitation — DIFFERENT CTA from homepage ────────────
    {
        id: 'about-invite',
        type: 'cta',
        data: {
            title: "Come See For Yourself",
            text: "The best way to know who we are is to meet us. Come visit, ask anything, and let's get to know each other — face to face.",
            button_text: "Plan a Visit",
            button_link: "/contact",
            bg_image: "/9.png",
            style: 'banner'
        }
    }
];

export const DEFAULT_IMPACT_BLOCKS: Block[] = [
    {
        id: 'impact-hero',
        type: 'hero',
        data: {
            title: "",
            subtitle: "",
            bg_image: "/Impact.png",
            align: 'center'
        }
    },
    {
        id: 'impact-stats',
        type: 'features',
        data: {
            title: "Our Impact",
            style: 'icons',
            columns: 4,
            features: [
                { title: "Lives Touched", description: "10,000+", icon: "Users" },
                { title: "Communities", description: "15", icon: "Globe" },
                { title: "Missions", description: "50+", icon: "ExternalLink" },
                { title: "Volunteers", description: "500+", icon: "Heart" }
            ]
        }
    },
    {
        id: 'impact-areas',
        type: 'features',
        data: {
            title: "Areas of Impact",
            columns: 2,
            style: 'cards',
            features: [
                { title: "Community Outreach", description: "Providing food, clothing, and essential supplies to families in need within our local community.", image: "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=800" },
                { title: "Global Missions", description: "Partnering with churches and organizations worldwide to spread the Gospel.", image: "https://images.unsplash.com/photo-1526976668912-1a811878dd37?w=800" },
                { title: "Youth Empowerment", description: "Mentoring the next generation through education, skill acquisition, and leadership training.", image: "https://images.unsplash.com/photo-1529390003875-5fd77b6580f5?w=800" },
                { title: "Medical Missions", description: "Providing free medical checkups and basic healthcare support to underserved areas.", image: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800" }
            ]
        }
    },
    {
        id: 'partner-cta',
        type: 'cta',
        data: {
            title: "Partner With Us",
            text: "Your generosity fuels these initiatives. When you give, you are not just donating; you are feeding the hungry, healing the sick, and equipping the next generation.",
            button_text: "Give to Missions",
            button_link: "/giving",
            style: 'simple'
        }
    }
];

export const DEFAULT_SUNDAY_SERVICE_BLOCKS: Block[] = [
    {
        id: 'sunday-hero',
        type: 'hero',
        data: {
            title: "Sunday <span class='text-[#f5bb00]'>Worship</span> Service",
            subtitle: "Join us every Sunday at 9:00 AM at our Main Campus for a powerful time of worship and word.",
            cta_text: "Watch Latest Sermons",
            cta_link: "/sermons",
            align: 'center',
            bg_image: "https://images.unsplash.com/photo-1438232992991-995b7058bbb3?w=1200"
        }
    },
    {
        id: 'service-info',
        type: 'features',
        data: {
            title: "What to Expect",
            subtitle: "Come as you are and experience God's presence",
            columns: 3,
            style: 'cards',
            features: [
                {
                    title: "Worship",
                    description: "Uplifting contemporary worship that leads into the presence of God.",
                    icon: "Music"
                },
                {
                    title: "The Word",
                    description: "Practical, biblical teaching that empowers you for daily living.",
                    icon: "BookOpen"
                },
                {
                    title: "Kids Ministry",
                    description: "Fun, safe, and engaging biblical learning for children of all ages.",
                    icon: "Smile"
                }
            ]
        }
    },
    {
        id: 'service-resources',
        type: 'features',
        data: {
            title: "Service Resources",
            subtitle: "Enhance your worship experience with these materials",
            columns: 3,
            style: 'cards',
            features: [
                {
                    title: "Weekly Bulletin",
                    description: "Download this week's bulletin to stay updated with church announcements and events.",
                    icon: "FileText",
                    link: "/download/bulletin"
                },
                {
                    title: "Sermon Notes",
                    description: "Follow along with the message using our interactive sermon notes.",
                    icon: "PenTool",
                    link: "/sermons/notes"
                },
                {
                    title: "First Time Guest?",
                    description: "Complete our connection card so we can welcome you properly.",
                    icon: "Heart",
                    link: "/connect"
                }
            ]
        }
    },
    {
        id: 'sunday-cta',
        type: 'cta',
        data: {
            title: "Plan Your Visit",
            text: "We can't wait to welcome you home. Let us know you're coming!",
            button_text: "Get Directions",
            button_link: "/contact",
            style: 'simple'
        }
    }
];

// ─── Evangelism Page Defaults ─────────────────────────────────────────────────

export const DEFAULT_EVANGELISM_BLOCKS: Block[] = [
    {
        id: 'evang-hero',
        type: 'hero',
        data: {
            title: "Go Into All The World",
            subtitle: "LETW's Great Commission — reaching every soul with the life-changing power of the Gospel.",
            bg_image: "https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=1600&auto=format&fit=crop&q=80",
            cta_text: "Join an Outreach",
            cta_link: "#get-involved",
            align: 'center'
        }
    },
    {
        id: 'evang-scripture',
        type: 'scripture',
        data: {
            verse: "Therefore go and make disciples of all nations, baptizing them in the name of the Father and of the Son and of the Holy Spirit, and teaching them to obey everything I have commanded you. And surely I am with you always, to the very end of the age.",
            reference: "Matthew 28:19–20",
            context: "The Great Commission",
            bg: 'brand',
            align: 'center'
        }
    },
    {
        id: 'evang-stats',
        type: 'stats',
        data: {
            title: "Lives Touched by the Gospel",
            subtitle: "Our Impact",
            bg: 'brand',
            stats: [
                { label: "Souls Reached", value: "5,000+", icon: "🙏" },
                { label: "Outreaches Held", value: "200+", icon: "📢" },
                { label: "Communities Served", value: "50+", icon: "🏘️" },
                { label: "Nations Praying", value: "12+", icon: "🌍" }
            ]
        }
    },
    {
        id: 'evang-mission',
        type: 'content',
        data: {
            title: "Our Evangelism Mission",
            content: `
                <p class="text-lg text-gray-600 leading-relaxed mb-5">
                    At Light Encounter Tabernacle Worldwide, evangelism is not a programme — it is a lifestyle. We believe every believer is called to be a witness, and every moment is an opportunity to share the life-changing message of Jesus Christ.
                </p>
                <p class="text-lg text-gray-600 leading-relaxed mb-5">
                    From the streets of our local communities to the digital spaces we occupy, we carry the Gospel with boldness, compassion, and love. Our evangelism teams go where people are — in the markets, on campuses, in homes, and online — so that no one is left without hearing the Good News.
                </p>
                <p class="text-xl font-semibold text-[#140152] leading-relaxed italic">
                    "We preach not ourselves, but Christ Jesus as Lord." — 2 Corinthians 4:5
                </p>
            `,
            width: 'standard',
            bg_color: 'white',
            padding: 'large'
        }
    },
    {
        id: 'evang-approach',
        type: 'features',
        data: {
            title: "How We Share the Gospel",
            subtitle: "Our Evangelism Approaches",
            columns: 3,
            style: 'cards',
            features: [
                {
                    title: "Street & Community Outreach",
                    description: "Our teams take to the streets — parks, markets, and public spaces — proclaiming the Gospel boldly and lovingly to those who have never heard.",
                    icon: "MapPin",
                    image: "https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?w=800&auto=format&fit=crop&q=60"
                },
                {
                    title: "One-on-One Conversations",
                    description: "Personal, heart-to-heart sharing of the Good News. We equip every member to share their faith naturally in everyday encounters.",
                    icon: "MessageCircle",
                    image: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=800&auto=format&fit=crop&q=60"
                },
                {
                    title: "Compassion-Driven Outreach",
                    description: "Meeting physical needs — food, clothing, hygiene — as a bridge to spiritual truth. We show the love of Christ before we speak it.",
                    icon: "Heart",
                    image: "https://images.unsplash.com/photo-1559027615-cd4628902d4a?w=800&auto=format&fit=crop&q=60"
                },
                {
                    title: "Campus & Youth Evangelism",
                    description: "Reaching the next generation where they study, socialise, and dream. We partner with schools and universities to plant the seed of faith.",
                    icon: "BookOpen",
                    image: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=800&auto=format&fit=crop&q=60"
                },
                {
                    title: "Digital & Online Evangelism",
                    description: "Using social media, live streams, and digital content to reach people in their homes and across the world with the Gospel 24/7.",
                    icon: "Globe",
                    image: "https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?w=800&auto=format&fit=crop&q=60"
                },
                {
                    title: "Follow-Up & Discipleship",
                    description: "We don't just lead people to Christ — we walk with them. Our follow-up teams ensure new believers are nurtured and connected to the church.",
                    icon: "Users",
                    image: "https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=800&auto=format&fit=crop&q=60"
                }
            ]
        }
    },
    {
        id: 'evang-schedule',
        type: 'content',
        data: {
            title: "Outreach Schedule",
            content: `
                <div class="grid md:grid-cols-2 gap-8">
                    <div class="bg-[#140152]/5 rounded-2xl p-6">
                        <h3 class="text-xl font-black text-[#140152] mb-4 flex items-center gap-2">📅 Weekly Outreaches</h3>
                        <ul class="space-y-3">
                            <li class="flex items-start gap-3"><span class="w-24 shrink-0 font-bold text-[#140152] text-sm">Saturday</span><span class="text-gray-600 text-sm">Community street outreach — 9:00 AM</span></li>
                            <li class="flex items-start gap-3"><span class="w-24 shrink-0 font-bold text-[#140152] text-sm">Sunday</span><span class="text-gray-600 text-sm">Post-service outreach — after main service</span></li>
                            <li class="flex items-start gap-3"><span class="w-24 shrink-0 font-bold text-[#140152] text-sm">Wednesday</span><span class="text-gray-600 text-sm">Online/social media evangelism team</span></li>
                        </ul>
                        <p class="text-xs text-gray-400 mt-4">📍 Meeting point announced weekly — contact us for details</p>
                    </div>
                    <div class="bg-[#f5bb00]/10 rounded-2xl p-6">
                        <h3 class="text-xl font-black text-[#140152] mb-4 flex items-center gap-2">🗓️ Special Events</h3>
                        <ul class="space-y-3">
                            <li class="flex items-start gap-3"><span class="w-24 shrink-0 font-bold text-[#140152] text-sm">Monthly</span><span class="text-gray-600 text-sm">Community compassion day — food & prayer</span></li>
                            <li class="flex items-start gap-3"><span class="w-24 shrink-0 font-bold text-[#140152] text-sm">Quarterly</span><span class="text-gray-600 text-sm">Campus evangelism blitz</span></li>
                            <li class="flex items-start gap-3"><span class="w-24 shrink-0 font-bold text-[#140152] text-sm">Annual</span><span class="text-gray-600 text-sm">Open-air crusade & missions trip</span></li>
                        </ul>
                        <p class="text-xs text-gray-400 mt-4">✉️ Sign up below to be notified of upcoming events</p>
                    </div>
                </div>
            `,
            width: 'wide',
            bg_color: 'light',
            padding: 'large'
        }
    },
    {
        id: 'evang-testimonies',
        type: 'testimonies',
        data: {
            title: "Stories of Transformation",
            subtitle: "Changed Lives",
            style: 'grid',
            bg: 'brand',
            testimonies: [
                {
                    quote: "I was walking past a LETW outreach team when one of them stopped to speak with me. That conversation changed the course of my entire life. I gave my heart to Jesus that day and have never looked back.",
                    name: "Emmanuel O.",
                    location: "Community Outreach, Lagos",
                    avatar: "🙌"
                },
                {
                    quote: "I had lost all hope. A team member knocked on my door during a compassion outreach, and for the first time in years someone sat with me and prayed. God answered. My family is restored.",
                    name: "Grace A.",
                    location: "Home Outreach",
                    avatar: "🌟"
                },
                {
                    quote: "I found LETW through a social media post. I watched a live stream at midnight, desperate and alone. I prayed the prayer at the end of that video and everything changed. I'm now part of this amazing church family.",
                    name: "David M.",
                    location: "Online Outreach",
                    avatar: "💻"
                }
            ]
        }
    },
    {
        id: 'evang-resources',
        type: 'features',
        data: {
            title: "Gospel Resources",
            subtitle: "Share the Good News",
            columns: 3,
            style: 'icons',
            features: [
                {
                    title: "How to Share Your Faith",
                    description: "A simple, practical guide for sharing the Gospel in everyday conversations — even if you're new to evangelism.",
                    icon: "MessageCircle",
                    link: "/evangelism#how-to-share"
                },
                {
                    title: "The Roman Road",
                    description: "Key scriptures from Romans that walk someone through the Gospel message in a clear, simple way. Download or memorise.",
                    icon: "BookOpen",
                    link: "/evangelism#roman-road"
                },
                {
                    title: "Prayer for Salvation",
                    description: "Lead someone in a simple prayer to receive Jesus Christ as Lord and Saviour. Words matter — use this as a guide.",
                    icon: "Heart",
                    link: "/prayer-request"
                },
                {
                    title: "Digital Gospel Tract",
                    description: "Share our digital gospel tract on WhatsApp, Instagram, and social media. One share could change a life forever.",
                    icon: "Share2",
                    link: "/evangelism#digital-tract"
                },
                {
                    title: "Invite a Friend",
                    description: "The simplest form of evangelism — invite someone to church. Download our invitation card to share online or in person.",
                    icon: "UserPlus",
                    link: "/join"
                },
                {
                    title: "Contact Our Team",
                    description: "Have questions about evangelism? Want to join a specific outreach? Our evangelism coordinator is ready to help you get started.",
                    icon: "Phone",
                    link: "/contact"
                }
            ]
        }
    },
    {
        id: 'evang-cta-join',
        type: 'cta',
        data: {
            title: "Ready to Go? Join Our Outreach Team",
            text: "You don't need to be a theologian. You just need a willing heart. Fill in the form below and we'll connect you with the right outreach team for your schedule and gifting.",
            button_text: "Sign Up to Serve",
            button_link: "#get-involved",
            style: 'banner',
            bg_image: "https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?w=1600&auto=format&fit=crop&q=60"
        }
    },
    {
        id: 'evang-prayer-cta',
        type: 'cta',
        data: {
            title: "Do You Have Someone to Pray For?",
            text: "Submit a prayer request for a loved one who needs to encounter Jesus. Our evangelism intercessors will pray specifically for them.",
            button_text: "Submit a Prayer Request",
            button_link: "/prayer-request",
            style: 'simple'
        }
    }
];

// ─── Download Page Defaults ───────────────────────────────────────────────────

export const DEFAULT_DOWNLOAD_BLOCKS: Block[] = [
    {
        id: 'dl-hero',
        type: 'hero',
        data: {
            title: "Free Resources",
            subtitle: "Download sermons, devotionals, study guides, and worship resources for your spiritual journey.",
            bg_image: "https://images.unsplash.com/photo-1457369804613-52c61a468e7d?w=1600&q=80",
            cta_text: "Browse Resources",
            cta_link: "#resources",
            align: 'center',
            height: 'tall',
        }
    },
    {
        id: 'dl-features',
        type: 'features',
        data: {
            title: "What You Can Download",
            subtitle: "Curated content to grow your faith on your own time.",
            columns: 3,
            style: 'cards',
            features: [
                { title: "Sermon Audio", description: "MP3 recordings of every Sunday and midweek message — listen anywhere, anytime.", icon: "Mic", link: "/sermons" },
                { title: "E-books & Study Guides", description: "Topical studies, devotionals, and discipleship guides authored by our pastoral team.", icon: "BookOpen" },
                { title: "Weekly Bulletins", description: "This week's announcements, prayer points, and Bible reading plan — PDF format.", icon: "FileText" },
                { title: "Worship Music", description: "Songs from our worship team — MP3 downloads + lyric sheets.", icon: "Music" },
                { title: "Video Teachings", description: "Sermon videos, conference messages, and teaching series in MP4 format.", icon: "Video" },
                { title: "Devotional Articles", description: "Short reads to start your day with the Word — fresh content every week.", icon: "Newspaper" },
            ]
        }
    },
    {
        id: 'dl-cta',
        type: 'cta',
        data: {
            title: "Get every new resource in your inbox",
            text: "Subscribe to our newsletter and be the first to know when new sermons, devotionals, and bulletins drop.",
            button_text: "Subscribe Free",
            button_link: "/newsletter",
            style: 'simple'
        }
    },
];

// ─── Onboarding Page Defaults ─────────────────────────────────────────────────

export const DEFAULT_ONBOARDING_BLOCKS: Block[] = [
    {
        id: 'onb-hero',
        type: 'hero',
        data: {
            title: "Welcome to the Family",
            subtitle: "Five short steps to make LETW your home. Start where you are, finish closer to Jesus.",
            bg_image: "https://images.unsplash.com/photo-1529070538774-1843cb3265df?w=1600&q=80",
            cta_text: "Begin Step 1",
            cta_link: "#step-1",
            align: 'center',
            height: 'tall',
        }
    },
    {
        id: 'onb-stats',
        type: 'stats',
        data: {
            title: "You're Joining Something Real",
            subtitle: "A growing worldwide family rooted in the Word of God.",
            stats: [
                { value: "10K+", label: "Members worldwide" },
                { value: "50+", label: "Countries reached" },
                { value: "5K+", label: "Lives transformed" },
                { value: "24/7", label: "Prayer coverage" },
            ]
        }
    },
    {
        id: 'onb-steps',
        type: 'features',
        data: {
            title: "Your First Five Steps",
            subtitle: "Take them one at a time. No rush, no pressure.",
            columns: 3,
            style: 'pillars',
            features: [
                { title: "1 · Plan Your Visit", description: "Attend a Sunday service — in person or online. We'll save you a seat.", icon: "Calendar", link: "/services/sunday-service" },
                { title: "2 · Connect with a Pastor", description: "Book a 30-min welcome call. We want to know your name, not just your face.", icon: "Phone", link: "/contact" },
                { title: "3 · Discover What We Believe", description: "Read our Statement of Faith. Know what you're stepping into.", icon: "BookOpen", link: "/about" },
                { title: "4 · Join a Small Group", description: "Faith grows in community. Find a midweek group near you.", icon: "Users", link: "/bible-study" },
                { title: "5 · Get Baptized & Serve", description: "Make your faith public, then put it to work. Join a ministry team.", icon: "Heart", link: "/life-events" },
                { title: "Need Prayer Right Now?", description: "Our live prayer team is online. Submit a request, get prayed for in minutes.", icon: "Sparkles", link: "/prayer-request" },
            ]
        }
    },
    {
        id: 'onb-scripture',
        type: 'scripture',
        data: {
            verse: "Therefore, as you have received Christ Jesus the Lord, so walk in him, rooted and built up in him and established in the faith.",
            reference: "Colossians 2:6-7",
        }
    },
    {
        id: 'onb-cta',
        type: 'cta',
        data: {
            title: "Become a Member Officially",
            text: "Fill the membership form and a pastor will personally reach out within 48 hours.",
            button_text: "Become a Member",
            button_link: "/join",
            style: 'primary'
        }
    },
];

// ─── Lent Page Defaults ───────────────────────────────────────────────────────

export const DEFAULT_LENT_BLOCKS: Block[] = [
    {
        id: 'lent-hero',
        type: 'hero',
        data: {
            title: "40 Days at the Foot of the Cross",
            subtitle: "Lent is a sacred season of fasting, prayer, and reflection — the road that leads to Easter morning.",
            bg_image: "https://images.unsplash.com/photo-1490127252417-7c393f993ee4?w=1600&q=80",
            cta_text: "Open the Tracker",
            cta_link: "#tracker",
            align: 'center',
            height: 'tall',
        }
    },
    {
        id: 'lent-scripture',
        type: 'scripture',
        data: {
            verse: "Even now, declares the LORD, return to me with all your heart — with fasting, weeping and mourning.",
            reference: "Joel 2:12",
        }
    },
    {
        id: 'lent-pillars',
        type: 'features',
        data: {
            title: "Three Practices of Lent",
            subtitle: "Anchors for the 40-day journey.",
            columns: 3,
            style: 'pillars',
            features: [
                { title: "Fasting", description: "Lay something down — a meal, a screen, a comfort — to make room for hunger after God.", icon: "Flame" },
                { title: "Prayer", description: "Set a daily rhythm. Morning, midday, evening — short, honest, repeated.", icon: "Heart" },
                { title: "Almsgiving", description: "What you save through fasting, give to the poor. Lent without compassion is just dieting.", icon: "HandHeart" },
            ]
        }
    },
    {
        id: 'lent-image',
        type: 'image',
        data: {
            image: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=1600&q=80",
            caption: "From dust to resurrection — the journey of every believer.",
            width: 'wide',
            aspect_ratio: '21:9',
        }
    },
    {
        id: 'lent-timeline',
        type: 'features',
        data: {
            title: "The Path to Easter",
            subtitle: "Six weeks. One destination.",
            columns: 3,
            style: 'icons',
            features: [
                { title: "Ash Wednesday", description: "The beginning. We remember: we are dust, and to dust we will return.", icon: "Cross" },
                { title: "Weeks 1–4 · Fasting", description: "Daily disciplines settle in. Hunger sharpens prayer.", icon: "Flame" },
                { title: "Week 5 · Passion Week begins", description: "We slow down. We meditate on the cross.", icon: "Heart" },
                { title: "Palm Sunday", description: "The King enters Jerusalem. Crowds wave palms. The road narrows.", icon: "Sparkles" },
                { title: "Good Friday", description: "The cross. Darkness at noon. The veil tears.", icon: "Cross" },
                { title: "Easter Morning", description: "He is risen. The tomb is empty. The fast is over.", icon: "Sunrise" },
            ]
        }
    },
    {
        id: 'lent-cta',
        type: 'cta',
        data: {
            title: "Open the 40-Day Tracker",
            text: "A simple daily checklist — mark each day's fast, prayer, and scripture. Held privately on your device.",
            button_text: "Begin the Journey",
            button_link: "#tracker",
            style: 'primary'
        }
    },
];
