import { lazy, useState, Suspense, Fragment, useRef, useEffect } from "react";
import Header from "./components/Header";
import HeroBanner from "./components/HeroBanner";
import ProductCard from "./components/ProductCard";
import Footer from "./components/Footer";
import FounderSection from "./components/FounderSection";
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

    <div className="h-60 sm:h-72" />
    <h2 className="text-center font-bold text-white sm:text-2xl text-lg mt-6 bogart tracking-wider">🔥Pick Your Obsession🔥</h2>
    <ol className="flex items-center text-white gap-x-2.5 sm:gap-x-4 mt-5 mx-3 overflow-x-auto pb-4 no-scrollbar snap-x snap-mandatory scroll-smooth">
      {
        ['All', 'Roll', 'Burger', 'Sandwich', 'Pizza', 'Momos', 'Mandi', 'Shakes', 'Mojito'].map(item => (
          <li key={item} className="snap-start flex-shrink-0">
            <button
              onClick={setActiveFn}
              className={`px-4 sm:px-6 py-1.5 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all duration-300 border backdrop-blur-md ${active === item
                ? 'bg-amber-500 border-amber-400 text-black shadow-[0_0_20px_rgba(245,158,11,0.5)] scale-105'
                : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10 hover:text-white'
                }`}
            >
              {item}
            </button>
          </li>
        ))
      }
    </ol>
    {(() => {
      let counter = 0;
      return items.length < 1 ? (<p className="text-center my-[15vh]"><span className="px-6 py-3 bg-red-700/80 text-white rounded-xl backdrop-blur-sm border border-red-500/50">Currently Unavailable</span></p>) :
        (items.map((dish, idx) => <Fragment key={dish.img}>
          <h3 className="font-bold sm:text-2xl text-xl min-w-1/2 inline-block py-2 pl-4 mt-6 sm:mt-10 rounded-r-full text-amber-500 bg-white/5 border-y border-r border-white/10 shadow-lg">{dish.head}</h3>
          <div className="mx-3 space-y-4 mt-4">
            {dish.menu.map((item, i) => <div ref={(e) => itemDiv_.current[counter++] = e} key={i} className="opacity-0 translate-y-4 transition-all duration-200"><ProductCard data={{ img: dish.img, ...item }} setOpen={setOpen} /></div>)}
          </div>
        </Fragment>))
    })()}
    <FounderSection />
    <Footer />
  </>)
}