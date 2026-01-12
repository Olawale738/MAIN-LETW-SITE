"use client";

import React, { useState } from "react";
import PageLayout from "@/components/layout/PageLayout";
import { motion, AnimatePresence } from "framer-motion";
import { Users, User, UserGroupIcon, Calendar, Clock, MessageSquare, CheckCircle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";

const categories = [
    { id: "individual", title: "Individual", icon: User, description: "One-on-one session for personal spiritual guidance and support." },
    { id: "family", title: "Family", icon: Users, description: "Counselling for couples or families seeking peace and reconciliation." },
    { id: "group", title: "Larger Group", icon: Users, description: "Support for group dynamics, fellowships, or ministry teams." },
];

export default function CounsellingPage() {
    const [selectedCategory, setSelectedCategory] = useState("individual");
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitted(true);
    };

    return (
        <PageLayout>
            <section className="relative py-32 bg-secondary text-white overflow-hidden">
                <div className="absolute inset-0 z-0 opacity-20">
                    <img src="https://images.unsplash.com/photo-1544027993-37dbfe43562a?q=80&w=2070&auto=format&fit=crop" className="w-full h-full object-cover" />
                </div>
                <div className="section-container relative z-10 space-y-8 text-center max-w-4xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="inline-flex items-center gap-2 text-white font-bold tracking-widest text-sm bg-white/10 backdrop-blur-md px-4 py-2 rounded-full uppercase border border-white/20"
                    >
                        Support & Guidance
                    </motion.div>
                    <h1 className="text-5xl md:text-8xl font-heading font-black uppercase italic leading-tight">
                        How can we <span className="text-primary italic">Support You?</span>
                    </h1>
                    <p className="text-white/80 text-xl leading-relaxed">
                        Our dedicated team is here to listen, pray, and guide you through life's challenges. Book a session that fits your needs.
                    </p>
                </div>
            </section>

            <section className="py-24 bg-white relative overflow-hidden">
                {/* Decorative background circle */}
                <div className="absolute -bottom-40 -left-40 w-[600px] h-[600px] bg-secondary/5 rounded-full blur-[120px]" />

                <div className="section-container">
                    <AnimatePresence mode="wait">
                        {!submitted ? (
                            <motion.div
                                key="form"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-start"
                            >
                                {/* Left Side: Choices */}
                                <div className="lg:col-span-4 space-y-8">
                                    <h3 className="text-2xl font-bold font-heading uppercase text-zinc-900">Select Category</h3>
                                    <div className="space-y-4">
                                        {categories.map((cat) => (
                                            <button
                                                key={cat.id}
                                                onClick={() => setSelectedCategory(cat.id)}
                                                className={`w-full p-6 rounded-[2rem] border-2 text-left transition-all group ${selectedCategory === cat.id
                                                        ? "bg-secondary border-secondary text-white shadow-xl shadow-secondary/20 scale-105"
                                                        : "bg-white border-zinc-100 text-zinc-600 hover:border-secondary/40"
                                                    }`}
                                            >
                                                <div className="flex items-center gap-4 mb-2">
                                                    <cat.icon className={`w-8 h-8 ${selectedCategory === cat.id ? "text-white" : "text-secondary"}`} />
                                                    <h4 className="text-xl font-bold font-heading">{cat.title}</h4>
                                                </div>
                                                <p className={`text-sm ${selectedCategory === cat.id ? "text-white/80" : "text-zinc-400"}`}>
                                                    {cat.description}
                                                </p>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Right Side: Form */}
                                <div className="lg:col-span-8 bg-zinc-50 p-8 md:p-12 rounded-[3.5rem] border border-zinc-100 shadow-sm">
                                    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="space-y-3">
                                            <label className="text-zinc-800 font-bold ml-4">Full Name</label>
                                            <input required type="text" placeholder="John Doe" className="w-full px-6 py-4 rounded-2xl border border-zinc-200 focus:border-secondary outline-none transition-all" />
                                        </div>
                                        <div className="space-y-3">
                                            <label className="text-zinc-800 font-bold ml-4">Email Address</label>
                                            <input required type="email" placeholder="john@example.com" className="w-full px-6 py-4 rounded-2xl border border-zinc-200 focus:border-secondary outline-none transition-all" />
                                        </div>
                                        <div className="space-y-3">
                                            <label className="text-zinc-800 font-bold ml-4">Phone Number</label>
                                            <input required type="tel" placeholder="+1 (234) 567-890" className="w-full px-6 py-4 rounded-2xl border border-zinc-200 focus:border-secondary outline-none transition-all" />
                                        </div>
                                        <div className="space-y-3 text-secondary">
                                            <label className="text-zinc-800 font-bold ml-4 italic">Preferred Method</label>
                                            <select className="w-full px-6 py-4 rounded-2xl border border-zinc-200 focus:border-secondary bg-white outline-none transition-all appearance-none cursor-pointer">
                                                <option>In-Person Meeting</option>
                                                <option>Video Call (Zoom)</option>
                                                <option>Phone Call</option>
                                            </select>
                                        </div>
                                        <div className="md:col-span-2 space-y-3">
                                            <label className="text-zinc-800 font-bold ml-4">Special Requests / Message</label>
                                            <textarea rows={4} placeholder="How can we specifically help you today?" className="w-full px-6 py-4 rounded-2xl border border-zinc-200 focus:border-secondary outline-none transition-all resize-none"></textarea>
                                        </div>
                                        <div className="md:col-span-2 pt-4">
                                            <Button type="submit" size="lg" className="w-full bg-secondary hover:bg-secondary/90 py-5 text-xl group">
                                                Book Session Now <ArrowRight className="w-6 h-6 ml-2 transition-transform group-hover:translate-x-1" />
                                            </Button>
                                        </div>
                                    </form>
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="success"
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="max-w-3xl mx-auto bg-zinc-950 p-16 rounded-[4rem] text-center text-white space-y-8 shadow-2xl relative overflow-hidden"
                            >
                                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-[100px]" />
                                <div className="w-24 h-24 bg-white/10 rounded-full flex items-center justify-center mx-auto text-primary border border-white/10">
                                    <CheckCircle className="w-12 h-12" />
                                </div>
                                <div className="space-y-4">
                                    <h2 className="text-4xl md:text-5xl font-heading font-black uppercase">Booking Received!</h2>
                                    <p className="text-zinc-400 text-lg leading-relaxed">
                                        Thank you for reaching out. A member of our pastoral team will contact you within 24 hours to confirm your scheduled time.
                                    </p>
                                </div>
                                <Button variant="white" onClick={() => setSubmitted(false)} className="px-12 py-5 text-xl">
                                    Book Another Session
                                </Button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </section>
        </PageLayout>
    );
}
