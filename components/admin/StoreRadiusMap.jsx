"use client";

import React, { useEffect, useRef, useState } from "react";
import { 
  FiMapPin, 
  FiCrosshair, 
  FiSearch, 
  FiNavigation, 
  FiLayers, 
  FiCheckCircle, 
  FiX, 
  FiMaximize2 
} from "react-icons/fi";
import toast from "react-hot-toast";

const MAP_LAYERS = {
  streets: {
    label: "Google Roads & Villages",
    url: "https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}",
    attribution: "&copy; Google Maps",
    maxZoom: 20,
  },
  hybrid: {
    label: "Satellite + Labels",
    url: "https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}",
    attribution: "&copy; Google Maps Satellite",
    maxZoom: 20,
  },
  osm: {
    label: "OpenStreetMap",
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: "&copy; OpenStreetMap contributors",
    maxZoom: 19,
  },
};

export default function StoreRadiusMap({
  lat = 26.8467,
  lng = 80.9462,
  radiusKm = 5,
  onChangeCoordinates,
  onChangeRadius,
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const circleRef = useRef(null);
  const tileLayerRef = useRef(null);

  const [currentLayer, setCurrentLayer] = useState("streets");
  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [mapLoaded, setMapLoaded] = useState(false);

  // Initialize Leaflet Map
  useEffect(() => {
    let isMounted = true;

    const initMap = async () => {
      if (typeof window === "undefined" || !mapContainerRef.current) return;

      // Dynamically import Leaflet
      const L = (await import("leaflet")).default;

      // Import CSS if not already present
      if (!document.getElementById("leaflet-css")) {
        const link = document.createElement("link");
        link.id = "leaflet-css";
        link.rel = "stylesheet";
        link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
        document.head.appendChild(link);
      }

      if (!isMounted || mapInstanceRef.current) return;

      const initialLat = Number(lat) || 26.8467;
      const initialLng = Number(lng) || 80.9462;
      const initialRadius = Number(radiusKm) || 5;

      // Create map
      const map = L.map(mapContainerRef.current, {
        center: [initialLat, initialLng],
        zoom: 14,
        zoomControl: true,
      });

      // Add High-Detail Road & Village Tile Layer
      const baseLayer = L.tileLayer(MAP_LAYERS.streets.url, {
        attribution: MAP_LAYERS.streets.attribution,
        maxZoom: MAP_LAYERS.streets.maxZoom,
      }).addTo(map);

      tileLayerRef.current = baseLayer;

      // Custom Glowing Store Marker Icon
      const storeIcon = L.divIcon({
        className: "custom-store-pin",
        html: `
          <div style="
            width: 38px;
            height: 38px;
            background: linear-gradient(135deg, #f59e0b, #d97706);
            border-radius: 50% 50% 50% 0;
            transform: rotate(-45deg);
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 4px 16px rgba(0,0,0,0.6), 0 0 0 3px #ffffff;
            cursor: grab;
          ">
            <svg style="transform: rotate(45deg); width: 18px; height: 18px; color: #000;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
              <polyline points="9 22 9 12 15 12 15 22"></polyline>
            </svg>
          </div>
        `,
        iconSize: [38, 38],
        iconAnchor: [19, 38],
        popupAnchor: [0, -38],
      });

      // Add Draggable Marker
      const marker = L.marker([initialLat, initialLng], {
        icon: storeIcon,
        draggable: true,
      }).addTo(map);

      marker.bindPopup("<b>The Nawab Sahab</b><br/>Drag pin or click map to move store.").openPopup();

      // Add Serviceable Delivery Circle (Radius in meters)
      const circle = L.circle([initialLat, initialLng], {
        radius: initialRadius * 1000,
        color: "#d97706",
        weight: 2.5,
        fillColor: "#f59e0b",
        fillOpacity: 0.2,
      }).addTo(map);

      // Event: Marker dragged
      marker.on("dragend", (e) => {
        const position = e.target.getLatLng();
        circle.setLatLng(position);
        onChangeCoordinates(position.lat, position.lng);
      });

      // Event: Click on map to move pin
      map.on("click", (e) => {
        const { lat: clickLat, lng: clickLng } = e.latlng;
        marker.setLatLng([clickLat, clickLng]);
        circle.setLatLng([clickLat, clickLng]);
        onChangeCoordinates(clickLat, clickLng);
      });

      mapInstanceRef.current = map;
      markerRef.current = marker;
      circleRef.current = circle;
      setMapLoaded(true);
    };

    initMap();

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Switch Tile Layer (Streets / Satellite / OSM)
  const switchLayer = async (layerKey) => {
    if (!mapInstanceRef.current) return;
    const L = (await import("leaflet")).default;
    const target = MAP_LAYERS[layerKey];
    if (!target) return;

    if (tileLayerRef.current) {
      mapInstanceRef.current.removeLayer(tileLayerRef.current);
    }

    const newLayer = L.tileLayer(target.url, {
      attribution: target.attribution,
      maxZoom: target.maxZoom,
    }).addTo(mapInstanceRef.current);

    tileLayerRef.current = newLayer;
    setCurrentLayer(layerKey);
  };

  // Update map when coordinates prop changes externally
  useEffect(() => {
    if (!mapInstanceRef.current || !markerRef.current || !circleRef.current) return;
    const currentPos = markerRef.current.getLatLng();
    if (Math.abs(currentPos.lat - lat) > 0.0001 || Math.abs(currentPos.lng - lng) > 0.0001) {
      markerRef.current.setLatLng([lat, lng]);
      circleRef.current.setLatLng([lat, lng]);
      mapInstanceRef.current.panTo([lat, lng]);
    }
  }, [lat, lng]);

  // Update circle radius when radiusKm prop changes
  useEffect(() => {
    if (circleRef.current) {
      circleRef.current.setRadius(Number(radiusKm) * 1000);
    }
  }, [radiusKm]);

  // Search Address / Village / Locality via Geocode API
  const handleSearchAddress = async () => {
    if (!searchQuery.trim()) return;

    setSearching(true);
    setSearchResults([]);

    try {
      const res = await fetch(`/api/admin/geocode?q=${encodeURIComponent(searchQuery.trim())}`);
      const result = await res.json();
      
      if (result.success && Array.isArray(result.data) && result.data.length > 0) {
        setSearchResults(result.data);
        // Automatically jump to the top matched location
        selectLocation(result.data[0]);
      } else {
        toast.error("Location not found. Try typing village name, district, or PIN code.");
      }
    } catch {
      toast.error("Search failed. Please check your internet connection.");
    } finally {
      setSearching(false);
    }
  };

  const selectLocation = (item) => {
    const newLat = parseFloat(item.lat);
    const newLng = parseFloat(item.lon);

    if (mapInstanceRef.current && markerRef.current && circleRef.current) {
      markerRef.current.setLatLng([newLat, newLng]);
      circleRef.current.setLatLng([newLat, newLng]);
      mapInstanceRef.current.setView([newLat, newLng], 15);
    }

    onChangeCoordinates(newLat, newLng);
    setSearchResults([]);
    toast.success(`Positioned at: ${item.display_name.split(",")[0]}`);
  };

  // Get current GPS position of Admin device
  const handleDetectGPS = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }

    const toastId = toast.loading("Detecting your current location...");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const userLat = pos.coords.latitude;
        const userLng = pos.coords.longitude;

        if (mapInstanceRef.current && markerRef.current && circleRef.current) {
          markerRef.current.setLatLng([userLat, userLng]);
          circleRef.current.setLatLng([userLat, userLng]);
          mapInstanceRef.current.setView([userLat, userLng], 15);
        }

        onChangeCoordinates(userLat, userLng);
        toast.success("Location set to device GPS!", { id: toastId });
      },
      () => {
        toast.error("Unable to retrieve location. Please check browser permissions.", { id: toastId });
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const coverageAreaSqKm = (Math.PI * Math.pow(Number(radiusKm) || 0, 2)).toFixed(1);

  return (
    <div className="space-y-4">
      {/* Search & Location Actions */}
      <div className="relative">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <div className="relative flex-1">
            <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  e.stopPropagation();
                  handleSearchAddress();
                }
              }}
              placeholder="Search village, colony, road name, district, or PIN code..."
              className="w-full bg-[#101014] border border-white/10 focus:border-amber-500/50 rounded-xl pl-10 pr-24 py-2.5 text-xs text-white placeholder-gray-500 outline-none"
            />
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleSearchAddress();
              }}
              disabled={searching}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black text-[11px] font-bold cursor-pointer disabled:opacity-50 transition-colors"
            >
              {searching ? "Searching..." : "Search"}
            </button>
          </div>

          <button
            type="button"
            onClick={handleDetectGPS}
            className="flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-200 text-xs font-bold border border-white/10 whitespace-nowrap transition-colors cursor-pointer"
          >
            <FiCrosshair size={14} className="text-amber-400" />
            <span>My GPS</span>
          </button>
        </div>

        {/* Search Results Dropdown */}
        {searchResults.length > 1 && (
          <div className="absolute top-full left-0 right-0 z-30 mt-1.5 bg-[#16161d] border border-white/15 rounded-xl shadow-2xl overflow-hidden divide-y divide-white/5 max-h-60 overflow-y-auto">
            <div className="px-3 py-1.5 text-[10px] font-bold text-gray-400 bg-black/60 flex items-center justify-between sticky top-0">
              <span>Matching Places ({searchResults.length}):</span>
              <button onClick={() => setSearchResults([])} className="text-gray-400 hover:text-white">
                <FiX size={12} />
              </button>
            </div>
            {searchResults.map((item, idx) => (
              <div
                key={idx}
                onClick={() => selectLocation(item)}
                className="p-2.5 hover:bg-amber-500/15 cursor-pointer transition-colors text-xs text-gray-200 flex items-start gap-2"
              >
                <FiMapPin size={14} className="text-amber-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-white truncate">{item.display_name.split(",")[0]}</p>
                  <p className="text-[10px] text-gray-400 truncate">{item.display_name}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Map Style Switcher & Info Controls */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1 bg-[#101014] p-1 rounded-xl border border-white/10">
          {Object.entries(MAP_LAYERS).map(([key, info]) => (
            <button
              key={key}
              type="button"
              onClick={() => switchLayer(key)}
              className={`px-3 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                currentLayer === key
                  ? "bg-amber-500 text-black shadow-sm"
                  : "text-gray-400 hover:text-white hover:bg-white/5"
              }`}
            >
              {info.label}
            </button>
          ))}
        </div>

        <span className="text-[10px] text-gray-400">
          💡 Click anywhere on map or drag the pin to reposition store
        </span>
      </div>

      {/* Map Container */}
      <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-black/60 shadow-xl">
        <div
          ref={mapContainerRef}
          style={{ height: "420px", width: "100%", zIndex: 10 }}
          className="rounded-2xl"
        />

        {/* Live Overlay Badge on Map */}
        <div className="absolute top-3 right-3 z-20 bg-black/85 backdrop-blur-md border border-white/15 rounded-xl px-3 py-2 text-[11px] text-white shadow-xl pointer-events-none space-y-0.5">
          <div className="flex items-center gap-1.5 font-bold text-amber-400">
            <FiNavigation size={12} />
            <span>Delivery Zone</span>
          </div>
          <p className="text-[10px] text-gray-300">
            Radius: <span className="font-bold text-white">{radiusKm} km</span>
          </p>
          <p className="text-[10px] text-gray-400">
            Area: <span className="font-semibold text-gray-200">{coverageAreaSqKm} km²</span>
          </p>
        </div>
      </div>

      {/* Radius Controls & Sliders */}
      <div className="p-4 rounded-2xl bg-[#101014] border border-white/10 space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-gray-200 flex items-center gap-2">
            <FiMapPin className="text-amber-400" size={14} />
            <span>Delivery Radius (Kilometers):</span>
          </label>
          <span className="text-xs font-black text-amber-400 font-mono bg-amber-500/10 px-2.5 py-0.5 rounded-lg border border-amber-500/20">
            {radiusKm} KM
          </span>
        </div>

        {/* Range Slider */}
        <div className="flex items-center gap-3">
          <span className="text-[10px] text-gray-500 font-mono font-bold">1 km</span>
          <input
            type="range"
            min="1"
            max="30"
            step="0.5"
            value={radiusKm}
            onChange={(e) => onChangeRadius(Number(e.target.value))}
            className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-amber-500"
          />
          <span className="text-[10px] text-gray-500 font-mono font-bold">30 km</span>
        </div>

        {/* Quick Radius Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1">
          {[2, 3, 5, 7, 10, 15, 20].map((km) => (
            <button
              key={km}
              type="button"
              onClick={() => onChangeRadius(km)}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold whitespace-nowrap transition-all cursor-pointer ${
                Number(radiusKm) === km
                  ? "bg-amber-500 text-black shadow-md shadow-amber-500/20"
                  : "bg-white/5 text-gray-400 hover:text-white hover:bg-white/10"
              }`}
            >
              {km} KM
            </button>
          ))}
        </div>
      </div>

      {/* Numerical Coordinate Inputs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
            Store Latitude
          </label>
          <input
            type="number"
            step="any"
            value={lat}
            onChange={(e) => onChangeCoordinates(parseFloat(e.target.value) || 0, lng)}
            className="w-full mt-1 bg-[#101014] border border-white/10 focus:border-amber-500/50 rounded-xl px-3 py-2 text-xs text-white font-mono outline-none"
          />
        </div>

        <div>
          <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
            Store Longitude
          </label>
          <input
            type="number"
            step="any"
            value={lng}
            onChange={(e) => onChangeCoordinates(lat, parseFloat(e.target.value) || 0)}
            className="w-full mt-1 bg-[#101014] border border-white/10 focus:border-amber-500/50 rounded-xl px-3 py-2 text-xs text-white font-mono outline-none"
          />
        </div>
      </div>
    </div>
  );
}
