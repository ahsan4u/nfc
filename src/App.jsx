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
      { name: 'Vada Pav', price: 40 },
      { name: 'Bread Pakoda', price: 40 },
      { name: 'Samosa', price: 30 },
      { name: 'Chicken Samosa', price: 50 },
      { name: 'Bhajia', price: 40 },
      { name: 'Pani Puri', price: 40 }
    ]
  },
  {
    img: 'parathas',
    head: 'Parathas',
    menu: [
      { name: 'Aloo Paratha', price: 50 }
    ]
  },
  {
    img: 'burgers',
    head: 'Burgers',
    menu: [
      { name: 'Veg Burger', price: 80 },
      { name: 'Chicken Burger', price: 100 },
      { name: 'Zinger Burger', price: 120 }
    ]
  },
  {
    img: 'sandwiches',
    head: 'Sandwiches',
    menu: [
      { name: 'Veg Sandwich', price: 60 },
      { name: 'Chicken Sandwich', price: 90 },
      { name: 'Cheese Sandwich', price: 80 }
    ]
  },
  {
    img: 'pizzas',
    head: 'Pizzas',
    menu: [
      { name: 'Veg Pizza', price: 150 },
      { name: 'Chicken Pizza', price: 200 },
      { name: 'Cheese Corn Pizza', price: 170 }
    ]
  },
  {
    img: 'rolls_shawarma',
    head: 'Rolls & Shawarma',
    menu: [
      { name: 'Single Egg Roll', price: 50 },
      { name: 'Double Egg Roll', price: 70 },
      { name: 'Chicken Roll', price: 90 },
      { name: 'Shawarma', price: 100 }
    ]
  },
  {
    img: 'momos',
    head: 'Momos',
    menu: [
      { name: 'Veg Momos – Steam / Fry / Gravy', price: 80 },
      { name: 'Chicken Momos – Steam / Fry / Gravy', price: 100 },
      { name: 'Kurkure Momos', price: 110 }
    ]
  },
  {
    img: 'chinese_quick_bites',
    head: 'Chinese & Quick Bites',
    menu: [
      { name: 'Chicken Fried Rice', price: 120 },
      { name: 'Chicken Noodles', price: 120 },
      { name: 'Chicken Soup', price: 80 },
      { name: 'Manchurian (Dry/Gravy)', price: 110 },
      { name: 'French Fries', price: 80 },
      { name: 'Chilli Potato', price: 90 },
      { name: 'Crispy Corn', price: 100 },
      { name: 'Chicken Lollipop', price: 180 }
    ]
  },
  {
    img: 'mojitos_coolers',
    head: 'Mojitos & Coolers',
    menu: [
      { name: 'Mint Mojito', price: 70 },
      { name: 'Guava Mojito', price: 80 },
      { name: 'Blue Mojito', price: 80 }
    ]
  },
  {
    img: 'shakes_special_drinks',
    head: 'Shakes & Special Drinks',
    menu: [
      { name: 'Falooda', price: 90 },
      { name: 'Shakes', price: 80 },
      { name: 'Cold Coffee', price: 90 }
    ]
  },
  {
    img: 'tea_hot_beverages',
    head: 'Tea & Hot Beverages',
    menu: [
      { name: 'Tea', price: 20 },
      { name: 'Irani Tea', price: 25 }
    ]
  },
  {
    img: 'ice_gola',
    head: 'Ice Gola',
    menu: [
      { name: 'Cola', price: 40 },
      { name: 'Kala Khatta', price: 40 },
      { name: 'Rose', price: 40 },
      { name: 'Mango', price: 40 },
      { name: 'Orange', price: 40 }
    ]
  },
  {
    img: 'bbq_grills',
    head: 'BBQ & Grills',
    menu: [
      { name: 'Chicken Fry', price: 150 },
      { name: 'BBQ Chicken Tikka', price: 180 },
      { name: 'BBQ Chicken Wings', price: 160 },
      { name: 'Seekh Kebab', price: 170 },
      { name: 'Malai Boti', price: 190 }
    ]
  },
  {
    img: 'bakery_delights',
    head: 'Bakery Delights',
    menu: [
      { name: 'Pastries', price: 60 },
      { name: 'Cakes', price: 350 },
      { name: 'Cup Cakes', price: 40 },
      { name: 'Puff', price: 25 },
      { name: 'Cookies', price: 50 },
      { name: 'Brownies', price: 80 },
      { name: 'Donuts', price: 60 },
      { name: 'Maska Bun', price: 30 }
    ]
  },
  {
    img: 'indian_sweets',
    head: 'Indian Sweets (Traditional Delights)',
    menu: [
      { name: 'Jalebi', price: 50 },
      { name: 'Gulab Jamun', price: 40 },
      { name: 'Rasgulla', price: 55 },
      { name: 'Ras Malai', price: 60 },
      { name: 'Malai Roll', price: 70 },
      { name: 'Barfi', price: 80 },
      { name: 'Milk Cake', price: 90 },
      { name: 'Peda', price: 80 },
      { name: 'Motichoor Ladoo', price: 60 },
      { name: 'Chhena Rasgulla', price: 65 },
      { name: 'Chhena Ras Malai', price: 70 },
      { name: 'Sandesh', price: 75 },
      { name: 'Imarti', price: 60 },
      { name: 'Boondi', price: 50 },
      { name: 'Kesar Peda', price: 85 },
      { name: 'Kalakand', price: 90 },
      { name: 'Khoya Barfi', price: 85 },
      { name: 'Balushahi', price: 60 },
      { name: 'Son Papdi', price: 50 }
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
  'Indian Sweets (Traditional Delights)': 'indian_sweets_traditional_delights.png'
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
            ['All', 'Street Bites & Chaat', 'Parathas', 'Burgers', 'Sandwiches', 'Pizzas', 'Rolls & Shawarma', 'Momos', 'Chinese & Quick Bites', 'Mojitos & Coolers', 'Shakes & Special Drinks', 'Tea & Hot Beverages', 'Ice Gola', 'BBQ & Grills', 'Bakery Delights', 'Indian Sweets (Traditional Delights)'].map(item => (
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