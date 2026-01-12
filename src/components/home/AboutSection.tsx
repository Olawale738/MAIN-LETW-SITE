"use client";

import Image from "next/image";
import { CheckCircle2, ArrowRight } from "lucide-react";
import { Button } from "../ui/Button";

const features = [
    "Share God's Love",
    "Foster Spiritual Growth",
    "Serve Our Community",
    "Build Strong Relationships",
];

export default function AboutSection() {
    return (
        <section className="py-24 bg-surface relative overflow-hidden">
            <div className="section-container grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
                {/* Image Collage */}
                <div className="relative">
                    <div className="relative z-10 rounded-[3rem] overflow-hidden shadow-2xl skew-y-1 group">
                        <img
                            src="https://images.unsplash.com/photo-1548625361-1250009617bc?q=80&w=2070&auto=format&fit=crop"
                            alt="Church Interior"
                            className="w-full h-[600px] object-cover transition-transform duration-700 group-hover:scale-110"
                        />
                    </div>

                    <div className="absolute -bottom-10 -left-10 z-20 w-72 h-72 rounded-[2rem] overflow-hidden border-[12px] border-surface shadow-xl hidden md:block group/small">
                        <img
                            src="https://images.unsplash.com/photo-1444333523264-70d30fe99923?q=80&w=2071&auto=format&fit=crop"
                            alt="Church Detail"
                            className="w-full h-full object-cover transition-transform duration-700 group-hover/small:scale-110"
                        />
                    </div>

                    <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary/10 rounded-full blur-3xl" />
                </div>

                {/* Content */}
                <div className="space-y-8">
                    <div className="inline-flex items-center gap-2 text-primary font-bold tracking-widest text-sm bg-primary/5 px-4 py-1 rounded-full uppercase">
                        <div className="w-2 h-2 rotate-45 bg-primary" />
                        About Us
                    </div>

                    <h2 className="text-4xl md:text-6xl font-heading font-black text-zinc-900 leading-tight">
                        Faith, Hope, and Love in <br />
                        <span className="text-primary italic">Action</span> every day
                    </h2>

                    <p className="text-zinc-600 text-lg leading-relaxed max-w-xl">
                        We are a vibrant community of believers dedicated to worship, fellowship, and service. Our mission is to share God's love, grow in faith, and make a positive impact in the world through compassionate outreach and meaningful connections.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                        {features.map((feature, i) => (
                            <div key={i} className="flex items-center gap-4 group">
                                <div className="w-12 h-12 rounded-xl bg-white shadow-sm flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all duration-300">
                                    <CheckCircle2 className="w-6 h-6" />
                                </div>
                                <span className="font-bold text-zinc-800">{feature}</span>
                            </div>
                        ))}
                    </div>

                    <div className="pt-8">
                        <Button size="lg" className="group">
                            Read More About Us <ArrowRight className="w-5 h-5 ml-2 transition-transform group-hover:translate-x-1" />
                        </Button>
                    </div>
                </div>
            </div>
        </section>
    );
}
