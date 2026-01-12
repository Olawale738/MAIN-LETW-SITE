"use client";

import PageLayout from "@/components/layout/PageLayout";
import { motion } from "framer-motion";
import { Heart, Users, HandHelping, Gift, Mail, Phone, MapPin, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function ConnectPage() {
    return (
        <PageLayout>
            <section className="relative py-40 bg-primary overflow-hidden">
                <div className="absolute inset-0 z-0 opacity-20">
                    <img src="https://images.unsplash.com/photo-1511632765486-a01980e01a18?q=80&w=2070&auto=format&fit=crop" className="w-full h-full object-cover" />
                </div>
                <div className="section-container relative z-10 text-center space-y-6">
                    <div className="flex items-center gap-2 text-white font-bold tracking-widest text-sm bg-white/10 backdrop-blur-md px-4 py-2 rounded-full uppercase border border-white/20 w-fit mx-auto">
                        Get Involved
                    </div>
                    <h1 className="text-5xl md:text-8xl font-heading font-black text-white uppercase italic">
                        Connect <br /> <span className="text-white not-italic underline decoration-white/20">With Us</span>
                    </h1>
                </div>
            </section>

            {/* Connection Links Grid */}
            <section className="py-24 bg-white">
                <div className="section-container">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                        <div id="member" className="p-12 md:p-16 rounded-[4rem] bg-zinc-50 border border-zinc-100 hover:bg-white hover:shadow-2xl transition-all space-y-8 group">
                            <div className="w-16 h-16 rounded-[1.5rem] bg-primary text-white flex items-center justify-center group-hover:rotate-12 transition-transform">
                                <UserPlus className="w-8 h-8" />
                            </div>
                            <div className="space-y-4">
                                <h2 className="text-3xl font-heading font-black text-zinc-900 uppercase">Become A Member</h2>
                                <p className="text-zinc-500 text-lg">
                                    Ready to make Light Encounter Tabernacle your home? Join our membership orientation to learn about our values and how you can belong.
                                </p>
                            </div>
                            <Button size="lg" className="px-12">Membership Form</Button>
                        </div>

                        <div id="volunteer" className="p-12 md:p-16 rounded-[4rem] bg-zinc-50 border border-zinc-100 hover:bg-white hover:shadow-2xl transition-all space-y-8 group">
                            <div className="w-16 h-16 rounded-[1.5rem] bg-secondary text-white flex items-center justify-center group-hover:rotate-12 transition-transform">
                                <HandHelping className="w-8 h-8" />
                            </div>
                            <div className="space-y-4">
                                <h2 className="text-3xl font-heading font-black text-zinc-900 uppercase">Serve & Volunteer</h2>
                                <p className="text-zinc-500 text-lg">
                                    Use your gifts to serve others. From ushering to technical support, there is a place for you to impact lives in our ministry teams.
                                </p>
                            </div>
                            <Button size="lg" variant="outline" className="px-12">See Opportunities</Button>
                        </div>
                    </div>
                </div>
            </section>

            {/* Giving Section */}
            <section id="give" className="py-24 bg-zinc-950 text-white relative overflow-hidden">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] bg-primary/10 rounded-full blur-[150px]" />
                <div className="section-container relative z-10 flex flex-col items-center text-center space-y-8">
                    <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center text-primary border border-white/10">
                        <Gift className="w-10 h-10" />
                    </div>
                    <h2 className="text-4xl md:text-6xl font-heading font-black uppercase">Giving <br /> <span className="text-primary italic">Generously</span></h2>
                    <p className="text-zinc-400 text-xl max-w-2xl">
                        Your faithful giving helps us reach more people and support our local and global mission projects. Thank you for your support.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-4xl pt-8">
                        {["Tithes", "Offerings", "Building Fund"].map((type) => (
                            <div key={type} className="p-8 rounded-[2.5rem] bg-white/5 border border-white/10 hover:bg-white hover:text-zinc-900 transition-all cursor-pointer group">
                                <h3 className="text-2xl font-bold font-heading mb-2">{type}</h3>
                                <p className="text-sm opacity-60 group-hover:opacity-100">Click to Give Now</p>
                            </div>
                        ))}
                    </div>
                    <div className="pt-8">
                        <div className="space-y-4">
                            <p className="text-zinc-500 font-bold uppercase tracking-widest">Other Ways To Give</p>
                            <div className="flex flex-wrap justify-center gap-6">
                                <span className="bg-white/5 px-6 py-2 rounded-full border border-white/10">Bank Transfer</span>
                                <span className="bg-white/5 px-6 py-2 rounded-full border border-white/10">PayPal</span>
                                <span className="bg-white/5 px-6 py-2 rounded-full border border-white/10">Zelle</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Contact Grid */}
            <section id="contact" className="py-24 bg-white">
                <div className="section-container">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-16">
                        <div className="space-y-6">
                            <h3 className="text-3xl font-heading font-black text-zinc-900 uppercase">Get In Touch</h3>
                            <p className="text-zinc-500">We would love to hear from you. Whether you have a prayer request or a question, feel free to reach out.</p>
                            <div className="space-y-4 pt-4">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-primary/5 text-primary flex items-center justify-center"><Phone className="w-5 h-5" /></div>
                                    <span className="font-bold">+1 (234) 567-890</span>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-primary/5 text-primary flex items-center justify-center"><Mail className="w-5 h-5" /></div>
                                    <span className="font-bold">hello@lightencounter.org</span>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-primary/5 text-primary flex items-center justify-center"><MapPin className="w-5 h-5" /></div>
                                    <span className="font-bold">123 Spiritual Way, Faith City</span>
                                </div>
                            </div>
                        </div>
                        <div className="lg:col-span-2 bg-zinc-50 p-12 rounded-[4rem] border border-zinc-100">
                            <form className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <input type="text" placeholder="Full Name" className="w-full px-8 py-5 rounded-2xl border border-zinc-200 focus:border-primary outline-none" />
                                <input type="email" placeholder="Email Address" className="w-full px-8 py-5 rounded-2xl border border-zinc-200 focus:border-primary outline-none" />
                                <div className="md:col-span-2">
                                    <textarea rows={5} placeholder="How can we help you?" className="w-full px-8 py-5 rounded-2xl border border-zinc-200 focus:border-primary outline-none resize-none"></textarea>
                                </div>
                                <Button className="md:col-span-2 py-5 text-xl">Send Message</Button>
                            </form>
                        </div>
                    </div>
                </div>
            </section>
        </PageLayout>
    );
}
