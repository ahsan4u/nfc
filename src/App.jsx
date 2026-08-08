import { lazy, useState, Suspense, Fragment, useRef, useEffect } from "react";
import Header from "./components/Header";
import HeroBanner from "./components/HeroBanner";
import ProductCard from "./components/ProductCard";
import Footer from "./components/Footer";
import FounderSection from "./components/FounderSection";
import BackgroundAnimation from "./components/BackgroundAnimation";
const ComingSoon = lazy(() => import('./components/ComingSoon'));


const dishes = [
  {
    img: 'street_bites_chaat',
    head: 'Street Bites & Chaat',
    menu: [
      { name: 'Special Dahi Puri', price: 60 },
      { name: 'Sev Puri Premium', price: 50 },
      { name: 'Crispy Bhel Puri', price: 40 }
    ]
  },
  {
    img: 'parathas',
    head: 'Parathas',
    menu: [
      { name: 'Aloo Paratha', price: 50 },
      { name: 'Paneer Paratha', price: 70 },
      { name: 'Gobi Paratha', price: 60 }
    ]
  },
  {
    img: 'burgers',
    head: 'Burgers',
    menu: [
      { name: 'Chicken Zinger Burger', price: 120 },
      { name: 'Cheese Veggie Burger', price: 80 },
      { name: 'Double Patty Burger', price: 150 }
    ]
  },
  {
    img: 'sandwiches',
    head: 'Sandwiches',
    menu: [
      { name: 'Grilled Cheese Sandwich', price: 60 },
      { name: 'Club Chicken Sandwich', price: 110 },
      { name: 'Paneer Tikka Sandwich', price: 90 }
    ]
  },
  {
    img: 'pizzas',
    head: 'Pizzas',
    menu: [
      { name: 'Margherita Pizza', price: 160 },
      { name: 'Chicken Tikka Pizza', price: 220 },
      { name: 'Farmhouse Pizza', price: 180 }
    ]
  },
  {
    img: 'rolls_shawarma',
    head: 'Rolls & Shawarma',
    menu: [
      { name: 'Egg Chicken Roll', price: 80 },
      { name: 'Single Paneer Roll', price: 70 },
      { name: 'Classic Chicken Shawarma', price: 90 }
    ]
  },
  {
    img: 'momos',
    head: 'Momos',
    menu: [
      { name: 'Steamed Veg Momos', price: 60 },
      { name: 'Fried Chicken Momos', price: 90 },
      { name: 'Kurkure Momos Special', price: 110 }
    ]
  },
  {
    img: 'chinese_quick_bites',
    head: 'Chinese & Quick Bites',
    menu: [
      { name: 'Veg Hakka Noodles', price: 90 },
      { name: 'Crispy Spring Rolls', price: 80 },
      { name: 'Chilli Chicken Dry', price: 140 }
    ]
  },
  {
    img: 'mojitos_coolers',
    head: 'Mojitos & Coolers',
    menu: [
      { name: 'Mint Lime Mojito', price: 70 },
      { name: 'Blue Lagoon Cooler', price: 80 },
      { name: 'Watermelon Slush', price: 80 }
    ]
  },
  {
    img: 'shakes_special_drinks',
    head: 'Shakes & Special Drinks',
    menu: [
      { name: 'Classic Oreo Shake', price: 90 },
      { name: 'Cold Coffee with Ice Cream', price: 100 },
      { name: 'Premium Mango Shake', price: 90 }
    ]
  },
  {
    img: 'tea_hot_beverages',
    head: 'Tea & Hot Beverages',
    menu: [
      { name: 'Nawab Special Chai', price: 20 },
      { name: 'Filter Coffee', price: 30 },
      { name: 'Hot Chocolate', price: 60 }
    ]
  },
  {
    img: 'ice_gola',
    head: 'Ice Gola',
    menu: [
      { name: 'Kala Khatta Gola', price: 40 },
      { name: 'Special Rabri Gola', price: 60 }
    ]
  },
  {
    img: 'bbq_grills',
    head: 'BBQ & Grills',
    menu: [
      { name: 'Chicken Tikka Kebab', price: 180 },
      { name: 'Paneer Tikka Kebab', price: 150 }
    ]
  },
  {
    img: 'bakery_delights',
    head: 'Bakery Delights',
    menu: [
      { name: 'Fresh Butter Croissant', price: 50 },
      { name: 'Chocolate Lava Cake', price: 80 },
      { name: 'Red Velvet Pastry', price: 70 }
    ]
  },
  {
    img: 'indian_sweets',
    head: 'Indian Sweets',
    menu: [
      { name: 'Kaju Katli (250g)', price: 250 },
      { name: 'Special Gulab Jamun (2 Pcs)', price: 40 },
      { name: 'Motichoor Ladoo (250g)', price: 120 }
    ]
  }
]

