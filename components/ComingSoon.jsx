"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getBlobUrl } from "@/lib/functions";

export default function ComingSoon({ open, setOpen, config }) {
    const [show, setShow] = useState(false);
    const boardImg = getBlobUrl(config?.coming_soon_image || "/commin-soon.png");

    useEffect(() => {
        if (open) {
            setShow(true);
            setOpen(false); // Reset parent trigger state
        }
    }, [open, setOpen]);

    useEffect(() => {
        if (show) {
            const timer = setTimeout(() => {
                setShow(false);
            }, 2000);
            return () => clearTimeout(timer);
        }
    }, [show]);

    return (
        <AnimatePresence>
            {show && (
                <>
                    {/* Backdrop matching original style */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.5 }}
                        onClick={() => setShow(false)}
                        className="bg-black/80 fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] h-screen z-50 cursor-pointer"
                    />

                    {/* Sliding board hanging container */}
                    <div className="fixed z-50 top-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] h-screen pointer-events-none overflow-hidden">
                        <motion.img
                            src={boardImg}
                            alt="Coming Soon"
                            initial={{ y: "-100%" }}
                            animate={{ y: 0 }}
                            exit={{ y: "-100%" }}
                            transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1.0] }}
                            className="w-[80%] mx-auto pointer-events-auto"
                        />
                    </div>
                </>
            )}
        </AnimatePresence>
    );
}
