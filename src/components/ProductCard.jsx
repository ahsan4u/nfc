
export default function ProductCard({ data, setOpen }) {


    return (
        <div className="group relative flex justify-between items-center pl-4 pr-2 bg-gradient-to-br from-[#2a2a2a] to-[#1a1a1a] border border-white/5 text-white rounded-2xl sm:h-[94px] h-[90px] w-full shadow-lg hover:shadow-amber-500/10 hover:scale-[1.02] transition-all duration-300 cursor-pointer overflow-hidden">
            {/* Background Glow Effect */}
            <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none group-hover:bg-amber-500/10 transition-colors duration-300"></div>

            <div className="flex flex-col justify-center items-start z-10 w-full max-w-[calc(100%-85px)] sm:max-w-[calc(100%-90px)]">
                <p className="font-bold sm:text-lg text-base leading-tight kalam-font line-clamp-1 text-gray-100 group-hover:text-amber-400 transition-colors duration-300">{data.name}</p>
                <p className="text-[10px] sm:text-xs mt-0.5 sm:mt-1 text-gray-400 font-medium">Price <span className="text-green-500 text-sm font-bold ml-1">{data.price}₹</span></p>
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        setOpen(true);
                    }}
                    className="mt-1.5 sm:mt-2 text-[10px] font-bold uppercase tracking-wider bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white px-3 py-1.5 rounded-lg shadow-md hover:shadow-red-600/30 transition-all duration-300 active:scale-95 flex items-center gap-1"
                >
                    Add <span className="hidden sm:inline text-[9px]">To Cart</span> <i className="fa-solid fa-cart-shopping text-[8px] sm:text-[10px]"></i>
                </button>
            </div>

            <div className="relative h-[70px] w-[70px] sm:h-[80px] sm:w-[80px] flex-shrink-0">
                <div className="absolute inset-0 bg-amber-500/20 rounded-full blur-lg scale-75 group-hover:scale-100 transition-transform duration-500"></div>
                <img
                    src={`/images/dishes/${data.img}.png`}
                    alt={data.name}
                    className="relative h-full w-full object-contain drop-shadow-xl group-hover:rotate-6 group-hover:scale-110 transition-transform duration-500 ease-out"
                />
            </div>
        </div>
    )
}