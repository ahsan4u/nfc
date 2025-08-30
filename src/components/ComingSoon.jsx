import { useEffect, useRef, useState } from "react";

export default function ComingSoon({open, setOpen}) {
    const darkBg_ = useRef(null);
    const comingsoonImg_ = useRef(null);
    useEffect(()=>{if(open) {
        popupMsg();
        setOpen(false);
    } },[open]);


    function popupMsg() {
        comingsoonImg_.current.classList.remove("-translate-y-full")
        comingsoonImg_.current.classList.add("translate-y-0")

        darkBg_.current.classList.remove('pointer-events-none', 'opacity-0');
        darkBg_.current.classList.add('opacity-100');

        setTimeout(() => { removePopup() }, 2000);
    }

    function removePopup() {
        comingsoonImg_.current.classList.remove("translate-y-0")
        comingsoonImg_.current.classList.add("-translate-y-full")

        darkBg_.current.classList.remove('opacity-100');
        darkBg_.current.classList.add('pointer-events-none', 'opacity-0');
    }

    return (<>
        <div ref={darkBg_} onClick={()=>removePopup()} className="bg-[rgb(0,0,0,0.8)] fixed w-[100vw] h-[100vh] z-30 opacity-0 pointer-events-none  transition-all duration-500"></div>
        <div className="absolute z-30 top-0 w-full h-[100vh] pointer-events-none">
            <img ref={comingsoonImg_} src="/commin-soon.png" alt="" className="sm:w-[37%] w-[80%] mx-auto transition-all duration-500 -translate-y-full" />
        </div>
    </>)
}