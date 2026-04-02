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
            title: "A Vision for <br />Community Transformation",
            content: `
                <p class="text-lg text-gray-600 leading-relaxed font-medium mb-4">Founded on the principles of faith, love, and service, Light Encounter Tabernacle is dedicated to be a beacon of hope. Our mission is to empower individuals to live purposeful lives through the transformative power of God's Word.</p>
                <p class="text-lg text-gray-600 leading-relaxed font-medium">"You are the light of the world. A town built on a hill cannot be hidden... In the same way, let your light shine before others, that they may see your good deeds and glorify your Father in heaven." - Matthew 5:14-16</p>
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
                    image: "https://images.unsplash.com/photo-1507692049790-de58290a4334?w=800",
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
            title: "About LETW",
            subtitle: "Spreading God's Love, Transforming Lives",
            bg_image: "/9.png",
            align: 'center'
        }
    },
    {
        id: 'identity-content',
        type: 'content',
        data: {
            title: "Who We Are",
            content: `<p class="text-xl text-[#140152]/70 leading-relaxed font-medium text-center">Light Encounter Tabernacle Worldwide is dedicated to spreading the Word of GOD, empowering individuals, and engaging in charitable activities to uplift our community and beyond.</p>`,
            width: 'narrow',
            bg_color: 'white',
            padding: 'medium'
        }
    },
    {
        id: 'about-features',
        type: 'features',
        data: {
            title: "Our Core Values",
            columns: 2,
            style: 'cards',
            features: [
                { title: "Our Mission", description: "To spread the love of Christ through worship, discipleship, and community service, transforming lives and building a stronger faith community.", icon: "Target" },
                { title: "Our Vision", description: "To be a beacon of hope and light in our community, empowering individuals to live purposeful lives rooted in faith and service.", icon: "Compass" },
                { title: "Our Values", description: "Faith, Love, Service, Integrity, and Community. We believe in living out these values daily through our actions and ministry.", icon: "Sparkles" },
                { title: "Our Reach", description: "From local community outreach to global missions, we're committed to making a difference wherever God calls us to serve.", icon: "Globe" }
            ]
        }
    },
    {
        id: 'founder-section',
        type: 'image',
        data: {
            image: "/Founder.png",
            caption: "Apostle. Olawale N. Sanni - Founder/President",
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
                <p>Founded with a vision to bring light to those in darkness, LETW has grown into a vibrant community of believers committed to making a difference. Through worship, teaching, and service, we continue to fulfill our calling to be salt and light in the world.</p>
                <p>Our journey has been marked by God's faithfulness, and we look forward to continued growth and impact as we serve our community and beyond.</p>
            `,
            width: 'narrow',
            bg_color: 'gray',
            padding: 'medium'
        }
    }
];

