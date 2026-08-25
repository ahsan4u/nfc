"use client";

import React, { useState, useRef, useEffect } from "react";
import { 
  FiX, 
  FiCheck, 
  FiCrop, 
  FiZoomIn, 
  FiZoomOut, 
  FiRotateCw 
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
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [saving, setSaving] = useState(false);

  // Crop box in container pixel space
  const [crop, setCrop] = useState({ x: 20, y: 20, width: 220, height: 220 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const imageRef = useRef(null);
  const containerRef = useRef(null);

  if (!asset) return null;

  const handlePresetChange = (preset) => {
    setAspectPreset(preset.value);
    if (!preset.ratio) return;

    setCrop((prev) => {
      const width = Math.min(prev.width, 240);
      const height = width / preset.ratio;
      return { ...prev, width, height };
    });
  };

  // Drag handlers (touch + mouse)
  const handleStart = (clientX, clientY) => {
    setIsDragging(true);
    setDragStart({ x: clientX - crop.x, y: clientY - crop.y });
  };

  const handleMove = (clientX, clientY) => {
    if (!isDragging) return;
    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const maxX = rect.width - crop.width;
    const maxY = rect.height - crop.height;

    const newX = Math.max(0, Math.min(clientX - dragStart.x, maxX));
    const newY = Math.max(0, Math.min(clientY - dragStart.y, maxY));

    setCrop((prev) => ({ ...prev, x: newX, y: newY }));
  };

  const handleEnd = () => {
    setIsDragging(false);
  };

  useEffect(() => {
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
  }, [isDragging, dragStart, crop.width, crop.height]);

  const performCrop = async () => {
    if (!imageRef.current) return;
    setSaving(true);

    try {
      const img = imageRef.current;
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      // Calculate scale relative to natural image dimensions
      const scaleX = img.naturalWidth / img.width;
      const scaleY = img.naturalHeight / img.height;

      const sourceX = crop.x * scaleX;
      const sourceY = crop.y * scaleY;
      const sourceWidth = crop.width * scaleX;
      const sourceHeight = crop.height * scaleY;

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
          folder: asset.folder,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to save cropped image");
      }

      toast.success("Cropped image saved successfully!");
      if (onCropped) onCropped();
      onClose();
    } catch (err) {
      toast.error(err.message || "Crop failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-md bg-[#141418] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-[#19191f]">
          <div className="flex items-center gap-2">
            <FiCrop className="text-amber-400" size={16} />
            <h3 className="text-xs sm:text-sm font-bold text-white">
              Crop Image
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
          className="relative flex-1 min-h-[260px] max-h-[360px] bg-black/70 flex items-center justify-center overflow-hidden select-none"
        >
          <img
            ref={imageRef}
            src={asset.url}
            alt={asset.name}
            crossOrigin="anonymous"
            style={{
              transform: `scale(${zoom}) rotate(${rotation}deg)`,
              transformOrigin: "center center",
            }}
            className="max-h-[340px] max-w-full object-contain pointer-events-none transition-transform duration-200"
          />

          {/* Draggable Crop Box Overlay */}
          <div
            style={{
              left: `${crop.x}px`,
              top: `${crop.y}px`,
              width: `${crop.width}px`,
              height: `${crop.height}px`,
            }}
            onMouseDown={(e) => handleStart(e.clientX, e.clientY)}
            onTouchStart={(e) => {
              if (e.touches?.[0]) handleStart(e.touches[0].clientX, e.touches[0].clientY);
            }}
            className={`absolute border-2 border-amber-400 bg-amber-400/10 cursor-move shadow-[0_0_0_9999px_rgba(0,0,0,0.65)] ${
              isDragging ? "border-amber-300 bg-amber-300/20" : ""
            }`}
          >
            {/* Corner guide handles */}
            <div className="absolute top-0 left-0 w-2.5 h-2.5 bg-amber-400 -translate-x-1/2 -translate-y-1/2" />
            <div className="absolute top-0 right-0 w-2.5 h-2.5 bg-amber-400 translate-x-1/2 -translate-y-1/2" />
            <div className="absolute bottom-0 left-0 w-2.5 h-2.5 bg-amber-400 -translate-x-1/2 translate-y-1/2" />
            <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-amber-400 translate-x-1/2 translate-y-1/2" />
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <span className="text-[9px] font-black text-amber-300 bg-black/60 px-1.5 py-0.5 rounded">
                Drag to position
              </span>
            </div>
          </div>
        </div>

        {/* Toolbar (Zoom & Rotate) */}
        <div className="px-4 py-2.5 bg-[#17171d] border-t border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-1">
            <button
              onClick={() => setZoom((z) => Math.max(0.6, z - 0.1))}
              className="p-1.5 rounded-lg bg-white/5 text-gray-300 hover:text-white"
              title="Zoom Out"
            >
              <FiZoomOut size={15} />
            </button>
            <span className="text-[10px] text-gray-400 w-10 text-center font-bold">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={() => setZoom((z) => Math.min(2.5, z + 0.1))}
              className="p-1.5 rounded-lg bg-white/5 text-gray-300 hover:text-white"
              title="Zoom In"
            >
              <FiZoomIn size={15} />
            </button>
          </div>

          <button
            onClick={() => setRotation((r) => (r + 90) % 360)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/5 text-xs text-gray-300 hover:text-white hover:bg-white/10"
          >
            <FiRotateCw size={13} />
            <span className="text-[10px] font-semibold">Rotate</span>
          </button>
        </div>

        {/* Footer Actions */}
        <div className="p-3 border-t border-white/10 bg-[#121216] flex items-center justify-end gap-2">
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
                <span>Save Cropped to Blob</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
