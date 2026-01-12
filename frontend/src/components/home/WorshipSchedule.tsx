"use client";

import { motion } from "framer-motion";
import { ArrowRight, Clock } from "lucide-react";

const services = [
    {
        title: "Youth Worship",
        description: "Engaging teens in faith, fellowship, and growth.",
        image: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=2070&auto=format&fit=crop",
        size: "large",
    },
    {
        title: "Children's Worship",
        description: "Fun, faith-filled worship for kids ages 4-12.",
        image: "https://images.unsplash.com/photo-1543706062-2f3b972d317b?q=80&w=2070&auto=format&fit=crop",
        size: "small",
    },
    {
        title: "Sunday School Worship",
        description: "Learning and worship for all ages.",
        image: "https://images.unsplash.com/photo-1490730141103-6cac27aaab94?q=80&w=2070&auto=format&fit=crop",
        size: "small",
    },
    {
        title: "Children's Worship",
        description: "Fun, faith-filled worship for kids ages 4-12.",
        image: "https://images.unsplash.com/photo-1543706062-2f3b972d317b?q=80&w=2070&auto=format&fit=crop",
        size: "small",
    },
];

export default function WorshipSchedule() {
    return (
        <section className="py-24 bg-white">
            <div className="section-container">
                <div className="text-center space-y-4 mb-16">
                    <div className="flex items-center justify-center gap-2 text-primary font-bold tracking-widest text-sm uppercase">
                        <div className="w-2 h-2 rotate-45 bg-primary" />
                        Worship With Us
                    </div>
                    <h2 className="text-4xl md:text-5xl font-heading font-black text-zinc-900 uppercase">
                        Join Us On Sunday At <br />
                        <span className="text-primary italic">8:00 & 9:00 AM</span>
                    </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 h-[700px]">
                    {/* Main Large Card */}
                    <div className="md:col-span-7 relative group overflow-hidden rounded-[2.5rem]">
                        <img
                            src={services[0].image}
                            alt={services[0].title}
                            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                        <div className="absolute bottom-0 left-0 p-10 w-full">
                            <div className="bg-white/10 backdrop-blur-md rounded-[2rem] p-8 border border-white/20 flex items-center justify-between gap-6">
                                <div className="space-y-2">
                                    <h3 className="text-3xl font-heading font-bold text-white">{services[0].title}</h3>
                                    <p className="text-white/70">{services[0].description}</p>
                                </div>
                                <button className="w-14 h-14 rounded-full bg-primary text-white flex items-center justify-center shrink-0 hover:scale-110 transition-transform">
                                    <ArrowRight className="w-6 h-6" />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Side Cards */}
                    <div className="md:col-span-5 flex flex-col gap-6">
                        {services.slice(1).map((service, i) => (
                            <div key={i} className="flex-1 relative group overflow-hidden rounded-[2rem] flex items-center p-6 bg-zinc-50 border border-zinc-100 hover:border-primary/20 transition-all duration-300">
                                <div className="w-32 h-32 shrink-0 rounded-2xl overflow-hidden relative">
                                    <img src={service.image} alt={service.title} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                                </div>
                                <div className="ml-6 space-y-2 pr-12">
                                    <h4 className="text-xl font-heading font-bold text-zinc-900">{service.title}</h4>
                                    <p className="text-zinc-500 text-sm">{service.description}</p>
                                </div>
                                <button className="absolute right-6 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                                    <ArrowRight className="w-5 h-5" />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
