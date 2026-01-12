"use client";

import React, { useState } from "react";
import PageLayout from "@/components/layout/PageLayout";
import { motion } from "framer-motion";
import { Search, Calendar, CheckCircle2, ChevronRight, Book } from "lucide-react";
import { Button } from "@/components/ui/Button";

// Simplified data for demonstration
const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
];

const generatePlan = (month: string) => {
    return Array.from({ length: 30 }, (_, i) => ({
        day: i + 1,
        title: `Day ${i + 1}`,
        reading: `Genesis ${i * 2 + 1}-${i * 2 + 2}, Psalm ${i + 1}`,
        completed: false
    }));
};

export default function BibleStudyPlanPage() {
    const [selectedMonth, setSelectedMonth] = useState("January");
    const [plan, setPlan] = useState(generatePlan("January"));

    const toggleComplete = (index: number) => {
        const newPlan = [...plan];
        newPlan[index].completed = !newPlan[index].completed;
        setPlan(newPlan);
    };

    return (
        <PageLayout>
            <section className="relative py-32 bg-zinc-950 overflow-hidden">
                <div className="absolute inset-0 z-0 opacity-30">
                    <img src="https://images.unsplash.com/photo-1504052434569-7c9302e015e1?q=80&w=2070&auto=format&fit=crop" className="w-full h-full object-cover" />
                </div>
                <div className="section-container relative z-10 space-y-8">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="text-primary font-bold tracking-widest uppercase flex items-center gap-2"
                    >
                        <div className="w-3 h-3 rotate-45 bg-primary" />
                        Spiritual Growth
                    </motion.div>
                    <h1 className="text-5xl md:text-7xl font-heading font-black text-white uppercase leading-tight max-w-4xl italic">
                        Personalize Your <br /> <span className="text-primary not-italic">Bible Study Journey</span>
                    </h1>
                    <p className="text-zinc-400 text-xl max-w-2xl leading-relaxed">
                        Generate a comprehensive 1-year Bible reading plan tailored to your schedule. Stay consistent and grow deeper in your walk with the Word.
                    </p>
                </div>
            </section>

            <section className="py-24 bg-white">
                <div className="section-container">
                    <div className="flex flex-col lg:flex-row gap-12">
                        {/* Sidebar Controls */}
                        <aside className="lg:w-80 space-y-8">
                            <div className="bg-zinc-50 p-8 rounded-[2.5rem] border border-zinc-100 space-y-6">
                                <h3 className="text-xl font-bold font-heading uppercase flex items-center gap-3 text-zinc-900 border-b pb-4">
                                    <Calendar className="w-6 h-6 text-primary" />
                                    Select Month
                                </h3>
                                <div className="grid grid-cols-1 gap-2">
                                    {months.map((m) => (
                                        <button
                                            key={m}
                                            onClick={() => setSelectedMonth(m)}
                                            className={`text-left px-4 py-3 rounded-xl font-bold transition-all ${selectedMonth === m
                                                    ? "bg-primary text-white shadow-lg shadow-primary/20 scale-105"
                                                    : "text-zinc-500 hover:bg-zinc-100"
                                                }`}
                                        >
                                            {m}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="bg-zinc-950 p-8 rounded-[2.5rem] text-white overflow-hidden relative group">
                                <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary/20 rounded-full blur-3xl" />
                                <h4 className="text-xl font-bold font-heading mb-4 relative z-10">Progress</h4>
                                <div className="w-full h-2 bg-white/10 rounded-full mb-4 relative z-10 overflow-hidden">
                                    <motion.div
                                        className="h-full bg-primary"
                                        initial={{ width: 0 }}
                                        animate={{ width: `${(plan.filter(p => p.completed).length / plan.length) * 100}%` }}
                                    />
                                </div>
                                <p className="text-zinc-400 relative z-10 font-bold">
                                    {plan.filter(p => p.completed).length} of {plan.length} days completed
                                </p>
                                <Button className="w-full mt-6 py-4 rounded-2xl relative z-10">Generate PDF Plan</Button>
                            </div>
                        </aside>

                        {/* Plan Display */}
                        <div className="flex-1 space-y-6">
                            <div className="flex items-center justify-between mb-8">
                                <h2 className="text-4xl font-heading font-black text-zinc-900 uppercase">
                                    Reading Plan : <span className="text-primary italic">{selectedMonth}</span>
                                </h2>
                                <div className="relative group">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 group-hover:text-primary transition-colors" />
                                    <input
                                        type="text"
                                        placeholder="Search scriptures..."
                                        className="pl-12 pr-6 py-3 bg-zinc-50 rounded-full border border-zinc-100 outline-none focus:border-primary transition-all w-64"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-4">
                                {plan.map((item, i) => (
                                    <motion.div
                                        key={i}
                                        whileHover={{ x: 10 }}
                                        className={`flex items-center justify-between p-6 rounded-[2rem] border transition-all ${item.completed
                                                ? "bg-primary/5 border-primary/20"
                                                : "bg-white border-zinc-100 hover:border-primary/20 hover:shadow-xl hover:shadow-primary/5"
                                            }`}
                                    >
                                        <div className="flex items-center gap-6">
                                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-xl ${item.completed ? "bg-primary text-white" : "bg-zinc-100 text-zinc-500"
                                                }`}>
                                                {item.day}
                                            </div>
                                            <div className="space-y-1">
                                                <h4 className={`text-xl font-bold font-heading ${item.completed ? "text-primary" : "text-zinc-900"}`}>
                                                    {item.reading}
                                                </h4>
                                                <p className="text-zinc-500 text-sm flex items-center gap-2">
                                                    <Book className="w-4 h-4" /> Comprehensive Bible Commentary Available
                                                </p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => toggleComplete(i)}
                                            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${item.completed ? "bg-primary text-white shadow-lg" : "border-2 border-zinc-100 text-zinc-200 hover:border-primary hover:text-primary"
                                                }`}
                                        >
                                            <CheckCircle2 className="w-6 h-6" />
                                        </button>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </PageLayout>
    );
}
