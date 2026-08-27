"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { 
  FiUploadCloud, 
  FiSearch, 
  FiFolder, 
  FiFolderPlus, 
  FiLink, 
  FiDownload,
  FiCrop, 
  FiTrash2, 
  FiGrid, 
  FiList, 
  FiCheck,
  FiX,
  FiCornerUpRight,
  FiCheckSquare,
  FiSquare
} from "react-icons/fi";
import toast from "react-hot-toast";
import AssetModalViewer from "./AssetModalViewer";
import AssetCropModal from "./AssetCropModal";
import MoveAssetModal from "./MoveAssetModal";

function formatBytes(bytes) {
  if (!bytes || bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export default function AdminAssets() {
  const [assets, setAssets] = useState([]);
  const [folderCounts, setFolderCounts] = useState({ All: 0 });
  const [selectedFolder, setSelectedFolder] = useState("All");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("newest");
  const [viewMode, setViewMode] = useState("grid"); // 'grid' | 'list'
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  // Multi-item selection state
  const [selectedUrls, setSelectedUrls] = useState([]);

  // Modals
  const [viewerAsset, setViewerAsset] = useState(null);
  const [cropAsset, setCropAsset] = useState(null);
  const [moveModalData, setMoveModalData] = useState(null); // { items: [...] }
  const [newFolderModal, setNewFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [customFolders, setCustomFolders] = useState([]);

  // Copied URL toast tracker
  const [copiedUrl, setCopiedUrl] = useState(null);

  const fileInputRef = useRef(null);

  const fetchAssets = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedFolder !== "All") params.set("folder", selectedFolder);
      if (search.trim()) params.set("search", search.trim());
      if (sort) params.set("sort", sort);
      params.set("_t", Date.now().toString());

      const res = await fetch(`/api/admin/assets?${params.toString()}`);
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to load assets");
      }

      setAssets(data.assets || []);
      setFolderCounts(data.folderCounts || { All: 0 });
    } catch (err) {
      toast.error(err.message || "Error loading assets");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssets();
    setSelectedUrls([]); // Clear selection on folder/sort change
  }, [selectedFolder, sort]);

  // Debounced search trigger
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchAssets();
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Lock body scroll while new folder modal is open
  useEffect(() => {
    if (newFolderModal) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [newFolderModal]);

  // Multi-select handlers
  const toggleSelect = (url, e) => {
    if (e) e.stopPropagation();
    setSelectedUrls((prev) => 
      prev.includes(url) ? prev.filter((u) => u !== url) : [...prev, url]
    );
  };

  const selectAll = () => {
    if (selectedUrls.length === assets.length) {
      setSelectedUrls([]);
    } else {
      setSelectedUrls(assets.map((a) => a.url));
    }
  };

  const clearSelection = () => {
    setSelectedUrls([]);
  };

  const getSelectedAssets = () => {
    return assets.filter((a) => selectedUrls.includes(a.url));
  };

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
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Upload failed");
      }

      toast.success(data.message || "Files uploaded successfully!");
      fetchAssets();
    } catch (err) {
      toast.error(err.message || "Upload failed");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDelete = async (url) => {
    try {
      const res = await fetch(`/api/admin/assets?url=${encodeURIComponent(url)}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Delete failed");
      }

      toast.success("Asset deleted");
      setSelectedUrls((prev) => prev.filter((u) => u !== url));
      fetchAssets();
    } catch (err) {
      toast.error(err.message || "Delete failed");
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedUrls.length === 0) return;
    if (!window.confirm(`Are you sure you want to delete ${selectedUrls.length} selected asset(s)?`)) return;

    let deletedCount = 0;
    for (const url of selectedUrls) {
      try {
        await fetch(`/api/admin/assets?url=${encodeURIComponent(url)}`, { method: "DELETE" });
        deletedCount++;
      } catch (e) {
        console.error("Failed to delete", url, e);
      }
    }

    toast.success(`Deleted ${deletedCount} asset(s)`);
    setSelectedUrls([]);
    fetchAssets();
  };

  const copyLink = (url, e) => {
    if (e) e.stopPropagation();
    navigator.clipboard.writeText(url);
    setCopiedUrl(url);
    toast.success("Link copied!");
    setTimeout(() => setCopiedUrl(null), 2000);
  };

  const handleDownload = async (url, filename, e) => {
    if (e) e.stopPropagation();
    try {
      const toastId = toast.loading("Downloading...");
      const res = await fetch(url);
      const blob = await res.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = filename || "image.png";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(blobUrl);
      toast.success("Download started!", { id: toastId });
    } catch {
      window.open(url, "_blank");
    }
  };

  // Combine folders uniquely (case-insensitively)
  const allFolders = useMemo(() => {
    const predefined = ["All", "Categories", "Dishes", "Icons", "Banners", "General"];
    const seen = new Map();

    predefined.forEach((f) => seen.set(f.toLowerCase(), f));

    Object.keys(folderCounts).forEach((f) => {
      if (!seen.has(f.toLowerCase())) {
        const canonical = f.charAt(0).toUpperCase() + f.slice(1);
        seen.set(f.toLowerCase(), canonical);
      }
    });

    customFolders.forEach((f) => {
      if (!seen.has(f.toLowerCase())) {
        const canonical = f.charAt(0).toUpperCase() + f.slice(1);
        seen.set(f.toLowerCase(), canonical);
      }
    });

    return Array.from(seen.values());
  }, [folderCounts, customFolders]);

  const getFolderCount = (folder) => {
    if (folder.toLowerCase() === "all") return folderCounts.All || 0;
    if (folderCounts[folder] !== undefined) return folderCounts[folder];
    const entry = Object.entries(folderCounts).find(
      ([k]) => k.toLowerCase() === folder.toLowerCase()
    );
    return entry ? entry[1] : 0;
  };

  const handleCreateFolder = (e) => {
    e.preventDefault();
    const name = newFolderName.trim();
    if (!name) return;

    // Check case-insensitively if folder already exists
    const existingFolder = allFolders.find(
      (f) => f.toLowerCase() === name.toLowerCase()
    );

    if (existingFolder) {
      toast.error(`Folder '${existingFolder}' already exists!`);
      setSelectedFolder(existingFolder);
      setNewFolderName("");
      setNewFolderModal(false);
      return;
    }

    const formattedName = name.charAt(0).toUpperCase() + name.slice(1);
    setCustomFolders((prev) => [...prev, formattedName]);
    setSelectedFolder(formattedName);
    setNewFolderName("");
    setNewFolderModal(false);
    toast.success(`Folder '${formattedName}' created!`);
  };

  return (
    <div className="space-y-4 pb-24">
      {/* Top Header Actions (Upload & Stats) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#111116] border border-white/10 rounded-2xl p-3 sm:p-4">
        <div>
          <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
            <span>Media & Asset Library</span>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
              {folderCounts.All || 0} files
            </span>
          </h2>
          <p className="text-[11px] text-gray-400">
            Select, move, crop, and organize your images across folders
          </p>
        </div>

        {/* Upload Button */}
        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            className="hidden"
            onChange={(e) => handleUploadFiles(e.target.files)}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-extrabold text-xs uppercase tracking-wider shadow-lg shadow-amber-500/20 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
          >
            {uploading ? (
              <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <FiUploadCloud size={16} />
                <span>Upload Images</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Folders Scroll Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar pt-0.5">
        {allFolders.map((folder) => {
          const count = getFolderCount(folder);
          const active = selectedFolder.toLowerCase() === folder.toLowerCase();
          return (
            <button
              key={folder}
              onClick={() => setSelectedFolder(folder)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer border ${
                active
                  ? "bg-amber-500/20 text-amber-400 border-amber-500/50 shadow-md shadow-amber-500/10 scale-[1.02]"
                  : "bg-[#141419] text-gray-400 border-white/5 hover:text-white hover:border-white/20"
              }`}
            >
              <FiFolder size={13} className={active ? "text-amber-400" : "text-gray-500"} />
              <span>{folder}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                active ? "bg-amber-400 text-black" : "bg-white/10 text-gray-400"
              }`}>
                {count}
              </span>
            </button>
          );
        })}

        <button
          onClick={() => setNewFolderModal(true)}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold text-gray-400 hover:text-white bg-[#141419] border border-dashed border-white/20 hover:border-white/40 whitespace-nowrap transition-colors"
        >
          <FiFolderPlus size={14} className="text-amber-400" />
          <span>New Folder</span>
        </button>
      </div>

      {/* Filter / Search / View Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 bg-[#111116] border border-white/5 rounded-2xl p-2.5">
        {/* Search */}
        <div className="relative flex-1 flex items-center">
          <FiSearch className="absolute left-3 text-gray-400" size={14} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search assets by file or folder name..."
            className="w-full bg-[#17171d] border border-white/5 focus:border-amber-500/50 rounded-xl pl-9 pr-8 py-2 text-xs text-white placeholder-gray-500 outline-none transition-colors"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-2.5 text-gray-400 hover:text-white"
            >
              <FiX size={14} />
            </button>
          )}
        </div>

        {/* Sort & Select All & Layout Toggle */}
        <div className="flex items-center gap-2">
          {assets.length > 0 && (
            <button
              onClick={selectAll}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#17171d] border border-white/10 hover:border-amber-500/40 text-gray-300 hover:text-amber-400 text-xs font-bold transition-colors cursor-pointer"
            >
              {selectedUrls.length === assets.length ? (
                <>
                  <FiCheckSquare size={14} className="text-amber-400" />
                  <span>Deselect All</span>
                </>
              ) : (
                <>
                  <FiSquare size={14} />
                  <span>Select All</span>
                </>
              )}
            </button>
          )}

          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="bg-[#17171d] border border-white/10 text-gray-300 rounded-xl px-3 py-2 text-xs font-semibold outline-none cursor-pointer hover:border-white/20"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="name">Name (A-Z)</option>
            <option value="size_desc">Largest Size</option>
            <option value="size_asc">Smallest Size</option>
          </select>

          {/* View Mode Toggle */}
          <div className="flex items-center bg-[#17171d] border border-white/10 rounded-xl p-0.5">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === "grid" ? "bg-amber-500 text-black font-bold" : "text-gray-400 hover:text-white"
              }`}
              title="Grid View"
            >
              <FiGrid size={14} />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === "list" ? "bg-amber-500 text-black font-bold" : "text-gray-400 hover:text-white"
              }`}
              title="List View"
            >
              <FiList size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Main Assets Grid / List */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3">
          <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-gray-400 font-medium">Loading asset library...</p>
        </div>
      ) : assets.length === 0 ? (
        <div className="py-20 text-center space-y-3 bg-[#111116] border border-white/5 rounded-2xl">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto text-amber-400">
            <FiFolder size={24} />
          </div>
          <h3 className="text-sm font-bold text-white">No images found</h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto">
            {search ? "No assets match your search query." : "Upload your first image to this folder using the upload button above."}
          </p>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-xs font-bold border border-amber-500/30"
          >
            <FiUploadCloud size={14} />
            <span>Upload Image</span>
          </button>
        </div>
      ) : viewMode === "grid" ? (
        /* Grid Cards View */
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {assets.map((asset) => {
            const isCopied = copiedUrl === asset.url;
            const isSelected = selectedUrls.includes(asset.url);

            return (
              <div
                key={asset.url}
                onClick={() => setViewerAsset(asset)}
                className={`group relative bg-[#131318] border rounded-2xl overflow-hidden transition-all duration-200 hover:shadow-xl hover:shadow-black/50 cursor-pointer flex flex-col ${
                  isSelected
                    ? "border-amber-400 ring-2 ring-amber-400/40 bg-[#191922] shadow-lg shadow-amber-500/15"
                    : "border-white/5 hover:border-amber-500/40"
                }`}
              >
                {/* Thumbnail Preview */}
                <div className="relative aspect-square bg-black/40 flex items-center justify-center p-2 overflow-hidden">
                  <img
                    src={`${asset.url}${asset.url.includes('?') ? '&' : '?'}t=${asset.uploadedAt ? new Date(asset.uploadedAt).getTime() : ''}`}
                    alt={asset.name}
                    className="max-h-full max-w-full object-contain rounded-md transition-transform duration-300 group-hover:scale-105"
                  />

                  {/* Top-Left Selection Checkbox (Amber/Yellow Glow Shadow) */}
                  <button
                    type="button"
                    onClick={(e) => toggleSelect(asset.url, e)}
                    className="absolute top-2 left-2 z-10 p-0.5 flex items-center justify-center transition-all cursor-pointer [filter:drop-shadow(0_0_2px_#d97706)_drop-shadow(0_1px_3px_#b45309)_drop-shadow(0_2px_6px_#78350f)] hover:scale-110 active:scale-95"
                    title={isSelected ? "Deselect item" : "Select item"}
                  >
                    {isSelected ? (
                      <div className="w-[17px] h-[17px] rounded-md bg-amber-400 flex items-center justify-center shadow-sm">
                        <FiCheck size={13} className="text-black stroke-[3.5]" />
                      </div>
                    ) : (
                      <FiSquare size={16} className="text-white hover:text-amber-300 stroke-[2.5]" />
                    )}
                  </button>

                  {/* Top-Right Quick Action Icons */}
                  <div className="absolute top-2 right-2 flex items-center gap-1.5">
                    {/* Download Image (Emerald Green Glow Shadow) */}
                    <button
                      type="button"
                      onClick={(e) => handleDownload(asset.url, asset.name, e)}
                      className="p-1 text-white hover:text-emerald-300 hover:scale-110 active:scale-95 transition-all cursor-pointer [filter:drop-shadow(0_0_2px_#10b981)_drop-shadow(0_1px_3px_#059669)_drop-shadow(0_2px_6px_#064e3b)]"
                      title="Download Image"
                    >
                      <FiDownload size={13} className="stroke-[2.5]" />
                    </button>

                    {/* Copy Link (Blue Glow Shadow) */}
                    <button
                      type="button"
                      onClick={(e) => copyLink(asset.url, e)}
                      className="p-1 text-white hover:text-blue-300 hover:scale-110 active:scale-95 transition-all cursor-pointer [filter:drop-shadow(0_0_2px_#3b82f6)_drop-shadow(0_1px_3px_#2563eb)_drop-shadow(0_2px_6px_#1e3a8a)]"
                      title="Copy Blob Link"
                    >
                      {isCopied ? (
                        <FiCheck size={13} className="text-green-400 stroke-[3]" />
                      ) : (
                        <FiLink size={13} className="stroke-[2.5]" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Footer details & Quick actions */}
                <div className="p-2.5 bg-[#17171d] border-t border-white/5 flex flex-col justify-between flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <p className="text-[11px] font-bold text-gray-200 truncate leading-tight group-hover:text-amber-400 transition-colors">
                      {asset.name}
                    </p>
                    <span className="text-[9px] px-1 py-0.2 rounded font-bold uppercase tracking-wider bg-white/5 text-amber-400 flex-shrink-0">
                      {asset.folder}
                    </span>
                  </div>

                  <div className="flex items-center justify-between mt-1.5 text-[10px] text-gray-500">
                    <span>{formatBytes(asset.size)}</span>
                    <div className="flex items-center gap-1">
                      {/* Move single item */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setMoveModalData({ items: [asset] });
                        }}
                        className="p-1.5 rounded-lg bg-white/5 text-gray-300 hover:text-amber-400 hover:bg-white/10 transition-colors"
                        title="Move to folder..."
                      >
                        <FiCornerUpRight size={13} />
                      </button>

                      {/* Crop */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setCropAsset(asset);
                        }}
                        className="p-1.5 rounded-lg bg-white/5 text-gray-300 hover:text-amber-400 hover:bg-white/10 transition-colors"
                        title="Crop Image"
                      >
                        <FiCrop size={13} />
                      </button>

                      {/* Delete */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (window.confirm(`Delete ${asset.name}?`)) {
                            handleDelete(asset.url);
                          }
                        }}
                        className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
                        title="Delete"
                      >
                        <FiTrash2 size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Compact List View */
        <div className="space-y-1.5">
          {assets.map((asset) => {
            const isCopied = copiedUrl === asset.url;
            const isSelected = selectedUrls.includes(asset.url);

            return (
              <div
                key={asset.url}
                onClick={() => setViewerAsset(asset)}
                className={`group flex items-center justify-between p-2.5 rounded-xl bg-[#131318] border transition-all cursor-pointer ${
                  isSelected
                    ? "border-amber-400 ring-2 ring-amber-400/40 bg-[#191922]"
                    : "border-white/5 hover:border-amber-500/40"
                }`}
              >
                <div className="flex items-center gap-3 min-w-0 pr-2">
                  {/* Selection Checkbox */}
                  <div
                    onClick={(e) => toggleSelect(asset.url, e)}
                    className={`w-5 h-5 rounded-md flex items-center justify-center transition-all cursor-pointer flex-shrink-0 ${
                      isSelected
                        ? "bg-amber-500 text-black font-bold"
                        : "bg-white/10 text-gray-400 hover:text-white"
                    }`}
                    title={isSelected ? "Deselect item" : "Select item"}
                  >
                    {isSelected ? <FiCheck size={13} className="stroke-[3]" /> : <FiSquare size={12} />}
                  </div>

                  <div className="w-10 h-10 rounded-lg bg-black/40 flex items-center justify-center p-1 flex-shrink-0 border border-white/5">
                    <img
                      src={`${asset.url}${asset.url.includes('?') ? '&' : '?'}t=${asset.uploadedAt ? new Date(asset.uploadedAt).getTime() : ''}`}
                      alt={asset.name}
                      className="max-h-full max-w-full object-contain rounded"
                    />
                  </div>
                  <div className="truncate">
                    <p className="text-xs font-bold text-gray-200 truncate group-hover:text-amber-400">
                      {asset.name}
                    </p>
                    <div className="flex items-center gap-2 text-[10px] text-gray-500">
                      <span className="text-amber-500 font-semibold">{asset.folder}</span>
                      <span>•</span>
                      <span>{formatBytes(asset.size)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {/* Move File */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setMoveModalData({ items: [asset] });
                    }}
                    className="p-1.5 rounded-lg bg-white/5 hover:bg-amber-500/20 text-gray-300 hover:text-amber-400 text-xs flex items-center gap-1 font-bold"
                    title="Move to Folder..."
                  >
                    <FiCornerUpRight size={13} />
                    <span className="hidden sm:inline">Move</span>
                  </button>

                  {/* Download */}
                  <button
                    onClick={(e) => handleDownload(asset.url, asset.name, e)}
                    className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white text-xs"
                    title="Download"
                  >
                    <FiDownload size={13} />
                  </button>

                  {/* Copy Link */}
                  <button
                    onClick={(e) => copyLink(asset.url, e)}
                    className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white text-xs"
                    title="Copy Link"
                  >
                    {isCopied ? <FiCheck size={13} className="text-green-400" /> : <FiLink size={13} />}
                  </button>

                  {/* Crop */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setCropAsset(asset);
                    }}
                    className="p-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 text-xs"
                    title="Crop"
                  >
                    <FiCrop size={13} />
                  </button>

                  {/* Delete */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (window.confirm(`Delete ${asset.name}?`)) {
                        handleDelete(asset.url);
                      }
                    }}
                    className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs"
                    title="Delete"
                  >
                    <FiTrash2 size={13} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Floating Selection Toolbar (appears when 1 or more items are selected) */}
      {selectedUrls.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-[94%] max-w-xl bg-[#181822]/95 border-2 border-amber-500/80 rounded-2xl shadow-2xl backdrop-blur-xl p-3 flex items-center justify-between gap-3 animate-slideUp">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-amber-500 text-black font-black text-xs">
              {selectedUrls.length}
            </span>
            <span className="text-xs font-bold text-white truncate">
              {selectedUrls.length === 1 ? "1 item selected" : `${selectedUrls.length} items selected`}
            </span>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Move Selected Button */}
            <button
              onClick={() => setMoveModalData({ items: getSelectedAssets() })}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs shadow-lg shadow-amber-500/30 active:scale-95 transition-all cursor-pointer"
            >
              <FiCornerUpRight size={15} />
              <span>Move to Folder...</span>
            </button>

            {/* Delete Selected Button */}
            <button
              onClick={handleDeleteSelected}
              className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition-colors"
              title="Delete Selected"
            >
              <FiTrash2 size={15} />
            </button>

            {/* Clear Selection */}
            <button
              onClick={clearSelection}
              className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
              title="Clear Selection"
            >
              <FiX size={17} />
            </button>
          </div>
        </div>
      )}

      {/* New Folder Modal */}
      {newFolderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-[#141418] border border-white/10 rounded-2xl p-4 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <FiFolderPlus className="text-amber-400" />
                <span>Create New Folder</span>
              </h3>
              <button
                onClick={() => setNewFolderModal(false)}
                className="text-gray-400 hover:text-white"
              >
                <FiX size={18} />
              </button>
            </div>
            <form onSubmit={handleCreateFolder} className="space-y-3">
              <input
                type="text"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="Folder name (e.g., Seasonal, Desserts)"
                className="w-full bg-[#181820] border border-white/10 focus:border-amber-500/50 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-500 outline-none"
                autoFocus
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setNewFolderModal(false)}
                  className="px-3 py-1.5 rounded-lg text-xs text-gray-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Viewer Modal */}
      {viewerAsset && (
        <AssetModalViewer
          asset={viewerAsset}
          onClose={() => setViewerAsset(null)}
          onCrop={(a) => setCropAsset(a)}
          onDelete={(url) => handleDelete(url)}
          onMove={(a) => setMoveModalData({ items: [a] })}
        />
      )}

      {/* Crop Modal */}
      {cropAsset && (
        <AssetCropModal
          asset={cropAsset}
          onClose={() => setCropAsset(null)}
          onCropped={() => fetchAssets()}
        />
      )}

      {/* Move Modal (Single or Multiple Items) */}
      {moveModalData && (
        <MoveAssetModal
          items={moveModalData.items}
          folders={allFolders}
          currentFolder={selectedFolder}
          onClose={() => setMoveModalData(null)}
          onSuccess={(targetFolder) => {
            fetchAssets();
            setSelectedUrls([]);
            if (targetFolder && targetFolder !== selectedFolder) {
              setSelectedFolder(targetFolder);
            }
          }}
        />
      )}
    </div>
  );
}
