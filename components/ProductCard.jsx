"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getDishImageUrl, formatPrice } from "@/lib/functions";

export default function ProductCard({ data, quantity = 0, onAdd, onRemove, setOpen }) {
    const { dishImgUrl: defaultImgUrl, fallbackImgUrl } = getDishImageUrl(data.name, data.img);
    const dishImgUrl = data.image_url || defaultImgUrl;

    const [imgSrc, setImgSrc] = useState(dishImgUrl);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setImgSrc(dishImgUrl);
    }, [dishImgUrl]);

    useEffect(() => {
        setMounted(true);
    }, []);

    const hasDiscount = data.compare_price && parseFloat(data.compare_price) > parseFloat(data.price);
    const discountPct = hasDiscount 
        ? Math.round(((parseFloat(data.compare_price) - parseFloat(data.price)) / parseFloat(data.compare_price)) * 100)
        : null;

    const handleAddClick = (e) => {
        e.stopPropagation();
        if (onAdd) {
            onAdd(data);
        } else if (setOpen) {
            setOpen(true);
        }
    };

    return (
        <motion.div 
            className="group relative flex justify-between items-center pl-4 pr-2 bg-[#1a1a1a] border border-white/5 text-white rounded-2xl sm:h-[94px] h-[95px] w-full shadow-[0_4px_20px_rgba(0,0,0,0.4)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.6)] hover:scale-[1.01] active:bg-[#252525] transition-all duration-500 cursor-pointer overflow-hidden"
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, amount: 0.3 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
        >
            {/* Premium Shine Overlay */}
            <div className="absolute inset-0 pointer-events-none self-center">
                <div className="absolute inset-[-150%] bg-gradient-to-r from-transparent via-white/10 to-transparent rotate-45 animate-card-shine"></div>
            </div>

            {/* Subtle Inner Highlight */}
            <div className="absolute inset-0 rounded-2xl border border-white/0 group-hover:border-white/10 active:border-white/20 transition-colors duration-500 pointer-events-none"></div>

            <div className="flex flex-col justify-center items-start z-10 w-full max-w-[calc(100%-85px)] sm:max-w-[calc(100%-90px)]">
                <p className="font-bold sm:text-lg text-base leading-tight tracking-wide kalam-font line-clamp-1 text-gray-100 group-hover:text-white transition-colors duration-300">
                    {data.name}
                </p>
                <div className="flex items-center gap-2 mt-0.5 sm:mt-1">
                    <p className="text-[10px] sm:text-[9px] text-gray-400 font-medium uppercase tracking-tighter">Price</p>
                    <span className="text-green-500 text-sm font-black drop-shadow-[0_0_8px_rgba(34,197,94,0.3)]">
                        {formatPrice(data.price)}
                    </span>
                    {hasDiscount && (
                        <span className="line-through text-gray-400 text-xs font-semibold">
                            {formatPrice(data.compare_price)}
                        </span>
                    )}
                </div>

                {/* Smooth Animated Quantity Controller */}
                <div className="mt-2 sm:mt-2.5 h-[28px] flex items-center">
                    <AnimatePresence mode="wait">
                        {quantity > 0 ? (
                            <motion.div
                                key="stepper"
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.8 }}
                                transition={{ duration: 0.2 }}
                                className="flex items-center bg-[#232329] border border-amber-500/50 rounded-lg p-0.5 shadow-md shadow-amber-500/10"
                            >
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (onRemove) onRemove(data);
                                    }}
                                    className="w-6 h-6 flex items-center justify-center rounded bg-white/5 hover:bg-white/15 text-amber-400 text-sm font-black active:scale-90 transition-all cursor-pointer"
                                >
                                    -
                                </button>
                                <span className="w-6 text-center text-xs font-black text-white select-none">
                                    {quantity}
                                </span>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (onAdd) onAdd(data);
                                    }}
                                    className="w-6 h-6 flex items-center justify-center rounded bg-amber-500 hover:bg-amber-400 text-black text-sm font-black active:scale-90 transition-all cursor-pointer"
                                >
                                    +
                                </button>
                            </motion.div>
                        ) : (
                            <motion.button
                                key="add-btn"
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                transition={{ duration: 0.2 }}
                                onClick={handleAddClick}
                                className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.15em] bg-red-600 hover:bg-red-500 text-white px-3 sm:px-4 py-1.5 rounded-lg shadow-lg hover:shadow-red-600/20 transition-all duration-300 active:scale-95 flex items-center gap-1.5 group-hover:scale-105"
                            >
                                Add <span className="hidden sm:inline">To Cart</span> 
                                <i className="fa-solid fa-cart-shopping text-[8px] sm:text-[10px]"></i>
                            </motion.button>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            <div className="relative h-[75px] w-[75px] sm:h-[80px] sm:w-[80px] flex-shrink-0 z-10">
                <div className="absolute inset-1 bg-white/5 rounded-full blur-xl scale-90 group-hover:scale-110 transition-transform duration-700"></div>
                {mounted ? (
                    <div className="relative h-full w-full overflow-hidden rounded-xl">
                        <img
                            src={imgSrc}
                            onError={() => {
                                if (imgSrc !== fallbackImgUrl) {
                                    setImgSrc(fallbackImgUrl);
                                }
                            }}
                            alt={data.name}
                            className="relative h-full w-full object-cover rounded-xl border border-white/10 drop-shadow-[0_10px_15px_rgba(0,0,0,0.5)] group-hover:rotate-3 group-hover:scale-110 transition-transform duration-500 ease-out"
                        />
                        {hasDiscount && (
                            <div className="absolute inset-x-0 bottom-0 bg-red-600/95 py-0.5 text-center text-[8px] sm:text-[9px] font-black uppercase text-white tracking-tighter leading-none shadow-md">
                                {discountPct}% OFF
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="relative h-full w-full bg-[#1a1a1a] rounded-xl border border-white/10" />
                )}
            </div>
        </motion.div>
    );
}
