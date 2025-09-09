export default function Header() {

    return (
        <div className="sm:h-24 h-16 flex justify-between items-center pl-4 pr-7 relative z-20 bg-gradient-to-r from-red-600 to-[rgb(0,0,0,0.4)">
            <div className="flex items-end h-[85%]">
                <img src="/icons/logo.png" alt="" className="h-full sm:mx-0 brightness-125" />
                <p className="text-slate-500 loader-text text-sm tracking-widest dancing-script-font">A Place to Remember</p>
            </div>
        </div>
    )
}