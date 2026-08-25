"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  FiX, 
  FiCheck, 
  FiUploadCloud, 
  FiSearch, 
  FiFolder, 
  FiImage 
} from "react-icons/fi";
import toast from "react-hot-toast";

export default function AssetPickerModal({
  open,
  onClose,
  onSelect,
  title = "Select Image from Asset Library",
}) {
  const [assets, setAssets] = useState([]);
  const [folderCounts, setFolderCounts] = useState({ All: 0 });
  const [selectedFolder, setSelectedFolder] = useState("All");
  const [search, setSearch] = useState("");
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const fileInputRef = useRef(null);

  const fetchAssets = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedFolder !== "All") params.set("folder", selectedFolder);
      if (search.trim()) params.set("search", search.trim());

      const res = await fetch(`/api/admin/assets?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setAssets(data.assets || []);
        setFolderCounts(data.folderCounts || { All: 0 });
      }
    } catch {
      toast.error("Failed to load assets");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchAssets();
    }
  }, [open, selectedFolder]);

  useEffect(() => {
    if (open) {
      const timer = setTimeout(() => {
        fetchAssets();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [search]);

  if (!open) return null;

  const handleUploadFiles = async (filesList) => {
    const files = Array.from(filesList || []);
    if (files.length === 0) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("folder", selectedFolder === "All" ? "General" : selectedFolder);
    files.forEach((file) => formData.append("file", file));

    try {
      const res = await fetch("/api/admin/assets/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Upload failed");

      toast.success("Uploaded successfully!");
      await fetchAssets();
      if (data.assets?.[0]) {
        setSelectedAsset(data.assets[0]);
      }
    } catch (err) {
      toast.error(err.message || "Upload failed");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleConfirm = () => {
    if (!selectedAsset) {
      toast.error("Please select an image");
      return;
    }
    onSelect(selectedAsset);
    onClose();
  };

  const allFolders = Array.from(new Set([
    "All",
    "Categories",
    "Dishes",
    "Icons",
    "Banners",
    "General",
    ...Object.keys(folderCounts),
  ]));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md">
      <div className="relative w-full max-w-2xl bg-[#141418] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[90vh] max-h-[750px]">
        {/* Header */}
        <div className="px-4 py-3 border-b border-white/10 bg-[#18181f] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FiImage className="text-amber-400" size={16} />
            <h3 className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider">
              {title}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-white/10"
          >
            <FiX size={18} />
          </button>
        </div>

        {/* Filter Controls & Upload Button */}
        <div className="p-3 bg-[#111116] border-b border-white/5 space-y-2.5">
          {/* Folders */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            {allFolders.map((folder) => {
              const count = folderCounts[folder] || 0;
              const active = selectedFolder.toLowerCase() === folder.toLowerCase();
              return (
                <button
                  key={folder}
                  onClick={() => setSelectedFolder(folder)}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap transition-all cursor-pointer border ${
                    active
                      ? "bg-amber-500/20 text-amber-400 border-amber-500/50 scale-[1.02]"
                      : "bg-[#16161c] text-gray-400 border-white/5 hover:text-white"
                  }`}
                >
                  <FiFolder size={11} className={active ? "text-amber-400" : "text-gray-500"} />
                  <span>{folder}</span>
                  <span className={`text-[9px] px-1 rounded-full ${active ? "bg-amber-400 text-black font-extrabold" : "bg-white/10 text-gray-400"}`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search + Upload */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1 flex items-center">
              <FiSearch className="absolute left-2.5 text-gray-500 text-xs" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search images..."
                className="w-full bg-[#181820] border border-white/10 focus:border-amber-500/50 rounded-lg pl-7 pr-3 py-1.5 text-xs text-white placeholder-gray-500 outline-none"
              />
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleUploadFiles(e.target.files)}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-bold whitespace-nowrap transition-colors"
            >
              {uploading ? (
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <FiUploadCloud size={13} />
                  <span>Upload New</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Asset Grid */}
        <div className="flex-1 p-3 overflow-y-auto bg-black/40">
          {loading ? (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2.5">
              {[...Array(10)].map((_, i) => (
                <div key={i} className="aspect-square bg-[#17171d] rounded-xl animate-pulse" />
              ))}
            </div>
          ) : assets.length === 0 ? (
            <div className="text-center py-16">
              <FiImage size={32} className="text-gray-600 mx-auto mb-2" />
              <p className="text-xs text-gray-400 font-bold">No images in this folder</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2.5">
              {assets.map((asset) => {
                const isSelected = selectedAsset?.url === asset.url;
                return (
                  <div
                    key={asset.url}
                    onClick={() => setSelectedAsset(asset)}
                    className={`group relative aspect-square rounded-xl overflow-hidden bg-[#16161c] border-2 cursor-pointer transition-all duration-200 flex flex-col ${
                      isSelected
                        ? "border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.35)] scale-[1.02]"
                        : "border-white/5 hover:border-white/20"
                    }`}
                  >
                    <div className="relative flex-1 w-full flex items-center justify-center p-1.5 overflow-hidden">
                      <img
                        src={asset.url}
                        alt={asset.name}
                        loading="lazy"
                        className="max-h-full max-w-full object-contain rounded"
                      />
                      {isSelected && (
                        <div className="absolute top-1 right-1 w-5 h-5 rounded-full bg-amber-400 text-black flex items-center justify-center shadow-lg font-bold">
                          <FiCheck size={13} />
                        </div>
                      )}
                    </div>
                    <div className="p-1 bg-[#121216] border-t border-white/5">
                      <p className="text-[9px] font-bold text-gray-300 truncate text-center">
                        {asset.name}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Bottom Confirm Toolbar */}
        <div className="p-3 border-t border-white/10 bg-[#18181f] flex items-center justify-between">
          <div className="flex items-center gap-2 truncate pr-2">
            {selectedAsset ? (
              <>
                <div className="w-8 h-8 rounded-lg bg-black/60 border border-white/10 overflow-hidden flex-shrink-0 flex items-center justify-center p-0.5">
                  <img src={selectedAsset.url} alt="Selected" className="max-h-full max-w-full object-contain" />
                </div>
                <div className="truncate">
                  <p className="text-[11px] font-bold text-white truncate">
                    {selectedAsset.name}
                  </p>
                  <span className="text-[9px] text-amber-400 font-semibold uppercase">
                    {selectedAsset.folder}
                  </span>
                </div>
              </>
            ) : (
              <span className="text-xs text-gray-500 italic">No image selected</span>
            )}
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={onClose}
              className="px-3 py-2 rounded-xl text-xs font-bold text-gray-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={!selectedAsset}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-extrabold shadow-lg shadow-amber-500/20 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
            >
              <FiCheck size={14} />
              <span>Use Image</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
