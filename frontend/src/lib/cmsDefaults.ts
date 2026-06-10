import { Block } from './api';

export const DEFAULT_HOME_BLOCKS: Block[] = [
    {
        id: 'hero-1',
        type: 'hero',
        data: {
            title: "Light Encounter <br /> Tabernacle",
            subtitle: "Engage. Empower. Uplift. Experience the divine presence in a sanctuary of faith and love.",
            bg_image: "/9.png",
            cta_text: "Join Our Family",
            cta_link: "/join",
            align: 'center'
        }
    },
    {
        id: 'about-section',
        type: 'content',
        data: {
            title: "We Are More Than <br /><span style='color:#f5bb00;'>A Church</span>",
            content: `
                <p class="text-lg text-gray-600 leading-relaxed font-medium mb-4">We are a movement — built on unshakeable faith, genuine love, and sacrificial service. Light Encounter Tabernacle exists to awaken destinies, restore the broken, and release people into the fullness of God's purpose through the living, life-changing power of His Word.</p>
                <p class="text-lg text-gray-600 leading-relaxed font-medium mb-6">Every message preached, every hand extended, every life touched is a declaration that God's light is real and His kingdom is advancing — one transformed life at a time.</p>
                <p class="text-lg text-[#140152] leading-relaxed font-semibold italic">"You are the light of the world. A town built on a hill cannot be hidden… let your light shine before others, that they may see your good deeds and glorify your Father in heaven." — Matthew 5:14–16</p>
            `,
            width: 'standard',
            bg_color: 'white',
            padding: 'medium'
        }
    },
    {
        id: 'essence-features',
        type: 'features',
        data: {
            title: "More Than A Church",
            subtitle: "Our Essence",
            columns: 3,
            style: 'cards',
            features: [
                {
                    title: "Divine Worship",
                    description: "Experience powerful, spirit-filled worship that connects you directly to the heart of God.",
                    image: "https://images.unsplash.com/photo-1438232992991-995b7058bbb3?w=800",
                    icon: "Sparkles"
                },
                {
                    title: "Community",
                    description: "A place where everyone belongs. We foster strong relationships and genuine care.",
                    image: "https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=800",
                    icon: "Users"
                },
                {
                    title: "Pastoral Care",
                    description: "Guidance and support for every season of your life.",
                    image: "https://images.unsplash.com/photo-1544427928-c49cdfebf494?w=800",
                    icon: "Shield"
                },
                {
                    title: "Outreach",
                    description: "Extending God's love beyond our walls to those in need.",
                    image: "https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?w=800",
                    icon: "Heart"
                }
            ]
        }
    },
    {
        id: 'latest-sermons',
        type: 'sermon-list',
        data: {
            title: "Latest Sermons",
            count: 3
        }
    },
    {
        id: 'upcoming-events',
        type: 'upcoming-events',
        data: {
            title: "Upcoming Events",
            count: 3
        }
    }
];

