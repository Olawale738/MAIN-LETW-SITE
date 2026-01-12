"use client";

import { motion } from "framer-motion";

const stats = [
    { label: "Oldest Member", value: "350+", description: "Our oldest member is Mary Thompson, who is 95 years old and has been attending since 1945." },
    { label: "Youth Retreats", value: "98+", description: "Our oldest member is Mary Thompson, who is 95 years old and has been attending since 1945." },
    { label: "Tech Workshops", value: "148+", description: "Our oldest member is Mary Thompson, who is 95 years old and has been attending since 1945." },
    { label: "Christmas Concert", value: "58+", description: "Our oldest member is Mary Thompson, who is 95 years old and has been attending since 1945." },
];

export default function StatsBar() {
    return (
        <section className="bg-primary pt-20 pb-0 overflow-hidden relative">
            <div className="section-container pb-20">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
                    {stats.map((stat, i) => (
                        <div key={i} className="text-white space-y-4">
                            <h3 className="text-6xl font-heading font-black">{stat.value}</h3>
                            <div className="space-y-2">
                                <h4 className="text-xl font-bold font-heading uppercase">{stat.label}</h4>
                                <p className="text-white/70 text-sm leading-relaxed">
                                    {stat.description}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Decorative Bottom Curve */}
            <div className="h-20 bg-white rounded-t-[5rem] w-full" />
        </section>
    );
}
