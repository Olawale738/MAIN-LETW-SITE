'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import {
    BookOpen,
    GraduationCap,
    Globe,
    Users,
    Award,
    ArrowRight,
    CheckCircle,
    Scroll,
    Flame,
    Heart,
    Anchor,
    Map
} from 'lucide-react'
import SectionWrapper from '@/components/shared/SectionWrapper'
import PremiumButton from '@/components/ui/PremiumButton'
import Link from 'next/link'

// --- Data ---

const IMPACT_POINTS = [
    {
        id: "01",
        title: "Biblical Foundation",
        desc: "Master the complete biblical narrative from Genesis to Revelation. Develop rigorous exegetical skills in Hebrew and Greek to unlock the original languages of Scripture and interpret God's Word with precision.",
        icon: BookOpen
    },
    {
        id: "02",
        title: "Theological Depth",
        desc: "Journey through systematic theology, exploring the doctrine of God, pneumatology, ecclesiology, and more. Engage with historical and contemporary theological frameworks that shape Christian thought.",
        icon: Scroll
    },
    {
        id: "03",
        title: "Ministry Excellence",
        desc: "From pastoral care to church planting, homiletics to leadership—gain practical ministry skills tested through internships and real-world application. Graduate ready to serve with competence and confidence.",
        icon: Users
    },
    {
        id: "04",
        title: "Global Perspective",
        desc: "Understand Christianity in its global context. Explore cross-cultural ministry, world religions, political theologies, and engage with the Bible's response to contemporary global challenges.",
        icon: Globe
    },
    {
        id: "05",
        title: "Spiritual Formation",
        desc: "Your education is not merely academic—it's transformational. Through spiritual disciplines, worship studies, and intentional formation, cultivate a deep, authentic walk with God that sustains lifelong ministry.",
        icon: Flame
    },
    {
        id: "06",
        title: "Mission & Impact",
        desc: "Graduate equipped for evangelism, apologetics, social transformation, and kingdom advancement. Whether in local churches or global missions, make an eternal impact for Christ.",
        icon: Anchor
    }
]