export const DEFAULT_ABOUT_BLOCKS: Block[] = [
    {
        id: 'about-hero',
        type: 'hero',
        data: {
            title: "About <br /><span style='color:#f5bb00;'>Light Encounter Tabernacle</span>",
            subtitle: "A worldwide family awakening destinies, restoring the broken, and releasing people into the fullness of God's purpose.",
            bg_image: "/9.png",
            cta_text: "Plan Your Visit",
            cta_link: "/join",
            align: 'center'
        }
    },
    {
        id: 'identity-content',
        type: 'content',
        data: {
            title: "Who We Are",
            content: `
                <p class="text-xl text-[#140152]/80 leading-relaxed font-medium text-center mb-6">Light Encounter Tabernacle Worldwide (LETW) is a Christ-centered, Spirit-led community devoted to spreading the Word of God, empowering individuals, and serving humanity through compassion and charity.</p>
                <p class="text-lg text-gray-600 leading-relaxed text-center">We are more than a church — we are a movement. From our local sanctuary to nations across the world, every gathering, every prayer, and every outreach is a declaration that God's light is real and His Kingdom is advancing, one transformed life at a time.</p>
            `,
            width: 'narrow',
            bg_color: 'white',
            padding: 'medium'
        }
    },
    {
        id: 'about-scripture',
        type: 'scripture',
        data: {
            verse: "You are the light of the world. A town built on a hill cannot be hidden... let your light shine before others, that they may see your good deeds and glorify your Father in heaven.",
            reference: "Matthew 5:14-16",
            context: "Our Foundation",
            bg: 'brand',
            align: 'center'
        }
    },
    {
        id: 'about-stats',
        type: 'stats',
        data: {
            title: "The Light Is Spreading",
            subtitle: "By God's grace, lives are being touched every single day",
            bg: 'light',
            style: 'cards',
            stats: [
                { label: "Lives Transformed", value: "5,000+", icon: "❤️" },
                { label: "Active Ministries", value: "12+", icon: "⛪" },
                { label: "Nations Reached", value: "8+", icon: "🌍" },
                { label: "Weekly Gatherings", value: "20+", icon: "🙌" }
            ]
        }
    },
    {
        id: 'about-features',
        type: 'features',
        data: {
            title: "Our Mission, Vision & Values",
            subtitle: "What Drives Us",
            columns: 2,
            style: 'cards',
            features: [
                { title: "Our Mission", description: "To spread the love of Christ through worship, discipleship, and community service — transforming lives and building a stronger faith community.", icon: "Target" },
                { title: "Our Vision", description: "To be a beacon of hope and light, empowering individuals across the world to live purposeful lives rooted in faith and service.", icon: "Compass" },
                { title: "Our Values", description: "Faith, Love, Service, Integrity, and Community. We live out these values daily through worship, ministry, and genuine care for one another.", icon: "Sparkles" },
                { title: "Our Reach", description: "From local community outreach to global missions, we are committed to making a difference wherever God calls us to serve.", icon: "Globe" }
            ]
        }
    },
    {
        id: 'founder-section',
        type: 'image',
        data: {
            image: "/Founder.png",
            caption: "Apostle Olawale N. Sanni — Founder & President",
            width: 'standard',
            aspect_ratio: '4:3'
        }
    },
    {
        id: 'founder-content',
        type: 'content',
        data: {
            title: "Our Story of Faith",
            content: `
                <p class="mb-4">Light Encounter Tabernacle was born out of a single, burning conviction: that the light of God is meant to be carried into the darkest places. What began as a small gathering of hungry hearts has grown into a vibrant, worldwide family of believers united by faith, love, and an unrelenting passion for souls.</p>
                <p class="mb-4">Under the leadership of Apostle Olawale N. Sanni, the ministry has remained anchored to the uncompromised Word of God — preaching the gospel boldly, raising disciples intentionally, and extending the hand of compassion to the hurting, the forgotten, and the broken.</p>
                <p>Our journey has been marked by God's unfailing faithfulness. As we look ahead, our heart remains the same: to be salt and light in the earth, and to see every life we touch awakened to its God-given destiny.</p>
            `,
            width: 'narrow',
            bg_color: 'gray',
            padding: 'medium'
        }
    },
    {
        id: 'beliefs-features',
        type: 'features',
        data: {
            title: "What We Believe",
            subtitle: "Our Statement of Faith",
            columns: 3,
            style: 'icons',
            features: [
                { title: "The Word of God", description: "We believe the Bible is the inspired, infallible, and authoritative Word of God — our guide for faith and living.", icon: "BookOpen" },
                { title: "Salvation in Christ", description: "We believe salvation is a gift of grace through faith in Jesus Christ alone, who died and rose again for our redemption.", icon: "Heart" },
                { title: "The Holy Spirit", description: "We believe in the present-day power and gifts of the Holy Spirit, empowering every believer for holy living and service.", icon: "Flame" },
                { title: "Prayer & Worship", description: "We believe in fervent prayer and Spirit-filled worship as the heartbeat of a thriving relationship with God.", icon: "HandHeart" },
                { title: "Water Baptism", description: "We believe in baptism by immersion as a public declaration of a believer's new life in Christ.", icon: "Droplets" },
                { title: "The Great Commission", description: "We believe every believer is called to share the gospel and make disciples of all nations.", icon: "Globe" }
            ]
        }
    },
    {
        id: 'expect-features',
        type: 'features',
        data: {
            title: "What to Expect",
            subtitle: "Your First Visit",
            columns: 3,
            style: 'cards',
            features: [
                { title: "A Warm Welcome", description: "From the moment you arrive, our team is ready to welcome you like family. Come as you are.", icon: "HandHeart" },
                { title: "Spirit-Filled Worship", description: "Experience heartfelt, life-giving worship that ushers you into the tangible presence of God.", icon: "Music" },
                { title: "Practical Teaching", description: "Receive clear, Bible-based teaching that speaks to real life and stirs genuine transformation.", icon: "BookOpen" },
                { title: "Care for Kids & Youth", description: "Your children are safe, loved, and engaged with age-appropriate ministry while you worship.", icon: "Baby" },
                { title: "Prayer Ministry", description: "Our prayer team is available to stand with you in faith for every need and breakthrough.", icon: "Sparkles" },
                { title: "Genuine Community", description: "Connect with people who will walk with you, encourage you, and grow with you in faith.", icon: "Users" }
            ]
        }
    },
    {
        id: 'about-testimonies',
        type: 'testimonies',
        data: {
            title: "Lives Touched by the Light",
            subtitle: "Stories From Our Family",
            style: 'grid',
            bg: 'light',
            testimonies: [
                { quote: "I walked in broken and walked out renewed. LETW didn't just welcome me — they restored my hope and reminded me who I am in Christ.", name: "Grace A.", location: "Member since 2023", avatar: "🙏" },
                { quote: "The teaching here changed how I live. Every message meets me exactly where I am and points me straight to Jesus.", name: "Daniel O.", location: "Youth Ministry", avatar: "🔥" },
                { quote: "This is more than a church — it's a family. The love and prayer support I've received carried me through my hardest season.", name: "Esther M.", location: "Women's Fellowship", avatar: "❤️" }
            ]
        }
    },
    {
        id: 'about-cta',
        type: 'cta',
        data: {
            title: "Become Part of the Family",
            text: "There's a place for you here. Join us this week and encounter the light of God in a community that will love you, lift you, and walk with you.",
            button_text: "Join Us This Sunday",
            button_link: "/join",
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
