"use client";

import { motion } from "framer-motion";
import { Button } from "../ui/Button";
import { ArrowRight, Play } from "lucide-react";

export default function Hero() {
    return (
        <section className="relative h-screen min-h-[800px] flex items-center justify-center overflow-hidden">
            {/* Background Image */}
            <div
                className="absolute inset-0 z-0 bg-fixed bg-cover bg-center transition-transform duration-1000 scale-105"
                style={{
                    backgroundImage: `linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.6)), url('https://images.unsplash.com/photo-1438032005730-c779502df39b?q=80&w=2071&auto=format&fit=crop')`
                }}
            />

            {/* Content */}
            <div className="section-container relative z-10 text-center">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    className="space-y-8"
                >
                    <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/20 text-white font-medium text-sm">
                        <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                        MAKE A DIFFERENCE TODAY
                    </div>

                    <h1 className="text-5xl md:text-7xl lg:text-8xl font-heading font-black text-white leading-[1.1] tracking-tight max-w-5xl mx-auto uppercase">
                        Loving God, Loving Other <br />
                        <span className="text-primary italic">and serving</span> the world!
                    </h1>

                    <p className="text-xl md:text-2xl text-white/80 max-w-2xl mx-auto leading-relaxed font-body">
                        Experience God's love and grace in a welcoming community where faith grows, hope thrives, and everyone is cherished.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-8">
                        <Button size="lg" className="px-10 group">
                            Join In Person <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                        </Button>
                        <Button size="lg" variant="white" className="px-10 group">
                            Donate Now <span className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center ml-2 border border-primary/20"><ArrowRight className="w-4 h-4 text-primary" /></span>
                        </Button>
                    </div>
                </motion.div>
            </div>

            {/* Scroll Indicator */}
            <motion.div
                animate={{ y: [0, 10, 0] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="absolute bottom-10 left-1/2 -translate-x-1/2 z-10 hidden md:block"
            >
                <div className="w-8 h-12 rounded-full border-2 border-white/30 flex items-start justify-center p-2">
                    <div className="w-1.5 h-3 bg-white/60 rounded-full" />
                </div>
            </motion.div>
        </section>
    );
}
