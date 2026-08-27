"use client";

import { useState, useEffect } from "react";
import { parseGrams, formatWeightDisplay } from "@/lib/functions";

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
    if (dish.selectedVariant) {
      return `${dish.id || dish.name}_${dish.selectedVariant.id || dish.selectedVariant.name}`;
    }
    if (dish.variant_id) {
      return `${dish.id || dish.name}_${dish.variant_id}`;
    }
    return dish.id ? String(dish.id) : dish.name;
  };

  const addItem = (dish) => {
    const key = getItemKey(dish);
    const existing = cart[key];
    const qtyToAdd = dish.customQty || 1;
    const newQty = (existing?.quantity || 0) + qtyToAdd;

    const isWeight = dish.pricing_type === "weight";
    
    // Sort any configured weight batches
    let sortedWeightBatches = [];
    if (isWeight) {
      const rawBatches = Array.isArray(dish.variants) && dish.variants.length > 0
        ? dish.variants
        : existing?.variants || [{ name: "250g", price: dish.price, compare_price: dish.compare_price, note: "" }];
      
      sortedWeightBatches = [...rawBatches].sort((a, b) => {
        const gA = parseGrams(a.name) || a.step_grams || 0;
        const gB = parseGrams(b.name) || b.step_grams || 0;
        return gA - gB;
      });
    }

    if (isWeight && sortedWeightBatches.length > 1) {
      // Multiple distinct tiers (e.g. 100g=120, 1000g=150)
      const batchIdx = Math.min(newQty - 1, sortedWeightBatches.length - 1);
      const activeBatch = sortedWeightBatches[batchIdx];
      const stepGrams = activeBatch.step_grams || parseGrams(activeBatch.name) || 250;

      const newCart = {
        ...cart,
        [key]: {
          key,
          id: dish.id,
          name: dish.name,
          variant_id: activeBatch.id || `wb_${batchIdx}`,
          variant_name: activeBatch.name,
          variant_note: activeBatch.note || "",
          step_grams: stepGrams,
          unit_label: activeBatch.name,
          price: parseFloat(activeBatch.price),
          compare_price: activeBatch.compare_price ? parseFloat(activeBatch.compare_price) : null,
          image_url: dish.image_url || null,
          img: dish.img || null,
          pricing_type: "weight",
          quantity: newQty,
          is_tier_pricing: true,
          variants: sortedWeightBatches,
        },
      };
      saveCart(newCart);
      return;
    }

    // Single weight batch or portion/count item
    const firstWeightBatch = sortedWeightBatches[0] || null;
    const variantObj = dish.selectedVariant || (dish.variant_name ? {
      id: dish.variant_id,
      name: dish.variant_name,
      note: dish.variant_note,
      price: dish.price,
      compare_price: dish.compare_price
    } : null);

    const priceVal = isWeight && firstWeightBatch
      ? parseFloat(firstWeightBatch.price)
      : variantObj
      ? parseFloat(variantObj.price)
      : parseFloat(dish.price);

    const compPriceVal = isWeight && firstWeightBatch
      ? (firstWeightBatch.compare_price ? parseFloat(firstWeightBatch.compare_price) : null)
      : variantObj
      ? (variantObj.compare_price ? parseFloat(variantObj.compare_price) : null)
      : (dish.compare_price ? parseFloat(dish.compare_price) : null);

    const stepGrams = isWeight
      ? (firstWeightBatch?.step_grams || parseGrams(firstWeightBatch?.name) || 250)
      : null;
    const unitLabel = isWeight ? (firstWeightBatch?.name || `${stepGrams}g`) : null;
    const weightNote = isWeight ? (firstWeightBatch?.note || "") : null;

    const newCart = {
      ...cart,
      [key]: {
        key,
        id: dish.id,
        name: dish.name,
        variant_id: variantObj ? (variantObj.id || variantObj.name) : null,
        variant_name: variantObj ? variantObj.name : (isWeight ? unitLabel : null),
        variant_note: variantObj ? variantObj.note : (isWeight ? weightNote : null),
        step_grams: stepGrams,
        unit_label: unitLabel,
        price: priceVal,
        compare_price: compPriceVal,
        image_url: dish.image_url || null,
        img: dish.img || null,
        pricing_type: dish.pricing_type || "count",
        quantity: newQty,
        is_tier_pricing: false,
        variants: sortedWeightBatches,
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
      return;
    }

    const newQty = existing.quantity - 1;

    if (existing.is_tier_pricing && Array.isArray(existing.variants) && existing.variants.length > 1) {
      const batchIdx = Math.min(newQty - 1, existing.variants.length - 1);
      const activeBatch = existing.variants[batchIdx];
      const stepGrams = activeBatch.step_grams || parseGrams(activeBatch.name) || 250;

      const newCart = {
        ...cart,
        [key]: {
          ...existing,
          variant_id: activeBatch.id || `wb_${batchIdx}`,
          variant_name: activeBatch.name,
          variant_note: activeBatch.note || "",
          step_grams: stepGrams,
          unit_label: activeBatch.name,
          price: parseFloat(activeBatch.price),
          compare_price: activeBatch.compare_price ? parseFloat(activeBatch.compare_price) : null,
          quantity: newQty,
        },
      };
      saveCart(newCart);
      return;
    }

    const newCart = {
      ...cart,
      [key]: {
        ...existing,
        quantity: newQty,
      },
    };
    saveCart(newCart);
  };

  const getQty = (dish) => {
    // If checking specific variant
    if (dish.selectedVariant || dish.variant_id) {
      const key = getItemKey(dish);
      return cart[key]?.quantity || 0;
    }
    // Sum total quantity for this dish id across all its variants
    const dishIdStr = String(dish.id || dish.name);
    return Object.values(cart).reduce((sum, item) => {
      if (String(item.id) === dishIdStr || item.name === dish.name) {
        return sum + item.quantity;
      }
      return sum;
    }, 0);
  };

  const clearCart = () => {
    saveCart({});
  };

  const cartItems = Object.values(cart);
  const totalCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = cartItems.reduce((sum, item) => {
    // If tier pricing (e.g. 1000g tier price already represents the entire batch)
    if (item.is_tier_pricing) {
      return sum + item.price;
    }
    return sum + (item.price * item.quantity);
  }, 0);

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
