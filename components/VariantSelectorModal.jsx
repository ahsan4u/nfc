"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiX, FiCheck, FiPlus, FiMinus, FiShoppingBag, FiLayers, FiTag } from "react-icons/fi";
import { formatPrice, getDishImageUrl, parseGrams } from "@/lib/functions";

export default function VariantSelectorModal({
  open,
  onClose,
  dish,
  onAddToCart,
}) {
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [qty, setQty] = useState(1);

  const rawVariants = Array.isArray(dish?.variants) ? dish.variants : [];
  const variants = dish?.pricing_type === "weight"
    ? [...rawVariants].sort((a, b) => (parseGrams(a.name) || 0) - (parseGrams(b.name) || 0))
    : rawVariants;

  // Initialize with the first variant whenever a new dish is opened
  useEffect(() => {
    if (dish && variants.length > 0) {
      setSelectedVariant(variants[0]);
      setQty(1);
    }
  }, [dish]);

  // Lock body scroll while modal is open
  useEffect(() => {
    if (open) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [open]);

  if (!open || !dish) return null;

  const { dishImgUrl, fallbackImgUrl } = getDishImageUrl(dish.name, dish.img || "all");
  const finalImg = dish.image_url || dishImgUrl;

  const unitPrice = selectedVariant ? parseFloat(selectedVariant.price) : parseFloat(dish.price || 0);
  const totalPrice = unitPrice * qty;

  const handleConfirmAdd = () => {
    if (!selectedVariant) return;

    onAddToCart?.({
      ...dish,
      selectedVariant: {
        id: selectedVariant.id || selectedVariant.name,
        name: selectedVariant.name,
        note: selectedVariant.note || "",
        price: parseFloat(selectedVariant.price),
        compare_price: selectedVariant.compare_price ? parseFloat(selectedVariant.compare_price) : null,
      },
      customQty: qty,
    });

    onClose?.();
  };

  const isPortion = dish.pricing_type === "portion";
  const isWeight = dish.pricing_type === "weight";

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/85 backdrop-blur-md">
        {/* Backdrop click to dismiss */}
        <div className="absolute inset-0" onClick={onClose} />

        {/* Modal Sheet */}
        <motion.div
          initial={{ y: "100%", opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: "100%", opacity: 0 }}
          transition={{ type: "spring", damping: 28, stiffness: 320 }}
          className="relative z-10 w-full max-w-[480px] bg-[#121218] border-t sm:border border-white/10 rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl overflow-hidden max-h-[85vh] flex flex-col"
        >
          {/* Top Header */}
          <div className="flex items-center justify-between pb-3 border-b border-white/10 flex-shrink-0">
            <div className="flex items-center gap-2">
              {isPortion ? (
                <FiLayers className="text-amber-400" size={16} />
              ) : isWeight ? (
                <FiTag className="text-blue-400" size={16} />
              ) : (
                <FiShoppingBag className="text-amber-400" size={16} />
              )}
              <h3 className="text-xs font-black uppercase tracking-wider text-white">
                {isPortion ? "Select Portion Size" : isWeight ? "Select Weight (Grams / Kg)" : "Select Variant"}
              </h3>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors cursor-pointer"
            >
              <FiX size={16} />
            </button>
          </div>

          {/* Dish Header Info */}
          <div className="flex items-center gap-3 py-3.5 border-b border-white/5 flex-shrink-0">
            <div className="w-14 h-14 rounded-2xl bg-black/60 border border-white/10 overflow-hidden flex-shrink-0">
              <img
                src={finalImg}
                alt={dish.name}
                onError={(e) => { e.currentTarget.src = fallbackImgUrl; }}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="text-sm font-black text-white truncate kalam-font">{dish.name}</h4>
              <p className="text-[10px] text-gray-400 mt-0.5">
                {isPortion ? "Available in Quarter, Half & Full sizes" : isWeight ? "Freshly packed by weight" : "Customise your order"}
              </p>
            </div>
          </div>

          {/* Variants List (Scrollable) */}
          <div className="py-3 space-y-2.5 overflow-y-auto flex-1 no-scrollbar">
            <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">
              Choose Option:
            </label>

            {variants.map((v, idx) => {
              const isSelected = selectedVariant?.id === (v.id || v.name) || selectedVariant?.name === v.name;
              const hasDiscount = v.compare_price && parseFloat(v.compare_price) > parseFloat(v.price);

              return (
                <div
                  key={v.id || idx}
                  onClick={() => setSelectedVariant(v)}
                  className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                    isSelected
                      ? "bg-amber-500/15 border-amber-500 shadow-md shadow-amber-500/10"
                      : "bg-[#181822] border-white/10 hover:border-white/20"
                  }`}
                >
                  {/* Left: Radio + Name + Note in () */}
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div
                      className={`w-5 h-5 rounded-full border flex items-center justify-center flex-shrink-0 transition-all ${
                        isSelected
                          ? "border-amber-500 bg-amber-500 text-black"
                          : "border-white/30 bg-transparent"
                      }`}
                    >
                      {isSelected && <FiCheck size={12} className="stroke-[3]" />}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs font-black text-white">{v.name}</span>
                        {v.note && (
                          <span className="text-[11px] font-bold text-amber-400/90">
                            ({v.note})
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Price */}
                  <div className="text-right flex-shrink-0">
                    <div className="flex items-center gap-1.5 justify-end">
                      <span className="text-xs font-black text-green-400 font-mono">
                        {formatPrice(v.price)}
                      </span>
                      {hasDiscount && (
                        <span className="text-[10px] text-gray-500 line-through font-mono">
                          {formatPrice(v.compare_price)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bottom Actions Bar */}
          <div className="pt-3 border-t border-white/10 flex-shrink-0 flex items-center justify-between gap-3">
            {/* Quantity Stepper */}
            <div className="flex items-center bg-[#1c1c26] border border-white/10 rounded-xl p-1 shadow-inner">
              <button
                type="button"
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/15 text-amber-400 flex items-center justify-center text-sm font-black active:scale-90 transition-all cursor-pointer"
              >
                <FiMinus size={13} />
              </button>
              <span className="w-8 text-center text-xs font-black text-white font-mono select-none">
                {qty}
              </span>
              <button
                type="button"
                onClick={() => setQty((q) => q + 1)}
                className="w-8 h-8 rounded-lg bg-amber-500 hover:bg-amber-400 text-black flex items-center justify-center text-sm font-black active:scale-90 transition-all cursor-pointer"
              >
                <FiPlus size={13} />
              </button>
            </div>

            {/* Add to Cart Button */}
            <button
              type="button"
              onClick={handleConfirmAdd}
              disabled={!selectedVariant}
              className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-extrabold text-xs uppercase tracking-wider shadow-lg shadow-amber-500/25 active:scale-95 transition-all flex items-center justify-between cursor-pointer disabled:opacity-50"
            >
              <span>Add to Cart</span>
              <span className="font-mono font-black text-sm bg-black/20 px-2 py-0.5 rounded-md">
                {formatPrice(totalPrice)}
              </span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
