"use client";

import { useState, useEffect } from "react";

export function useCart() {
  const [cart, setCart] = useState({});

  // Load cart from sessionStorage / localStorage if available
  useEffect(() => {
    try {
      const saved = localStorage.getItem("nfc_cart");
      if (saved) {
        setCart(JSON.parse(saved));
      }
    } catch {}
  }, []);

  const saveCart = (newCart) => {
    setCart(newCart);
    try {
      localStorage.setItem("nfc_cart", JSON.stringify(newCart));
    } catch {}
  };

  const getItemKey = (dish) => {
    return dish.id ? String(dish.id) : dish.name;
  };

  const addItem = (dish) => {
    const key = getItemKey(dish);
    const existing = cart[key];
    const newQty = (existing?.quantity || 0) + 1;

    const newCart = {
      ...cart,
      [key]: {
        id: dish.id,
        name: dish.name,
        price: parseFloat(dish.price),
        compare_price: dish.compare_price ? parseFloat(dish.compare_price) : null,
        image_url: dish.image_url || null,
        img: dish.img || null,
        quantity: newQty,
      },
    };
    saveCart(newCart);
  };

  const removeItem = (dish) => {
    const key = getItemKey(dish);
    const existing = cart[key];
    if (!existing) return;

    if (existing.quantity <= 1) {
      const newCart = { ...cart };
      delete newCart[key];
      saveCart(newCart);
    } else {
      const newCart = {
        ...cart,
        [key]: {
          ...existing,
          quantity: existing.quantity - 1,
        },
      };
      saveCart(newCart);
    }
  };

  const getQty = (dish) => {
    const key = getItemKey(dish);
    return cart[key]?.quantity || 0;
  };

  const clearCart = () => {
    saveCart({});
  };

  const cartItems = Object.values(cart);
  const totalCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  return {
    cart,
    cartItems,
    addItem,
    removeItem,
    getQty,
    clearCart,
    totalCount,
    totalPrice,
  };
}
