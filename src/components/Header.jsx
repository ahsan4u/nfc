export default function Header() {

    return (
        <div className="sm:h-20 h-16 flex justify-between items-center px-4 sm:px-8 fixed top-0 w-full z-40 bg-[#0a0a0a]/90 backdrop-blur-xl border-b border-white/5 shadow-2xl">
            <div className="flex items-center gap-4 h-[80%]">
                <img src="/icons/logo.png" alt="NFC Logo" className="h-full object-contain drop-shadow-[0_0_15px_rgba(255,255,255,0.05)]" />
                <div className="flex flex-col justify-center gap-1.5">
                    <h1 className="text-white text-base sm:text-xl font-black tracking-[0.25em] leading-tight uppercase bogart">NFC CAFE</h1>
                    <p className="text-amber-500/90 text-[8px] sm:text-[10px] tracking-[0.4em] font-bold uppercase opacity-80 shimmer-text">Taste That Brings You Back</p>
                </div>
            </div>
        </div>
    )
}