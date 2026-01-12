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
                    <h1 className="text-2xl md:text-3xl lg:text-4xl font-heading font-black text-white leading-[1.1] ">
                        Where Faith Meets <span className="text-white">Light, </span>
                        Lives are <br/><span className="text-white">Changed.</span>
                    </h1>

                    <p className="text-lg md:text-xl text-white/90 max-w-xl ml-auto leading-relaxed font-heading font-medium">
                        Step into a space of hope, prayer, and transformation, your journey with God begins here.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center md:justify-end gap-6 pt-4">
                        <Link
                            href="/auth"
                            className="inline-flex items-center gap-2 bg-[#a57b00] hover:bg-[#fabb00] text-white font-semibold px-1 py-1 pl-6 rounded-full transition-all duration-300 shadow-lg hover:shadow-xl group"
                        >
                            Join Us
                             <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                                  <ArrowRight className="w-5 h-5 text-[#a57b00] -rotate-45 transition-transform group-hover:translate-x-0.5" />
                                </div>
                        </Link>
                        <button className="flex items-center gap-2 px-0.5 py-0.5 pl-5 rounded-full font-poppins text-md font-semibold text-[#140152] text-bold bg-white backdrop-blur-md border border-white/90 hover:bg-white/20 transition-all group">
                            Play Sermons
                            <div className="w-10 h-10 rounded-full bg-[#a57b00] flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                                <Play className="w-4 h-4 text-white fill-white" />
                            </div>
                        </button>
                    </div>
                </motion.div>
                 
            </div>
        </section>
    );
}
