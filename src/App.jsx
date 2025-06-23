import { useEffect, useRef } from "react";
import Header from "./components/Header";
import { useLocation } from "react-router-dom";

export default function App() {
  const bgImg_ = useRef(null);
  const leftText_ = useRef(null);
  const rightImg_ = useRef(null);
  const darkBg_ = useRef(null);
  const comingsoonImg_ = useRef(null);
  const location = useLocation();

  useEffect(() => {
    bgImg_.current.classList.remove("brightness-50")
    bgImg_.current.classList.add("brightness-100");

    leftText_.current.classList.remove("-translate-x-[120%]");
    leftText_.current.classList.add("translate-x-0");

    rightImg_.current.classList.remove("translate-x-[120%]");
    rightImg_.current.classList.add("translate-x-0");

  }, [location])


  function popupMsg(time) {
    console.log('hi');
    comingsoonImg_.current.classList.remove("-translate-y-full")
    comingsoonImg_.current.classList.add("translate-y-0")

    darkBg_.current.classList.remove('pointer-events-none', 'opacity-0');
    darkBg_.current.classList.add('opacity-100');

    setTimeout(() => {
      removePopup();
    }, time);
  }

  function removePopup() {
    comingsoonImg_.current.classList.remove("translate-y-0")
      comingsoonImg_.current.classList.add("-translate-y-full")

      darkBg_.current.classList.remove('opacity-100');
      darkBg_.current.classList.add('pointer-events-none', 'opacity-0');
  }

  return (<>
    <div ref={darkBg_} className="bg-[rgb(0,0,0,0.8)] fixed w-[100vw] h-[100vh] z-30 opacity-0 pointer-events-none  transition-all duration-500"></div>
    <div className="absolute z-30 top-0 w-full h-[100vh] pointer-events-none">
      <img ref={comingsoonImg_} src="/commin-soon.png" alt="" className="sm:w-[37%] w-[80%] mx-auto transition-all duration-500 -translate-y-full" />
    </div>


    <Header />
    <div className="absolute top-0 w-full">
      <div className="relative sm:aspect-[16/7.6] aspect-[16/12] w-full z-10 overflow-hidden">
        <img ref={bgImg_} src="/hero-banner.jpg" alt="" className="absolute top-0 h-full w-full object-cover brightness-50 transition-all duration-700" />

        <div className="h-full flex justify-between sm:items-center items-end sm:pb-0 pb-8 sm:w-[85%] mx-auto relative z-10 text-white">
          <div ref={leftText_} className="sm:w-[40%] w-[45%] sm:ml-0 ml-4 -translate-x-[120%] transition-all duration-700">
            <p className="sm:text-7xl text-lg font-bold sm:leading-20">Enjoy our Delicious Meal</p>
            <p className="sm:text-lg text-[10px] sm:mt-5 mt-2">Classic recipes with a modern twist, made fresh with care food that delights, comforts, and truly leaves a lasting mark.</p>
            <button onClick={()=>popupMsg(2000)} className="sm:px-10 px-5 sm:py-3 py-2 sm:text-xl text-xs tracking-wider font-bold rounded-md bg-yellow-600 sm:mt-12 mt-3 cursor-pointer">Book a Table</button>
          </div>


          <img ref={rightImg_} src="/dish.png" alt="" className="w-[50%] -mb-4 brightness-75 contrast-125 mr-1 translate-x-[120%] transition-all duration-700" />
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-y-6">
        <img src="/banner-1.jpg" alt="" className="w-full" />
        <img src="/coming-soon-2.avif" alt="" className="w-full" />
      </div>
    </div>
  </>)
}