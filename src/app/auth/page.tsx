"use client";

import React, { useState } from "react";
import PageLayout from "@/components/layout/PageLayout";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Lock, User, ArrowRight, Github, Chrome as Google } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function AuthPage() {
    const [mode, setMode] = useState<"login" | "signup">("signup");

    return (
        <PageLayout>
            <section className="min-h-screen pt-32 pb-24 bg-surface flex items-center justify-center overflow-hidden relative">
                {/* Background blobs */}
                <div className="absolute top-1/4 -right-20 w-96 h-96 bg-primary/10 rounded-full blur-[100px]" />
                <div className="absolute bottom-1/4 -left-20 w-80 h-80 bg-secondary/10 rounded-full blur-[100px]" />

                <div className="section-container relative z-10 w-full max-w-xl">
                    <div className="bg-white rounded-[4rem] shadow-2xl overflow-hidden border border-zinc-100 flex flex-col">
                        {/* Header Toggle */}
                        <div className="flex p-4 bg-zinc-50 rounded-b-[3rem]">
                            <button
                                onClick={() => setMode("login")}
                                className={`flex-1 py-4 rounded-[2rem] font-bold transition-all ${mode === "login" ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-400 hover:text-zinc-600"}`}
                            >
                                Log In
                            </button>
                            <button
                                onClick={() => setMode("signup")}
                                className={`flex-1 py-4 rounded-[2rem] font-bold transition-all ${mode === "signup" ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-400 hover:text-zinc-600"}`}
                            >
                                Sign Up
                            </button>
                        </div>

                        {/* Form Content */}
                        <div className="p-8 md:p-14 space-y-8">
                            <div className="text-center space-y-2">
                                <h1 className="text-4xl font-heading font-black text-zinc-900 uppercase">
                                    {mode === "login" ? "Welcome Back" : "Join Our Family"}
                                </h1>
                                <p className="text-zinc-500">
                                    {mode === "login"
                                        ? "Sign in to access your personal dashboard and study plan."
                                        : "Create an account to join the community and start your journey."}
                                </p>
                            </div>

                            <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
                                <AnimatePresence mode="wait">
                                    {mode === "signup" && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: "auto" }}
                                            exit={{ opacity: 0, height: 0 }}
                                            className="space-y-2"
                                        >
                                            <div className="relative group">
                                                <User className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-primary transition-colors" />
                                                <input type="text" placeholder="Full Name" className="w-full pl-14 pr-6 py-4 rounded-2xl bg-zinc-50 border border-zinc-100 focus:border-primary outline-none transition-all" />
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                <div className="space-y-4">
                                    <div className="relative group">
                                        <Mail className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-primary transition-colors" />
                                        <input type="email" placeholder="Email Address" className="w-full pl-14 pr-6 py-4 rounded-2xl bg-zinc-50 border border-zinc-100 focus:border-primary outline-none transition-all" />
                                    </div>
                                    <div className="relative group">
                                        <Lock className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-primary transition-colors" />
                                        <input type="password" placeholder="Password" className="w-full pl-14 pr-6 py-4 rounded-2xl bg-zinc-50 border border-zinc-100 focus:border-primary outline-none transition-all" />
                                    </div>
                                </div>

                                {mode === "login" && (
                                    <div className="text-right">
                                        <button className="text-sm font-bold text-primary hover:underline">Forgot Password?</button>
                                    </div>
                                )}

                                <Button className="w-full py-5 text-lg group">
                                    {mode === "login" ? "Log In Now" : "Create Account"}
                                    <ArrowRight className="w-6 h-6 ml-2 transition-transform group-hover:translate-x-1" />
                                </Button>
                            </form>

                            <div className="relative py-4">
                                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-zinc-100"></div></div>
                                <div className="relative flex justify-center text-sm uppercase">
                                    <span className="bg-white px-4 text-zinc-400 font-bold tracking-widest">Or continue with</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <button className="flex items-center justify-center gap-2 py-4 border border-zinc-100 rounded-2xl hover:bg-zinc-50 transition-all font-bold text-zinc-600">
                                    <Google className="w-5 h-5" /> Google
                                </button>
                                <button className="flex items-center justify-center gap-2 py-4 border border-zinc-100 rounded-2xl hover:bg-zinc-50 transition-all font-bold text-zinc-600">
                                    <Github className="w-5 h-5" /> GitHub
                                </button>
                            </div>

                            <p className="text-center text-sm text-zinc-500">
                                By continuing, you agree to our <button className="font-bold text-zinc-900 border-b border-zinc-200">Terms of Service</button> and <button className="font-bold text-zinc-900 border-b border-zinc-200">Privacy Policy</button>.
                            </p>
                        </div>
                    </div>
                </div>
            </section>
        </PageLayout>
    );
}
