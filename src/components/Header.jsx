import { useState, useEffect } from "react";

export default function Header() {
    const phrases = ["NAWAB FUSION CREATIONS", "Taste That Brings You Back"];
    const [index, setIndex] = useState(0);
    const [subIndex, setSubIndex] = useState(0);
    const [isDeleting, setIsDeleting] = useState(false);
    const [pause, setPause] = useState(false);

    useEffect(() => {
        if (pause) return;

        if (subIndex === phrases[index].length + 1 && !isDeleting) {
            setPause(true);
            setTimeout(() => {
                setIsDeleting(true);
                setPause(false);
            }, 2000);
            return;
        }

        if (subIndex === 0 && isDeleting) {
            setIsDeleting(false);
            setIndex((prev) => (prev + 1) % phrases.length);
            return;
        }

        const timeout = setTimeout(() => {
            setSubIndex((prev) => prev + (isDeleting ? -1 : 1));
        }, isDeleting ? 50 : 100);

        return () => clearTimeout(timeout);
    }, [subIndex, isDeleting, index, pause, phrases]);

    return (
        <div className="sm:h-20 h-16 flex justify-between items-center px-4 sm:px-8 fixed top-0 w-full z-40 bg-[#0a0a0a]/60 backdrop-blur-xl border-b border-white/10 shadow-2xl">
            <div className="flex items-center gap-2 h-[80%]">
                <img src="/icons/logo.png" alt="NFC Logo" className="h-full -mt-0.5 object-contain drop-shadow-[0_0_15px_rgba(255,255,255,0.05)]" />
                <div className="flex flex-col justify-center gap-1.5 -mb-1">
                    <h1 className="text-white text-base sm:text-xl font-black tracking-[0.25em] leading-tight uppercase bogart">NFC CAFE</h1>
                    <p className="text-amber-500/90 text-[8px] sm:text-[10px] tracking-[0.4em] font-bold uppercase opacity-80 shimmer-text min-h-[1em] flex items-center">
                        {phrases[index].substring(0, subIndex)}
                        <span className="w-[2px] h-[1em] bg-amber-500 ml-1 animate-cursor inline-block"></span>

                    </p>
                </div>
            </div>
        </div>
    )
}



