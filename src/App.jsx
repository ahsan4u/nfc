import { lazy, useState, Suspense, Fragment, useRef, useEffect } from "react";
import Header from "./components/Header";
import HeroBanner from "./components/HeroBanner";
import ProductCard from "./components/ProductCard";
import Footer from "./components/Footer";
const ComingSoon = lazy(() => import('./components/ComingSoon'));


const dishes = [
  { img: 'burger', head: 'Burger', menu: [{ name: 'Chicken Burger', price: 80 }, { name: 'Patty Burger', price: 120 }, { name: 'Zingar Burger', price: 190 }] },
  { img: 'sandwitch', head: 'Sandwich', menu: [{ name: 'Veg. Sandwich', price: 50 }, { name: 'Paneer Sandwich', price: 60 }, { name: 'Chicken Sandwich', price: 60 }] },
  { img: 'roll', head: 'Roll', menu: [{ name: 'Egg Roll', price: 50 }, { name: 'Paneer Roll', price: 80 }, { name: 'Chicken Roll', price: 80 }] },
]
export default function App() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState(dishes);
  const [active, setActive] = useState('All');
  const itemDiv_ = useRef([]);

  function setActiveFn(e) {
    const { textContent } = e.target;
    textContent !== 'All' ? setItems(dishes.filter(a => a.head == textContent)) : setItems(dishes);
    setActive(textContent);
  }


  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          if (entry.boundingClientRect?.top > entry.rootBounds?.top) {
            // 👆 Element came in from the bottom
            entry.target.classList.remove('opacity-0', 'translate-y-4');
            entry.target.classList.add('opacity-100', 'translate-y-0');
          } else {
            // 👇 Element came in from the top
            entry.target.classList.remove('opacity-0', '-translate-y-4');
            entry.target.classList.add('opacity-100', 'translate-y-0');
          }

        } else {
          if (entry.boundingClientRect?.top > entry.rootBounds?.top) {
            // ⬇ Element left going down
            entry.target.classList.add('opacity-0', 'translate-y-4');
            entry.target.classList.remove('opacity-100', 'translate-y-0');
          } else {
            // ⬆ Element left going up
            entry.target.classList.add('opacity-0', '-translate-y-4');
            entry.target.classList.remove('opacity-100', 'translate-y-0');
          }
        }
      })
    }, {
      threshold: 0.3,
      rootMargin: '-20px 0px 20px 0px'
    })

    itemDiv_.current.forEach((item) => item && observer.observe(item));

    return () => observer.disconnect();
  }, [active]);



  return (<>

    <Suspense fallback={null}>
      <ComingSoon open={open} setOpen={setOpen} />
    </Suspense>

    <Header />
    <div className="absolute top-0 w-full">
      <HeroBanner setOpen={setOpen} />
    </div>

    <div className="h-60" />
    <h2 className="text-center font-bold text-white text-xl mt-4 bogart tracking-wider">🔥Pick Your Obsession🔥</h2>
    <ol className="flex text-white gap-x-4 mt-4 mx-2 overflow-x-scroll snap-x snap-mandatory">
      {
        ['All', 'Roll', 'Burger', 'Sandwich', 'Pizza', 'Momos', 'Mandi', 'Shakes', 'Mojito'].map(item => <li key={item} ><button onClick={setActiveFn} className={`snap-start px-3 py-0.5 rounded-md bg-[#ffffff0c] border-2 ${active == item ? 'border-amber-600 text-amber-500' : 'border-[#ffffff19]'}`}>{item}</button></li>)
      }
    </ol>
    {(() => {
      let counter = 0;
      return items.length < 1 ? (<p className="text-center my-[15vh]"><span className="px-4 py-2 bg-red-700 text-white rounded-md">Currently Unavailable</span></p>) :
        (items.map((dish, idx) => <Fragment key={dish.img}>
          <h3 className="font-bold text-2xl min-w-1/2 inline-block py-2 pl-3 mt-8 rounded-r-full text-amber-500 bg-[#1c1c1c]">{dish.head}</h3>
          <div className="mx-3 space-y-4 mt-4">
            {dish.menu.map((item, i) => <div ref={(e) => itemDiv_.current[counter++] = e} key={i} className="opacity-0 translate-y-4 transition-all duration-200"><ProductCard data={{ img: dish.img, ...item }} setOpen={setOpen} /></div>)}
          </div>
        </Fragment>))
    })()}
    {/* <Suspense fallback={null}>
        <Images />
      </Suspense> */}
    <Footer />
  </>)
}