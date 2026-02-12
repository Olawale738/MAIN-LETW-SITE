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
            bg_image: "https://images.unsplash.com/photo-1593113598332-cd288d649433?q=80&w=2670",
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
