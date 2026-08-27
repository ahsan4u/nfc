"use client";

import React, { useState } from "react";
import { 
  FiX, 
  FiLink, 
  FiDownload, 
  FiCrop, 
  FiTrash2, 
  FiCheck,
  FiClock,
  FiHardDrive,
  FiCornerUpRight
} from "react-icons/fi";
import toast from "react-hot-toast";

function formatBytes(bytes) {
  if (!bytes || bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export default function AssetModalViewer({ 
  asset, 
  onClose, 
  onCrop, 
  onDelete,
  onMove
}) {
  const [copied, setCopied] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Lock body scroll while modal is open
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  if (!asset) return null;

  const copyLink = () => {
    navigator.clipboard.writeText(asset.url);
    setCopied(true);
    toast.success("Blob URL copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = async () => {
    try {
      const toastId = toast.loading("Downloading...");
      const res = await fetch(asset.url);
      const blob = await res.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = asset.name || "image.png";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(blobUrl);
      toast.success("Download started!", { id: toastId });
    } catch {
      window.open(asset.url, "_blank");
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete "${asset.name}"?`)) return;
    setDeleting(true);
    try {
      await onDelete(asset.url);
      onClose();
    } catch {
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-lg bg-[#141418] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Topbar */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-[#19191f]">
          <div className="flex items-center gap-2 truncate pr-2">
            <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider bg-amber-500/20 text-amber-400 border border-amber-500/30">
              {asset.folder}
            </span>
            <h3 className="text-xs sm:text-sm font-bold text-white truncate">
              {asset.name}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <FiX size={18} />
          </button>
        </div>

        {/* Image Display Area */}
        <div className="relative flex-1 min-h-[220px] max-h-[380px] bg-black/60 flex items-center justify-center p-4 overflow-hidden pattern-checkers">
          <img
            src={`${asset.url}${asset.url.includes('?') ? '&' : '?'}t=${asset.uploadedAt ? new Date(asset.uploadedAt).getTime() : ''}`}
            alt={asset.name}
            className="max-h-full max-w-full object-contain rounded-lg drop-shadow-2xl"
          />
        </div>

        {/* Metadata Details */}
        <div className="p-3 bg-[#17171d] border-t border-white/5 grid grid-cols-2 gap-2 text-[11px]">
          <div className="flex items-center gap-1.5 text-gray-400 truncate">
            <FiHardDrive size={13} className="text-amber-400 flex-shrink-0" />
            <span>Size: <strong className="text-gray-200">{formatBytes(asset.size)}</strong></span>
          </div>
          <div className="flex items-center gap-1.5 text-gray-400 truncate">
            <FiClock size={13} className="text-amber-400 flex-shrink-0" />
            <span>Uploaded: <strong className="text-gray-200">{new Date(asset.uploadedAt || Date.now()).toLocaleDateString()}</strong></span>
          </div>
        </div>

        {/* Action Buttons Toolbar */}
        <div className="p-3 border-t border-white/10 bg-[#121216] grid grid-cols-5 gap-1.5 sm:gap-2">
          {/* Copy Link */}
          <button
            onClick={copyLink}
            className="flex flex-col items-center justify-center gap-1 py-2 px-1 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-200 text-[10px] font-bold transition-all cursor-pointer"
            title="Copy Blob URL"
          >
            {copied ? <FiCheck className="text-green-400" size={14} /> : <FiLink size={14} />}
            <span className="truncate">{copied ? "Copied" : "Copy Link"}</span>
          </button>

          {/* Move to Folder */}
          <button
            onClick={() => {
              if (onMove) onMove(asset);
              onClose();
            }}
            className="flex flex-col items-center justify-center gap-1 py-2 px-1 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-200 text-[10px] font-bold transition-all cursor-pointer hover:text-amber-400"
            title="Move to another folder"
          >
            <FiCornerUpRight size={14} className="text-amber-400" />
            <span className="truncate">Move File</span>
          </button>

          {/* Crop */}
          <button
            onClick={() => {
              onCrop(asset);
              onClose();
            }}
            className="flex flex-col items-center justify-center gap-1 py-2 px-1 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/30 text-amber-300 text-[10px] font-bold transition-all cursor-pointer"
          >
            <FiCrop size={14} />
            <span className="truncate">Crop</span>
          </button>

          {/* Download */}
          <button
            onClick={handleDownload}
            className="flex flex-col items-center justify-center gap-1 py-2 px-1 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-200 text-[10px] font-bold transition-all cursor-pointer"
          >
            <FiDownload size={14} />
            <span className="truncate">Download</span>
          </button>

          {/* Delete */}
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="flex flex-col items-center justify-center gap-1 py-2 px-1 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 text-[10px] font-bold transition-all cursor-pointer disabled:opacity-50"
          >
            <FiTrash2 size={14} />
            <span className="truncate">{deleting ? "..." : "Delete"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
