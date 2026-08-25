import React from "react";
import { getBlobUrl } from "@/lib/functions";

export default function Header({ config }) {
    const logoUrl = getBlobUrl(config?.logo_image || "/icons/logo2.png");
    const siteTitle = config?.site_title || "THE NAWAB SAHAB";
    const tagline = config?.tagline || "CAFE • BAKERY • SWEETS";

    return (
        <div
            className="sm:h-20 h-16 flex justify-between items-center px-4 sm:px-8 fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] z-40 bg-[#0a0a0a]/60 backdrop-blur-xl border-b border-white/10 shadow-2xl"
        >
            <div className="flex items-center gap-2 h-[80%]">
                <img 
                    src={logoUrl} 
                    alt={siteTitle} 
                    className="h-full -mt-0.5 object-contain drop-shadow-[0_0_15px_rgba(255,255,255,0.05)]" 
                />
                <div className="flex flex-col justify-center gap-1.5 -mb-1">
                    <h1 className="text-white text-base sm:text-xl font-black tracking-[0.25em] leading-tight uppercase bogart">
                        {siteTitle}
                    </h1>
                    <p className="text-amber-500/90 text-[8px] sm:text-[10px] tracking-[0.4em] font-bold uppercase opacity-80 shimmer-text min-h-[1em] flex items-center">
                        {tagline}
                    </p>
                </div>
            </div>
        </div>
    );
}
