"use client";

import { motion } from "framer-motion";
import { User, Tag, Clock, ArrowRight } from "lucide-react";
import Link from "next/link";

const sermons = [
    {
        title: "Start A New Way Of Living",
        speaker: "James Mitchell",
        category: "Faith & Trust",
        time: "7:00 AM To 10:00 AM",
        date: "03 Aug",
        image: "https://images.unsplash.com/photo-1438234591033-699745778930?q=80&w=2070&auto=format&fit=crop",
    },
    {
        title: "Overcoming Life's Challenges",
        speaker: "Grace Miller",
        category: "Pray",
        time: "10:00 AM To 11:00 AM",
        date: "09 Aug",
        image: "https://images.unsplash.com/photo-1548625361-1250009617bc?q=80&w=2070&auto=format&fit=crop",
    },
    {
        title: "Hope In Times Of Trouble",
        speaker: "Mary Johnson",
        category: "Pray",
        time: "6:00 AM To 7:00 AM",
        date: "08 Aug",
        image: "https://images.unsplash.com/photo-1438032005730-c779502df39b?q=80&w=2071&auto=format&fit=crop",
    },
];

export default function SermonsGrid() {
    return (
        <section className="py-24 bg-surface">
            <div className="section-container">
                <div className="text-center space-y-4 mb-16">
                    <div className="flex items-center justify-center gap-2 text-primary font-bold tracking-widest text-sm uppercase">
                        <div className="w-2 h-2 rotate-45 bg-primary" />
                        Our Sermons
                    </div>
                    <h2 className="text-4xl md:text-5xl font-heading font-black text-zinc-900 uppercase">
                        Our Latest <span className="text-primary italic">Sermons</span>
                    </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {sermons.map((sermon, i) => (
                        <motion.div
                            key={i}
                            whileHover={{ y: -10 }}
                            className="bg-white rounded-[2.5rem] overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col group"
                        >
                            {/* Image & Date Badge */}
                            <div className="relative h-64 overflow-hidden">
                                <img
                                    src={sermon.image}
                                    alt={sermon.title}
                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                />
                                <div className="absolute top-6 left-6 bg-primary text-white p-2 rounded-xl text-center min-w-[50px]">
                                    <span className="block text-xl font-bold font-heading leading-none">{sermon.date.split(' ')[0]}</span>
                                    <span className="text-[10px] uppercase font-bold opacity-80">{sermon.date.split(' ')[1]}</span>
                                </div>
                            </div>

                            {/* Content */}
                            <div className="p-8 space-y-6 flex-1 flex flex-col">
                                <h3 className="text-2xl font-bold font-heading text-zinc-900 leading-tight group-hover:text-primary transition-colors cursor-pointer">
                                    {sermon.title}
                                </h3>

                                <div className="space-y-3 pt-2">
                                    <div className="flex items-center gap-3 text-zinc-500">
                                        <User className="w-4 h-4 text-primary" />
                                        <span className="text-sm">Sermon From : <strong className="text-zinc-800">{sermon.speaker}</strong></span>
                                    </div>
                                    <div className="flex items-center gap-3 text-zinc-500">
                                        <Tag className="w-4 h-4 text-primary" />
                                        <span className="text-sm">Categories : <strong className="text-zinc-800">{sermon.category}</strong></span>
                                    </div>
                                    <div className="flex items-center gap-3 text-zinc-500">
                                        <Clock className="w-4 h-4 text-primary" />
                                        <span className="text-sm">Date & Time : <strong className="text-zinc-800">{sermon.time}</strong></span>
                                    </div>
                                </div>

                                <div className="pt-6 mt-auto border-t border-zinc-100">
                                    <Link href="/sermons" className="flex items-center justify-between text-primary font-bold group/link">
                                        Watch Sermon
                                        <div className="w-10 h-10 rounded-full bg-primary/5 flex items-center justify-center group-hover/link:bg-primary group-hover/link:text-white transition-all">
                                            <ArrowRight className="w-5 h-5" />
                                        </div>
                                    </Link>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
