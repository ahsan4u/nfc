"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getDishImageUrl, formatPrice, parseGrams, formatWeightDisplay } from "@/lib/functions";
import { FiPlus, FiMinus } from "react-icons/fi";

export default function ProductCard({ 
    data, 
    quantity = 0, 
    onAdd, 
    onRemove, 
    onSelectVariant,
    setOpen 
}) {
    const { dishImgUrl: defaultImgUrl, fallbackImgUrl } = getDishImageUrl(data.name, data.img);
    const dishImgUrl = data.image_url || defaultImgUrl;

    const [imgSrc, setImgSrc] = useState(dishImgUrl);
    const [mounted, setMounted] = useState(false);
    const [selectedBatchIdx, setSelectedBatchIdx] = useState(0);

    useEffect(() => {
        setImgSrc(dishImgUrl);
    }, [dishImgUrl]);

    useEffect(() => {
        setMounted(true);
    }, []);

    const isWeight = data.pricing_type === "weight";
    const isPortionOrCustom = (data.pricing_type === "portion" || data.pricing_type === "custom") && 
                              Array.isArray(data.variants) && 
                              data.variants.length > 0;

    // Process Weight Batches dynamically
    let sortedWeightBatches = [];
    if (isWeight) {
        const rawBatches = Array.isArray(data.variants) && data.variants.length > 0
            ? data.variants
            : [{ name: "250g", price: data.price, compare_price: data.compare_price, note: "" }];
        
        sortedWeightBatches = [...rawBatches].sort((a, b) => {
            const gA = parseGrams(a.name) || a.step_grams || 0;
            const gB = parseGrams(b.name) || b.step_grams || 0;
            return gA - gB;
        });
    }

    const hasMultipleWeightBatches = sortedWeightBatches.length > 1;
    const currentWeightBatch = sortedWeightBatches[selectedBatchIdx] || sortedWeightBatches[0] || null;

    // Pricing & Display logic
    let displayPrice = data.price;
    let displayComparePrice = data.compare_price;

    if (isWeight && currentWeightBatch) {
        displayPrice = currentWeightBatch.price;
        displayComparePrice = currentWeightBatch.compare_price;
    } else if (!isWeight && quantity > 0) {
        displayPrice = parseFloat(data.price) * quantity;
        displayComparePrice = data.compare_price ? parseFloat(data.compare_price) * quantity : null;
    }

    const hasDiscount = displayComparePrice && parseFloat(displayComparePrice) > parseFloat(displayPrice);
    const discountPct = hasDiscount 
        ? Math.round(((parseFloat(displayComparePrice) - parseFloat(displayPrice)) / parseFloat(displayComparePrice)) * 100)
        : null;

    const handleCardClick = () => {
        if ((isPortionOrCustom || isWeight) && onSelectVariant) {
            onSelectVariant(data);
        }
    };

    const handleAddClick = (e) => {
        e.stopPropagation();
        if (isPortionOrCustom && onSelectVariant) {
            onSelectVariant(data);
        } else if (isWeight && onAdd && currentWeightBatch) {
            onAdd({
                ...data,
                selectedVariant: {
                    id: currentWeightBatch.id || currentWeightBatch.name,
                    name: currentWeightBatch.name,
                    note: currentWeightBatch.note || "",
                    price: parseFloat(currentWeightBatch.price),
                    compare_price: currentWeightBatch.compare_price ? parseFloat(currentWeightBatch.compare_price) : null,
                },
                pricing_type: "weight",
            });
        } else if (onAdd) {
            onAdd(data);
        } else if (setOpen) {
            setOpen(true);
        }
    };

    const handleRemoveClick = (e) => {
        e.stopPropagation();
        if (isWeight && onRemove && currentWeightBatch) {
            onRemove({
                ...data,
                selectedVariant: {
                    id: currentWeightBatch.id || currentWeightBatch.name,
                    name: currentWeightBatch.name,
                },
            });
        } else if (onRemove) {
            onRemove(data);
        }
    };

    return (
        <motion.div 
            onClick={(isPortionOrCustom || isWeight) ? handleCardClick : undefined}
            className="group relative flex justify-between items-center pl-4 pr-2 bg-[#1a1a1a] border border-white/5 text-white rounded-2xl min-h-[95px] sm:min-h-[96px] py-2 w-full shadow-[0_4px_20px_rgba(0,0,0,0.4)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.6)] hover:scale-[1.01] active:bg-[#252525] transition-all duration-500 cursor-pointer overflow-hidden"
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
                <div className="flex items-center gap-1.5 w-full">
                    <p className="font-bold sm:text-lg text-base leading-tight tracking-wide kalam-font line-clamp-1 text-gray-100 group-hover:text-white transition-colors duration-300">
                        {data.name}
                    </p>
                </div>

                {/* SHOW ALL ADDED WEIGHT BATCHES AS INTERACTIVE PILLS */}
                {isWeight && hasMultipleWeightBatches && (
                    <div className="flex items-center gap-1 my-1 overflow-x-auto no-scrollbar max-w-full">
                        {sortedWeightBatches.map((batch, idx) => {
                            const isSelected = selectedBatchIdx === idx;
                            return (
                                <button
                                    key={batch.id || idx}
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedBatchIdx(idx);
                                    }}
                                    className={`px-2 py-0.5 rounded-lg text-[9px] font-black border transition-all cursor-pointer whitespace-nowrap flex items-center gap-1 ${
                                        isSelected
                                            ? "bg-amber-500 text-black border-amber-500 shadow-md shadow-amber-500/20"
                                            : "bg-white/5 text-gray-300 border-white/10 hover:bg-white/15 hover:text-white"
                                    }`}
                                >
                                    <span>{batch.name}</span>
                                    <span className={isSelected ? "text-black/80 font-mono" : "text-green-400 font-mono"}>
                                        {formatPrice(batch.price)}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                )}

                {/* Price & Badges */}
                <div className="flex items-center gap-1.5 mt-0.5 sm:mt-1 flex-wrap">
                    {isPortionOrCustom && (
                        <span className="text-[9px] font-bold text-amber-400 uppercase tracking-tight bg-amber-500/15 px-1.5 py-0.2 rounded border border-amber-500/30">
                            {data.pricing_type === "portion" ? "Quarter / Half / Full" : "Sizes"}
                        </span>
                    )}

                    <div className="flex items-center gap-1">
                        {isPortionOrCustom && (
                            <span className="text-[9px] text-gray-400 font-semibold uppercase">From</span>
                        )}
                        <span className="text-green-500 text-sm font-black drop-shadow-[0_0_8px_rgba(34,197,94,0.3)] font-mono">
                            {formatPrice(displayPrice)}
                        </span>
                        {isWeight && currentWeightBatch && !hasMultipleWeightBatches && (
                            <span className="text-[10px] text-gray-400 font-bold">
                                /{currentWeightBatch.name}
                            </span>
                        )}
                        {hasDiscount && (
                            <span className="line-through text-gray-400 text-xs font-semibold font-mono">
                                {formatPrice(displayComparePrice)}
                            </span>
                        )}
                    </div>
                </div>

                {/* Action Button / Stepper Controller */}
                <div className="mt-2 sm:mt-2.5 h-[28px] flex items-center">
                    <AnimatePresence mode="wait">
                        {isPortionOrCustom ? (
                            quantity > 0 ? (
                                <motion.button
                                    key="customise-added-btn"
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    transition={{ duration: 0.2 }}
                                    onClick={handleAddClick}
                                    className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.1em] bg-amber-500 hover:bg-amber-400 text-black px-2.5 sm:px-3 py-1 rounded-lg shadow-md shadow-amber-500/20 active:scale-95 flex items-center gap-1.5 cursor-pointer"
                                >
                                    <span>Added ({quantity})</span>
                                    <FiPlus size={11} className="text-black/80" />
                                </motion.button>
                            ) : (
                                <motion.button
                                    key="customise-btn"
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    transition={{ duration: 0.2 }}
                                    onClick={handleAddClick}
                                    className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.12em] bg-amber-500 hover:bg-amber-400 text-black px-3 sm:px-3.5 py-1.5 rounded-lg shadow-lg hover:shadow-amber-500/20 transition-all duration-300 active:scale-95 flex items-center gap-1 group-hover:scale-105 cursor-pointer"
                                >
                                    <span>Add</span>
                                    <span className="text-[8px] bg-black/20 px-1 py-0.2 rounded font-bold">Options</span>
                                </motion.button>
                            )
                        ) : quantity > 0 ? (
                            /* INLINE STEPPER */
                            <motion.div
                                key="stepper"
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.8 }}
                                transition={{ duration: 0.2 }}
                                className="flex items-center bg-[#232329] border border-amber-500/50 rounded-lg p-0.5 shadow-md shadow-amber-500/10"
                            >
                                <button
                                    onClick={handleRemoveClick}
                                    className="w-6 h-6 flex items-center justify-center rounded bg-white/5 hover:bg-white/15 text-amber-400 text-sm font-black active:scale-90 transition-all cursor-pointer"
                                >
                                    <FiMinus size={11} />
                                </button>
                                <span className="text-center text-xs font-black text-white select-none font-mono w-6">
                                    {quantity}
                                </span>
                                <button
                                    onClick={handleAddClick}
                                    className="w-6 h-6 flex items-center justify-center rounded bg-amber-500 hover:bg-amber-400 text-black text-sm font-black active:scale-90 transition-all cursor-pointer"
                                >
                                    <FiPlus size={11} />
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
                                className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.15em] bg-red-600 hover:bg-red-500 text-white px-3 sm:px-4 py-1.5 rounded-lg shadow-lg hover:shadow-red-600/20 transition-all duration-300 active:scale-95 flex items-center gap-1.5 group-hover:scale-105 cursor-pointer"
                            >
                                <span>Add {isWeight && currentWeightBatch ? `(${currentWeightBatch.name})` : ""}</span> 
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
                            <div className="absolute inset-x-0 bottom-0 bg-red-600/95 py-1 text-center text-[8px] sm:text-[9px] font-black uppercase text-white tracking-tighter leading-none shadow-md">
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
