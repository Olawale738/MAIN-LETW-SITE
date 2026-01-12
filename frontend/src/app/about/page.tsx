"use client";

import PageLayout from "@/components/layout/PageLayout";
import { motion } from "framer-motion";
import { CheckCircle2, Target, Eye, Users, History, MapPin } from "lucide-react";
import { Button } from "@/components/ui/Button";

const sections = [
    {
        id: "our-church",
        title: "Our Church",
        icon: Users,
        content: "We are a vibrant community of believers dedicated to worship, fellowship, and service. Our church is a place where everyone can find support, inspiration, and a sense of belonging. Together, we strive to live out our faith and make a difference.",
        image: "https://images.unsplash.com/photo-1548625361-1250009617bc?q=80&w=2070&auto=format&fit=crop"
    },
    {
        id: "vision",
        title: "Vision & Mission",
        icon: Target,
        content: "Our mission is to share God's love, foster spiritual growth, and serve our community with compassion and purpose. We envision a world transformed by the power of faith and the impact of meaningful connections.",
        image: "https://images.unsplash.com/photo-1444333523264-70d30fe99923?q=80&w=2071&auto=format&fit=crop"
    },
    {
        id: "history",
        title: "Church History",
        icon: History,
        content: "Founded on principles of faith and service, our church has a rich history of community involvement and spiritual leadership. Over the years, we have grown into a diverse and welcoming family, committed to our shared values.",
        image: "https://images.unsplash.com/photo-1438032005730-c779502df39b?q=80&w=2071&auto=format&fit=crop"
    }
];

export default function AboutPage() {
    return (
        <PageLayout>
            {/* About Hero */}
            <section className="relative py-40 bg-zinc-900 overflow-hidden">
                <div className="absolute inset-0 z-0 opacity-40">
                    <img src="https://images.unsplash.com/photo-1438234591033-699745778930?q=80&w=2070&auto=format&fit=crop" className="w-full h-full object-cover" />
                </div>
                <div className="section-container relative z-10 text-center space-y-6">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="inline-flex items-center gap-2 text-primary font-bold tracking-widest text-sm bg-white/10 backdrop-blur-md px-4 py-2 rounded-full uppercase border border-white/10"
                    >
                        About Us
                    </motion.div>
                    <h1 className="text-5xl md:text-8xl font-heading font-black text-white uppercase italic">
                        Our Journey <br /> <span className="text-primary not-italic">of Faith</span>
                    </h1>
                </div>
            </section>

            {/* Content Sections */}
            <div className="py-24 space-y-32">
                {sections.map((section, i) => (
                    <section key={section.id} id={section.id} className="section-container scroll-mt-32">
                        <div className={`grid grid-cols-1 lg:grid-cols-2 gap-20 items-center ${i % 2 !== 0 ? 'lg:flex-row-reverse' : ''}`}>
                            <div className={`space-y-8 ${i % 2 !== 0 ? 'lg:order-2' : ''}`}>
                                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                                    <section.icon className="w-8 h-8" />
                                </div>
                                <h2 className="text-4xl md:text-6xl font-heading font-black text-zinc-900 uppercase">
                                    {section.title}
                                </h2>
                                <p className="text-zinc-500 text-lg leading-relaxed">
                                    {section.content}
                                </p>
                                <Button variant="outline">Learn More</Button>
                            </div>

                            <div className={`relative rounded-[3rem] overflow-hidden shadow-2xl skew-y-1 group ${i % 2 !== 0 ? 'lg:order-1' : ''}`}>
                                <img
                                    src={section.image}
                                    alt={section.title}
                                    className="w-full h-[500px] object-cover transition-transform duration-700 group-hover:scale-110"
                                />
                            </div>
                        </div>
                    </section>
                ))}
            </div>

            {/* Locations Section */}
            <section id="locations" className="bg-surface py-24 scroll-mt-32">
                <div className="section-container">
                    <div className="text-center space-y-4 mb-16">
                        <h2 className="text-4xl md:text-6xl font-heading font-black text-zinc-900 uppercase">
                            Find Us <span className="text-primary italic">Nearby</span>
                        </h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {[1, 2, 3].map((loc) => (
                            <div key={loc} className="bg-white p-10 rounded-[2.5rem] shadow-sm hover:shadow-xl transition-all border border-zinc-100 space-y-6">
                                <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center text-secondary">
                                    <MapPin className="w-6 h-6" />
                                </div>
                                <div className="space-y-2">
                                    <h3 className="text-2xl font-bold font-heading">Campus {loc}</h3>
                                    <p className="text-zinc-500 italic">Faith City Central</p>
                                </div>
                                <p className="text-zinc-500">
                                    123 Spiritual Way, Faith City, FC 45678 <br />
                                    Phone: +1 (234) 567-890
                                </p>
                                <Button variant="ghost" className="p-0 text-primary hover:bg-transparent hover:underline h-auto">
                                    Get Directions
                                </Button>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        </PageLayout>
    );
}
