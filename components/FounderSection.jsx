"use client";

import React from "react";
import { getBlobUrl } from "@/lib/functions";

const FounderSection = ({ config }) => {
    const founderImg = getBlobUrl(config?.founder_image || "/new-founder.png");
    const badge = config?.founder_badge || "THE VISIONARY";
    const name = config?.founder_name || "Nawab Sahab";
    const quote = config?.founder_quote || "“We believe great food is more than a meal. It is an experience, a memory, and a reason to come together. At The Nawab Sahab, every detail is created to make every visit feel special.”";
    const role = config?.founder_role || "Founder & CEO";

    return (
        <section className="relative mt-20 mb-12 px-4 flex flex-col items-center overflow-hidden">
            {/* Background decorative elements */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-amber-500/10 rounded-full blur-[80px] -z-10" />

            <div className="w-full max-w-sm relative group">
                {/* Glow Effect */}
                <div className="absolute -inset-1 bg-gradient-to-r from-amber-600 to-amber-400 rounded-3xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>

                {/* Main Card */}
                <div className="relative bg-black/40 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl overflow-hidden">

                    {/* Founder Image Container */}
                    <div className="relative flex justify-center mb-6">
                        <div className="relative">
                            <div className="absolute -inset-0.5 bg-amber-500/20 rounded-2xl blur-3xl scale-105"></div>
                            <img
                                src={founderImg}
                                alt={`${name} - ${role}`}
                                className="w-48 h-auto relative z-10 drop-shadow-[0_10px_15px_rgba(0,0,0,0.5)]"
                                loading="lazy"
                            />
                        </div>
                    </div>

                    {/* Content */}
                    <div className="text-center space-y-3">
                        <h4 className="text-amber-500 font-bold tracking-[0.2em] text-[10px] uppercase opacity-80 kalam-font">{badge}</h4>
                        <h2 className="text-3xl font-black text-white italic tracking-tight dancing-script-font">
                            {name}
                        </h2>
                        <div className="h-[2px] w-12 bg-amber-500/50 mx-auto rounded-full"></div>
                        <p className="text-gray-400 text-sm leading-relaxed px-2 font-medium">
                            {quote}
                        </p>
                    </div>

                    {/* Signature style decoration */}
                    <div className="mt-6 flex justify-center opacity-30 grayscale contrast-125">
                        <span className="kalam-font text-white/50 text-lg select-none">{role}</span>
                    </div>
                </div>

                {/* Quote decorative svg */}
                <div className="absolute top-4 right-4 text-amber-500/20">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M14.017 21L14.017 18C14.017 16.8954 14.9124 16 16.017 16H19.017C19.5693 16 20.017 15.5523 20.017 15V9C20.017 8.44772 19.5693 8 19.017 8H16.017C14.9124 8 14.017 7.10457 14.017 6V5C14.017 3.34315 15.3601 2 17.017 2H20.017C21.6739 2 23.017 3.34315 23.017 5V15C23.017 18.3137 20.3307 21 17.017 21H14.017ZM1 21L1 18C1 16.8954 1.89543 16 3 16H6C6.55228 16 7 15.5523 7 15V9C7 8.44772 6.55228 8 6 8H3C1.89543 8 1 7.10457 1 6V5C1 3.34315 2.34315 2 4 2H7C8.65685 2 10 3.34315 10 5V15C10 18.3137 7.31371 21 4 21H1Z" />
                    </svg>
                </div>
            </div>
        </section>
    );
};

export default FounderSection;
