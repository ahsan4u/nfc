import { lazy, useState, Suspense, Fragment } from "react";
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
  
  function setActiveFn(e) {
    const {textContent} = e.target;
    textContent !== 'All'? setItems(dishes.filter(a=>a.head == textContent)) : setItems(dishes);
    setActive(textContent);
  }
  

  return (<>

    <Suspense fallback={null}>
      <ComingSoon open={open} setOpen={setOpen} />
    </Suspense>

    <Header />
    <div className="absolute top-0 w-full">
      <HeroBanner setOpen={setOpen} />
    </div>

    <div className="h-60" />
    <h2 className="text-center font-bold text-white text-xl mt-4">🔥Pick Your Obsession🔥</h2>
    <ol className="flex text-white gap-x-4 mt-4 mx-2 overflow-x-scroll snap-x snap-mandatory">
      {
        ['All','Burger', 'Sandwich', 'Roll', 'Pizza', 'Momos', 'Mandi', 'Shakes', 'Mojito'].map(item=><li key={item} ><button onClick={setActiveFn} className={`snap-start px-3 py-0.5 rounded-md bg-[#ffffff0c] border-2 ${active == item? 'border-amber-600 text-amber-500': 'border-[#ffffff19]'}`}>{item}</button></li>)
      }
    </ol>
    { items.length < 1 ? <p className="text-center my-[15vh]"><span className="px-4 py-2 bg-red-700 text-white rounded-md">Currently Unavailable</span></p> :
      items.map(dish => <Fragment key={dish.img}>
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