const PROGRAMS = [
    {
        level: 1,
        title: "Certificate in Ministry",
        subtitle: "Foundation Program - Open to those beginning their theological journey",
        duration: "1 Year Duration",
        credits: "36-40 Credit Hours",
        courses_count: "15 Core Courses",
        description: "Build a strong foundation in biblical studies, theology, and practical ministry. This certificate introduces you to Scripture, Christian doctrine, spiritual formation, and essential ministry skills.",
        color: "from-blue-500 to-cyan-500",
        semesters: [
            {
                name: "Semester 1",
                courses: [
                    "Ministry Formation",
                    "Introduction to Biblical Literature",
                    "Foundations of Ministry",
                    "Intro to Christian Theology",
                    "Spiritual Disciplines",
                    "Old Testament Survey",
                    "Synoptic Gospels",
                    "Ethics & Christian Worldview"
                ]
            },
            {
                name: "Semester 2",
                courses: [
                    "Pentateuch",
                    "New Testament Survey",
                    "Jesus and the Gospels",
                    "Spiritual Gifts I",
                    "Introduction to Worship & Service",
                    "Biblical Interpretation & Application",
                    "Introduction to Christian Ethics",
                    "Introduction to Church History",
                    "World Religions Overview"
                ]
            }
        ],
        requirements: {
            basics: [
                "Basic secondary school education (or equivalent life experience)",
                "Ability to read, write, and communicate effectively in English",
                "Personal commitment to Christian faith and spiritual growth",
                "Interest in ministry, leadership, or biblical studies"
            ],
            docs: [
                "Completed application form",
                "Short personal statement (calling, faith journey, or ministry interest)",
                "Recommendation from a pastor, church leader, or mentor (optional but encouraged)"
            ]
        }
    },
    {
        level: 2,
        title: "Diploma in Ministry and Divinity",
        subtitle: "Intermediate Program - Deeper academic and practical ministry formation",
        duration: "1 Year Duration",
        credits: "36-40 Credit Hours",
        courses_count: "18 Advanced Courses",
        description: "Deepen your theological understanding and ministry competencies. This diploma advances your study in systematic theology, biblical exegesis, church history, and practical ministry applications including preaching and discipleship.",
        color: "from-purple-500 to-indigo-500",
        semesters: [
            {
                name: "Semester 1",
                courses: [
                    "Theology II (Systematic Theology)",
                    "Scripture, Exegesis & Hermeneutics",
                    "Cultures of Ancient Civilizations",
                    "Spiritual Gifts II",
                    "Church History: Early to Medieval Period",
                    "Mission in Contemporary Context",
                    "Christian Doctrine & Ethics",
                    "Pauline Theology",
                    "Protestant Reformation"
                ]
            },
            {
                name: "Semester 2",
                courses: [
                    "Christian Communication Skills",
                    "Romans (Biblical Book Study)",
                    "Exploring Other Faiths",
                    "Kings & Prophets",
                    "Biblical Exegesis Practicum",
                    "Preaching & Teaching Practicum",
                    "Methods in Discipleship",
                    "Church Planting & Evangelism",
                    "Leadership and Spirituality"
                ]
            }
        ],
        requirements: {
            basics: [
                "Successful completion of Certificate in Ministry OR equivalent theological training",
                "Demonstrated commitment to church involvement or ministry service",
                "Basic understanding of Scripture and Christian doctrine"
            ],
            docs: [
                "Completed application form",
                "Academic transcript or proof of prior theological study",
                "Personal statement outlining ministry goals",
                "Recommendation from a pastor or ministry supervisor"
            ]
        }
    },
    {
        level: 3,
        title: "Advanced Diploma in Ministry and Divinity",
        subtitle: "Advanced Leadership - For strategic ministry, pastoral work, and theological engagement",
        duration: "1 Year Duration",
        credits: "36-40 Credit Hours",
        courses_count: "29 Specialized Courses + Internship",
        description: "Achieve scholarly expertise and advanced ministry leadership. Master biblical languages, engage with cutting-edge theological discourse, specialize in pastoral care or missional leadership, and complete a comprehensive ministry internship.",
        color: "from-amber-500 to-orange-500",
        semesters: [
            {
                name: "Semester 1",
                courses: [
                    "Greek & Hebrew Exegesis Studies",
                    "Theology III (Advanced Systematic Theology)",
                    "Pastoral Leadership & Care",
                    "Doctrine of God",
                    "Digital Theology",
                    "Global Theologies",
                    "Christianity and the Arts",
                    "Pneumatology",
                    "Evangelism & Apologetics",
                    "Church History: Reformation to Contemporary",
                    "Ecclesiology & Church Mission",
                    "Church Planting & Evangelism"
                ]
            },
            {
                name: "Semester 2",
                courses: [
                    "Contextualized Ministry",
                    "Hermeneutics & Homiletics",
                    "The Bible and Global Challenges",
                    "Wisdom Literature",
                    "Political Theologies: Wealth, Race, Gender",
                    "Leadership & Theology for Ministry & Mission",
                    "Multimedia Worship Skills",
                    "Cross-cultural Ministry",
                    "Missions & Social Transformation",
                    "Counselling in a Pastoral Setting",
                    "Internship (Practical Ministry Experience)"
                ]
            }
        ],
        requirements: {
            basics: [
                "Successful completion of Diploma in Ministry and Divinity OR equivalent qualification",
                "Demonstrated leadership responsibility in church or ministry context",
                "Academic readiness for advanced theological study",
                "Willingness to complete internship/supervised ministry placement"
            ],
            docs: [
                "Completed application form",
                "Official transcripts or evidence of prior theological education",
                "Detailed personal statement or ministry vision statement",
                "Pastoral or professional reference confirming leadership experience"
            ]
        }
    }
]

