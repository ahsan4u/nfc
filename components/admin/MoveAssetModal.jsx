"use client";

import React, { useState } from "react";
import { 
  FiX, 
  FiFolder, 
  FiCornerUpRight, 
  FiCheck, 
  FiFolderPlus 
} from "react-icons/fi";
import toast from "react-hot-toast";

export default function MoveAssetModal({ 
  asset, 
  items = [], // multiple items support
  folders = [], 
  currentFolder = "All",
  onClose, 
  onSuccess 
}) {
  // Consolidate target list
  const assetList = items.length > 0 ? items : (asset ? [asset] : []);

  const [selectedTargetFolder, setSelectedTargetFolder] = useState(() => {
    const available = folders.filter((f) => f.toLowerCase() !== "all" && f.toLowerCase() !== currentFolder.toLowerCase());
    return available[0] || "General";
  });
  const [newFolderName, setNewFolderName] = useState("");
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [loading, setLoading] = useState(false);

  // Lock body scroll while modal is open
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  if (assetList.length === 0) return null;

  const validFolders = folders.filter((f) => f.toLowerCase() !== "all");

  const handleTransfer = async () => {
    const target = isCreatingNew ? newFolderName.trim() : selectedTargetFolder;
    if (!target) {
      toast.error("Please select or enter a target folder name");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/admin/assets/transfer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "move",
          items: assetList.map((a) => ({
            assetUrl: a.url,
            assetName: a.name,
          })),
          targetFolder: target,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to move files");
      }

      toast.success(data.message || `Successfully moved to '${target}'!`);
      if (onSuccess) onSuccess(target);
      onClose();
    } catch (err) {
      toast.error(err.message || "Transfer failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-md bg-[#141418] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-[#19191f]">
          <div className="flex items-center gap-2">
            <FiCornerUpRight className="text-amber-400" size={16} />
            <h3 className="text-xs sm:text-sm font-bold text-white">
              Move {assetList.length === 1 ? "1 Item" : `${assetList.length} Items`} to Folder
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <FiX size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4 overflow-y-auto">
          {/* Files Preview Bar */}
          <div className="p-2.5 rounded-xl bg-[#1a1a22] border border-white/5 space-y-2">
            <div className="flex items-center justify-between text-[11px] text-gray-400">
              <span className="font-bold text-gray-200">
                {assetList.length === 1 ? "Selected File:" : `Selected Files (${assetList.length}):`}
              </span>
              <span className="text-[10px] text-amber-400 font-semibold">
                Moving to new folder
              </span>
            </div>

            <div className="flex items-center gap-2 overflow-x-auto py-1 no-scrollbar">
              {assetList.slice(0, 6).map((item) => (
                <div 
                  key={item.url} 
                  className="w-11 h-11 rounded-lg bg-black/50 p-1 flex-shrink-0 border border-white/10 flex items-center justify-center relative group"
                  title={item.name}
                >
                  <img
                    src={`${item.url}${item.url.includes("?") ? "&" : "?"}t=${item.uploadedAt ? new Date(item.uploadedAt).getTime() : ""}`}
                    alt={item.name}
                    className="max-h-full max-w-full object-contain rounded"
                  />
                </div>
              ))}
              {assetList.length > 6 && (
                <div className="w-11 h-11 rounded-lg bg-[#252530] flex-shrink-0 border border-white/10 flex items-center justify-center text-xs font-bold text-gray-300">
                  +{assetList.length - 6}
                </div>
              )}
            </div>
          </div>

          {/* Folder Selection List */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold uppercase text-gray-400 tracking-wider">
                Select Destination Folder:
              </label>
              <button
                type="button"
                onClick={() => setIsCreatingNew(!isCreatingNew)}
                className="text-[10px] text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1 cursor-pointer"
              >
                {isCreatingNew ? "Choose Existing" : "+ New Folder"}
              </button>
            </div>

            {isCreatingNew ? (
              <div className="space-y-1.5">
                <input
                  type="text"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  placeholder="Enter new folder name (e.g. Specials)"
                  className="w-full bg-[#181820] border border-amber-500/40 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-500 outline-none focus:ring-1 focus:ring-amber-400"
                  autoFocus
                />
                <p className="text-[10px] text-gray-500">
                  A new folder will be created and all selected items will be moved into it.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 max-h-[180px] overflow-y-auto pr-1">
                {validFolders.map((folder) => {
                  const isSelected = selectedTargetFolder.toLowerCase() === folder.toLowerCase();
                  return (
                    <button
                      key={folder}
                      type="button"
                      onClick={() => setSelectedTargetFolder(folder)}
                      className={`flex items-center justify-between p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                        isSelected
                          ? "bg-amber-500/20 text-amber-400 border-amber-500/50 shadow-md shadow-amber-500/10"
                          : "bg-[#16161d] text-gray-300 border-white/5 hover:border-white/20 hover:text-white"
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <FiFolder size={14} className={isSelected ? "text-amber-400" : "text-gray-400"} />
                        <span className="truncate">{folder}</span>
                      </div>
                      {isSelected && <FiCheck size={14} className="text-amber-400 flex-shrink-0" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
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
            onClick={handleTransfer}
            disabled={loading}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs shadow-lg shadow-amber-500/20 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <FiCornerUpRight size={15} />
                <span>
                  Move {assetList.length === 1 ? "Item" : `${assetList.length} Items`} to {isCreatingNew ? (newFolderName || "New Folder") : selectedTargetFolder}
                </span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