const categoryImages = {
  'All': 'all.png',
  'Street Bites & Chaat': 'street_bites_chaat.png',
  'Parathas': 'parathas.png',
  'Burgers': 'burgers.png',
  'Sandwiches': 'sandwiches.png',
  'Pizzas': 'pizzas.png',
  'Rolls & Shawarma': 'rolls_shawarma.png',
  'Momos': 'momos.png',
  'Chinese & Quick Bites': 'chinese_quick_bites.png',
  'Mojitos & Coolers': 'mojitos_coolers.png',
  'Shakes & Special Drinks': 'shakes_special_drinks.png',
  'Tea & Hot Beverages': 'tea_hot_beverages.png',
  'Ice Gola': 'ice_gola.png',
  'BBQ & Grills': 'bbq_grills.png',
  'Bakery Delights': 'bakery_delights.png',
  'Indian Sweets': 'indian_sweets.png'
};
export default function App() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState(dishes);
  const [active, setActive] = useState('All');
  const itemDiv_ = useRef([]);
  const menuRef = useRef(null);

  function scrollToMenu() {
    menuRef.current?.scrollIntoView({ behavior: 'smooth' });
  }

  function selectCategory(category) {
    category !== 'All' ? setItems(dishes.filter(a => a.head == category)) : setItems(dishes);
    setActive(category);
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



  return (
    <div className="relative min-h-screen w-full bg-[#030303] text-white flex justify-center overflow-x-hidden">
      {/* Background Animation for PC sidebar space and ambient lighting */}
      <BackgroundAnimation />

      {/* Main Mobile frame container centered on PC screen */}
      <div className="relative w-full max-w-[480px] min-h-screen bg-black/95 shadow-[0_0_65px_rgba(0,0,0,0.85)] border-x border-white/5 flex flex-col z-10 overflow-x-hidden">
        <Suspense fallback={null}>
          <ComingSoon open={open} setOpen={setOpen} />
        </Suspense>

        <Header />
        <div className="absolute top-0 w-full">
          <HeroBanner setOpen={setOpen} scrollToMenu={scrollToMenu} />
        </div>

        <div className="sm:aspect-[16/7.6] aspect-[16/12] w-full" />
        <ol ref={menuRef} className="flex items-center text-white gap-x-3.5 mt-5 mx-3 overflow-x-auto pt-1.5 px-1.5 pb-4 no-scrollbar snap-x snap-mandatory scroll-smooth scroll-mt-24">
          {
            ['All', 'Street Bites & Chaat', 'Parathas', 'Burgers', 'Sandwiches', 'Pizzas', 'Rolls & Shawarma', 'Momos', 'Chinese & Quick Bites', 'Mojitos & Coolers', 'Shakes & Special Drinks', 'Tea & Hot Beverages', 'Ice Gola', 'BBQ & Grills', 'Bakery Delights', 'Indian Sweets'].map(item => (
              <li key={item} className="snap-start flex-shrink-0">
                <button
                  onClick={() => selectCategory(item)}
                  className={`relative overflow-hidden rounded-2xl w-20 h-20 sm:w-24 sm:h-24 border transition-all duration-500 cursor-pointer group flex flex-col justify-end ${active === item
                    ? 'border-amber-400 scale-[1.03] shadow-[0_0_20px_rgba(245,158,11,0.35)]'
                    : 'border-white/10 hover:scale-[1.01]'
                    }`}
                >
                  <img
                    src={`/images/categories/${categoryImages[item]}`}
                    alt={item}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-x-0 -bottom-[1px] h-1/2 group-hover:h-[58%] flex items-end justify-center pb-2 bg-black/45 backdrop-blur-fade px-1 transition-all duration-500">
                    <span className="text-[8px] sm:text-[9px] font-black text-white tracking-wider uppercase text-center leading-none transition-transform duration-500 group-hover:-translate-y-1">
                      {item}
                    </span>
                  </div>
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
      </div>
    </div>
  )
}