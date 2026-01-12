"use client";

import { motion } from "framer-motion";
import { Button } from "../ui/Button";
import { ArrowRight, Heart } from "lucide-react";

export default function VerseOfTheDay() {
    return (
        <section className="relative py-32 overflow-hidden group">
            {/* Background with slight zoom effect */}
            <div
                className="absolute inset-0 z-0 transition-transform duration-[20s] ease-linear group-hover:scale-110"
                style={{
                    backgroundImage: `linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.7)), url('https://images.unsplash.com/photo-1438234591033-699745778930?q=80&w=2070&auto=format&fit=crop')`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                }}
            />

            <div className="section-container relative z-10">
                <div className="max-w-4xl space-y-8">
                    <div className="flex items-center gap-2 text-primary font-bold tracking-widest text-sm uppercase">
                        <div className="w-2 h-2 rotate-45 bg-primary" />
                        Verse Of The Day
                    </div>

                    <h2 className="text-5xl md:text-7xl font-heading font-black text-white uppercase leading-[1.1] tracking-tight">
                        Life is a Church that loves <br />
                        <span className="text-primary italic underline decoration-white/20">God and People.</span>
                    </h2>

                    <p className="text-xl text-white/80 max-w-2xl leading-relaxed">
                        Life is a church dedicated to loving God and serving people. We foster a welcoming community where faith and compassion drive everything we do, striving to make a positive impact both spiritually and socially. Join us in this journey.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center gap-6 pt-4">
                        <Button size="lg" className="px-10 group">
                            Donate Now <ArrowRight className="w-5 h-5 ml-2 transition-transform group-hover:translate-x-1" />
                        </Button>

                        <div className="flex items-center gap-4 text-white font-bold group/stats cursor-pointer">
                            <div className="w-12 h-12 rounded-full border border-white/20 flex items-center justify-center group-hover/stats:bg-white group-hover/stats:text-primary transition-all">
                                <Heart className="w-5 h-5" />
                            </div>
                            <span>1.2k People Blessed Today</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Floating Decorative Elements */}
            <div className="absolute top-1/4 -right-20 w-80 h-80 bg-primary/20 rounded-full blur-[100px] opacity-50" />
            <div className="absolute bottom-1/4 -left-20 w-60 h-60 bg-secondary/20 rounded-full blur-[80px] opacity-30" />
        </section>
    );
}
