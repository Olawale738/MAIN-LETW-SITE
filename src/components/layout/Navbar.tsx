"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ChevronDown, Menu, X, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ComingSoonModal from "../shared/ComingSoonModal";

const navLinks = [

    {
        name: "About",
        href: "/about",
        dropdown: [
            { name: "Our Church", href: "/about#our-church" },
            { name: "Vision & Mission", href: "/about#vision" },
            { name: "Statement of Faith", href: "/about#faith" },
            { name: "Leadership", href: "/about#leadership" },
            { name: "Church History", href: "/about#history" },
            { name: "Locations", href: "/about#locations" },
        ],
    },
    {
        name: "Ministries",
        href: "/ministries",
        dropdown: [
            { name: "Bible Study", href: "/ministries#bible-study" },
            { name: "Prayer & Intercession", href: "/ministries#prayer" },
            { name: "Evangelism & Outreach", href: "/ministries#outreach" },
            { name: "Charity & Social Impact", href: "/ministries#charity" },
            { name: "Discipleship", href: "/ministries#discipleship" },
            { name: "Leadership Development", href: "/ministries#leadership" },
            { name: "Career Guidance", href: "/ministries#career" },
            { name: "Skill Development", href: "/ministries#skill" },
            { name: "Counseling & Support", href: "/counselling" }
        ],
    },
    {
        name: "Education",
        href: "#",
        isModal: true,
        dropdown: [
            { name: "University", href: "#", isModal: true },
            { name: "School of Ministry", href: "#", isModal: true },
            { name: "Primary School", href: "#", isModal: true },
            { name: "Secondary School", href: "#", isModal: true },
        ],
    },
    {
        name: "Worship & Events",
        href: "/worship-events",
        dropdown: [
            { name: "Service Times", href: "/worship-events#times" },
            { name: "Weekly Programs", href: "/worship-events#programs" },
            { name: "Special Services", href: "/worship-events#special" },
            { name: "Events & Conferences", href: "/worship-events#events" },
            { name: "Watch Live", href: "/worship-events#live" },
        ],
    },
    {
        name: "Media & Resources",
        href: "/media-resources",
        dropdown: [
            { name: "Sermons (Video)", href: "/media-resources#sermons" },
            { name: "Audio Messages", href: "/media-resources#audio" },
            { name: "Devotionals", href: "/media-resources#devotionals" },
            { name: "Testimonies", href: "/media-resources#testimonies" },
            { name: "Prayer Requests", href: "/media-resources#prayer" },
        ],
    }
];

