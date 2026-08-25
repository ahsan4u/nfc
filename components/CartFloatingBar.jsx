"use client";

import { motion, AnimatePresence } from "framer-motion";
import { formatPrice } from "@/lib/functions";
import { FiShoppingBag, FiArrowRight, FiClock } from "react-icons/fi";

export default function CartFloatingBar({ totalCount, totalPrice, deliveryTime, onOpenCheckout }) {
  if (totalCount <= 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        transition={{ type: "spring", stiffness: 350, damping: 25 }}
        className="fixed bottom-3 left-1/2 -translate-x-1/2 w-[calc(100%-24px)] max-w-[456px] z-40"
      >
        <div className="bg-gradient-to-r from-[#181820] to-[#121216] border border-amber-500/40 rounded-2xl p-2.5 sm:p-3 shadow-[0_10px_35px_rgba(0,0,0,0.8),0_0_20px_rgba(245,158,11,0.15)] flex items-center justify-between gap-3 backdrop-blur-xl">
          {/* Left Info */}
          <div className="flex items-center gap-2.5 min-w-0 pl-1">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-black flex items-center justify-center flex-shrink-0 shadow-md shadow-amber-500/20 font-black">
              <FiShoppingBag size={18} />
            </div>
            <div className="truncate">
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-black text-amber-400 uppercase tracking-wider">
                  {totalCount} {totalCount === 1 ? "Item" : "Items"}
                </span>
                <span className="text-gray-500 text-xs">•</span>
                <span className="text-white text-xs font-black">
                  {formatPrice(totalPrice)}
                </span>
              </div>
              <div className="flex items-center gap-1 text-[9px] text-gray-400 font-bold mt-0.5">
                <FiClock size={10} className="text-amber-400" />
                <span>Delivery in <span className="text-gray-200">{deliveryTime || "25-35 mins"}</span></span>
              </div>
            </div>
          </div>

          {/* Right Action Button */}
          <button
            onClick={onOpenCheckout}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white font-extrabold text-xs uppercase tracking-wider shadow-lg shadow-red-600/30 active:scale-95 transition-all cursor-pointer flex-shrink-0"
          >
            <span>Place Order</span>
            <FiArrowRight size={14} />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
