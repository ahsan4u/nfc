import { useEffect, useRef, useState } from "react";
import Header from "./components/Header";
import { useLocation } from "react-router-dom";
import ComingSoon from "./components/ComingSoon";
import HeroBanner from "./components/HeroBanner";

export default function App() {
  const [open, setOpen] = useState(false);

  return (<>

    <ComingSoon open={open} setOpen={setOpen} />

    <Header />
    <div className="absolute top-0 w-full">
      <HeroBanner setOpen={setOpen}/>

      <div className="mt-6 flex flex-col gap-y-6">
        <img src="/banner-2.jpg" alt="" className="w-full" />
        <img src="/banner-4.jpg" alt="" className="w-full" />
        <img src="/banner-1.jpg" alt="" className="w-full" />
        <img src="/coming-soon-2.avif" alt="" className="w-full" />
        <img src="/banner-3.jpg" alt="" className="w-full" />
      </div>
    </div>
  </>)
}