const JOURNEY_ITMES = [
    {
        step: "1",
        title: "Foundation Year",
        desc: "Begin with the Certificate in Ministry. Master biblical literacy, theological foundations, and essential ministry skills. Discover your calling and develop spiritual disciplines that will sustain your entire journey."
    },
    {
        step: "2",
        title: "Development Year",
        desc: "Advance to the Diploma in Ministry and Divinity. Deepen your theological understanding, master exegetical methods, explore church history, and begin practical ministry application through preaching and discipleship training."
    },
    {
        step: "3",
        title: "Mastery Year",
        desc: "Complete the Advanced Diploma in Ministry and Divinity. Achieve scholarly expertise in biblical languages, engage contemporary theological issues, specialize in your area of calling, and complete hands-on ministry internship."
    }
]

const GAINS = [
    "Comprehensive biblical and theological training across three progressive levels",
    "Mastery of biblical languages (Hebrew & Greek) for original text study",
    "Practical ministry skills in preaching, teaching, pastoral care, and leadership",
    "Global perspective on Christianity and cross-cultural ministry",
    "Hands-on ministry experience through internship placements",
    "Internationally recognized qualifications (Certificate, Diploma, Advanced Diploma)",
    "Spiritual formation and personal transformation",
    "Network of like-minded ministry professionals and lifelong mentors"
]

