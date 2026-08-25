"use client";

import { useState, Fragment, useRef } from "react";
import Header from "@/components/Header";
import HeroBanner from "@/components/HeroBanner";
import ProductCard from "@/components/ProductCard";
import Footer from "@/components/Footer";
import FounderSection from "@/components/FounderSection";
import BackgroundAnimation from "@/components/BackgroundAnimation";
import ComingSoon from "@/components/ComingSoon";
import CartFloatingBar from "@/components/CartFloatingBar";
import CheckoutModal from "@/components/CheckoutModal";
import { useCart } from "@/hooks/useCart";
import { filterDishes, getBlobUrl } from "@/lib/functions";

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

export default function AppClient({ categories, initialDishes, config }) {
  const [open, setOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [items, setItems] = useState(initialDishes);
  const [active, setActive] = useState('All');
  const menuRef = useRef(null);

  const {
    cartItems,
    addItem,
    removeItem,
    getQty,
    clearCart,
    totalCount,
    totalPrice,
  } = useCart();

  function scrollToMenu() {
    menuRef.current?.scrollIntoView({ behavior: 'smooth' });
  }

  function selectCategory(category) {
    setItems(filterDishes(initialDishes, category));
    setActive(category);
  }

  const unavailableMsg = config?.unavailable_text || "Currently Unavailable";

  return (
    <div className="relative min-h-screen w-full bg-[#030303] text-white flex justify-center overflow-x-hidden">
      {/* Background Neon sparks/lasers */}
      <BackgroundAnimation />

      {/* Main Mobile Frame Container centered on PC */}
      <div className="relative w-full max-w-[480px] min-h-screen bg-black/95 shadow-[0_0_65px_rgba(0,0,0,0.85)] border-x border-white/5 flex flex-col z-10 overflow-x-hidden pb-16">
        <ComingSoon open={open} setOpen={setOpen} config={config} />

        <Header config={config} />
        
        <div className="absolute top-0 w-full">
          <HeroBanner setOpen={setOpen} scrollToMenu={scrollToMenu} config={config} />
        </div>

        <div className="sm:aspect-[16/7.6] aspect-[16/12] w-full" />
        
        {/* Horizontal scrollable category list */}
        <ol ref={menuRef} className="flex items-center text-white gap-x-3.5 mt-5 mx-3 overflow-x-auto pt-1.5 px-1.5 pb-4 no-scrollbar snap-x snap-mandatory scroll-smooth scroll-mt-24">
          {categories.map(item => (
            <li key={item} className="snap-start flex-shrink-0">
              <button
                onClick={() => selectCategory(item)}
                className={`relative overflow-hidden rounded-2xl w-20 h-20 sm:w-24 sm:h-24 border transition-all duration-500 cursor-pointer group flex flex-col justify-end ${active === item
                  ? 'border-amber-400 scale-[1.03] shadow-[0_0_20px_rgba(245,158,11,0.35)]'
                  : 'border-white/10 hover:scale-[1.01]'
                  }`}
              >
                <img
                  src={getBlobUrl(`/images/categories/${categoryImages[item] || 'all.png'}`)}
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
          ))}
        </ol>

        {/* Dishes list */}
        {items.length < 1 ? (
          <p className="text-center my-[15vh]">
            <span className="px-6 py-3 bg-red-700/80 text-white rounded-xl backdrop-blur-sm border border-red-500/50">
              {unavailableMsg}
            </span>
          </p>
        ) : (
          items.map((dish) => (
            <Fragment key={dish.img}>
              <h3 className="font-bold sm:text-2xl text-xl min-w-1/2 inline-block py-2 pl-4 mt-6 sm:mt-10 rounded-r-full text-amber-500 bg-white/5 border-y border-r border-white/10 shadow-lg">
                {dish.head}
              </h3>
              <div className="mx-3 space-y-4 mt-4">
                {dish.menu.map((item, i) => {
                  const dishData = { img: dish.img, ...item };
                  const qty = getQty(dishData);
                  return (
                    <ProductCard 
                      key={item.id || item.name || i} 
                      data={dishData} 
                      quantity={qty}
                      onAdd={addItem}
                      onRemove={removeItem}
                      setOpen={setOpen} 
                    />
                  );
                })}
              </div>
            </Fragment>
          ))
        )}

        <FounderSection config={config} />
        <Footer config={config} />

        {/* Sticky Floating Bottom Cart Bar */}
        <CartFloatingBar
          totalCount={totalCount}
          totalPrice={totalPrice}
          deliveryTime={config?.delivery_time}
          onOpenCheckout={() => setCheckoutOpen(true)}
        />

        {/* Slide-Up Bottom Sheet Checkout Modal */}
        <CheckoutModal
          open={checkoutOpen}
          onClose={() => setCheckoutOpen(false)}
          cartItems={cartItems}
          totalPrice={totalPrice}
          totalCount={totalCount}
          onAdd={addItem}
          onRemove={removeItem}
          onClearCart={clearCart}
          config={config}
        />
      </div>
    </div>
  );
}
