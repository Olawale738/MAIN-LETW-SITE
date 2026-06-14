'use client'
import MinistryContentEditor from '@/components/admin/MinistryContentEditor'

export default function MenContentEditorPage() {
    return (
        <MinistryContentEditor
            ministryKey="men"
            label="Men's Ministry"
            livePath="/men"
            defaults={{
                hero_eyebrow: "Men's Ministry",
                hero_title_line1: 'Be',
                hero_title_highlight: 'Strong.',
                hero_title_line2: 'Be Courageous.',
                hero_scripture: 'Be on your guard; stand firm in the faith; be courageous; be strong. Do everything in love.',
                hero_scripture_ref: '— 1 Corinthians 16:13–14',
                hero_description: 'A brotherhood of men forged in the Word, sharpened in accountability, and sent into every battle — at home, at work, in our cities — as men who fear God and nothing else.',
                hero_primary_cta: 'Join the Brotherhood',
                hero_secondary_cta: 'Explore Programs',
                carousel_eyebrow: 'Who We Are',
                carousel: [
                    { value: 'Iron',    label: 'Sharpens Iron' },
                    { value: 'Sons',    label: 'of the King' },
                    { value: 'Built',   label: 'On the Rock' },
                    { value: 'Sent',    label: 'To War' },
                ],
                pillars_eyebrow: 'Our Foundation',
                pillars_heading: 'Four Pillars Every Man Stands On',
                pillars: [
                    { icon: 'Anchor',   title: 'Word-Forged',     desc: 'Scripture is the anvil that shapes every man. We hammer truth into character, week after week.' },
                    { icon: 'Shield',   title: 'Brother-Backed',  desc: 'No man walks alone here. Real accountability, no performance, no posturing — just brothers who go to war for you.' },
                    { icon: 'Hammer',   title: 'Purpose-Built',   desc: 'You were made to build something that outlives you. We help you find it, sharpen it, and ship it.' },
                    { icon: 'Mountain', title: 'Battle-Ready',    desc: 'Husband, father, leader, soldier — every battlefield gets the same answer: discipline rooted in surrender to Christ.' },
                ],
                programs_eyebrow: 'Our Programs',
                programs_heading: 'Six Battlegrounds. One Brotherhood.',
                programs_subtitle: "Whatever season of warfare you're in — there's a band of brothers ready to fight beside you.",
                programs: [
                    { icon: 'Sword',    title: 'Iron Sharpens Iron',   desc: 'Weekly small groups where men get real about marriage, money, mission, and what God is asking of them.', badge: 'Weekly Brotherhood', cta: 'Join a Group' },
                    { icon: 'Hammer',   title: 'Forged Mentorship',    desc: 'One-on-one pairings with seasoned fathers in the faith. Real talk on career, marriage, fatherhood, calling.',   badge: 'Mentorship',         cta: 'Find a Father' },
                    { icon: 'BookOpen', title: 'Men of the Word',      desc: 'Saturday morning Bible study — deep teaching, hard questions, scripture you can build a life on.',             badge: 'Bible Study',        cta: 'Pull Up a Chair' },
                    { icon: 'Target',   title: 'The Arena',            desc: 'Quarterly retreats — sweat, scripture, story. Three days that recalibrate the man you came as.',                badge: 'Quarterly Retreat',  cta: 'Step Into the Arena' },
                    { icon: 'Crown',    title: 'Fathered & Fathering', desc: 'A track for fathers and fathers-in-waiting: legacy, discipline, presence, intentionality.',                    badge: 'Family Track',       cta: 'Become a Father' },
                    { icon: 'Flame',    title: 'On Mission',           desc: 'Outreach to fatherless boys, men in addiction, and brothers behind bars. We go where the bleeding is.',         badge: 'Outreach',           cta: 'Get In the Fight' },
                ],
                scripture_band_text: 'As iron sharpens iron, so one man sharpens another.',
                scripture_band_ref: '— Proverbs 27:17',
                join_eyebrow: 'Step In',
                join_heading: 'Take Your Position',
                join_description: "Tell us where you're at. Our men's lead will reach out within 48 hours.",
                footer_heading: "You're not alone, brother.",
                footer_subtext: 'Already a member? Open your dashboard for announcements, upcoming events, and your iron-sharpens-iron group.',
            }}
        />
    )
}
