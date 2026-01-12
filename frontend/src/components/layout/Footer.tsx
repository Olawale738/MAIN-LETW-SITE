"use client";

import Link from "next/link";
import { Facebook, Instagram, Twitter, Youtube, Mail, Phone, MapPin, ArrowRight } from "lucide-react";
import { Button } from "../ui/Button";

const footerLinks = [
    {
        title: "About Us",
        links: [
            { name: "Our Church", href: "/about#our-church" },
            { name: "Vision & Mission", href: "/about#vision" },
            { name: "Leadership", href: "/about#leadership" },
            { name: "Church History", href: "/about#history" },
        ],
    },
    {
        title: "Ministries",
        links: [
            { name: "Bible Study", href: "/ministries#bible-study" },
            { name: "Youth Ministry", href: "/ministries#youth" },
            { name: "Children's Ministry", href: "/ministries#children" },
            { name: "Mission Ministry", href: "/ministries#mission" },
        ],
    },
    {
        title: "Quick Links",
        links: [
            { name: "Sermons", href: "/sermons" },
            { name: "Events", href: "/worship-events" },
            { name: "Bible Plan", href: "/bible-study-plan" },
            { name: "Counselling", href: "/counselling" },
            { name: "Contact Us", href: "/connect#contact" },
        ],
    },
];

export default function Footer() {
    return (
        <footer className="bg-zinc-950 text-white pt-20 pb-10">
            <div className="section-container">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
                    {/* Brand Column */}
                    <div className="space-y-6">
                        <Link href="/" className="flex items-center gap-2">
                            <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center text-white font-bold text-2xl">
                                L
                            </div>
                            <span className="font-heading font-bold text-3xl tracking-tight">AVENIX</span>
                        </Link>
                        <p className="text-zinc-400 leading-relaxed">
                            We are a vibrant community of believers dedicated to worship, fellowship, and service. Our mission is to share God's love and make a positive impact.
                        </p>
                        <div className="flex items-center gap-4">
                            {[Facebook, Instagram, Twitter, Youtube].map((Icon, i) => (
                                <a
                                    key={i}
                                    href="#"
                                    className="w-10 h-10 rounded-full border border-zinc-800 flex items-center justify-center hover:bg-primary hover:border-primary transition-all duration-300"
                                >
                                    <Icon className="w-5 h-5" />
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Links Columns */}
                    {footerLinks.map((column) => (
                        <div key={column.title} className="space-y-6">
                            <h4 className="text-xl font-bold font-heading">{column.title}</h4>
                            <ul className="space-y-4">
                                {column.links.map((link) => (
                                    <li key={link.name}>
                                        <Link
                                            href={link.href}
                                            className="text-zinc-400 hover:text-white transition-colors flex items-center gap-2 group"
                                        >
                                            <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-all -ml-6 group-hover:ml-0" />
                                            {link.name}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}

                    {/* Contact Column */}
                    <div className="space-y-6">
                        <h4 className="text-xl font-bold font-heading">Connect With Us</h4>
                        <ul className="space-y-4">
                            <li className="flex items-start gap-4 text-zinc-400">
                                <MapPin className="w-6 h-6 text-primary shrink-0" />
                                <span>123 Spiritual Way, Faith City, FC 45678</span>
                            </li>
                            <li className="flex items-center gap-4 text-zinc-400">
                                <Phone className="w-6 h-6 text-primary shrink-0" />
                                <span>+1 (234) 567-890</span>
                            </li>
                            <li className="flex items-center gap-4 text-zinc-400">
                                <Mail className="w-6 h-6 text-primary shrink-0" />
                                <span>info@avenixchurch.com</span>
                            </li>
                        </ul>
                        <div className="pt-4">
                            <Button className="w-full">Book Counselling</Button>
                        </div>
                    </div>
                </div>

                <div className="pt-8 border-t border-zinc-900 flex flex-col md:flex-row items-center justify-between gap-4 text-zinc-500 text-sm">
                    <p>© {new Date().getFullYear()} AVENIX Church. All rights reserved.</p>
                    <div className="flex items-center gap-8">
                        <Link href="#" className="hover:text-white transition-colors">Privacy Policy</Link>
                        <Link href="#" className="hover:text-white transition-colors">Terms of Service</Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}
