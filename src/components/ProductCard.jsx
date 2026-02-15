
export default function ProductCard({ data, setOpen }) {


    return (
        <div className="group relative flex justify-between items-center pl-4 pr-2 bg-[#1a1a1a] border border-white/5 text-white rounded-2xl sm:h-[94px] h-[95px] w-full shadow-[0_4px_20px_rgba(0,0,0,0.4)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.6)] hover:scale-[1.01] active:bg-[#252525] transition-all duration-500 cursor-pointer overflow-hidden">
            {/* Premium Shine Overlay (Automatic on mobile, faster on hover) */}
            <div className="absolute inset-0 pointer-events-none self-center">
                <div className="absolute inset-[-150%] bg-gradient-to-r from-transparent via-white/10 to-transparent rotate-45 animate-card-shine group-hover:duration-700"></div>
            </div>

            {/* Subtle Inner Highlight */}
            <div className="absolute inset-0 rounded-2xl border border-white/0 group-hover:border-white/10 active:border-white/20 transition-colors duration-500 pointer-events-none"></div>

            <div className="flex flex-col justify-center items-start z-10 w-full max-w-[calc(100%-85px)] sm:max-w-[calc(100%-90px)]">
                <p className="font-bold sm:text-lg text-base leading-tight tracking-wide kalam-font line-clamp-1 text-gray-100 group-hover:text-white transition-colors duration-300">{data.name}</p>
                <div className="flex items-center gap-2 mt-0.5 sm:mt-1">
                    <p className="text-[10px] sm:text-xs text-gray-400 font-medium uppercase tracking-tighter">Price</p>
                    <span className="text-green-500 text-sm font-black drop-shadow-[0_0_8px_rgba(34,197,94,0.3)]">{data.price}₹</span>
                </div>
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        setOpen(true);
                    }}
                    className="mt-2 sm:mt-2.5 text-[9px] sm:text-[10px] font-black uppercase tracking-[0.15em] bg-red-600 hover:bg-red-500 text-white px-3 sm:px-4 py-1.5 rounded-lg shadow-lg hover:shadow-red-600/20 transition-all duration-300 active:scale-95 flex items-center gap-1.5 group-hover:scale-105"
                >
                    Add <span className="hidden sm:inline">To Cart</span> <i className="fa-solid fa-cart-shopping text-[8px] sm:text-[10px]"></i>
                </button>
            </div>

            <div className="relative h-[75px] w-[75px] sm:h-[80px] sm:w-[80px] flex-shrink-0 z-10">
                <div className="absolute inset-1 bg-white/5 rounded-full blur-xl scale-90 group-hover:scale-110 transition-transform duration-700"></div>
                <img
                    src={`/images/dishes/${data.img}.png`}
                    alt={data.name}
                    className="relative h-full w-full object-contain drop-shadow-[0_10px_15px_rgba(0,0,0,0.5)] group-hover:rotate-3 group-hover:scale-110 transition-transform duration-500 ease-out"
                />
            </div>
        </div>
    )
}