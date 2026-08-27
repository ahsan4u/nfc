"use client";

import React, { useState, useRef, useEffect } from "react";
import { 
  FiX, 
  FiCheck, 
  FiCrop, 
  FiRotateCw,
  FiSliders,
  FiZap
} from "react-icons/fi";
import toast from "react-hot-toast";

const PRESETS = [
  { label: "Free", value: "free", ratio: null },
  { label: "1:1", value: "1:1", ratio: 1 },
  { label: "16:9", value: "16:9", ratio: 16 / 9 },
  { label: "4:5", value: "4:5", ratio: 4 / 5 },
  { label: "3:2", value: "3:2", ratio: 3 / 2 },
];

export default function AssetCropModal({ asset, onClose, onCropped }) {
  const [aspectPreset, setAspectPreset] = useState("free");
  const [rotation, setRotation] = useState(0);
  const [saving, setSaving] = useState(false);
  const [replaceOriginal, setReplaceOriginal] = useState(false);
  const [imageBlobUrl, setImageBlobUrl] = useState(null);

  // Sharp Color Palette optimization state (default unchecked)
  const [usePalette, setUsePalette] = useState(false);
  const [colours, setColours] = useState(64);

  // Crop box in container pixel space
  const [crop, setCrop] = useState({ x: 30, y: 30, width: 200, height: 200 });
  const [dragMode, setDragMode] = useState(null); // 'move' | 'nw' | 'ne' | 'sw' | 'se' | 'n' | 's' | 'e' | 'w' | null
  const [dragStart, setDragStart] = useState({ x: 0, y: 0, crop: { x: 30, y: 30, width: 200, height: 200 } });

  const imageRef = useRef(null);
  const containerRef = useRef(null);

  // Fetch image into a local blob url to prevent CORS canvas tainting
  useEffect(() => {
    let active = true;
    let createdUrl = null;

    const loadBlob = async () => {
      try {
        const res = await fetch(asset.url);
        const blob = await res.blob();
        if (active) {
          createdUrl = URL.createObjectURL(blob);
          setImageBlobUrl(createdUrl);
        }
      } catch (e) {
        if (active) {
          setImageBlobUrl(asset.url);
        }
      }
    };

    if (asset?.url) {
      loadBlob();
    }

    return () => {
      active = false;
      if (createdUrl) {
        URL.revokeObjectURL(createdUrl);
      }
    };
  }, [asset?.url]);

  // Lock body scroll while modal is open
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  if (!asset) return null;

  const handleImageLoad = () => {
    if (!imageRef.current || !containerRef.current) return;
    const img = imageRef.current;
    const container = containerRef.current;

    const imgRect = img.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();

    const imgLeft = Math.max(0, imgRect.left - containerRect.left);
    const imgTop = Math.max(0, imgRect.top - containerRect.top);
    const imgW = imgRect.width;
    const imgH = imgRect.height;

    // Open crop box to full image frame by default
    setCrop({
      x: Math.round(imgLeft),
      y: Math.round(imgTop),
      width: Math.max(30, Math.round(imgW)),
      height: Math.max(30, Math.round(imgH)),
    });
  };

  const handlePresetChange = (preset) => {
    setAspectPreset(preset.value);
    if (!preset.ratio) return;

    setCrop((prev) => {
      const container = containerRef.current;
      const maxW = container ? container.clientWidth - prev.x : 260;
      const maxH = container ? container.clientHeight - prev.y : 260;
      let width = Math.min(prev.width, maxW);
      let height = width / preset.ratio;
      if (height > maxH) {
        height = maxH;
        width = height * preset.ratio;
      }
      return { ...prev, width: Math.max(30, Math.round(width)), height: Math.max(30, Math.round(height)) };
    });
  };

  // Drag handlers (touch + mouse)
  const handleStart = (mode, clientX, clientY) => {
    setDragMode(mode);
    setDragStart({
      x: clientX,
      y: clientY,
      crop: { ...crop },
    });
  };

  const handleMove = (clientX, clientY) => {
    if (!dragMode) return;
    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const containerWidth = rect.width;
    const containerHeight = rect.height;

    const dx = clientX - dragStart.x;
    const dy = clientY - dragStart.y;
    const init = dragStart.crop;
    const currentPreset = PRESETS.find((p) => p.value === aspectPreset);
    const ratio = currentPreset?.ratio;

    if (dragMode === "move") {
      const maxX = Math.max(0, containerWidth - init.width);
      const maxY = Math.max(0, containerHeight - init.height);
      const newX = Math.max(0, Math.min(init.x + dx, maxX));
      const newY = Math.max(0, Math.min(init.y + dy, maxY));
      setCrop((prev) => ({ ...prev, x: Math.round(newX), y: Math.round(newY) }));
      return;
    }

    let newX = init.x;
    let newY = init.y;
    let newW = init.width;
    let newH = init.height;

    // Corner / Edge Resizing
    if (dragMode === "se") {
      newW = Math.max(30, Math.min(init.width + dx, containerWidth - init.x));
      newH = ratio ? newW / ratio : Math.max(30, Math.min(init.height + dy, containerHeight - init.y));
      if (init.y + newH > containerHeight) {
        newH = containerHeight - init.y;
        if (ratio) newW = newH * ratio;
      }
    } else if (dragMode === "sw") {
      newW = Math.max(30, Math.min(init.width - dx, init.x + init.width));
      newH = ratio ? newW / ratio : Math.max(30, Math.min(init.height + dy, containerHeight - init.y));
      if (init.y + newH > containerHeight) {
        newH = containerHeight - init.y;
        if (ratio) newW = newH * ratio;
      }
      newX = init.x + (init.width - newW);
    } else if (dragMode === "ne") {
      newW = Math.max(30, Math.min(init.width + dx, containerWidth - init.x));
      newH = ratio ? newW / ratio : Math.max(30, Math.min(init.height - dy, init.y + init.height));
      if (init.y + init.height - newH < 0) {
        newH = init.y + init.height;
        if (ratio) newW = newH * ratio;
      }
      newY = init.y + (init.height - newH);
    } else if (dragMode === "nw") {
      newW = Math.max(30, Math.min(init.width - dx, init.x + init.width));
      newH = ratio ? newW / ratio : Math.max(30, Math.min(init.height - dy, init.y + init.height));
      if (init.y + init.height - newH < 0) {
        newH = init.y + init.height;
        if (ratio) newW = newH * ratio;
      }
      newX = init.x + (init.width - newW);
      newY = init.y + (init.height - newH);
    } else if (dragMode === "e") {
      newW = Math.max(30, Math.min(init.width + dx, containerWidth - init.x));
      newH = ratio ? newW / ratio : init.height;
      if (ratio && init.y + newH > containerHeight) {
        newH = containerHeight - init.y;
        newW = newH * ratio;
      }
    } else if (dragMode === "w") {
      newW = Math.max(30, Math.min(init.width - dx, init.x + init.width));
      newH = ratio ? newW / ratio : init.height;
      if (ratio && init.y + newH > containerHeight) {
        newH = containerHeight - init.y;
        newW = newH * ratio;
      }
      newX = init.x + (init.width - newW);
    } else if (dragMode === "s") {
      newH = Math.max(30, Math.min(init.height + dy, containerHeight - init.y));
      newW = ratio ? newH * ratio : init.width;
      if (ratio && init.x + newW > containerWidth) {
        newW = containerWidth - init.x;
        newH = newW / ratio;
      }
    } else if (dragMode === "n") {
      newH = Math.max(30, Math.min(init.height - dy, init.y + init.height));
      newW = ratio ? newH * ratio : init.width;
      if (ratio && init.x + newW > containerWidth) {
        newW = containerWidth - init.x;
        newH = newW / ratio;
      }
      newY = init.y + (init.height - newH);
    }

    setCrop({
      x: Math.max(0, Math.round(newX)),
      y: Math.max(0, Math.round(newY)),
      width: Math.max(30, Math.round(newW)),
      height: Math.max(30, Math.round(newH)),
    });
  };

  const clampCropToImage = (currentCrop) => {
    if (!imageRef.current || !containerRef.current) return currentCrop;
    const img = imageRef.current;
    const container = containerRef.current;

    const imgRect = img.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();

    const imgLeft = imgRect.left - containerRect.left;
    const imgTop = imgRect.top - containerRect.top;
    const imgWidth = imgRect.width;
    const imgHeight = imgRect.height;

    const minX = imgLeft;
    const minY = imgTop;
    const maxX = imgLeft + imgWidth;
    const maxY = imgTop + imgHeight;

    let { x, y, width, height } = currentCrop;
    const currentPreset = PRESETS.find((p) => p.value === aspectPreset);
    const ratio = currentPreset?.ratio;

    // 1. Clamp dimensions to not exceed rendered image dimensions
    if (width > imgWidth) {
      width = imgWidth;
      if (ratio) height = width / ratio;
    }
    if (height > imgHeight) {
      height = imgHeight;
      if (ratio) width = height * ratio;
    }

    // 2. Snap position to stay inside image edges
    if (x < minX) {
      x = minX;
    } else if (x + width > maxX) {
      x = Math.max(minX, maxX - width);
    }

    if (y < minY) {
      y = minY;
    } else if (y + height > maxY) {
      y = Math.max(minY, maxY - height);
    }

    // 3. Final bounds safety check
    if (x + width > maxX) {
      width = maxX - x;
      if (ratio) height = width / ratio;
    }
    if (y + height > maxY) {
      height = maxY - y;
      if (ratio) width = height * ratio;
    }

    return {
      x: Math.round(x),
      y: Math.round(y),
      width: Math.max(30, Math.round(width)),
      height: Math.max(30, Math.round(height)),
    };
  };

  const handleEnd = () => {
    setDragMode(null);
    setCrop((prev) => clampCropToImage(prev));
  };

  useEffect(() => {
    if (!dragMode) return;
    const onMouseUp = () => handleEnd();
    const onMouseMove = (e) => handleMove(e.clientX, e.clientY);
    const onTouchEnd = () => handleEnd();
    const onTouchMove = (e) => {
      if (e.touches?.[0]) handleMove(e.touches[0].clientX, e.touches[0].clientY);
    };

    window.addEventListener("mouseup", onMouseUp);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("touchend", onTouchEnd);
    window.addEventListener("touchmove", onTouchMove);

    return () => {
      window.removeEventListener("mouseup", onMouseUp);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("touchend", onTouchEnd);
      window.removeEventListener("touchmove", onTouchMove);
    };
  }, [dragMode, dragStart]);

  const performCrop = async () => {
    if (!imageRef.current || !containerRef.current) return;
    setSaving(true);

    try {
      const img = imageRef.current;
      const container = containerRef.current;

      const imgRect = img.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();

      // Rendered position of image relative to container
      const imgLeft = imgRect.left - containerRect.left;
      const imgTop = imgRect.top - containerRect.top;
      const imgWidth = imgRect.width;
      const imgHeight = imgRect.height;

      // Crop box coordinates relative to image rendered pixels
      const relX = Math.max(0, crop.x - imgLeft);
      const relY = Math.max(0, crop.y - imgTop);
      const relW = Math.min(crop.width, imgWidth - relX);
      const relH = Math.min(crop.height, imgHeight - relY);

      if (relW <= 5 || relH <= 5) {
        throw new Error("Please adjust the crop area over the image.");
      }

      // Natural dimensions vs rendered dimensions
      const scaleX = img.naturalWidth / imgWidth;
      const scaleY = img.naturalHeight / imgHeight;

      const sourceX = relX * scaleX;
      const sourceY = relY * scaleY;
      const sourceWidth = relW * scaleX;
      const sourceHeight = relH * scaleY;

      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      canvas.width = Math.max(10, Math.floor(sourceWidth));
      canvas.height = Math.max(10, Math.floor(sourceHeight));

      if (rotation !== 0) {
        ctx.save();
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate((rotation * Math.PI) / 180);
        ctx.drawImage(
          img,
          sourceX,
          sourceY,
          sourceWidth,
          sourceHeight,
          -canvas.width / 2,
          -canvas.height / 2,
          canvas.width,
          canvas.height
        );
        ctx.restore();
      } else {
        ctx.drawImage(
          img,
          sourceX,
          sourceY,
          sourceWidth,
          sourceHeight,
          0,
          0,
          canvas.width,
          canvas.height
        );
      }

      const imageBase64 = canvas.toDataURL("image/png");

      const res = await fetch("/api/admin/assets/crop", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64,
          originalName: asset.name,
          originalUrl: asset.url,
          originalPathname: asset.pathname,
          folder: asset.folder,
          replaceOriginal,
          colours: usePalette ? Number(colours) : null,
          usePalette,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to save cropped image");
      }

      toast.success(
        replaceOriginal 
          ? "Original image replaced with cropped version!" 
          : "New cropped image created successfully!"
      );
      if (onCropped) onCropped(data.asset);
      onClose();
    } catch (err) {
      console.error("Crop error:", err);
      toast.error(err.message || "Crop failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-md bg-[#141418] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[94vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-[#19191f]">
          <div className="flex items-center gap-2">
            <FiCrop className="text-amber-400" size={16} />
            <h3 className="text-xs sm:text-sm font-bold text-white">
              Crop & Optimize Image
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <FiX size={18} />
          </button>
        </div>

        {/* Aspect Ratio Presets Bar */}
        <div className="px-3 py-2 bg-[#17171d] border-b border-white/5 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          <span className="text-[10px] text-gray-400 font-bold uppercase mr-1">Aspect:</span>
          {PRESETS.map((p) => (
            <button
              key={p.value}
              onClick={() => handlePresetChange(p)}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold whitespace-nowrap transition-all cursor-pointer ${
                aspectPreset === p.value
                  ? "bg-amber-500 text-black shadow-md shadow-amber-500/20"
                  : "bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Canvas Cropping Container */}
        <div
          ref={containerRef}
          className="relative flex-1 min-h-[250px] max-h-[340px] bg-black/70 flex items-center justify-center overflow-hidden select-none"
        >
          {imageBlobUrl ? (
            <img
              ref={imageRef}
              src={imageBlobUrl}
              alt={asset.name}
              onLoad={handleImageLoad}
              style={{
                transform: `rotate(${rotation}deg)`,
                transformOrigin: "center center",
              }}
              className="max-h-[320px] max-w-full object-contain pointer-events-none transition-transform duration-200"
            />
          ) : (
            <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
          )}

          {/* Movable & Resizable Crop Box Overlay */}
          <div
            style={{
              left: `${crop.x}px`,
              top: `${crop.y}px`,
              width: `${crop.width}px`,
              height: `${crop.height}px`,
            }}
            className={`absolute border-2 border-amber-400 shadow-[0_0_0_9999px_rgba(0,0,0,0.65)] ${
              dragMode ? "border-amber-300" : "transition-all duration-200 ease-out"
            }`}
          >
            {/* Center Area to Move Entire Box */}
            <div
              onMouseDown={(e) => {
                e.stopPropagation();
                handleStart("move", e.clientX, e.clientY);
              }}
              onTouchStart={(e) => {
                e.stopPropagation();
                if (e.touches?.[0]) handleStart("move", e.touches[0].clientX, e.touches[0].clientY);
              }}
              className="absolute inset-0 bg-amber-400/10 cursor-move flex items-center justify-center"
            >
              {/* 3x3 Rule-of-Thirds Grid Lines */}
              <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none opacity-40">
                <div className="border-r border-b border-amber-400/60" />
                <div className="border-r border-b border-amber-400/60" />
                <div className="border-b border-amber-400/60" />
                <div className="border-r border-b border-amber-400/60" />
                <div className="border-r border-b border-amber-400/60" />
                <div className="border-b border-amber-400/60" />
                <div className="border-r border-b border-amber-400/60" />
                <div className="border-r border-b border-amber-400/60" />
                <div />
              </div>
            </div>

            {/* Top Edge Handle */}
            <div
              onMouseDown={(e) => {
                e.stopPropagation();
                handleStart("n", e.clientX, e.clientY);
              }}
              onTouchStart={(e) => {
                e.stopPropagation();
                if (e.touches?.[0]) handleStart("n", e.touches[0].clientX, e.touches[0].clientY);
              }}
              className="absolute top-0 left-3 right-3 h-2.5 -translate-y-1/2 cursor-n-resize hover:bg-amber-400/40 z-10"
            />

            {/* Bottom Edge Handle */}
            <div
              onMouseDown={(e) => {
                e.stopPropagation();
                handleStart("s", e.clientX, e.clientY);
              }}
              onTouchStart={(e) => {
                e.stopPropagation();
                if (e.touches?.[0]) handleStart("s", e.touches[0].clientX, e.touches[0].clientY);
              }}
              className="absolute bottom-0 left-3 right-3 h-2.5 translate-y-1/2 cursor-s-resize hover:bg-amber-400/40 z-10"
            />

            {/* Left Edge Handle */}
            <div
              onMouseDown={(e) => {
                e.stopPropagation();
                handleStart("w", e.clientX, e.clientY);
              }}
              onTouchStart={(e) => {
                e.stopPropagation();
                if (e.touches?.[0]) handleStart("w", e.touches[0].clientX, e.touches[0].clientY);
              }}
              className="absolute top-3 bottom-3 left-0 w-2.5 -translate-x-1/2 cursor-w-resize hover:bg-amber-400/40 z-10"
            />

            {/* Right Edge Handle */}
            <div
              onMouseDown={(e) => {
                e.stopPropagation();
                handleStart("e", e.clientX, e.clientY);
              }}
              onTouchStart={(e) => {
                e.stopPropagation();
                if (e.touches?.[0]) handleStart("e", e.touches[0].clientX, e.touches[0].clientY);
              }}
              className="absolute top-3 bottom-3 right-0 w-2.5 translate-x-1/2 cursor-e-resize hover:bg-amber-400/40 z-10"
            />

            {/* Top-Left Corner Handle */}
            <div
              onMouseDown={(e) => {
                e.stopPropagation();
                handleStart("nw", e.clientX, e.clientY);
              }}
              onTouchStart={(e) => {
                e.stopPropagation();
                if (e.touches?.[0]) handleStart("nw", e.touches[0].clientX, e.touches[0].clientY);
              }}
              className="absolute -top-1.5 -left-1.5 w-3.5 h-3.5 bg-amber-400 border border-black rounded-sm cursor-nwse-resize z-20 shadow-md hover:scale-125 transition-transform"
            />

            {/* Top-Right Corner Handle */}
            <div
              onMouseDown={(e) => {
                e.stopPropagation();
                handleStart("ne", e.clientX, e.clientY);
              }}
              onTouchStart={(e) => {
                e.stopPropagation();
                if (e.touches?.[0]) handleStart("ne", e.touches[0].clientX, e.touches[0].clientY);
              }}
              className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-amber-400 border border-black rounded-sm cursor-nesw-resize z-20 shadow-md hover:scale-125 transition-transform"
            />

            {/* Bottom-Left Corner Handle */}
            <div
              onMouseDown={(e) => {
                e.stopPropagation();
                handleStart("sw", e.clientX, e.clientY);
              }}
              onTouchStart={(e) => {
                e.stopPropagation();
                if (e.touches?.[0]) handleStart("sw", e.touches[0].clientX, e.touches[0].clientY);
              }}
              className="absolute -bottom-1.5 -left-1.5 w-3.5 h-3.5 bg-amber-400 border border-black rounded-sm cursor-nesw-resize z-20 shadow-md hover:scale-125 transition-transform"
            />

            {/* Bottom-Right Corner Handle */}
            <div
              onMouseDown={(e) => {
                e.stopPropagation();
                handleStart("se", e.clientX, e.clientY);
              }}
              onTouchStart={(e) => {
                e.stopPropagation();
                if (e.touches?.[0]) handleStart("se", e.touches[0].clientX, e.touches[0].clientY);
              }}
              className="absolute -bottom-1.5 -right-1.5 w-3.5 h-3.5 bg-amber-400 border border-black rounded-sm cursor-nwse-resize z-20 shadow-md hover:scale-125 transition-transform"
            />
          </div>
        </div>

        {/* Toolbar (Crop Dimensions & Rotate) */}
        <div className="px-4 py-2 bg-[#17171d] border-t border-white/5 flex items-center justify-between">
          <div className="text-[11px] text-gray-400 font-mono flex items-center gap-1.5">
            <span className="text-amber-400 font-bold">Size:</span>
            <span>{Math.round(crop.width)} × {Math.round(crop.height)} px</span>
          </div>

          <button
            onClick={() => setRotation((r) => (r + 90) % 360)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs text-gray-300 hover:text-white transition-colors cursor-pointer"
          >
            <FiRotateCw size={13} className="text-amber-400" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Rotate 90°</span>
          </button>
        </div>

        {/* Sharp Palette / Number of Colors Optimization Progress Bar */}
        <div className="px-4 py-2.5 bg-[#141419] border-t border-white/5 space-y-2">
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={usePalette}
                onChange={(e) => setUsePalette(e.target.checked)}
                className="w-3.5 h-3.5 rounded bg-[#1b1b22] border-white/20 text-amber-500 accent-amber-500 cursor-pointer"
              />
              <span className="text-xs font-bold text-gray-200 flex items-center gap-1.5">
                <FiZap size={13} className="text-amber-400" />
                <span>Reduce Size:</span>
              </span>
            </label>

            {usePalette && (
              <span className="text-xs font-black text-amber-400 font-mono bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                {colours} Colors
              </span>
            )}
          </div>

          {usePalette && (
            <div className="space-y-1 pt-1">
              {/* Slider Input */}
              <div className="flex items-center gap-2.5">
                <span className="text-[10px] text-gray-500 font-mono font-bold">2</span>
                <input
                  type="range"
                  min="2"
                  max="256"
                  value={colours}
                  onChange={(e) => setColours(Number(e.target.value))}
                  className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-amber-500"
                />
                <span className="text-[10px] text-gray-500 font-mono font-bold">256</span>
              </div>
            </div>
          )}
        </div>

        {/* Replace Original / Create New Checkbox */}
        <div className="px-4 py-2.5 bg-[#121217] border-t border-white/5">
          <label className="flex items-center gap-2.5 cursor-pointer select-none group">
            <input
              type="checkbox"
              checked={replaceOriginal}
              onChange={(e) => setReplaceOriginal(e.target.checked)}
              className="w-4 h-4 rounded bg-[#1b1b22] border-white/20 text-amber-500 focus:ring-amber-400 accent-amber-500 cursor-pointer"
            />
            <span className="text-xs font-bold text-gray-200 group-hover:text-white transition-colors">
              Replace original image
            </span>
          </label>
        </div>

        {/* Footer Actions */}
        <div className="p-3 border-t border-white/10 bg-[#121216] flex items-center justify-between gap-2">
          <button
            onClick={onClose}
            className="px-3.5 py-2 rounded-xl text-xs font-bold text-gray-400 hover:text-white hover:bg-white/5"
          >
            Cancel
          </button>
          <button
            onClick={performCrop}
            disabled={saving}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-extrabold shadow-lg shadow-amber-500/20 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
          >
            {saving ? (
              <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <FiCheck size={15} />
                <span>{replaceOriginal ? "Replace Original" : "Create Cropped & Compressed Asset"}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
