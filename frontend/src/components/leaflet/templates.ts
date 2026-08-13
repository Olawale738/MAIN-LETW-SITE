/**
 * Ready-made evangelism leaflet themes. Selecting one fills the editor with a
 * complete, print-ready starting point the admin can then edit freely.
 */
import type { Leaflet } from '@/lib/api'

export interface LeafletTemplate {
    id: string
    name: string
    emoji: string
    content: Partial<Leaflet>
}

const COMMON: Partial<Leaflet> = {
    church_name: 'Light Encounter Tabernacle Worldwide',
    contact_website: 'letw.org',
    service_times: 'Sundays 9:00 AM · Wednesdays 6:00 PM',
    layout: 'flyer',
    status: 'draft',
    is_public: false,
}

export const LEAFLET_TEMPLATES: LeafletTemplate[] = [
    {
        id: 'salvation',
        name: 'Salvation',
        emoji: '✝️',
        content: {
            ...COMMON,
            title: 'Salvation — God Loves You',
            design: 'classic',
            headline: 'God Loves You',
            subheadline: 'And has a wonderful plan for your life',
            body_html:
                'No matter what you have done or where you have been, God loves you with an everlasting love. He sent His Son, Jesus Christ, to die for your sins so you could be forgiven and have eternal life.\n\nToday, He is calling you home. Will you answer?',
            scripture_ref: 'John 3:16',
            scripture_text:
                'For God so loved the world that He gave His only begotten Son, that whoever believes in Him should not perish but have everlasting life.',
            cta_text: 'Give your life to Christ today',
            cta_detail:
                'Pray: "Lord Jesus, I believe You died for me and rose again. Forgive my sins and come into my heart. I receive You as my Lord and Saviour. Amen."',
            accent_color: '#f5bb00',
            footer_note: 'You are welcome to worship with us. Come as you are.',
        },
    },
    {
        id: 'healing',
        name: 'Healing',
        emoji: '🕊️',
        content: {
            ...COMMON,
            title: 'Healing — By His Stripes',
            design: 'minimal',
            headline: 'There Is Healing',
            subheadline: 'Jesus still heals today',
            body_html:
                'Whatever pain you are carrying — in your body, your mind, or your heart — Jesus sees you and cares. He bore your sickness and your sorrow on the cross so that you could be made whole.\n\nBring your burden to Him. He is the God who heals.',
            scripture_ref: 'Isaiah 53:5',
            scripture_text:
                'He was wounded for our transgressions, He was bruised for our iniquities; and by His stripes we are healed.',
            cta_text: 'Receive your healing',
            cta_detail:
                'Pray: "Lord Jesus, I bring my pain to You. Touch me, heal me, and make me whole. I trust You with my life. Amen."',
            accent_color: '#0e7a5f',
            footer_note: 'Let us pray with you. You never have to carry it alone.',
        },
    },
    {
        id: 'invitation',
        name: 'Church invite',
        emoji: '⛪',
        content: {
            ...COMMON,
            title: 'Invitation — You Are Welcome',
            design: 'modern',
            headline: 'You Are Welcome Home',
            subheadline: 'Come and encounter God with us',
            body_html:
                'There is a place for you at Light Encounter Tabernacle Worldwide. Whatever your story, you will find a family that loves you, worship that lifts you, and the presence of God that changes everything.\n\nCome just as you are — we would love to meet you this week.',
            scripture_ref: 'Psalm 122:1',
            scripture_text: 'I was glad when they said unto me, Let us go into the house of the Lord.',
            cta_text: 'Join us this weekend',
            cta_detail: 'Bring a friend. Doors open 30 minutes before each service — refreshments and a warm welcome await.',
            accent_color: '#b45309',
            footer_note: 'Everyone is welcome. See you soon.',
        },
    },
    {
        id: 'christmas',
        name: 'Christmas',
        emoji: '⭐',
        content: {
            ...COMMON,
            title: 'Christmas — Unto Us a Child',
            design: 'bold',
            headline: 'Unto Us a Child Is Born',
            subheadline: 'The reason for the season is Jesus',
            body_html:
                'This Christmas, remember the greatest gift ever given — God’s own Son, Jesus Christ, born to bring peace on earth and reconcile us to God.\n\nCelebrate the true meaning of Christmas with us. There is joy, hope, and a Saviour for you.',
            scripture_ref: 'Isaiah 9:6',
            scripture_text:
                'For unto us a child is born, unto us a son is given: and the government shall be upon his shoulder.',
            cta_text: 'Celebrate Christmas with us',
            cta_detail: 'Join our Carols & Christmas services — a warm welcome, beautiful worship, and the good news of great joy.',
            accent_color: '#9d174d',
            footer_note: 'Merry Christmas from our family to yours.',
        },
    },
    {
        id: 'easter',
        name: 'Easter',
        emoji: '🌅',
        content: {
            ...COMMON,
            title: 'Easter — He Is Risen',
            design: 'modern',
            headline: 'He Is Risen',
            subheadline: 'Death could not hold Him',
            body_html:
                'The tomb is empty. Jesus Christ conquered sin and death, and because He lives, you can have new life and everlasting hope.\n\nThis Easter, celebrate the resurrection that changes everything — and discover the risen Saviour for yourself.',
            scripture_ref: 'Luke 24:6',
            scripture_text: 'He is not here, but is risen: remember how he spake unto you.',
            cta_text: 'Meet the risen Christ',
            cta_detail: 'Pray: "Lord Jesus, thank You for dying and rising for me. I give You my life. Fill me with Your resurrection hope. Amen."',
            accent_color: '#6d28d9',
            footer_note: 'Celebrate Resurrection Sunday with us.',
        },
    },
    {
        id: 'comfort',
        name: 'Comfort',
        emoji: '🤍',
        content: {
            ...COMMON,
            title: 'Comfort — In Times of Loss',
            design: 'minimal',
            headline: 'You Are Not Alone',
            subheadline: 'God is near to the broken-hearted',
            body_html:
                'Grief can feel overwhelming, but you do not have to face it alone. God is close to those who hurt, and He offers a peace that the world cannot give.\n\nLean on Him today. He gathers your tears and He will carry you through.',
            scripture_ref: 'Psalm 34:18',
            scripture_text: 'The Lord is nigh unto them that are of a broken heart; and saveth such as be of a contrite spirit.',
            cta_text: 'Find comfort in Christ',
            cta_detail: 'Pray: "Lord, I bring my grief to You. Comfort my heart and hold me close. Help me trust You one day at a time. Amen."',
            accent_color: '#185fa5',
            footer_note: 'We are here for you. Reach out — we would be honoured to pray with you.',
        },
    },
    {
        id: 'youth',
        name: 'Youth',
        emoji: '🔥',
        content: {
            ...COMMON,
            title: 'Youth — Find Your Purpose',
            design: 'bold',
            headline: 'Find Your Purpose',
            subheadline: 'You were made for more',
            body_html:
                'You are not an accident. God created you on purpose, for a purpose — and He has a future for you filled with hope. No mistake is too big and no dream is too small for Him.\n\nCome discover who you really are in Christ, with people your own age who are chasing the same dream.',
            scripture_ref: 'Jeremiah 29:11',
            scripture_text:
                'For I know the thoughts that I think toward you, saith the Lord, thoughts of peace, and not of evil, to give you an expected end.',
            cta_text: 'Discover your purpose',
            cta_detail: 'Join our youth services — real talk, great friends, and a God who is closer than you think.',
            accent_color: '#d4537e',
            footer_note: 'Come as you are. Bring your crew.',
        },
    },
]
