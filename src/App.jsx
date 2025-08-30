import { lazy, useState, Suspense } from "react";
import Header from "./components/Header";
import HeroBanner from "./components/HeroBanner";
const ComingSoon = lazy(() => import('./components/ComingSoon'));
const Images = lazy(() => import('./components/Images'));

export default function App() {
  const [open, setOpen] = useState(false);

  return (<>

    <Suspense fallback={null}>
      <ComingSoon open={open} setOpen={setOpen} />
    </Suspense>

    <Header />
    <div className="absolute top-0 w-full">
      <HeroBanner setOpen={setOpen} />
    <Suspense fallback={null}>
    <Images/>
    </Suspense>
    </div>
  </>)
}