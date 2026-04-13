'use client';
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronDown, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ButtonConfig {
    text: string;
    link?: string;
    type: 'solid' | 'dropdown' | 'outline';
    options?: { title: string; link: string }[];
}

interface ButtonGroupBlockProps {
    data: {
        bg_color?: string;
        buttons: ButtonConfig[];
    }
}

const dropdownVariants = {
    closed: { opacity: 0, y: 10, scale: 0.95, display: "none" },
    open: {
        opacity: 1,
        y: 0,
        scale: 1,
        display: "block",
        transition: { type: "spring" as const, stiffness: 400, damping: 25 }
    }
};

function HoverDropdownButton({ btn }: { btn: ButtonConfig }) {
    const [isHovered, setIsHovered] = useState(false);

    return (
        <div 
            className="relative px-2 z-[60]"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <button className="flex items-center justify-center gap-2 bg-[#140152] hover:bg-blue-900 text-white rounded-full h-14 px-8 text-base font-medium shadow-lg shadow-[#140152]/20 transition-colors outline-none cursor-pointer group w-full">
                {btn.text} 
                <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isHovered ? "rotate-180" : ""}`} />
            </button>

            <AnimatePresence>
                {isHovered && (
                    <motion.div
                        initial="closed"
                        animate="open"
                        exit="closed"
                        variants={dropdownVariants}
                        className="absolute top-full right-0 left-0 sm:left-auto mt-2 w-full sm:w-56 bg-white rounded-2xl shadow-xl ring-1 ring-black/5 overflow-hidden p-2 z-[100] pointer-events-auto"
                        style={{ transformOrigin: "top" }}
                    >
                        {btn.options?.map((opt, oIdx) => (
                            <a
                                key={oIdx}
                                href={opt.link}
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="flex items-center gap-3 px-4 py-3 text-sm text-gray-600 hover:text-[#140152] hover:bg-gray-50 rounded-xl transition-colors group/item"
                            >
                                <div className="w-1.5 h-1.5 rounded-full bg-gray-300 group-hover/item:bg-[#f5bb00] transition-colors" />
                                <span className="flex-1 font-semibold text-[#140152]">{opt.title}</span>
                                <ExternalLink className="w-4 h-4 text-gray-400 opacity-50" />
                            </a>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

export default function ButtonGroupBlock({ data }: ButtonGroupBlockProps) {
    if (!data?.buttons || data.buttons.length === 0) return null;

    const bgClass = data.bg_color === 'white' 
        ? 'bg-white' 
        : 'bg-neutral-50 dark:bg-neutral-900';

    return (
        <section className={`py-12 ${bgClass} border-y border-gray-100 dark:border-neutral-800 relative z-50`}>
            <div className="container mx-auto px-4 flex flex-col sm:flex-row items-center justify-center gap-6">
                {data.buttons.map((btn, idx) => {
                    if (btn.type === 'dropdown') {
                        return <HoverDropdownButton key={idx} btn={btn} />;
                    }

                    return (
                        <div key={idx} className="relative z-10 w-full sm:w-auto">
                            <Button asChild size="lg" className="w-full bg-[#f5bb00] hover:bg-[#e0a800] text-[#140152] font-bold rounded-full h-14 px-8 text-base shadow-lg shadow-[#f5bb00]/30 transition-transform hover:-translate-y-1">
                                <a href={btn.link} target="_blank" rel="noopener noreferrer">{btn.text}</a>
                            </Button>
                        </div>
                    );
                })}
            </div>
        </section>
    );
}