export default function Navbar() {
    const [isScrolled, setIsScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
    const [modalTitle, setModalTitle] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);

    const openModal = (title: string) => {
        setModalTitle(title);
        setIsModalOpen(true);
        setMobileMenuOpen(false);
    };

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 50);
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    return (
        <header
            className={`absolute top-0 left-0 right-0 z-50 transition-all duration-300 bg-[#140152] ${isScrolled ? "py-2 shadow-xl" : "py-4"
                }`}
        >
            <div className="section-container flex items-center justify-between">
                {/* Logo */}
                <Link href="/" className="flex items-center gap-1 group">
                    <img src="/LETWlogo.png" alt="LETW Logo" className="w-12 h-12 md:w-14 md:h-14 object-contain transition-transform group-hover:scale-105" />
                    <div className="flex flex-col leading-none border-l border-white/20">
                        <span className="text-[9px] md:text-[11px] text-white tracking-wider uppercase">Light</span>
                        <span className="text-[9px] md:text-[11px] text-white tracking-wider uppercase">Encounter</span>
                        <span className="text-[9px] md:text-[11px] text-white tracking-wider uppercase">Tabernacle</span>
                    </div>
                </Link>

                {/* Desktop Nav */}
                <nav className="hidden lg:flex items-center gap-6 xl:gap-8">
                    {navLinks.map((link) => (
                        <div
                            key={link.name}
                            className="relative group"
                            onMouseEnter={() => setActiveDropdown(link.name)}
                            onMouseLeave={() => setActiveDropdown(null)}
                        >
                            {link.isModal ? (
                                <button
                                    onClick={() => openModal(link.name)}
                                    className="flex items-center gap-1 font-heading text-[13px] font-bold tracking-wide transition-colors text-white/80 hover:text-white"
                                >
                                    {link.name}
                                    {link.dropdown && <ChevronDown className="w-3 h-3 opacity-50" />}
                                </button>
                            ) : (
                                <Link
                                    href={link.href}
                                    className="flex items-center gap-1 font-heading text-[13px] font-bold tracking-wide transition-colors text-white/80 hover:text-white"
                                >
                                    {link.name}
                                    {link.dropdown && <ChevronDown className="w-3 h-3 opacity-50" />}
                                </Link>
                            )}

                            {/* Dropdown */}
                            <AnimatePresence>
                                {link.dropdown && activeDropdown === link.name && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: 10 }}
                                        className="absolute top-full left-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-zinc-100 overflow-hidden py-2"
                                    >
                                        {link.dropdown.map((sub: any) => (
                                            <div key={sub.name}>
                                                {sub.isModal ? (
                                                    <button
                                                        onClick={() => openModal(sub.name)}
                                                        className="block w-full text-left px-4 py-2.5 text-sm text-zinc-300 hover:bg-zinc-50 hover:text-primary transition-colors"
                                                    >
                                                        {sub.name}
                                                    </button>
                                                ) : (
                                                    <Link
                                                        href={sub.href}
                                                        className="block px-4 py-2.5 text-sm text-zinc-300 hover:bg-zinc-50 hover:text-primary transition-colors"
                                                    >
                                                        {sub.name}
                                                    </Link>
                                                )}
                                            </div>
                                        ))}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    ))}
                </nav>

                {/* Action Buttons */}
                <div className="hidden lg:flex items-center">
                      <Link
                                                 href="/auth"
                                                 className="inline-flex items-center gap-2 bg-[#a57b00] hover:bg-[#fabb00] text-white font-semibold px-1 py-1 pl-5 rounded-full transition-all duration-300 shadow-lg hover:shadow-xl group"
                                             >
                                                 Join Us
                                                  <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                                                       <ArrowRight className="w-5 h-5 text-[#a57b00] -rotate-45 transition-transform group-hover:translate-x-0.5" />
                                                     </div>
                                             </Link>

                </div>

                {/* Mobile Menu Trigger */}
                <button
                    className={`lg:hidden p-2 rounded-lg ${isScrolled ? "text-zinc-900" : "text-white"}`}
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                >
                    {mobileMenuOpen ? <X /> : <Menu />}
                </button>
            </div>

            {/* Mobile Menu */}
            <AnimatePresence>
                {mobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, x: "100%" }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: "100%" }}
                        className="fixed inset-0 bg-white z-40 lg:hidden flex flex-col"
                    >
                        <div className="flex items-center justify-between p-6 border-b">
                            <Link href="/" className="flex items-center">
                                <img src="public/LETWlogo.png" alt="LETW Logo" className="w-6 h-6" />
                            </Link>
                            <button onClick={() => setMobileMenuOpen(false)}>
                                <X className="text-zinc-900" />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                            {navLinks.map((link) => (
                                <div key={link.name} className="space-y-3">
                                    {link.isModal ? (
                                        <button
                                            onClick={() => openModal(link.name)}
                                            className="text-l font-bold text-zinc-900 text-left w-full"
                                        >
                                            {link.name}
                                        </button>
                                    ) : (
                                        <Link
                                            href={link.href}
                                            className="text-l font-bold text-zinc-900"
                                            onClick={() => setMobileMenuOpen(false)}
                                        >
                                            {link.name}
                                        </Link>
                                    )}
                                    {link.dropdown && (
                                        <div className="grid grid-cols-1 gap-2 pl-4 border-l-2 border-zinc-100">
                                            {link.dropdown.map((sub: any) => (
                                                <div key={sub.name}>
                                                    {sub.isModal ? (
                                                        <button
                                                            onClick={() => openModal(sub.name)}
                                                            className="text-zinc-500 hover:text-primary transition-colors py-1 text-left w-full"
                                                        >
                                                            {sub.name}
                                                        </button>
                                                    ) : (
                                                        <Link
                                                            href={sub.href}
                                                            className="text-zinc-500 hover:text-primary transition-colors py-1 block w-full"
                                                            onClick={() => setMobileMenuOpen(false)}
                                                        >
                                                            {sub.name}
                                                        </Link>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                        <div className="p-6 border-t space-y-4">
                             <Link
                                                        href="/auth"
                                                        className="inline-flex items-center gap-2 bg-[#a57b00] hover:bg-[#fabb00] text-white font-semibold px-1 py-1 pl-5 rounded-full transition-all duration-300 shadow-lg hover:shadow-xl group"
                                                    >
                                                        Join Us
                                                         <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                                                              <ArrowRight className="w-5 h-5 text-[#a57b00] -rotate-45 transition-transform group-hover:translate-x-0.5" />
                                                            </div>
                                                    </Link>

                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <ComingSoonModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={modalTitle}
            />
        </header>
    );
}
