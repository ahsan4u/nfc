"use client";

import React, { useState } from "react";
import { 
  FiX, 
  FiLink, 
  FiDownload, 
  FiCrop, 
  FiTrash2, 
  FiCheck,
  FiExternalLink,
  FiFolder,
  FiClock,
  FiHardDrive
} from "react-icons/fi";
import toast from "react-hot-toast";

function formatBytes(bytes) {
  if (!bytes || bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export default function AssetModalViewer({ asset, onClose, onCrop, onDelete }) {
  const [copied, setCopied] = useState(false);
  const [deleting, setDeleting] = useState(false);

  if (!asset) return null;

  const copyLink = () => {
    navigator.clipboard.writeText(asset.url);
    setCopied(true);
    toast.success("Blob URL copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete ${asset.name}?`)) return;
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
            src={asset.url}
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
            <span>Uploaded: <strong className="text-gray-200">{new Date(asset.uploadedAt).toLocaleDateString()}</strong></span>
          </div>
        </div>

        {/* Action Buttons Toolbar */}
        <div className="p-3 border-t border-white/10 bg-[#121216] grid grid-cols-4 gap-1.5 sm:gap-2">
          {/* Copy Link */}
          <button
            onClick={copyLink}
            className="flex flex-col sm:flex-row items-center justify-center gap-1 py-2 px-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-200 text-[10px] sm:text-xs font-bold transition-all cursor-pointer"
          >
            {copied ? <FiCheck className="text-green-400" size={14} /> : <FiLink size={14} />}
            <span>{copied ? "Copied" : "Copy Link"}</span>
          </button>

          {/* Crop */}
          <button
            onClick={() => {
              onCrop(asset);
              onClose();
            }}
            className="flex flex-col sm:flex-row items-center justify-center gap-1 py-2 px-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/30 text-amber-300 text-[10px] sm:text-xs font-bold transition-all cursor-pointer"
          >
            <FiCrop size={14} />
            <span>Crop</span>
          </button>

          {/* Open / Download */}
          <a
            href={asset.url}
            target="_blank"
            rel="noopener noreferrer"
            download
            className="flex flex-col sm:flex-row items-center justify-center gap-1 py-2 px-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-200 text-[10px] sm:text-xs font-bold transition-all"
          >
            <FiDownload size={14} />
            <span>Open</span>
          </a>

          {/* Delete */}
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="flex flex-col sm:flex-row items-center justify-center gap-1 py-2 px-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 text-[10px] sm:text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
          >
            <FiTrash2 size={14} />
            <span>{deleting ? "..." : "Delete"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
