"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FiCrosshair, 
  FiCheckCircle, 
  FiAlertTriangle, 
  FiX, 
  FiNavigation,
  FiArrowRight,
  FiMapPin
} from "react-icons/fi";
import toast from "react-hot-toast";
import { calculateDistanceKm } from "@/lib/functions";

export default function LocationPromptModal({
  config,
  locationState,
  setLocationState,
  isOpen: externalOpen,
  onClose: externalOnClose,
}) {
  const [internalOpen, setInternalOpen] = useState(false);

  const isControlled = externalOpen !== undefined;
  const open = isControlled ? externalOpen : internalOpen;
  const setOpen = externalOnClose || setInternalOpen;

  const storeLat = parseFloat(config?.store_lat) || 26.8467;
  const storeLng = parseFloat(config?.store_lng) || 80.9462;
  const maxRadiusKm = parseFloat(config?.delivery_radius_km) || 5;
  const deliveryTime = config?.delivery_time || "25-35 mins";
  const isEnabled = config?.serviceability_check_enabled !== "false";

  // Trigger popup after 5 seconds on site visit if location is not checked
  useEffect(() => {
    if (!isEnabled || isControlled) return;
    if (locationState?.checked) return;

    const timer = setTimeout(() => {
      setInternalOpen(true);
    }, 5000);

    return () => clearTimeout(timer);
  }, [isEnabled, locationState?.checked, isControlled]);

  // Lock body scroll while prompt modal is open
  useEffect(() => {
    if (open) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [open]);

  const handleDismiss = () => {
    if (isControlled) {
      externalOnClose?.();
    } else {
      setInternalOpen(false);
    }
  };

  // GPS Location Check
  const handleUseGPS = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported on this device");
      return;
    }

    setLocationState((prev) => ({ ...prev, checking: true, error: "" }));
    const toastId = toast.loading("Detecting your GPS location...");

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const uLat = pos.coords.latitude;
        const uLng = pos.coords.longitude;
        const dist = calculateDistanceKm(storeLat, storeLng, uLat, uLng);
        const serviceable = dist !== null ? dist <= maxRadiusKm : true;

        let addressText = "";
        try {
          const geoRes = await fetch(
            `/api/admin/geocode?lat=${encodeURIComponent(uLat)}&lng=${encodeURIComponent(uLng)}`
          );
          const geoResult = await geoRes.json();
          if (geoResult?.data?.display_name) {
            addressText = geoResult.data.display_name;
          }
        } catch {
          // Fallback if reverse geocode service fails
        }

        const newState = {
          checking: false,
          checked: true,
          isServiceable: serviceable,
          distanceKm: dist,
          userLat: uLat,
          userLng: uLng,
          detectedAddress: addressText,
          error: "",
        };

        setLocationState(newState);

        if (serviceable) {
          toast.success(`Delivery available! ~${dist} km from kitchen`, { id: toastId });
        } else {
          toast.error(`Out of delivery area (${dist} km away, max is ${maxRadiusKm} km)`, {
            id: toastId,
            duration: 4000,
          });
        }
      },
      (err) => {
        setLocationState((prev) => ({
          ...prev,
          checking: false,
          checked: false,
          error: "Permission denied",
        }));
        toast.error("GPS access was denied. Please allow location access to check.", { id: toastId });
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          {/* Modal Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="w-full max-w-sm bg-[#121218] border border-amber-500/30 rounded-3xl p-6 shadow-2xl shadow-amber-500/10 relative overflow-hidden"
          >
            {/* Ambient Top Glow */}
            <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-48 h-24 bg-amber-500/20 blur-3xl pointer-events-none rounded-full" />

            {/* Close X Button */}
            <button
              type="button"
              onClick={handleDismiss}
              className="absolute top-4 right-4 p-1.5 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors cursor-pointer z-10"
            >
              <FiX size={16} />
            </button>

            {/* Header Icon & Title */}
            <div className="text-center pt-2 pb-3 space-y-2">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-400 p-0.5 shadow-lg shadow-amber-500/30 flex items-center justify-center">
                <div className="w-full h-full bg-[#14141c] rounded-2xl flex items-center justify-center">
                  <FiNavigation size={26} className="text-amber-400 animate-pulse" />
                </div>
              </div>

              <div>
                <h3 className="text-base font-black text-white tracking-wide">
                  Check Delivery Availability
                </h3>
                <p className="text-xs text-gray-400 mt-1 max-w-[260px] mx-auto leading-relaxed">
                  Verify if your location is within our fresh delivery zone ({maxRadiusKm} km).
                </p>
              </div>
            </div>

            {/* Content Body */}
            <div className="space-y-4 pt-2">
              {/* If Already Checked: Show Result */}
              {locationState?.checked && locationState?.isServiceable !== null ? (
                <div className="space-y-3">
                  <div
                    className={`p-4 rounded-2xl border ${
                      locationState.isServiceable
                        ? "bg-green-500/10 border-green-500/30 text-green-300"
                        : "bg-red-500/10 border-red-500/30 text-red-300"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {locationState.isServiceable ? (
                        <FiCheckCircle className="text-green-400 mt-0.5 flex-shrink-0" size={20} />
                      ) : (
                        <FiAlertTriangle className="text-red-400 mt-0.5 flex-shrink-0" size={20} />
                      )}
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-black text-white">
                          {locationState.isServiceable
                            ? "🎉 Great News! We Deliver to You"
                            : "⚠️ Out of Delivery Area"}
                        </h4>
                        <p className="text-[11px] opacity-90 mt-1 leading-snug">
                          {locationState.isServiceable
                            ? `You are ~${locationState.distanceKm} km away. Estimated delivery in ${deliveryTime}.`
                            : `You are ~${locationState.distanceKm} km away. We deliver within ${maxRadiusKm} km.`}
                        </p>
                        {locationState.detectedAddress && (
                          <p className="text-[10px] text-gray-400 truncate mt-1.5 pt-1.5 border-t border-white/10 flex items-center gap-1">
                            <FiMapPin size={10} className="text-amber-400 flex-shrink-0" />
                            <span className="truncate">{locationState.detectedAddress}</span>
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleUseGPS}
                      disabled={locationState?.checking}
                      className="px-3.5 py-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5"
                      title="Re-check location"
                    >
                      <FiCrosshair size={14} className="text-amber-400" />
                      <span>Re-check</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleDismiss}
                      className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-extrabold text-xs uppercase tracking-wider shadow-lg shadow-amber-500/20 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <span>Explore Menu</span>
                      <FiArrowRight size={14} />
                    </button>
                  </div>
                </div>
              ) : (
                /* Initial Action View */
                <div className="space-y-3">
                  {/* Primary Big GPS Button */}
                  <button
                    type="button"
                    onClick={handleUseGPS}
                    disabled={locationState?.checking}
                    className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-black text-xs tracking-wide shadow-lg shadow-amber-500/25 active:scale-95 transition-all flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50"
                  >
                    <FiCrosshair size={18} className="text-black animate-spin-slow" />
                    <span>{locationState?.checking ? "Detecting GPS Coordinates..." : "Check My Location (Use GPS)"}</span>
                  </button>

                  {/* Skip Button */}
                  <div className="text-center pt-1">
                    <button
                      type="button"
                      onClick={handleDismiss}
                      className="text-[11px] text-gray-400 hover:text-white transition-colors cursor-pointer"
                    >
                      Skip for now, browse menu
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
