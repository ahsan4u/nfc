"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  FiX, 
  FiClock, 
  FiCheckCircle, 
  FiCreditCard, 
  FiDollarSign, 
  FiMapPin, 
  FiUser, 
  FiPhone, 
  FiMail,
  FiShoppingBag,
  FiArrowRight,
  FiCheck,
  FiCrosshair,
  FiAlertTriangle,
  FiNavigation
} from "react-icons/fi";
import toast from "react-hot-toast";
import { formatPrice, getDishImageUrl, calculateDistanceKm, formatWeightDisplay } from "@/lib/functions";

export default function CheckoutModal({
  open,
  onClose,
  cartItems,
  totalPrice,
  totalCount,
  onAdd,
  onRemove,
  onClearCart,
  config,
  locationState: externalLocState,
  setLocationState: externalSetLocState,
}) {
  // Parse configured delivery locations
  const deliveryLocations = React.useMemo(() => {
    try {
      if (!config?.delivery_locations_json) {
        return [{ id: "loc_1", name: "Main Town / Store Area", charge: 0, time: config?.delivery_time || "25-35 mins" }];
      }
      const parsed = typeof config.delivery_locations_json === 'string'
        ? JSON.parse(config.delivery_locations_json)
        : config.delivery_locations_json;
      return Array.isArray(parsed) && parsed.length > 0
        ? parsed
        : [{ id: "loc_1", name: "Main Town / Store Area", charge: 0, time: config?.delivery_time || "25-35 mins" }];
    } catch {
      return [{ id: "loc_1", name: "Main Town / Store Area", charge: 0, time: config?.delivery_time || "25-35 mins" }];
    }
  }, [config?.delivery_locations_json, config?.delivery_time]);

  const [selectedLocId, setSelectedLocId] = useState(() => deliveryLocations[0]?.id || "loc_1");
  const [customer, setCustomer] = useState({
    name: "",
    phone: "",
    email: "",
    landmark: "",
    address: "",
  });
  const [paymentMethod, setPaymentMethod] = useState("razorpay"); // 'razorpay' or 'cod'
  const [processing, setProcessing] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(null);

  // Sync selected location if deliveryLocations change
  useEffect(() => {
    if (deliveryLocations.length > 0 && !deliveryLocations.some(l => l.id === selectedLocId)) {
      setSelectedLocId(deliveryLocations[0]?.id || "");
    }
  }, [deliveryLocations, selectedLocId]);

  // Lock body scroll while modal is open
  useEffect(() => {
    if (open) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [open]);

  if (!open) return null;

  const selectedLoc = deliveryLocations.find(l => String(l.id) === String(selectedLocId)) || deliveryLocations[0];
  const deliveryCharge = selectedLoc ? (parseFloat(selectedLoc.charge) || 0) : 0;
  const totalWithDelivery = totalPrice + deliveryCharge;
  const deliveryTime = selectedLoc?.time || config?.delivery_time || "25-35 mins";

  /*
  ==================================================================
  GPS SERVICEABILITY CHECK (COMMENTED OUT AS REQUESTED)
  ==================================================================
  const verifyServiceability = () => {
    // Geolocation verification disabled
  };
  ==================================================================
  */

  const handleCheckout = async (e) => {
    e.preventDefault();

    if (!customer.name.trim()) {
      toast.error("Please enter your name");
      return;
    }
    if (!customer.phone.trim() || customer.phone.replace(/[^0-9]/g, '').length < 10) {
      toast.error("Please enter a valid 10-digit phone number");
      return;
    }
    if (!customer.email.trim() || !customer.email.includes("@")) {
      toast.error("Please enter a valid email address for order confirmation");
      return;
    }
    if (!customer.landmark.trim()) {
      toast.error("Please enter your landmark / street / house details");
      return;
    }

    const fullFormattedAddress = [
      customer.landmark.trim(),
      selectedLoc?.name ? `Area: ${selectedLoc.name}` : "",
      customer.address.trim() ? `Note: ${customer.address.trim()}` : ""
    ].filter(Boolean).join(", ");

    setProcessing(true);

    try {
      // Step 1: Create Order on Backend
      const res = await fetch("/api/checkout/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: cartItems,
          delivery_charge: deliveryCharge,
          customer: {
            name: customer.name.trim(),
            phone: customer.phone.trim(),
            email: customer.email.trim(),
            landmark: customer.landmark.trim(),
            selected_location: selectedLoc?.name || "Main Area",
            delivery_time: deliveryTime,
            delivery_charge: deliveryCharge,
            address: fullFormattedAddress,
          },
          payment_method: paymentMethod,
        }),
      });

      const orderData = await res.json();
      if (!res.ok || !orderData.success) {
        throw new Error(orderData.message || "Failed to initiate order");
      }

      // Step 2A: Handle Cash on Delivery (COD)
      if (paymentMethod === "cod") {
        setOrderSuccess({
          order_id: orderData.order_id,
          payment_method: "cod",
          amount: totalWithDelivery,
          delivery_charge: deliveryCharge,
          delivery_time: deliveryTime,
          customer: {
            name: customer.name.trim(),
            phone: customer.phone.trim(),
            email: customer.email.trim(),
            landmark: customer.landmark.trim(),
            selected_location: selectedLoc?.name || "Main Area",
            delivery_time: deliveryTime,
            address: fullFormattedAddress,
          },
          items: cartItems,
        });
        onClearCart();
        toast.success("COD Order placed successfully!");
        setProcessing(false);
        return;
      }

      // Step 2B: Handle Razorpay Online Payment
      if (typeof window.Razorpay === "undefined") {
        throw new Error("Razorpay SDK not loaded. Please check your internet connection.");
      }

      const options = {
        key: orderData.key_id,
        amount: orderData.amount_in_paise,
        currency: orderData.currency || "INR",
        name: config?.site_title || "THE NAWAB SAHAB",
        description: `Order #${orderData.order_id}`,
        image: config?.logo_image ? getDishImageUrl("logo", "all").dishImgUrl : undefined,
        order_id: orderData.order_id,
        prefill: {
          name: customer.name,
          email: customer.email,
          contact: customer.phone,
        },
        theme: {
          color: "#f59e0b",
        },
        handler: async function (response) {
          try {
            // Verify payment on backend and trigger email dispatch
            const verifyRes = await fetch("/api/checkout/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                order_details: {
                  amount: totalWithDelivery,
                  delivery_charge: deliveryCharge,
                  customer: {
                    name: customer.name.trim(),
                    phone: customer.phone.trim(),
                    email: customer.email.trim(),
                    landmark: customer.landmark.trim(),
                    selected_location: selectedLoc?.name || "Main Area",
                    delivery_time: deliveryTime,
                    address: fullFormattedAddress,
                  },
                  items: cartItems,
                }
              }),
            });

            const verifyData = await verifyRes.json();
            if (!verifyRes.ok || !verifyData.success) {
              throw new Error(verifyData.message || "Payment verification failed");
            }

            setOrderSuccess({
              order_id: response.razorpay_order_id,
              payment_method: "razorpay",
              amount: totalWithDelivery,
              delivery_charge: deliveryCharge,
              delivery_time: deliveryTime,
              customer: {
                name: customer.name.trim(),
                phone: customer.phone.trim(),
                email: customer.email.trim(),
                landmark: customer.landmark.trim(),
                selected_location: selectedLoc?.name || "Main Area",
                delivery_time: deliveryTime,
                address: fullFormattedAddress,
              },
              items: cartItems,
            });

            onClearCart();
            toast.success("Payment successful! Order confirmed.");
          } catch (verErr) {
            toast.error(verErr.message || "Payment verification error");
          } finally {
            setProcessing(false);
          }
        },
        modal: {
          ondismiss: function () {
            setProcessing(false);
            toast.error("Payment was cancelled");
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      toast.error(err.message || "Order submission failed");
      setProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/85 backdrop-blur-md">
      {/* Backdrop click to close */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Slide-Up Bottom Sheet Card */}
      <motion.div
        initial={{ y: "100%", opacity: 0.5 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: "100%", opacity: 0 }}
        transition={{ type: "spring", damping: 28, stiffness: 320 }}
        className="relative w-full max-w-[480px] bg-[#141419] border-t sm:border border-white/10 rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] z-10"
      >
        {/* Header */}
        <div className="px-4 py-3.5 border-b border-white/10 bg-[#181820] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FiShoppingBag className="text-amber-400" size={16} />
            <h3 className="text-xs sm:text-sm font-black text-white uppercase tracking-wider">
              {orderSuccess ? "Order Confirmed!" : "Checkout & Delivery"}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-white/10"
          >
            <FiX size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {orderSuccess ? (
            /* PROFESSIONAL ROYAL SUCCESS VIEW */
            <div className="py-6 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-green-500/20 text-green-400 border border-green-500/40 mx-auto flex items-center justify-center shadow-lg shadow-green-500/20 animate-bounce">
                <FiCheck size={36} />
              </div>

              <div className="space-y-1">
                <h4 className="text-xl font-black text-white">Thank You for Your Order!</h4>
                <p className="text-xs text-amber-400 font-bold">
                  Order ID: {orderSuccess.order_id}
                </p>
                <p className="text-[11px] text-gray-400 max-w-xs mx-auto pt-1">
                  We have received your order and our kitchen is preparing your delicious meal. A confirmation receipt has been sent to <strong className="text-white">{orderSuccess.customer.email}</strong>.
                </p>
                <div className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-[11px] font-extrabold border border-amber-500/30">
                  <FiClock size={12} />
                  <span>Estimated Delivery: {deliveryTime}</span>
                </div>
              </div>

              {/* Order Summary Receipt Box */}
              <div className="bg-[#191922] border border-white/5 rounded-2xl p-3.5 text-left space-y-2 text-xs">
                <div className="flex justify-between text-gray-300">
                  <span>Payment Mode:</span>
                  <span className="font-bold text-white uppercase">
                    {orderSuccess.payment_method === "cod" ? "Cash on Delivery (COD)" : "Paid Online (Razorpay)"}
                  </span>
                </div>
                <div className="flex justify-between text-gray-300">
                  <span>Total Amount:</span>
                  <span className="font-black text-green-400">{formatPrice(orderSuccess.amount)}</span>
                </div>
                <div className="border-t border-white/5 pt-2 text-gray-400 text-[11px]">
                  <p><strong className="text-gray-200">Deliver to:</strong> {orderSuccess.customer.name} ({orderSuccess.customer.phone})</p>
                  <p className="truncate mt-0.5">{orderSuccess.customer.address}</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2">
                <button
                  onClick={onClose}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-extrabold text-xs uppercase tracking-wider shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
                >
                  <span>Back to Menu / Order More</span>
                  <FiArrowRight size={14} />
                </button>
              </div>
            </div>
          ) : (
            /* CHECKOUT FORM VIEW */
            <>
              {/* Delivery Time Banner */}
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30">
                <div className="flex items-center gap-2 text-amber-400 text-xs font-bold">
                  <FiClock size={14} />
                  <span>⚡ Estimated Delivery Time</span>
                </div>
                <span className="text-xs font-black text-white bg-amber-500/30 px-2.5 py-0.5 rounded-md">
                  {deliveryTime}
                </span>
              </div>

              {/* Order Items Review */}
              <div className="space-y-2">
                <p className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400">
                  Selected Items ({totalCount})
                </p>
                <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                  {cartItems.map((item) => {
                    const { dishImgUrl, fallbackImgUrl } = getDishImageUrl(item.name, item.img || "all");
                    const img = item.image_url || dishImgUrl;
                    const itemKey = item.key || item.id || item.name;

                    return (
                      <div
                        key={itemKey}
                        className="flex items-center justify-between p-2 rounded-xl bg-[#181820] border border-white/5"
                      >
                        <div className="flex items-center gap-2.5 min-w-0 pr-2 flex-1">
                          <div className="w-9 h-9 rounded-lg bg-black/60 border border-white/10 overflow-hidden flex-shrink-0 flex items-center justify-center">
                            <img
                              src={img}
                              alt={item.name}
                              onError={(e) => { e.currentTarget.src = fallbackImgUrl; }}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="min-w-0 flex-1">
                            <h5 className="text-xs font-bold text-white truncate">{item.name}</h5>
                            {item.pricing_type === "weight" ? (
                              <p className="text-[10px] text-amber-400 font-bold truncate">
                                {item.is_tier_pricing ? item.variant_name : formatWeightDisplay(item.quantity, item.step_grams, item.unit_label)} {item.variant_note ? `(${item.variant_note})` : ""}
                              </p>
                            ) : item.variant_name ? (
                              <p className="text-[10px] text-amber-400 font-bold truncate">
                                {item.variant_name} {item.variant_note ? `(${item.variant_note})` : ""}
                              </p>
                            ) : null}
                            <p className="text-[10px] text-green-400 font-extrabold">
                              {formatPrice(item.is_tier_pricing ? item.price : (item.price * item.quantity))}
                            </p>
                          </div>
                        </div>

                        {/* Stepper */}
                        <div className="flex items-center bg-[#111116] border border-white/10 rounded-lg p-0.5 flex-shrink-0">
                          <button
                            type="button"
                            onClick={() => onRemove(item)}
                            className="w-5 h-5 flex items-center justify-center rounded bg-white/5 hover:bg-white/15 text-amber-400 text-xs font-black"
                          >
                            -
                          </button>
                          <span className={`text-center text-[11px] font-black text-white font-mono ${
                            item.pricing_type === "weight" ? "px-1.5 text-amber-300 min-w-[36px]" : "w-5"
                          }`}>
                            {item.pricing_type === "weight"
                              ? (item.is_tier_pricing ? item.variant_name : formatWeightDisplay(item.quantity, item.step_grams, item.unit_label))
                              : item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => onAdd(item)}
                            className="w-5 h-5 flex items-center justify-center rounded bg-amber-500 hover:bg-amber-400 text-black text-xs font-black"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Delivery Address & Contact Form */}
              <form id="checkout-form" onSubmit={handleCheckout} className="space-y-2.5 pt-1">
                <p className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400">
                  Delivery Address & Contact
                </p>

                <div>
                  <div className="relative flex items-center">
                    <FiUser className="absolute left-3 text-gray-500" size={13} />
                    <input
                      type="text"
                      value={customer.name}
                      onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
                      placeholder="Full Name *"
                      className="w-full bg-[#181820] border border-white/10 focus:border-amber-500/50 rounded-xl pl-8 pr-3 py-2 text-xs text-white placeholder-gray-500 outline-none"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div className="relative flex items-center">
                    <FiPhone className="absolute left-3 text-gray-500" size={13} />
                    <input
                      type="tel"
                      value={customer.phone}
                      onChange={(e) => setCustomer({ ...customer, phone: e.target.value })}
                      placeholder="Phone Number *"
                      className="w-full bg-[#181820] border border-white/10 focus:border-amber-500/50 rounded-xl pl-8 pr-3 py-2 text-xs text-white placeholder-gray-500 outline-none"
                      required
                    />
                  </div>

                  <div className="relative flex items-center">
                    <FiMail className="absolute left-3 text-gray-500" size={13} />
                    <input
                      type="email"
                      value={customer.email}
                      onChange={(e) => setCustomer({ ...customer, email: e.target.value })}
                      placeholder="Email (for order receipt) *"
                      className="w-full bg-[#181820] border border-white/10 focus:border-amber-500/50 rounded-xl pl-8 pr-3 py-2 text-xs text-white placeholder-gray-500 outline-none"
                      required
                    />
                  </div>
                </div>

                {/* 1. Delivery Location Selection */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold uppercase tracking-wider text-amber-400 flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <FiMapPin size={11} />
                      <span>Select Delivery Area *</span>
                    </span>
                    <span className="text-[9px] text-gray-400 font-normal">Delivery charges vary by area</span>
                  </label>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {deliveryLocations.map((loc) => {
                      const isSelected = String(loc.id) === String(selectedLocId);
                      const isFree = !loc.charge || parseFloat(loc.charge) === 0;
                      return (
                        <div
                          key={loc.id}
                          onClick={() => setSelectedLocId(loc.id)}
                          className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-2 ${
                            isSelected
                              ? "bg-amber-500/15 border-amber-500 shadow-md shadow-amber-500/10 scale-[1.01]"
                              : "bg-[#181820] border-white/10 hover:border-white/20"
                          }`}
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <span className={`w-2 h-2 rounded-full flex-shrink-0 ${isSelected ? "bg-amber-400 ring-2 ring-amber-400/40" : "bg-gray-600"}`} />
                              <p className="text-xs font-bold text-white truncate">{loc.name}</p>
                            </div>
                            {loc.time && (
                              <p className="text-[9px] text-gray-400 pl-3.5 mt-0.5">{loc.time}</p>
                            )}
                          </div>

                          <div className="flex-shrink-0">
                            {isFree ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 text-[10px] font-black uppercase">
                                <FiCheck size={10} />
                                <span>Free</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-black">
                                +₹{loc.charge}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 2. Landmark / Street / House No */}
                <div>
                  <div className="relative flex items-center">
                    <FiMapPin className="absolute left-3 text-amber-400" size={13} />
                    <input
                      type="text"
                      value={customer.landmark}
                      onChange={(e) => setCustomer({ ...customer, landmark: e.target.value })}
                      placeholder="Landmark / House No / Street Details *"
                      className="w-full bg-[#181820] border border-white/10 focus:border-amber-500/50 rounded-xl pl-8 pr-3 py-2 text-xs text-white placeholder-gray-500 outline-none"
                      required
                    />
                  </div>
                </div>

                {/* 3. Additional Delivery Notes (Optional) */}
                <div>
                  <input
                    type="text"
                    value={customer.address}
                    onChange={(e) => setCustomer({ ...customer, address: e.target.value })}
                    placeholder="Specific delivery notes or instructions (optional)"
                    className="w-full bg-[#181820] border border-white/10 focus:border-amber-500/50 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-500 outline-none"
                  />
                </div>

                {/* Payment Method Selector */}
                <div className="pt-1">
                  <p className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400 mb-2">
                    Select Payment Method
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {/* Razorpay Online */}
                    <div
                      onClick={() => setPaymentMethod("razorpay")}
                      className={`p-3 rounded-xl border-2 cursor-pointer transition-all ${
                        paymentMethod === "razorpay"
                          ? "bg-amber-500/15 border-amber-500 shadow-md shadow-amber-500/10"
                          : "bg-[#181820] border-white/5 hover:border-white/20"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <FiCreditCard className={paymentMethod === "razorpay" ? "text-amber-400" : "text-gray-400"} size={16} />
                        <span className="text-xs font-bold text-white">Online Pay</span>
                      </div>
                      <p className="text-[9px] text-gray-400 mt-1">UPI / Cards / NetBanking</p>
                    </div>

                    {/* Cash on Delivery */}
                    <div
                      onClick={() => setPaymentMethod("cod")}
                      className={`p-3 rounded-xl border-2 cursor-pointer transition-all ${
                        paymentMethod === "cod"
                          ? "bg-amber-500/15 border-amber-500 shadow-md shadow-amber-500/10"
                          : "bg-[#181820] border-white/5 hover:border-white/20"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <FiDollarSign className={paymentMethod === "cod" ? "text-amber-400" : "text-gray-400"} size={16} />
                        <span className="text-xs font-bold text-white">Cash on Delivery</span>
                      </div>
                      <p className="text-[9px] text-gray-400 mt-1">Pay cash at doorstep</p>
                    </div>
                  </div>
                </div>

                {/* Bill Summary */}
                <div className="bg-[#181820] rounded-xl p-3 border border-white/5 space-y-1.5 text-xs">
                  <div className="flex justify-between text-gray-400">
                    <span>Item Total:</span>
                    <span>{formatPrice(totalPrice)}</span>
                  </div>
                  <div className="flex justify-between text-gray-400">
                    <span>Delivery Fee ({selectedLoc?.name || "Standard"}):</span>
                    {deliveryCharge === 0 ? (
                      <span className="text-green-400 font-bold uppercase">FREE</span>
                    ) : (
                      <span className="text-amber-400 font-bold">{formatPrice(deliveryCharge)}</span>
                    )}
                  </div>
                  <div className="border-t border-white/10 pt-1.5 flex justify-between text-sm font-black text-white">
                    <span>To Pay:</span>
                    <span className="text-amber-400">{formatPrice(totalWithDelivery)}</span>
                  </div>
                </div>
              </form>
            </>
          )}
        </div>

        {/* Bottom CTA Action Button */}
        {!orderSuccess && (
          <div className="p-4 border-t border-white/10 bg-[#181820]">
            <button
              form="checkout-form"
              type="submit"
              disabled={processing || cartItems.length === 0}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white font-extrabold text-xs sm:text-sm uppercase tracking-wider shadow-lg shadow-red-600/30 active:scale-98 transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {processing ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <span>
                  {paymentMethod === "razorpay"
                    ? `Proceed to Pay ${formatPrice(totalWithDelivery)}`
                    : `Confirm COD Order (${formatPrice(totalWithDelivery)})`}
                </span>
              )}
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
