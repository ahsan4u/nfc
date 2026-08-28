"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { getBlobUrl } from "@/lib/functions";

export default function HeroBanner({ setOpen, scrollToMenu, config }) {
    const bannerRef = useRef(null);
    const isInView = useInView(bannerRef, { once: false, amount: 0.1 });

    const bannerImg = getBlobUrl(config?.hero_banner_image || "/hero-banner.jpg");
    const dishImg = getBlobUrl(config?.hero_dish_image || "/dish.png");
    const title = config?.hero_title || "Enjoy our Delicious Meal";
    const desc = config?.hero_desc || "Classic recipes with a modern twist, made fresh with care food that delights, comforts, and truly leaves a lasting mark.";
    const btnText = config?.hero_button_text || "Explore Dishes";

    return (
        <div ref={bannerRef} className="relative sm:aspect-[16/7.6] aspect-[16/12] w-full z-10 overflow-hidden">
            {/* Background banner image that dims when visible */}
            <motion.img 
                src={bannerImg} 
                alt="TNS Hero Banner" 
                className="absolute top-0 h-full w-full object-cover flip-x"
                initial={{ filter: "brightness(1)" }}
                animate={{ filter: isInView ? "brightness(0.5)" : "brightness(1)" }}
                transition={{ duration: 0.7 }}
            />

            <div className="h-full flex justify-between sm:items-center items-end sm:pb-0 pb-8 sm:w-[85%] mx-auto relative z-10 text-white">
                {/* Text section sliding from the left */}
                <motion.div 
                    className="sm:w-[40%] w-[45%] sm:ml-0 ml-4"
                    initial={{ x: "-120%", opacity: 0 }}
                    animate={{ x: isInView ? 0 : "-120%", opacity: isInView ? 1 : 0 }}
                    transition={{ duration: 0.7, ease: [0.25, 0.1, 0.25, 1.0] }}
                >
                    <p className="permanent-marker-font tracking-widest sm:text-7xl text-lg font-bold sm:leading-20">
                        {title}
                    </p>
                    <p className="sm:text-lg text-[10px] sm:mt-5 mt-2">
                        {desc}
                    </p>
                    <button 
                        onClick={scrollToMenu} 
                        className="sm:px-10 px-5 sm:py-3 py-2 sm:text-xl text-xs tracking-wider font-bold rounded-md bg-red-600 sm:mt-12 mt-3 cursor-pointer hover:bg-red-500 hover:scale-105 transition-all duration-300"
                    >
                        {btnText}
                    </button>
                </motion.div>

                {/* Floating dish image sliding from the right and bouncing */}
                <motion.div
                    className="w-[46%] -mb-4 mr-3"
                    initial={{ x: "120%", opacity: 0 }}
                    animate={{ x: isInView ? 0 : "120%", opacity: isInView ? 1 : 0 }}
                    transition={{ duration: 0.7, ease: [0.25, 0.1, 0.25, 1.0] }}
                >
                    <img 
                        src={dishImg} 
                        alt="Featured Dish" 
                        className="w-full h-auto brightness-75 contrast-125 animate-float"
                    />
                </motion.div>
            </div>
        </div>
    );
}
