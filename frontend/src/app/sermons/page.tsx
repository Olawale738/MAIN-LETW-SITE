"use client";

import PageContent from "@/components/layout/PageLayout";
import { motion } from "framer-motion";
import { Play, User, Tag, Clock, Search, Filter, Headphones, MonitorPlay } from "lucide-react";
import { Button } from "@/components/ui/Button";

const sermons = [
    {
        title: "Start A New Way Of Living",
        speaker: "James Mitchell",
        category: "Faith & Trust",
        time: "45 mins",
        date: "03 Aug 2024",
        image: "https://images.unsplash.com/photo-1438234591033-699745778930?q=80&w=2070&auto=format&fit=crop",
        type: "video"
    },
    {
        title: "Overcoming Life's Challenges",
        speaker: "Grace Miller",
        category: "Prayer",
        time: "38 mins",
        date: "09 Aug 2024",
        image: "https://images.unsplash.com/photo-1548625361-1250009617bc?q=80&w=2070&auto=format&fit=crop",
        type: "audio"
    },
    {
        title: "Hope In Times Of Trouble",
        speaker: "Mary Johnson",
        category: "Healing",
        time: "52 mins",
        date: "08 Aug 2024",
        image: "https://images.unsplash.com/photo-1438032005730-c779502df39b?q=80&w=2071&auto=format&fit=crop",
        type: "video"
    },
    {
        title: "The Power of Forgiveness",
        speaker: "David Wilson",
        category: "Discipleship",
        time: "41 mins",
        date: "15 Aug 2024",
        image: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=2070&auto=format&fit=crop",
        type: "video"
    },
];

export default function SermonsPage() {
    return (
        <PageContent>
            <section className="relative py-32 bg-zinc-900 overflow-hidden">
                <div className="absolute inset-0 z-0 opacity-40">
                    <img src="https://images.unsplash.com/photo-1438234591033-699745778930?q=80&w=2070&auto=format&fit=crop" className="w-full h-full object-cover" />
                </div>
                <div className="section-container relative z-10 space-y-8">
                    <div className="flex items-center gap-2 text-primary font-bold tracking-widest text-sm bg-white/10 backdrop-blur-md px-4 py-2 rounded-full uppercase border border-white/10 w-fit">
                        Media Archive
                    </div>
                    <h1 className="text-5xl md:text-8xl font-heading font-black text-white uppercase italic">
                        Watch & <span className="text-primary not-italic">Listen</span>
                    </h1>
                    <p className="text-zinc-400 text-xl max-w-2xl leading-relaxed">
                        Access our library of life-changing messages. Whether you missed a service or want to re-watch, our digital archive is always here.
                    </p>
                </div>
            </section>

            {/* Featured Sermon */}
            <section className="py-24 bg-white relative">
                <div className="section-container">
                    <div className="bg-zinc-950 rounded-[4rem] overflow-hidden flex flex-col lg:flex-row shadow-2xl">
                        <div className="lg:w-1/2 relative group">
                            <img src={sermons[0].image} className="w-full h-full min-h-[400px] object-cover opacity-70 group-hover:scale-110 transition-transform duration-1000" />
                            <div className="absolute inset-0 flex items-center justify-center">
                                <button className="w-24 h-24 rounded-full bg-primary text-white flex items-center justify-center shadow-2xl hover:scale-110 transition-transform cursor-pointer">
                                    <Play className="w-10 h-10 fill-white" />
                                </button>
                            </div>
                            <div className="absolute top-8 left-8 bg-primary px-4 py-2 rounded-xl text-white font-bold text-sm uppercase tracking-widest">
                                Latest Sermon
                            </div>
                        </div>
                        <div className="lg:w-1/2 p-12 md:p-20 flex flex-col justify-center space-y-8">
                            <h2 className="text-4xl md:text-5xl font-heading font-black text-white uppercase leading-tight">
                                {sermons[0].title}
                            </h2>
                            <div className="flex flex-wrap gap-6 text-zinc-400 font-bold border-y border-white/10 py-6">
                                <div className="flex items-center gap-2">
                                    <User className="w-5 h-5 text-primary" /> {sermons[0].speaker}
                                </div>
                                <div className="flex items-center gap-2">
                                    <Tag className="w-5 h-5 text-primary" /> {sermons[0].category}
                                </div>
                                <div className="flex items-center gap-2">
                                    <Clock className="w-5 h-5 text-primary" /> {sermons[0].time}
                                </div>
                            </div>
                            <Button size="lg" className="w-fit px-12">Watch Now</Button>
                        </div>
                    </div>
                </div>
            </section>

            {/* Filter & Grid */}
            <section className="py-24 bg-surface">
                <div className="section-container space-y-16">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-8 bg-white p-8 rounded-[2.5rem] border border-zinc-100 shadow-sm">
                        <div className="flex items-center gap-4 flex-1 w-full relative">
                            <Search className="absolute left-6 text-zinc-400" />
                            <input type="text" placeholder="Search sermons, speakers, or topics..." className="w-full pl-16 pr-8 py-4 bg-zinc-50 rounded-2xl border border-zinc-100 outline-none focus:border-primary transition-all text-zinc-900" />
                        </div>
                        <div className="flex items-center gap-4">
                            <Button variant="outline" className="flex items-center gap-2 border-zinc-200">
                                <Filter className="w-4 h-4" /> Filters
                            </Button>
                            <div className="h-10 w-px bg-zinc-100 hidden md:block" />
                            <div className="flex gap-2">
                                <button className="w-12 h-12 rounded-xl bg-primary text-white flex items-center justify-center shadow-lg"><MonitorPlay className="w-5 h-5" /></button>
                                <button className="w-12 h-12 rounded-xl bg-white text-zinc-400 hover:text-primary transition-colors flex items-center justify-center border border-zinc-100"><Headphones className="w-5 h-5" /></button>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                        {sermons.map((sermon, i) => (
                            <motion.div
                                key={i}
                                whileHover={{ y: -10 }}
                                className="bg-white rounded-[3rem] overflow-hidden shadow-sm hover:shadow-xl transition-all group"
                            >
                                <div className="relative h-64 overflow-hidden">
                                    <img src={sermon.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                    <div className="absolute top-6 right-6 bg-white/20 backdrop-blur-md p-3 rounded-2xl text-white">
                                        {sermon.type === 'video' ? <MonitorPlay className="w-6 h-6" /> : <Headphones className="w-6 h-6" />}
                                    </div>
                                </div>
                                <div className="p-10 space-y-6">
                                    <div className="text-primary font-bold text-sm tracking-widest uppercase">{sermon.date}</div>
                                    <h3 className="text-2xl font-bold font-heading text-zinc-900 leading-tight group-hover:text-primary transition-colors">{sermon.title}</h3>
                                    <div className="flex items-center gap-6 text-zinc-500 text-sm font-medium border-t border-zinc-100 pt-6">
                                        <span className="flex items-center gap-2"><User className="w-4 h-4" /> {sermon.speaker}</span>
                                        <span className="flex items-center gap-2"><Clock className="w-4 h-4" /> {sermon.time}</span>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    <div className="flex justify-center pt-8">
                        <Button variant="outline" size="lg" className="px-12 border-zinc-200">Load More Sermons</Button>
                    </div>
                </div>
            </section>
        </PageContent>
    );
}