export const DEFAULT_IMPACT_BLOCKS: Block[] = [
    {
        id: 'impact-hero',
        type: 'hero',
        data: {
            title: "Making Jesus <span class='text-[#f5bb00]'>Known</span>",
            subtitle: "Extending the love of Christ beyond the four walls of the church through service, missions, and community transformation.",
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
                    icon: "Smile",
                    link: "/kids-ministry",
                    button_text: "Join Kids Ministry"
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
                    icon: "FileText"
                },
                {
                    title: "Sermon Notes",
                    description: "Follow along with the message using our interactive sermon notes.",
                    icon: "PenTool"
                },
                {
                    title: "First Time Guest?",
                    description: "Complete our connection card so we can welcome you properly.",
                    icon: "Heart"
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

export const DEFAULT_KIDS_MINISTRY_BLOCKS: Block[] = [
    {
        id: 'kids-hero',
        type: 'hero',
        data: {
            title: "🌈 Shine Your <span class='text-[#f5bb00]'>Light</span>",
            subtitle: "Evangelizing, discipling, and empowering young hearts to encounter God's love in profound, joyful ways.",
            align: 'center',
            bg_image: "https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=1200"
        }
    },
    {
        id: 'kids-mission',
        type: 'content',
        data: {
            title: "Our Mission",
            content: `
                <h3 class="text-2xl font-bold text-[#140152] mb-4">Empowering Young Hearts</h3>
                <p class="text-lg text-gray-600 leading-relaxed mb-4">Drawing from our commitment to evangelizing and discipling children, Light Encounter Tabernacle Kids Ministry serves children ages 2–17. We create transformative spaces where kids value God's Word through worship, lessons, games, and one-on-one guidance.</p>
                <div class="bg-[#f5bb00]/10 border-l-4 border-[#f5bb00] p-5 rounded-r-xl mb-4">
                    <p class="text-gray-700"><strong class="text-[#140152]">Our Promise:</strong> A safe, nurturing environment where children encounter God's love, build meaningful friendships, develop strong faith foundations, and discover their unique gifts.</p>
                </div>
                <p class="text-lg text-gray-600 leading-relaxed">We blend engaging worship, biblical teaching, and community service to help children understand their purpose in God's plan.</p>
            `,
            width: 'standard',
            bg_color: 'white',
            padding: 'medium'
        }
    },
    {
        id: 'kids-age-groups',
        type: 'features',
        data: {
            title: "Age Groups",
            columns: 3,
            style: 'cards',
            features: [
                { title: "👶 Nursery (2-5)", description: "Play-based learning and basic Bible stories in a loving nursery setting.", icon: "Baby" },
                { title: "📚 Elementary (6-12)", description: "Interactive lessons, games, and worship to build faith foundations.", icon: "BookOpen" },
                { title: "🧑‍🎓 Youth (13-17)", description: "Discipleship, leadership training, and outreach for teens.", icon: "GraduationCap" }
            ]
        }
    },
    {
        id: 'kids-programs',
        type: 'features',
        data: {
            title: "Our Programs",
            columns: 4,
            style: 'cards',
            features: [
                { title: "Kids Choir & Worship", description: "Experience joyful worship through music, dance, and celebrations that bring God's presence alive.", icon: "Music" },
                { title: "Bible Adventures", description: "Interactive storytelling bringing God's Word to life with engaging narratives, crafts, and discussions.", icon: "BookOpen" },
                { title: "Discipleship & Growth", description: "Guided development programs helping kids establish faith and discover their callings through mentorship.", icon: "Sprout" },
                { title: "Community Outreach", description: "Hands-on service projects teaching the heart of compassion, making a difference in our community.", icon: "Heart" }
            ]
        }
    },
    {
        id: 'kids-summer-camp',
        type: 'cta',
        data: {
            title: "☀️ Summer Shine Camp",
            text: "Our week-long adventure features games, laughter, Bible exploration, and worship. A blast of faith-building fun!",
            button_text: "Stay Tuned",
            button_link: "#",
            style: 'banner'
        }
    },
    {
        id: 'kids-parent-resources',
        type: 'features',
        data: {
            title: "Parent & Volunteer Resources",
            subtitle: "We offer tools to equip parents and volunteers for nurturing young faith at home and church.",
            columns: 3,
            style: 'cards',
            features: [
                { title: "Parent Guides", description: "Weekly devotionals and tips for family faith discussions.", icon: "FileText" },
                { title: "Volunteer Training", description: "Annual workshops on child safety, teaching, and discipleship.", icon: "Users" },
                { title: "Bible Study Kits", description: "Downloadable materials for home Bible adventures.", icon: "BookMarked" }
            ]
        }
    },
    {
        id: 'kids-testimonials',
        type: 'features',
        data: {
            title: "Hear From Our Families",
            columns: 2,
            style: 'cards',
            features: [
                { title: "Sarah M. — Parent", description: "\"My daughter looks forward to every Sunday! She's made wonderful friends and her faith has deepened so much. This ministry truly cares.\"", icon: "Star" },
                { title: "David T. — Parent", description: "\"The teachers are amazing! They make learning about God fun and relatable. My kids ask about it all week long!\"", icon: "Star" }
            ]
        }
    },
    {
        id: 'kids-registration',
        type: 'kids-registration',
        data: {
            title: "Register Your Child",
            subtitle: "Join our ministry family! Fill out the form below and we'll be in touch."
        }
    },
    {
        id: 'kids-cta-footer',
        type: 'cta',
        data: {
            title: "Join Our Ministry Family",
            text: "Your child deserves a place where faith, friendship, and fun come together. We're ready to welcome your family with open hearts and open arms.",
            button_text: "Start Your Journey Today",
            button_link: "#register",
            style: 'banner'
        }
    }
];

export const DEFAULT_ALTER_SOUND_BLOCKS: Block[] = [
    {
        id: 'as-hero',
        type: 'hero',
        data: {
            title: "Raising Sound That <span class='text-[#f5bb00]'>Carries Heaven's Intention</span>",
            subtitle: "Not entertainment. A consecrated space where worship, prophetic sound, and spiritual alignment converge to release God's presence.",
            align: 'center',
            bg_image: "https://images.unsplash.com/photo-1525926477800-7a3be580c765?q=80&w=2670",
            cta_text: "Explore Audio Library",
            cta_link: "/services/alter-sound/library"
        }
    },
    {
        id: 'as-core-identity',
        type: 'content',
        data: {
            title: "Not a Performance Choir",
            content: `
                <p class="text-lg text-gray-600 leading-relaxed mb-6">We are not built on talent alone, nor driven by applause or stage presence. Alter Sound exists as a ministry of consecrated servants who offer sound as spiritual sacrifice, releasing heaven's atmosphere through surrendered voices and instruments.</p>
                <div class="space-y-4">
                    <div class="flex gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                        <div class="w-12 h-12 bg-[#140152]/5 rounded-full flex items-center justify-center text-[#140152] flex-shrink-0">🔥</div>
                        <div><h4 class="font-bold text-lg text-[#140152]">Sound as Spiritual Offering</h4><p class="text-sm text-gray-600">Every note is presented as worship unto the Lord.</p></div>
                    </div>
                    <div class="flex gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                        <div class="w-12 h-12 bg-[#140152]/5 rounded-full flex items-center justify-center text-[#140152] flex-shrink-0">🎵</div>
                        <div><h4 class="font-bold text-lg text-[#140152]">Worship as Ministry</h4><p class="text-sm text-gray-600">We serve by creating space for divine encounter.</p></div>
                    </div>
                    <div class="flex gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                        <div class="w-12 h-12 bg-[#140152]/5 rounded-full flex items-center justify-center text-[#140152] flex-shrink-0">⛪</div>
                        <div><h4 class="font-bold text-lg text-[#140152]">Servants at the Altar</h4><p class="text-sm text-gray-600">Our role is priestly—ministering to the Lord.</p></div>
                    </div>
                </div>
            `,
            width: 'standard',
            bg_color: 'white',
            padding: 'medium'
        }
    },
    {
        id: 'as-dimensions',
        type: 'features',
        data: {
            title: "Dimensions of Sound Ministry",
            subtitle: "Spiritual Depth",
            columns: 2,
            style: 'cards',
            features: [
                { title: "Worship Sound", description: "Hosts God's presence and leads into adoration.", icon: "Music" },
                { title: "Prophetic Sound", description: "Spirit-led melodies aligning with divine instruction.", icon: "Mic" },
                { title: "Healing Sound", description: "Anointed expressions for freedom and restoration.", icon: "Sparkles" },
                { title: "Missional Sound", description: "Songs crafted for nations and global contexts.", icon: "Globe" }
            ]
        }
    },
    {
        id: 'as-formation',
        type: 'content',
        data: {
            title: "Sound Formation Journey",
            content: `
                <div class="grid lg:grid-cols-2 gap-12">
                    <div class="bg-white p-8 rounded-2xl border border-gray-100 shadow-lg">
                        <h3 class="text-2xl font-bold mb-6 text-[#140152]">Sound Formation Journey</h3>
                        <div class="space-y-6">
                            <div class="flex gap-4 items-center"><div class="w-10 h-10 bg-[#140152] rounded-full text-white flex items-center justify-center font-bold text-sm flex-shrink-0 shadow-lg">1</div><h4 class="font-bold text-lg text-[#140152]">Consecration (Heart alignment)</h4></div>
                            <div class="flex gap-4 items-center"><div class="w-10 h-10 bg-[#140152] rounded-full text-white flex items-center justify-center font-bold text-sm flex-shrink-0 shadow-lg">2</div><h4 class="font-bold text-lg text-[#140152]">Vocal & Musical Formation</h4></div>
                            <div class="flex gap-4 items-center"><div class="w-10 h-10 bg-[#140152] rounded-full text-white flex items-center justify-center font-bold text-sm flex-shrink-0 shadow-lg">3</div><h4 class="font-bold text-lg text-[#140152]">Spiritual Sensitivity</h4></div>
                            <div class="flex gap-4 items-center"><div class="w-10 h-10 bg-[#140152] rounded-full text-white flex items-center justify-center font-bold text-sm flex-shrink-0 shadow-lg">4</div><h4 class="font-bold text-lg text-[#140152]">Corporate Sound Unity</h4></div>
                            <div class="flex gap-4 items-center"><div class="w-10 h-10 bg-[#140152] rounded-full text-white flex items-center justify-center font-bold text-sm flex-shrink-0 shadow-lg">5</div><h4 class="font-bold text-lg text-[#140152]">Sound Release</h4></div>
                        </div>
                    </div>
                    <div class="space-y-6">
                        <div class="bg-[#140152] text-white p-8 rounded-2xl shadow-xl">
                            <h3 class="text-2xl font-bold mb-4">How We Operate</h3>
                            <p class="mb-4 opacity-80 text-lg">Every gathering is prayer-led and Spirit-directed.</p>
                            <ul class="space-y-3 font-medium">
                                <li class="flex items-center gap-3"><span class="w-2 h-2 bg-[#f5bb00] rounded-full"></span>Formation rehearsals</li>
                                <li class="flex items-center gap-3"><span class="w-2 h-2 bg-[#f5bb00] rounded-full"></span>Prayer-soaked sessions</li>
                                <li class="flex items-center gap-3"><span class="w-2 h-2 bg-[#f5bb00] rounded-full"></span>Worship retreats</li>
                                <li class="flex items-center gap-3"><span class="w-2 h-2 bg-[#f5bb00] rounded-full"></span>Ministry service</li>
                            </ul>
                        </div>
                    </div>
                </div>
            `,
            width: 'wide',
            bg_color: 'gray',
            padding: 'large'
        }
    },
    {
        id: 'as-audio-cta',
        type: 'cta',
        data: {
            title: "Experience Worship Sound",
            text: "Listen to anointed worship and prophetic sound that carries heaven's presence",
            button_text: "Browse Audio Library",
            button_link: "/services/alter-sound/library",
            style: 'banner'
        }
    }
];
