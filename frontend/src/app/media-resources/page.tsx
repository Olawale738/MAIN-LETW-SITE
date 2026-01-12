"use client";

import PageLayout from "@/components/layout/PageLayout";
import { motion } from "framer-motion";
import { Headphones, BookOpen, MessageSquare, Download, Share2, Play } from "lucide-react";
import { Button } from "@/components/ui/Button";

const audioMessages = [
    { title: "Living with Purpose", speaker: "Pst. Chris", date: "Aug 12, 2024", duration: "42:15" },
    { title: "The Grace Factor", speaker: "Min. Sarah", date: "Aug 05, 2024", duration: "35:40" },
    { title: "Walking by Faith", speaker: "Pst. Chris", date: "July 29, 2024", duration: "51:20" },
];

export default function MediaResourcesPage() {
    return (
        <PageLayout>
            <section className="relative py-40 bg-zinc-950 overflow-hidden">
                <div className="absolute inset-0 z-0 opacity-40">
                    <img src="https://images.unsplash.com/photo-1438032005730-c779502df39b?q=80&w=2071&auto=format&fit=crop" className="w-full h-full object-cover" />
                </div>
                <div className="section-container relative z-10 text-center space-y-6">
                    <div className="flex items-center gap-2 text-primary font-bold tracking-widest text-sm bg-white/10 backdrop-blur-md px-4 py-2 rounded-full uppercase border border-white/10 w-fit mx-auto">
                        Resources Hub
                    </div>
                    <h1 className="text-5xl md:text-8xl font-heading font-black text-white uppercase italic">
                        Equipping <br /> <span className="text-primary not-italic">The Saints</span>
                    </h1>
                </div>
            </section>

            {/* Audio Messages Section */}
            <section className="py-24 bg-white" id="audio">
                <div className="section-container">
                    <div className="flex flex-col md:flex-row items-center justify-between mb-16 gap-6">
                        <div className="space-y-2">
                            <h2 className="text-4xl font-heading font-black text-zinc-900 uppercase">Audio Messages</h2>
                            <p className="text-zinc-500">Listen on the go to our latest teachings.</p>
                        </div>
                        <Button variant="outline">Browse SoundCloud</Button>
                    </div>
                    <div className="grid grid-cols-1 gap-4">
                        {audioMessages.map((msg, i) => (
                            <div key={i} className="flex flex-col md:flex-row items-center justify-between p-8 rounded-[2.5rem] bg-zinc-50 border border-zinc-100 hover:bg-white hover:shadow-xl hover:border-primary/20 transition-all group">
                                <div className="flex items-center gap-6 mb-4 md:mb-0">
                                    <div className="w-16 h-16 rounded-2xl bg-primary text-white flex items-center justify-center group-hover:scale-110 transition-transform">
                                        <Headphones className="w-8 h-8" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-zinc-900">{msg.title}</h3>
                                        <p className="text-zinc-500 text-sm">{msg.speaker} • {msg.date}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className="text-zinc-400 font-bold mr-4">{msg.duration}</span>
                                    <button className="w-12 h-12 rounded-full border border-zinc-200 flex items-center justify-center text-zinc-400 hover:text-primary hover:border-primary transition-all">
                                        <Download className="w-5 h-5" />
                                    </button>
                                    <button className="px-8 py-3 rounded-full bg-zinc-900 text-white font-bold hover:bg-primary transition-colors flex items-center gap-2">
                                        <Play className="w-4 h-4 fill-white" /> Listen
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Devotionals Section */}
            <section className="py-24 bg-surface" id="devotionals">
                <div className="section-container">
                    <div className="flex flex-col md:flex-row gap-16 items-center">
                        <div className="flex-1 space-y-8">
                            <div className="w-16 h-16 rounded-2xl bg-secondary/10 flex items-center justify-center text-secondary">
                                <BookOpen className="w-8 h-8" />
                            </div>
                            <h2 className="text-4xl md:text-5xl font-heading font-black text-zinc-900 uppercase">Daily Devotionals</h2>
                            <p className="text-zinc-500 text-lg leading-relaxed">
                                Start your day with spiritual nourishment. Our daily devotionals are designed to help you stay connected to God's word throughout the week.
                            </p>
                            <div className="space-y-4">
                                {["Daily Bread", "Streams in the Desert", "Morning Glory"].map((dev) => (
                                    <div key={dev} className="flex items-center justify-between p-6 bg-white rounded-2xl border border-zinc-100 font-bold text-zinc-700">
                                        {dev}
                                        <Download className="w-5 h-5 text-primary" />
                                    </div>
                                ))}
                            </div>
                            <Button size="lg" className="px-12">View All Devotionals</Button>
                        </div>
                        <div className="flex-1">
                            <div className="relative rounded-[3rem] overflow-hidden shadow-2xl skew-y-1">
                                <img src="https://images.unsplash.com/photo-1504052434569-7c9302e015e1?q=80&w=2070&auto=format&fit=crop" className="w-full h-[500px] object-cover" />
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Testimonies Section */}
            <section className="py-24 bg-white" id="testimonies">
                <div className="section-container">
                    <div className="text-center space-y-4 mb-16">
                        <h2 className="text-4xl md:text-6xl font-heading font-black text-zinc-900 uppercase">Testimonies</h2>
                        <p className="text-zinc-500 max-w-xl mx-auto italic">"And they overcame him by the blood of the Lamb, and by the word of their testimony..."</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="p-10 rounded-[2.5rem] bg-zinc-50 border border-zinc-100 space-y-6 hover:shadow-xl transition-all group">
                                <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center text-white">
                                    <MessageSquare className="w-6 h-6" />
                                </div>
                                <p className="text-zinc-600 text-lg leading-relaxed italic">
                                    "My life was completely transformed when I joined this family. The support, the prayer, and the word have been a pillar for me and my household."
                                </p>
                                <div className="flex items-center gap-4 border-t border-zinc-200 pt-6">
                                    <div className="w-12 h-12 rounded-full bg-zinc-300" />
                                    <div>
                                        <h4 className="font-bold text-zinc-900">Member Name</h4>
                                        <p className="text-sm text-zinc-400">August 2024</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        </PageLayout>
    );
}
