import React from "react";
import { FiMapPin } from "react-icons/fi";
import { getBlobUrl } from "@/lib/functions";

export default function Header({ config, locationState, onOpenLocation }) {
    const logoUrl = getBlobUrl(config?.logo_image || "/icons/logo2.png");
    const siteTitle = config?.site_title || "THE NAWAB SAHAB";
    const tagline = config?.tagline || "CAFE • BAKERY • SWEETS";

    return (
        <div
            className="sm:h-20 h-16 flex justify-between items-center px-4 sm:px-6 fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] z-40 bg-[#0a0a0a]/60 backdrop-blur-xl border-b border-white/10 shadow-2xl"
        >
            <div className="flex items-center gap-2 h-[80%] min-w-0 flex-1 pr-2">
                <img 
                    src={logoUrl} 
                    alt={siteTitle} 
                    className="h-full -mt-0.5 object-contain drop-shadow-[0_0_15px_rgba(255,255,255,0.05)] flex-shrink-0" 
                />
                <div className="flex flex-col justify-center gap-1 -mb-1 min-w-0">
                    <h1 className="text-white text-sm sm:text-base font-black tracking-[0.2em] leading-tight uppercase bogart truncate">
                        {siteTitle}
                    </h1>
                    <p className="text-amber-500/90 text-[8px] sm:text-[9px] tracking-[0.3em] font-bold uppercase opacity-80 shimmer-text min-h-[1em] flex items-center truncate">
                        {tagline}
                    </p>
                </div>
            </div>

            {/* Location Check Trigger Button */}
            {onOpenLocation && (
                <button
                    type="button"
                    onClick={onOpenLocation}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-400 text-[10px] font-bold transition-all cursor-pointer flex-shrink-0 active:scale-95"
                    title="Check delivery to your area"
                >
                    <FiMapPin size={11} className="text-amber-400" />
                    <span>
                        {locationState?.checked
                            ? locationState.isServiceable
                                ? `~${locationState.distanceKm} km`
                                : "Unavailable"
                            : "Check Area"}
                    </span>
                </button>
            )}
        </div>
    );
}
