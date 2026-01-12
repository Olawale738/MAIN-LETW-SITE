"use client";

import { motion } from "framer-motion";

export default function Ticker() {
    const items = Array(10).fill("Love Your Neighbor As Yourself");

    return (
        <div className="bg-primary py-4 overflow-hidden border-y border-white/10 uppercase font-heading font-black tracking-widest text-white whitespace-nowrap relative select-none">
            <motion.div
                animate={{ x: ["0%", "-50%"] }}
                transition={{ repeat: Infinity, duration: 20, ease: "linear" }}
                className="inline-flex gap-8"
            >
                {[...items, ...items].map((text, i) => (
                    <div key={i} className="flex items-center gap-8">
                        <span className="text-xl md:text-2xl">{text}</span>
                        <div className="w-3 h-3 rotate-45 bg-white/40" />
                    </div>
                ))}
            </motion.div>
        </div>
    );
}
