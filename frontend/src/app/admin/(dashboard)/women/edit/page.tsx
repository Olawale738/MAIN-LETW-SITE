'use client'
import MinistryContentEditor from '@/components/admin/MinistryContentEditor'

export default function WomenContentEditorPage() {
    return (
        <MinistryContentEditor
            ministryKey="women"
            label="Women's Ministry"
            livePath="/women"
            defaults={{
                hero_eyebrow: "Women's Ministry",
                hero_title_line1: 'She Is',
                hero_title_highlight: 'Clothed',
                hero_title_line2: 'in Strength',
                hero_scripture: 'She is clothed with strength and dignity, and she laughs without fear of the future.',
                hero_scripture_ref: '— Proverbs 31:25',
                hero_description: "A sisterhood of women anchored in the Word, healed by the Spirit, and sent into the world as living evidence of God's tender, restoring, world-shifting love.",
                hero_primary_cta: 'Join Our Sisterhood',
                hero_secondary_cta: 'Explore Programs',
                carousel_eyebrow: 'Who We Are',
                carousel: [
                    { value: 'Daughters', label: 'of the King' },
                    { value: 'Sisters',   label: 'in Every Season' },
                    { value: 'Anchored',  label: 'in the Word' },
                    { value: 'Sent',      label: 'as Light' },
                ],
                pillars_eyebrow: 'Our Foundation',
                pillars_heading: 'Four Pillars of Sisterhood',
                pillars: [
                    { icon: 'BookOpen',   title: 'Word-Anchored',      desc: 'Weekly studies that put scripture at the center of how we think, decide, and live.' },
                    { icon: 'Heart',      title: 'Heart-Healing',      desc: 'A safe table where every wound is welcomed and every story matters in the hands of Christ.' },
                    { icon: 'HandHeart',  title: 'Hands-Outstretched', desc: 'Outreach to single mothers, widows, and women in crisis — we go where the hurt is.' },
                    { icon: 'Flower2',    title: 'Beautifully Bold',   desc: 'A celebration of womanhood as God designed it: tender, strong, prophetic, world-changing.' },
                ],
                programs_eyebrow: 'Our Programs',
                programs_heading: 'Six Ways to Belong',
                programs_subtitle: "Whatever season you're in, there is a circle, a table, a hand reaching out for you here.",
                programs: [
                    { icon: 'Coffee',    title: "Sister's Circle",    desc: 'Intimate small groups meeting every two weeks for prayer, accountability, and Word.', badge: 'Weekly Fellowship', cta: 'Find a Circle' },
                    { icon: 'Crown',     title: 'Crown of Beauty',    desc: 'Inner-healing intensive for women carrying wounds from abuse, abandonment, or shame.', badge: 'Healing Track',     cta: 'Take the Step' },
                    { icon: 'Sun',       title: 'Daughters of Worth', desc: 'A mentorship cohort for young women (18–25) discovering identity and calling.',           badge: 'Mentorship',         cta: 'Join the Cohort' },
                    { icon: 'BookOpen',  title: 'Word & Tea',         desc: 'Saturday morning Bible studies with intention — deep teaching, warm tea, deeper sisters.', badge: 'Bible Study',        cta: 'Pull up a Chair' },
                    { icon: 'HandHeart', title: 'Hand to Hand',       desc: 'Outreach to single mothers and women in crisis — practical love, real provision.',           badge: 'Outreach',           cta: 'Serve With Us' },
                    { icon: 'Calendar',  title: 'The Annual Retreat', desc: 'Three days away in worship, prophetic ministry, and rest. The highlight of our year.',      badge: 'Annual Event',       cta: 'Reserve a Seat' },
                ],
                scripture_band_text: 'Many women do noble things, but you surpass them all. Charm is deceptive, and beauty is fleeting; but a woman who fears the Lord is to be praised.',
                scripture_band_ref: '— Proverbs 31:29–30',
                join_eyebrow: 'Come Join Us',
                join_heading: 'Pull Up a Chair',
                join_description: "Tell us a bit about yourself and our women's team will reach out within 48 hours.",
                footer_heading: 'You belong here, sister.',
                footer_subtext: 'Already a member? Open your dashboard for announcements, upcoming events, and your sister circle.',
            }}
        />
    )
}
