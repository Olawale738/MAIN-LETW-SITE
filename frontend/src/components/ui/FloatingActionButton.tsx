"use client";

import { motion } from "framer-motion";
import { ThumbsUp } from "lucide-react";

export default function FloatingActionButton() {
    return (
        <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="fixed bottom-10 right-10 z-50 w-20 h-20 bg-secondary text-white rounded-full shadow-2xl flex items-center justify-center hover:bg-secondary/90 transition-colors border-4 border-white/20"
        >
            <ThumbsUp className="w-8 h-8" />
        </motion.button>
    );
}
