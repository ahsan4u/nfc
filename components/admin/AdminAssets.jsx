"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  FiUploadCloud, 
  FiSearch, 
  FiFolder, 
  FiFolderPlus, 
  FiLink, 
  FiCrop, 
  FiTrash2, 
  FiEye, 
  FiGrid, 
  FiList, 
  FiPlus, 
  FiCheck,
  FiX,
  FiFileText
} from "react-icons/fi";
import toast from "react-hot-toast";
import AssetModalViewer from "./AssetModalViewer";
import AssetCropModal from "./AssetCropModal";

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

  // Modals
  const [viewerAsset, setViewerAsset] = useState(null);
  const [cropAsset, setCropAsset] = useState(null);
  const [newFolderModal, setNewFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [customFolders, setCustomFolders] = useState([]);

  // Copied state tracker
  const [copiedUrl, setCopiedUrl] = useState(null);

  const fileInputRef = useRef(null);

  const fetchAssets = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedFolder !== "All") params.set("folder", selectedFolder);
      if (search.trim()) params.set("search", search.trim());
      if (sort) params.set("sort", sort);

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
  }, [selectedFolder, sort]);

  // Debounced search trigger
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchAssets();
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

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
      fetchAssets();
    } catch (err) {
      toast.error(err.message || "Delete failed");
    }
  };

  const copyLink = (url, e) => {
    if (e) e.stopPropagation();
    navigator.clipboard.writeText(url);
    setCopiedUrl(url);
    toast.success("Link copied!");
    setTimeout(() => setCopiedUrl(null), 2000);
  };

  const handleCreateFolder = (e) => {
    e.preventDefault();
    const name = newFolderName.trim();
    if (!name) return;
    if (!customFolders.includes(name)) {
      setCustomFolders([...customFolders, name]);
    }
    setSelectedFolder(name);
    setNewFolderName("");
    setNewFolderModal(false);
    toast.success(`Folder '${name}' created!`);
  };

  // Combine folders
  const allFolders = Array.from(new Set([
    "All",
    "Categories",
    "Dishes",
    "Icons",
    "Banners",
    "General",
    ...Object.keys(folderCounts),
    ...customFolders,
  ]));

  return (
    <div className="space-y-4 pb-12">
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
            Upload, crop, and organize your images
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
          const count = folderCounts[folder] || 0;
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
          title="Create New Folder"
        >
          <FiFolderPlus size={14} />
          <span>New</span>
        </button>
      </div>

      {/* Controls Bar (Search, Sort, View toggle) */}
      <div className="grid grid-cols-12 gap-2 bg-[#121216] p-2.5 rounded-xl border border-white/5">
        {/* Search */}
        <div className="col-span-7 sm:col-span-6 relative flex items-center">
          <FiSearch className="absolute left-3 text-gray-500 text-xs" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search images..."
            className="w-full bg-[#1a1a20] border border-white/10 focus:border-amber-500/50 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-gray-500 outline-none"
          />
        </div>

        {/* Sort */}
        <div className="col-span-3 sm:col-span-4">
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="w-full bg-[#1a1a20] border border-white/10 rounded-lg px-2 py-1.5 text-xs text-gray-300 outline-none"
          >
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="name">Name (A-Z)</option>
            <option value="size_desc">Size (Large)</option>
            <option value="size_asc">Size (Small)</option>
          </select>
        </div>

        {/* View Toggle */}
        <div className="col-span-2 sm:col-span-2 flex items-center justify-end gap-1">
          <button
            onClick={() => setViewMode("grid")}
            className={`p-1.5 rounded-lg text-xs transition-colors ${
              viewMode === "grid" ? "bg-amber-500/20 text-amber-400" : "text-gray-500 hover:text-white"
            }`}
            title="Grid view"
          >
            <FiGrid size={15} />
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={`p-1.5 rounded-lg text-xs transition-colors ${
              viewMode === "list" ? "bg-amber-500/20 text-amber-400" : "text-gray-500 hover:text-white"
            }`}
            title="List view"
          >
            <FiList size={15} />
          </button>
        </div>
      </div>

      {/* Asset Grid / List View */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5 sm:gap-3.5">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="aspect-square bg-[#141419] rounded-xl animate-pulse border border-white/5" />
          ))}
        </div>
      ) : assets.length === 0 ? (
        <div className="text-center py-16 bg-[#111116] border border-dashed border-white/10 rounded-2xl p-6">
          <FiFolder size={36} className="text-gray-600 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-gray-300">No assets found</h3>
          <p className="text-xs text-gray-500 mt-1">Upload images into this folder to get started</p>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="mt-4 px-3.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-bold text-white transition-colors"
          >
            Upload Now
          </button>
        </div>
      ) : viewMode === "grid" ? (
        /* Compact Grid View for Mobile & Desktop */
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5 sm:gap-3.5">
          {assets.map((asset) => {
            const isCopied = copiedUrl === asset.url;
            return (
              <div
                key={asset.url}
                onClick={() => setViewerAsset(asset)}
                className="group relative bg-[#131318] border border-white/5 hover:border-amber-500/40 rounded-xl overflow-hidden shadow-lg hover:shadow-amber-500/5 transition-all duration-300 cursor-pointer flex flex-col"
              >
                {/* Thumbnail */}
                <div className="relative aspect-square w-full bg-black/40 flex items-center justify-center overflow-hidden p-2">
                  <img
                    src={asset.url}
                    alt={asset.name}
                    loading="lazy"
                    className="max-h-full max-w-full object-contain rounded-md transition-transform duration-300 group-hover:scale-105"
                  />
                  {/* Folder Badge */}
                  <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider bg-black/70 backdrop-blur-sm text-amber-400 border border-white/10">
                    {asset.folder}
                  </span>

                  {/* Top-Right Quick Copy Icon */}
                  <button
                    onClick={(e) => copyLink(asset.url, e)}
                    className="absolute top-1.5 right-1.5 p-1 rounded-md bg-black/70 backdrop-blur-sm text-gray-300 hover:text-white border border-white/10 shadow hover:bg-amber-500 hover:text-black transition-colors"
                    title="Copy Blob Link"
                  >
                    {isCopied ? <FiCheck size={12} className="text-green-400" /> : <FiLink size={12} />}
                  </button>
                </div>

                {/* Footer details & Quick actions */}
                <div className="p-2 bg-[#17171d] border-t border-white/5 flex flex-col justify-between flex-1">
                  <p className="text-[11px] font-bold text-gray-200 truncate leading-tight group-hover:text-amber-400 transition-colors">
                    {asset.name}
                  </p>
                  <div className="flex items-center justify-between mt-1 text-[9px] text-gray-500">
                    <span>{formatBytes(asset.size)}</span>
                    <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setCropAsset(asset);
                        }}
                        className="p-1 rounded text-gray-400 hover:text-amber-400 hover:bg-white/5"
                        title="Crop Image"
                      >
                        <FiCrop size={12} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (window.confirm(`Delete ${asset.name}?`)) {
                            handleDelete(asset.url);
                          }
                        }}
                        className="p-1 rounded text-gray-400 hover:text-red-400 hover:bg-white/5"
                        title="Delete"
                      >
                        <FiTrash2 size={12} />
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
            return (
              <div
                key={asset.url}
                onClick={() => setViewerAsset(asset)}
                className="group flex items-center justify-between p-2 rounded-xl bg-[#131318] border border-white/5 hover:border-amber-500/40 transition-all cursor-pointer"
              >
                <div className="flex items-center gap-2.5 min-w-0 pr-2">
                  <div className="w-10 h-10 rounded-lg bg-black/40 flex items-center justify-center p-1 flex-shrink-0 border border-white/5">
                    <img src={asset.url} alt={asset.name} className="max-h-full max-w-full object-contain rounded" />
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
                  <button
                    onClick={(e) => copyLink(asset.url, e)}
                    className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white text-xs"
                    title="Copy Link"
                  >
                    {isCopied ? <FiCheck size={13} className="text-green-400" /> : <FiLink size={13} />}
                  </button>
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

      {/* New Folder Modal */}
      {newFolderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-xs bg-[#17171d] border border-white/10 rounded-2xl p-4 shadow-2xl">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-3">
              Create New Folder
            </h3>
            <form onSubmit={handleCreateFolder} className="space-y-3">
              <input
                type="text"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="e.g. Specials, Drinks..."
                className="w-full bg-[#101014] border border-white/10 focus:border-amber-500/50 rounded-xl px-3 py-2 text-xs text-white outline-none"
                autoFocus
                required
              />
              <div className="flex items-center justify-end gap-2">
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
    </div>
  );
}