export default function TheologySchoolPage() {
    const [activeLevel, setActiveLevel] = useState(1)

    const scrollToPrograms = () => {
        document.getElementById('programs-section')?.scrollIntoView({ behavior: 'smooth' })
    }

    return (
        <>
            <div className="min-h-screen bg-gray-50 pb-20">
                {/* Hero Section */}
                <div className="bg-[#140152] text-white pt-32 pb-20 px-4 relative overflow-hidden bg-cover bg-center bg-no-repeat" style={{ backgroundImage: 'url("/TheologyHero.jpg")' }}>
                    {/* Dark Overlay - More Transparent */}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#140152]/70 via-[#140152]/40 to-transparent pointer-events-none" />
                    <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-blue-500 rounded-full blur-[100px] opacity-20 translate-y-1/2 -translate-x-1/4 pointer-events-none" />

                    <div className="max-w-7xl mx-auto relative z-10 w-full text-center">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6 }}
                        >
                            <div className="inline-block px-4 py-1.5 rounded-full bg-white/10 border border-white/20 text-[#f5bb00] font-bold text-xs sm:text-sm tracking-widest uppercase mb-6 backdrop-blur-sm">
                                School of Theology
                            </div>
                            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-black mb-4 md:mb-6 leading-tight">
                                Transform Your Calling <br className="hidden md:block" />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-white to-blue-200">
                                    Into Ministry
                                </span>
                            </h1>
                            <p className="text-blue-100/80 max-w-2xl mx-auto text-base sm:text-lg md:text-xl mb-6 md:mb-10 leading-relaxed">
                                Comprehensive theological education designed to equip you for impactful ministry.
                                From foundational biblical studies to advanced theological scholarship,
                                journey through three progressive levels of ministry formation.
                            </p>

                            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                                <Button
                                    onClick={scrollToPrograms}
                                    variant="outline"
                                    className="h-14 px-8 rounded-full border-white/20 text-white hover:bg-white hover:text-[#140152] bg-white/5 backdrop-blur-sm border-2 font-bold text-lg"
                                >
                                    Explore Programs
                                </Button>
                                <PremiumButton href="https://live.letw.org" target="_blank">
                                    Apply Now
                                </PremiumButton>
                            </div>
                        </motion.div>
                    </div>
                </div>

                <SectionWrapper>
                    <div className="max-w-7xl mx-auto space-y-24">

                        {/* Impact Section */}
                        <div className="space-y-12">
                            <div className="text-center max-w-3xl mx-auto">
                                <h2 className="text-3xl md:text-4xl font-black text-[#140152] mb-4">The Impact of Theological Education</h2>
                                <p className="text-lg text-gray-600">
                                    Our comprehensive programs don't just impart knowledge—they transform lives, build leaders, and equip servants for kingdom work.
                                </p>
                            </div>

                            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {IMPACT_POINTS.map((point, idx) => (
                                    <motion.div
                                        key={point.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ delay: idx * 0.1 }}
                                        className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all group"
                                    >
                                        <div className="flex items-start justify-between mb-6">
                                            <div className="w-12 h-12 rounded-xl bg-[#140152]/5 flex items-center justify-center text-[#140152] group-hover:bg-[#140152] group-hover:text-white transition-colors">
                                                <point.icon className="w-6 h-6" />
                                            </div>
                                            <span className="text-4xl font-black text-gray-100 select-none group-hover:text-[#f5bb00]/20 transition-colors">
                                                {point.id}
                                            </span>
                                        </div>
                                        <h3 className="text-xl font-bold text-[#140152] mb-3">{point.title}</h3>
                                        <p className="text-gray-600 leading-relaxed text-sm">
                                            {point.desc}
                                        </p>
                                    </motion.div>
                                ))}
                            </div>
                        </div>

                        {/* Programs Section */}
                        <div id="programs-section" className="scroll-mt-32 space-y-12">
                            <div className="text-center">
                                <h2 className="text-3xl md:text-4xl font-black text-[#140152] mb-4">Our Programs</h2>
                                <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                                    Three progressive levels designed to take you from foundational ministry training to advanced theological scholarship
                                </p>
                            </div>

                            {/* Level Tabs */}
                            <div className="flex flex-wrap justify-center gap-4 mb-8">
                                {[1, 2, 3].map((level) => (
                                    <button
                                        key={level}
                                        onClick={() => setActiveLevel(level)}
                                        className={`px-6 py-3 rounded-full font-bold text-sm md:text-base transition-all duration-300 ${activeLevel === level
                                            ? 'bg-[#140152] text-white shadow-lg scale-105'
                                            : 'bg-white text-gray-500 border border-gray-200 hover:bg-gray-50'
                                            }`}
                                    >
                                        Level {level}
                                    </button>
                                ))}
                            </div>

                            {/* Active Program Content */}
                            <div className="relative min-h-[600px]">
                                {PROGRAMS.map((program) => (
                                    activeLevel === program.level && (
                                        <motion.div
                                            key={program.level}
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -20 }}
                                            transition={{ duration: 0.3 }}
                                            className="bg-white rounded-[2.5rem] shadow-xl border border-gray-100 overflow-hidden"
                                        >
                                            <div className={`h-3 bg-gradient-to-r ${program.color}`} />
                                            <div className="p-6 md:p-12 space-y-12">
                                                {/* Header */}
                                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 items-start">
                                                    <div className="lg:col-span-2 space-y-4 md:space-y-6">
                                                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-gray-100 text-gray-600 rounded-lg text-xs font-bold uppercase tracking-wider">
                                                            Level {program.level}
                                                        </div>
                                                        <h3 className="text-2xl sm:text-3xl md:text-4xl font-black text-[#140152]">
                                                            {program.title}
                                                        </h3>
                                                        <div className="flex flex-wrap gap-2 md:gap-4 text-xs sm:text-sm font-medium text-gray-500">
                                                            <div className="flex items-center gap-2 bg-gray-50 px-2 sm:px-3 py-1.5 rounded-md">
                                                                <div className="w-2 h-2 rounded-full bg-[#f5bb00]" />
                                                                <span className="truncate">{program.duration}</span>
                                                            </div>
                                                            <div className="flex items-center gap-2 bg-gray-50 px-2 sm:px-3 py-1.5 rounded-md">
                                                                <div className="w-2 h-2 rounded-full bg-blue-500" />
                                                                <span className="truncate">{program.credits}</span>
                                                            </div>
                                                            <div className="flex items-center gap-2 bg-gray-50 px-2 sm:px-3 py-1.5 rounded-md">
                                                                <div className="w-2 h-2 rounded-full bg-green-500" />
                                                                <span className="truncate">{program.courses_count}</span>
                                                            </div>
                                                        </div>
                                                        <p className="text-sm sm:text-base md:text-lg text-gray-700 leading-relaxed">
                                                            {program.description}
                                                        </p>
                                                    </div>
                                                    <div className="bg-gray-50 p-4 md:p-6 rounded-2xl border border-gray-100 h-full">
                                                        <h4 className="font-bold text-[#140152] mb-3 flex items-center gap-2 text-sm md:text-base">
                                                            <CheckCircle className="w-4 md:w-5 h-4 md:h-5 text-green-600 flex-shrink-0" />
                                                            Entry Requirements
                                                        </h4>
                                                        <ul className="space-y-2 md:space-y-3 text-xs sm:text-sm text-gray-600 mb-4 md:mb-6">
                                                            {program.requirements.basics.map((req, i) => (
                                                                <li key={i} className="flex gap-2">
                                                                    <div className="w-1.5 h-1.5 rounded-full bg-gray-300 mt-1.5 flex-shrink-0" />
                                                                    {req}
                                                                </li>
                                                            ))}
                                                        </ul>
                                                        <PremiumButton href="https://live.letw.org" target="_blank">
                                                            Apply for Level {program.level}
                                                        </PremiumButton>
                                                    </div>
                                                </div>

                                                {/* Curriculum Grid */}
                                                <div>
                                                    <h4 className="text-xl md:text-2xl font-bold text-[#140152] mb-6 md:mb-8 pb-4 border-b border-gray-100">
                                                        Curriculum Structure
                                                    </h4>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                                                        {program.semesters.map((sem, idx) => (
                                                            <div key={idx} className="space-y-3 md:space-y-4">
                                                                <div className="flex items-center gap-3 mb-3 md:mb-4">
                                                                    <div className="w-8 h-8 rounded-full bg-[#f5bb00]/20 text-[#140152] flex items-center justify-center font-bold text-sm flex-shrink-0">
                                                                        {idx + 1}
                                                                    </div>
                                                                    <h5 className="font-bold text-base md:text-lg text-[#140152]">{sem.name}</h5>
                                                                </div>
                                                                <ul className="space-y-2 md:space-y-3">
                                                                    {sem.courses.map((course, cIdx) => (
                                                                        <li key={cIdx} className="flex items-center gap-3 p-2 md:p-3 bg-gray-50 rounded-lg border border-gray-100/50 hover:border-blue-100 transition-colors">
                                                                            <div className="w-1.5 h-1.5 rounded-full bg-blue-400 flex-shrink-0" />
                                                                            <span className="text-gray-700 font-medium text-xs sm:text-sm">{course}</span>
                                                                        </li>
                                                                    ))}
                                                                </ul>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>

                                                {/* Required Documents */}
                                                <div className="pt-6 md:pt-8 border-t border-gray-100">
                                                    <h4 className="font-bold text-[#140152] mb-3 md:mb-4 text-base md:text-lg">Required Documents</h4>
                                                    <div className="flex flex-wrap gap-2 md:gap-3">
                                                        {program.requirements.docs.map((doc, i) => (
                                                            <span key={i} className="inline-flex items-center gap-1.5 px-2.5 md:px-3 py-1.5 rounded-full bg-blue-50 text-blue-700 text-xs font-bold whitespace-nowrap">
                                                                <Scroll className="w-3 h-3 flex-shrink-0" />
                                                                {doc}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )
                                ))}
                            </div>
                        </div>

                        {/* Journey Timeline */}
                        <div className="space-y-12">
                            <div className="text-center">
                                <h2 className="text-3xl font-black text-[#140152] mb-4">Your Journey to Ministry Excellence</h2>
                                <p className="text-gray-600">A clear pathway from foundational training to advanced theological scholarship</p>
                            </div>

                            <div className="grid md:grid-cols-3 gap-8">
                                {JOURNEY_ITMES.map((item, i) => (
                                    <div key={i} className="relative group">
                                        <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm relative z-10 h-full hover:-translate-y-1 transition-transform duration-300">
                                            <div className="text-6xl font-black text-gray-100 absolute top-4 right-6 -z-10 group-hover:text-[#f5bb00]/10 transition-colors">
                                                {item.step}
                                            </div>
                                            <h3 className="text-xl font-bold text-[#140152] mb-4">{item.title}</h3>
                                            <p className="text-gray-600 leading-relaxed text-sm">
                                                {item.desc}
                                            </p>
                                        </div>
                                        {/* Connector line for mobile/desktop (simplified) */}
                                        {i < 2 && (
                                            <div className="hidden md:block absolute top-1/2 -right-4 w-8 h-0.5 bg-gray-200 z-0" />
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Gains & Bottom CTA */}
                        <div className="bg-[#140152] rounded-2xl md:rounded-[2.5rem] p-6 md:p-8 lg:p-16 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-[#f5bb00] rounded-full blur-[100px] opacity-10 pointer-events-none" />

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 relative z-10">
                                <div className="space-y-6 md:space-y-8">
                                    <div>
                                        <div className="text-[#f5bb00] font-bold tracking-widest uppercase mb-2 md:mb-4 text-xs md:text-sm">Why Join Us?</div>
                                        <h2 className="text-2xl sm:text-3xl md:text-5xl font-black text-white mb-4 md:mb-6">
                                            Begin Your <br className="hidden sm:block" />
                                            Theological Journey
                                        </h2>
                                        <p className="text-blue-100 text-base md:text-lg leading-relaxed">
                                            Take the first step toward transformative theological education and impactful ministry.
                                        </p>
                                    </div>
                                    <PremiumButton href="https://live.letw.org" target="_blank">
                                        Apply Now
                                    </PremiumButton>
                                </div>

                                <div className="space-y-4 md:space-y-6">
                                    <h3 className="text-lg md:text-xl font-bold text-white mb-4 md:mb-6">What You'll Gain</h3>
                                    <div className="space-y-3 md:space-y-4">
                                        {GAINS.map((gain, i) => (
                                            <div key={i} className="flex gap-3 md:gap-4 text-blue-100 text-sm md:text-base">
                                                <div className="w-5 md:w-6 h-5 md:h-6 rounded-full bg-[#f5bb00]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                                                    <CheckCircle className="w-3 md:w-3.5 h-3 md:h-3.5 text-[#f5bb00]" />
                                                </div>
                                                <span>{gain}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Additional Info */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 text-xs sm:text-sm text-gray-600 bg-gray-100/50 p-6 md:p-8 rounded-2xl">
                            <div>
                                <h4 className="font-bold text-[#140152] mb-2 md:mb-3 flex items-center gap-2 text-sm md:text-base">
                                    <Globe className="w-4 h-4 flex-shrink-0" /> Language & Study Readiness
                                </h4>
                                <ul className="list-disc pl-5 space-y-1 text-xs md:text-sm">
                                    <li>All programs taught in English with sufficient proficiency required</li>
                                    <li>Support resources available for academic writing and study skills development</li>
                                </ul>
                            </div>
                            <div>
                                <h4 className="font-bold text-[#140152] mb-2 md:mb-3 flex items-center gap-2 text-sm md:text-base">
                                    <Heart className="w-4 h-4 flex-shrink-0" /> Character & Community
                                </h4>
                                <ul className="list-disc pl-5 space-y-1 text-xs md:text-sm">
                                    <li>Demonstrate Christian character and ethical conduct</li>
                                    <li>Participate actively in spiritual formation activities</li>
                                    <li>Respect diversity within the global Christian community</li>
                                </ul>
                            </div>
                        </div>

                    </div>
                </SectionWrapper>
            </div>
        </>
    )
}
