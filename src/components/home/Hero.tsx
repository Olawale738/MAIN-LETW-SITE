"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Button } from "../ui/Button";
import { ArrowRight, Play } from "lucide-react";

export default function Hero() {
    return (
        <section className="relative h-screen min-h-[700px] flex items-center overflow-hidden bg-[#061a40]">
            {/* Background Image */}
            <div
                className="absolute inset-0 z-0 bg-cover bg-center"
            >
                <img src="Hero.png" alt="LETW Logo" className="w-full h-full object-cover" />
            </div>



            {/* Content Container */}
            <div className="section-container relative z-10 w-full flex justify-end items-center">
                <motion.div
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className="max-w-l text-center md:text-right space-y-8"
                >
                    <h1 className="text-xl md:text-2xl lg:text-3xl font-heading font-black text-white leading-[1.1] tracking-tight uppercase">
                        Where Faith Meets <span className="text-white">Light,</span>
                        Lives are <span className="text-white">Changed.</span>
                    </h1>

                    <p className="text-lg md:text-xl text-white/90 max-w-xl ml-auto leading-relaxed font-heading font-medium">
                        Step into a space of hope, prayer, and transformation, your journey with God begins here.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center md:justify-end gap-6 pt-4">
                        <Link
                            href="/auth"
                            className="px-12 py-4 rounded-full font-heading font-black text-sm uppercase tracking-widest transition-all hover:scale-105 active:scale-95 bg-golden text-[#061a40] shadow-[0_10px_30px_rgba(0,0,0,0.3)]"
                        >
                            Join Us
                        </Link>
                        <button className="flex items-center gap-3 px-8 py-3 rounded-full font-heading font-black text-sm uppercase tracking-widest text-white bg-black/40 backdrop-blur-md border border-white/10 hover:bg-black/60 transition-all group">
                            Play Our Sermons
                            <div className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                                <Play className="w-4 h-4 text-white fill-white" />
                            </div>
                        </button>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}
