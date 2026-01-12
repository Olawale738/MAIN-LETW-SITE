"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Clock, Bell } from "lucide-react";
import { Button } from "../ui/Button";

interface ComingSoonModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
}

export default function ComingSoonModal({ isOpen, onClose, title }: ComingSoonModalProps) {
    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-white rounded-[3rem] p-12 z-[101] shadow-2xl border border-zinc-100"
                    >
                        <button
                            onClick={onClose}
                            className="absolute top-8 right-8 p-2 rounded-full hover:bg-zinc-100 transition-colors"
                        >
                            <X className="w-6 h-6 text-zinc-400" />
                        </button>

                        <div className="text-center space-y-8">
                            <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto text-primary">
                                <Clock className="w-12 h-12" />
                            </div>

                            <div className="space-y-4">
                                <h2 className="text-4xl font-heading font-black text-zinc-900 uppercase">
                                    {title}
                                </h2>
                                <div className="bg-primary px-6 py-2 rounded-full text-white font-bold tracking-widest text-lg animate-pulse inline-block">
                                    COMING SOON
                                </div>
                            </div>

                            <p className="text-zinc-500 text-lg leading-relaxed">
                                We are currently developing this program to better serve our community. Stay tuned for updates and announcements!
                            </p>

                            <div className="pt-4 flex flex-col gap-4">
                                <Button className="w-full flex items-center justify-center gap-2">
                                    <Bell className="w-5 h-5" /> Notify Me When Ready
                                </Button>
                                <button
                                    onClick={onClose}
                                    className="text-zinc-400 font-bold hover:text-zinc-600 transition-colors"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
