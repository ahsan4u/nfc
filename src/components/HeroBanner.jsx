import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

export default function HeroBanner({setOpen}) {
    const location = useLocation();
    const [isLoaded, setLoaded] = useState(false);
    useEffect(() => {setLoaded(true)}, [location]);

    return (
        <div className="relative sm:aspect-[16/7.6] aspect-[16/12] w-full z-10 overflow-hidden">
            <img src="/hero-banner.jpg" alt="" className={`absolute top-0 h-full w-full object-cover ${isLoaded? 'brightness-50': 'brightness-100'} flip-x transition-all duration-700`} />

            <div className="h-full flex justify-between sm:items-center items-end sm:pb-0 pb-8 sm:w-[85%] mx-auto relative z-10 text-white">
                <div className={`sm:w-[40%] w-[45%] sm:ml-0 ml-4 ${isLoaded? 'translate-x-0': '-translate-x-[120%]'} transition-all duration-700`}>
                    <p className="permanent-marker-font tracking-widest sm:text-7xl text-lg font-bold sm:leading-20">Enjoy our Delicious Meal</p>
                    <p className="sm:text-lg text-[10px] sm:mt-5 mt-2">Classic recipes with a modern twist, made fresh with care food that delights, comforts, and truly leaves a lasting mark.</p>
                    <button onClick={() => setOpen(true)} className="sm:px-10 px-5 sm:py-3 py-2 sm:text-xl text-xs tracking-wider font-bold rounded-md bg-amber-600 sm:mt-12 mt-3 cursor-pointer">Book a Table</button>
                </div>


                <img src="/dish.png" alt="" className={`w-[50%] -mb-4 brightness-75 contrast-125 mr-1 ${isLoaded? 'translate-x-0': 'translate-x-[120%]'} transition-all duration-700`} />
            </div>
        </div>
    )
}