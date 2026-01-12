"use client";

import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import Link from "next/link";

const ministries = [
    {
        title: "Children's",
        image: "https://images.unsplash.com/photo-1543706062-2f3b972d317b?q=80&w=2070&auto=format&fit=crop",
        href: "/ministries#children",
    },
    {
        title: "Youth Ministry",
        image: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=2070&auto=format&fit=crop",
        href: "/ministries#youth",
    },
    {
        title: "Mission Ministry",
        image: "https://images.unsplash.com/photo-1490730141103-6cac27aaab94?q=80&w=2070&auto=format&fit=crop",
        href: "/ministries#mission",
    },
];

export default function MinistriesGrid() {
    return (
        <section className="py-24 bg-white">
            <div className="section-container">
                <div className="text-center space-y-4 mb-16">
                    <div className="flex items-center justify-center gap-2 text-primary font-bold tracking-widest text-sm uppercase">
                        <div className="w-2 h-2 rotate-45 bg-primary" />
                        Our Ministries
                    </div>
                    <h2 className="text-4xl md:text-5xl font-heading font-black text-zinc-900 uppercase">
                        Our Latest <span className="text-primary italic">Ministries</span>
                    </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {ministries.map((item, i) => (
                        <motion.div
                            key={i}
                            whileHover={{ y: -10 }}
                            className="relative group h-[500px] overflow-hidden rounded-t-[2.5rem] rounded-br-[5rem] rounded-bl-[2.5rem]"
                        >
                            <img
                                src={item.image}
                                alt={item.title}
                                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                            <div className="absolute top-6 left-6">
                                <h3 className="text-2xl font-bold text-white font-heading">{item.title}</h3>
                            </div>

                            <div className="absolute bottom-8 right-8">
                                <Link
                                    href={item.href}
                                    className="w-14 h-14 rounded-full bg-primary text-white flex items-center justify-center shadow-lg transform translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300"
                                >
                                    <ArrowUpRight className="w-6 h-6" />
                                </Link>
                            </div>
                        </motion.div>
                    ))}
                </div>

                <div className="mt-16 text-center">
                    <p className="text-zinc-500 max-w-2xl mx-auto mb-8 font-medium">
                        Explore the exciting new ways we are serving our community and growing together in faith with our latest ministry initiatives.
                        <Link href="/ministries" className="text-primary hover:underline ml-2">View All Ministries</Link>
                    </p>
                </div>
            </div>
        </section>
    );
}
