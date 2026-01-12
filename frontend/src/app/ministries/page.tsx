"use client";

import PageLayout from "@/components/layout/PageLayout";
import { motion } from "framer-motion";
import { BookOpen, Heart, Globe, HandHelping, UserPlus, ShieldCheck, Briefcase, GraduationCap, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/Button";

const ministryCategories = [
    { id: "bible-study", title: "Bible Study", icon: BookOpen, content: "Deepen your understanding of the Word through our structured study sessions.", image: "https://images.unsplash.com/photo-1504052434569-7c9302e015e1?q=80&w=2070&auto=format&fit=crop" },
    { id: "prayer", title: "Prayer & Intercession", icon: Heart, content: "Join our prayer warriors as we intercede for our community and the world.", image: "https://images.unsplash.com/photo-1444333523264-70d30fe99923?q=80&w=2071&auto=format&fit=crop" },
    { id: "outreach", title: "Evangelism & Outreach", icon: Globe, content: "Spreading the gospel beyond our walls through various community initiatives.", image: "https://images.unsplash.com/photo-1511632765486-a01980e01a18?q=80&w=2070&auto=format&fit=crop" },
    { id: "charity", title: "Charity & Social Impact", icon: HandHelping, content: "Making a tangible difference by helping those in need in our local area.", image: "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?q=80&w=2070&auto=format&fit=crop" },
    { id: "discipleship", title: "Discipleship", icon: UserPlus, content: "Helping new and mature believers grow in their walk with Christ.", image: "https://images.unsplash.com/photo-1523240715634-9426f0bc0f05?q=80&w=2070&auto=format&fit=crop" },
    { id: "leadership", title: "Leadership Development", icon: ShieldCheck, content: "Equipping the next generation of spiritual and community leaders.", image: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?q=80&w=2070&auto=format&fit=crop" },
    { id: "career", title: "Career Guidance", icon: Briefcase, content: "Professional mentorship and guidance for career success and integrity.", image: "https://images.unsplash.com/photo-1521737711867-e3b97375f902?q=80&w=2067&auto=format&fit=crop" },
    { id: "skill", title: "Skill Development", icon: GraduationCap, content: "Empowering individuals with practical skills for better livelihood.", image: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?q=80&w=2070&auto=format&fit=crop" },
];

export default function MinistriesPage() {
    return (
        <PageLayout>
            {/* Ministries Hero */}
            <section className="relative py-40 bg-primary overflow-hidden">
                <div className="absolute inset-0 z-0 opacity-20">
                    <img src="https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=2070&auto=format&fit=crop" className="w-full h-full object-cover" />
                </div>
                <div className="section-container relative z-10 text-center space-y-6">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="inline-flex items-center gap-2 text-white font-bold tracking-widest text-sm bg-white/10 backdrop-blur-md px-4 py-2 rounded-full uppercase border border-white/20"
                    >
                        Our Ministries
                    </motion.div>
                    <h1 className="text-5xl md:text-8xl font-heading font-black text-white uppercase italic">
                        Diverse Ways <br /> <span className="text-white not-italic underline decoration-primary/50">To Serve</span>
                    </h1>
                </div>
            </section>

            {/* Categories Grid */}
            <section className="py-24 bg-white">
                <div className="section-container">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {ministryCategories.map((item) => (
                            <motion.div
                                key={item.id}
                                id={item.id}
                                whileHover={{ y: -15 }}
                                className="relative h-[450px] overflow-hidden rounded-[2.5rem] group scroll-mt-32"
                            >
                                <img
                                    src={item.image}
                                    alt={item.title}
                                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

                                <div className="absolute bottom-0 left-0 p-8 w-full space-y-4">
                                    <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center text-white">
                                        <item.icon className="w-6 h-6" />
                                    </div>
                                    <h3 className="text-2xl font-bold font-heading text-white">{item.title}</h3>
                                    <p className="text-white/70 text-sm line-clamp-3">
                                        {item.content}
                                    </p>
                                    <Button variant="ghost" className="p-0 text-primary hover:bg-transparent flex items-center gap-2 font-bold h-auto shadow-none">
                                        Join Ministry <ArrowUpRight className="w-4 h-4" />
                                    </Button>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Contact CTA */}
            <section className="bg-surface py-24 mb-0">
                <div className="section-container bg-zinc-950 rounded-[4rem] p-12 md:p-20 relative overflow-hidden flex flex-col items-center text-center space-y-8">
                    <div className="absolute -top-10 -right-10 w-64 h-64 bg-primary/20 rounded-full blur-[100px]" />
                    <h2 className="text-4xl md:text-6xl font-heading font-black text-white max-w-3xl">
                        Ready to <span className="text-primary italic">Get Involved</span> in any of our ministries?
                    </h2>
                    <p className="text-zinc-400 text-lg max-w-xl">
                        Download our membership form or contact the ministry heads to start your journey of impact today.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-6 pt-4">
                        <Button size="lg" className="px-12">Become A Member</Button>
                        <Button size="lg" variant="white" className="px-12">Contact Registry</Button>
                    </div>
                </div>
            </section>
        </PageLayout>
    );
}
