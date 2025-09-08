import { lazy, useState, Suspense, Fragment } from "react";
import Header from "./components/Header";
import HeroBanner from "./components/HeroBanner";
import ProductCard from "./components/ProductCard";
import Footer from "./components/Footer";
const ComingSoon = lazy(() => import('./components/ComingSoon'));
const Images = lazy(() => import('./components/Images'));

export default function App() {
  const [open, setOpen] = useState(false);

  const dishes = [
    { img: 'burger', head: 'Burger', menu: [{ name: 'Chicken Burger', price: 80 }, { name: 'Patty Burger', price: 120 }, { name: 'Zingar Burger', price: 190 }] },
    { img: 'sandwitch', head: 'Sandwitch', menu: [{ name: 'Veg. Sandwitch', price: 50 }, { name: 'Paneer Sandwitch', price: 60 }, { name: 'Chicken Sandwitch', price: 60 }] },
    { img: 'roll', head: 'Roll', menu: [{ name: 'Egg Roll', price: 50 }, { name: 'Paneer Roll', price: 80 }, { name: 'Chicken Roll', price: 80 }] },
  ]

  return (<>

    <Suspense fallback={null}>
      <ComingSoon open={open} setOpen={setOpen} />
    </Suspense>

    <Header />
    <div className="absolute top-0 w-full">
      <HeroBanner setOpen={setOpen} />
    </div>

    <div className="h-56" />
    <h2 className="text-center font-bold text-white text-xl pt-4">🔥Pick Your Obsession🔥</h2>
    {
      dishes.map(dish => <Fragment key={dish.img}>
        <h3 className="font-bold text-2xl min-w-1/2 inline-block py-2 pl-3 mt-8 rounded-r-full text-yellow-400 bg-[#1c1c1c]">{dish.head}</h3>
        <div className="mx-3 space-y-4 mt-4">
          {dish.menu.map((item, idx) => <ProductCard key={idx} data={{ img: dish.img, ...item }} setOpen={setOpen} />)}
        </div>
      </Fragment>)
    }
    {/* <Suspense fallback={null}>
        <Images />
      </Suspense> */}
    <Footer />
  </>)
}