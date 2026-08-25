"use client";

import { motion } from "framer-motion";
import { getBlobUrl } from "@/lib/functions";

export default function Footer({ config }) {
    const footerLogo = getBlobUrl(config?.footer_logo_image || config?.logo_image || "/icons/logo2.png");
    const legacyText = config?.legacy_year || "LEGACY 1974 | ESTD 2026";
    const followTitle = config?.footer_follow_title || "Follow our Journey";
    const copyright = config?.footer_copyright || "© 2026 NFC CAFE • All Rights Reserved";

    const whatsappLink = config?.whatsapp_number 
        ? `https://wa.me/${config.whatsapp_number.replace(/[^0-9]/g, '')}` 
        : "https://wa.me/919838383836";

    const socialLinks = [
        { icon: 'fa-instagram', color: 'text-[#E4405F]', link: config?.instagram_url || 'https://www.instagram.com/the.nawabsahab?igsh=MWU5aGd0MXE1cXNoZQ==' },
        { icon: 'fa-threads', color: 'text-white', link: config?.threads_url || 'https://www.threads.net/@the.nawabsahab' },
        { icon: 'fa-youtube', color: 'text-[#FF0000]', link: config?.youtube_url || 'https://youtube.com/@the.nawabsahab?si=AuiFrjutTZ17F_49' },
        { icon: 'fa-facebook-f', color: 'text-[#1877F2]', link: config?.facebook_url || 'https://www.facebook.com/share/1JBAnSqFok/' },
        { icon: 'fa-whatsapp', color: 'text-[#25D366]', link: whatsappLink }
    ];

    return (
        <footer className="mt-20 py-12 bg-gradient-to-t from-black to-[#1a1a1a] border-t border-white/5">
            <div className="max-w-[85%] mx-auto flex flex-col sm:flex-row items-center sm:items-start justify-between gap-10">
                <div className="flex flex-col items-center sm:items-start">
                    <img src={footerLogo} alt="NFC Logo" className="h-32 mb-4" />
                    <p className="text-amber-500/80 tracking-[0.2em] uppercase text-[10px] font-bold shimmer-text">
                        {legacyText}
                    </p>
                </div>

                <div className="flex flex-col items-center sm:items-start">
                    <h4 className="text-xl font-bold permanent-marker-font text-white tracking-widest mb-6">
                        {followTitle}
                    </h4>
                    <div className="flex gap-4">
                        {socialLinks.map((social, i) => (
                            <motion.a
                                key={i}
                                href={social.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-12 h-12 flex items-center justify-center bg-white/5 border border-white/10 rounded-2xl group shadow-xl"
                                whileHover={{ scale: 1.1, y: -4, borderColor: "rgba(245, 158, 11, 0.5)", backgroundColor: "rgba(255,255,255,0.1)" }}
                                transition={{ type: "spring", stiffness: 400, damping: 15 }}
                            >
                                <i className={`fa-brands ${social.icon} ${social.color} text-xl group-hover:scale-110 transition-transform`} />
                            </motion.a>
                        ))}
                    </div>
                </div>
            </div>
            <div className="mt-12 pt-8 border-t border-white/5 text-center">
                <p className="text-gray-500 text-[10px] uppercase tracking-widest font-bold">
                    {copyright}
                </p>
            </div>
        </footer>
    );
}
