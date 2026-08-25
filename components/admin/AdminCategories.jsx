"use client";

import React, { useState, useEffect } from "react";
import { 
  FiPlus, 
  FiEdit2, 
  FiTrash2, 
  FiLayers, 
  FiSearch, 
  FiX, 
  FiCheck,
  FiImage
} from "react-icons/fi";
import toast from "react-hot-toast";
import { getBlobUrl } from "@/lib/functions";
import AssetPickerModal from "./AssetPickerModal";

const PRESET_IMAGE_KEYS = [
  "street_bites_chaat",
  "parathas",
  "burgers",
  "sandwiches",
  "pizzas",
  "rolls_shawarma",
  "momos",
  "chinese_quick_bites",
  "mojitos_coolers",
  "shakes_special_drinks",
  "tea_hot_beverages",
  "ice_gola",
  "bbq_grills",
  "bakery_delights",
  "indian_sweets",
  "mandi",
  "all"
];

export default function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState({ name: "", img: "street_bites_chaat", display_order: 1 });
  const [saving, setSaving] = useState(false);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/categories");
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Failed to load categories");
      setCategories(data.categories || []);
    } catch (err) {
      toast.error(err.message || "Error loading categories");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const openAddModal = () => {
    setEditingCategory(null);
    setFormData({
      name: "",
      img: "street_bites_chaat",
      display_order: categories.length + 1,
    });
    setModalOpen(true);
  };

  const openEditModal = (cat) => {
    setEditingCategory(cat);
    setFormData({
      name: cat.name,
      img: cat.img,
      display_order: cat.display_order,
    });
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.img.trim()) {
      toast.error("Please provide both name and image identifier");
      return;
    }

    setSaving(true);
    try {
      const url = "/api/admin/categories";
      const method = editingCategory ? "PUT" : "POST";
      const body = editingCategory 
        ? { id: editingCategory.id, ...formData }
        : formData;

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Save failed");

      toast.success(editingCategory ? "Category updated!" : "Category created!");
      setModalOpen(false);
      fetchCategories();
    } catch (err) {
      toast.error(err.message || "Operation failed");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete category "${name}" and all its dishes?`)) return;
    try {
      const res = await fetch(`/api/admin/categories?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Delete failed");
      toast.success("Category deleted");
      fetchCategories();
    } catch (err) {
      toast.error(err.message || "Delete failed");
    }
  };

  const handleSelectAsset = (asset) => {
    // Extract base key without extension or use url
    const cleanKey = asset.name.replace(/\.[^/.]+$/, '').toLowerCase().replace(/[^a-z0-9_-]+/g, '_');
    setFormData((prev) => ({
      ...prev,
      img: cleanKey || asset.name,
    }));
    toast.success(`Selected image: ${asset.name}`);
  };

  const filtered = categories.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    c.img.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4 pb-12">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#111116] border border-white/10 rounded-2xl p-3 sm:p-4">
        <div>
          <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
            <span>Menu Categories</span>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
              {categories.length} Total
            </span>
          </h2>
          <p className="text-[11px] text-gray-400">
            Create and organize menu tabs and their display sequence
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-extrabold text-xs uppercase tracking-wider shadow-lg shadow-amber-500/20 active:scale-95 transition-all cursor-pointer"
        >
          <FiPlus size={16} />
          <span>Add Category</span>
        </button>
      </div>

      {/* Search Filter */}
      <div className="bg-[#121216] p-2.5 rounded-xl border border-white/5 flex items-center gap-2">
        <FiSearch className="text-gray-500 ml-2" size={14} />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filter categories..."
          className="w-full bg-transparent text-xs text-white placeholder-gray-500 outline-none"
        />
      </div>

      {/* Categories List */}
      {loading ? (
        <div className="space-y-2">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-16 bg-[#131318] rounded-xl animate-pulse border border-white/5" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 bg-[#111116] border border-dashed border-white/10 rounded-2xl p-6">
          <FiLayers size={36} className="text-gray-600 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-gray-300">No categories found</h3>
          <button
            onClick={openAddModal}
            className="mt-3 px-3 py-1.5 rounded-lg bg-white/10 text-xs font-bold text-white hover:bg-white/20"
          >
            Create Category
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((cat) => {
            const imgUrl = getBlobUrl(`/images/categories/${cat.img}.png`);
            return (
              <div
                key={cat.id}
                className="flex items-center justify-between p-3 rounded-xl bg-[#131318] border border-white/5 hover:border-amber-500/30 transition-all"
              >
                <div className="flex items-center gap-3 min-w-0 pr-2">
                  {/* Category Thumbnail */}
                  <div className="w-12 h-12 rounded-xl bg-black/60 border border-white/10 flex items-center justify-center overflow-hidden flex-shrink-0">
                    <img
                      src={imgUrl}
                      alt={cat.name}
                      onError={(e) => { e.currentTarget.src = getBlobUrl('/images/categories/all.png'); }}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Info */}
                  <div className="truncate">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
                        #{cat.display_order}
                      </span>
                      <h4 className="text-xs sm:text-sm font-bold text-white truncate">
                        {cat.name}
                      </h4>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-gray-400 mt-0.5">
                      <span className="text-gray-500">Key: {cat.img}</span>
                      <span>•</span>
                      <span className="text-green-400 font-semibold">{cat.product_count || 0} dishes</span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() => openEditModal(cat)}
                    className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-colors"
                    title="Edit"
                  >
                    <FiEdit2 size={13} />
                  </button>
                  <button
                    onClick={() => handleDelete(cat.id, cat.name)}
                    className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 transition-colors"
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

      {/* Add / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-[#16161c] border border-white/10 rounded-2xl p-5 shadow-2xl">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-white/10">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                {editingCategory ? "Edit Category" : "Add New Category"}
              </h3>
              <button onClick={() => setModalOpen(false)} className="text-gray-400 hover:text-white">
                <FiX size={18} />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-3.5">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  Category Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Traditional Sweets"
                  className="w-full mt-1 bg-[#101014] border border-white/10 focus:border-amber-500/50 rounded-xl px-3 py-2 text-xs text-white outline-none"
                  required
                  autoFocus
                />
              </div>

              {/* Image Selection with Asset Picker */}
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  Category Image
                </label>
                
                <div className="mt-1.5 flex items-center gap-3 p-2 rounded-xl bg-[#101014] border border-white/10">
                  <div className="w-12 h-12 rounded-lg bg-black/60 border border-white/10 overflow-hidden flex items-center justify-center flex-shrink-0">
                    <img
                      src={getBlobUrl(`/images/categories/${formData.img}.png`)}
                      alt="Preview"
                      onError={(e) => { e.currentTarget.src = getBlobUrl('/images/categories/all.png'); }}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-bold text-gray-300 truncate">
                      {formData.img || "none"}
                    </p>
                    <button
                      type="button"
                      onClick={() => setPickerOpen(true)}
                      className="mt-1 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 text-[10px] font-bold border border-amber-500/30 transition-colors"
                    >
                      <FiImage size={12} />
                      <span>Choose from Assets</span>
                    </button>
                  </div>
                </div>

                {/* Quick Presets Pills */}
                <div className="flex items-center gap-1 overflow-x-auto mt-2 pb-1 no-scrollbar">
                  {PRESET_IMAGE_KEYS.slice(0, 8).map((key) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setFormData({ ...formData, img: key })}
                      className={`text-[9px] px-2 py-0.5 rounded-md whitespace-nowrap transition-colors ${
                        formData.img === key 
                          ? "bg-amber-500 text-black font-bold" 
                          : "bg-white/5 text-gray-400 hover:text-white"
                      }`}
                    >
                      {key}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  Display Order
                </label>
                <input
                  type="number"
                  value={formData.display_order}
                  onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
                  className="w-full mt-1 bg-[#101014] border border-white/10 focus:border-amber-500/50 rounded-xl px-3 py-2 text-xs text-white outline-none"
                  min="0"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-3 py-2 rounded-xl text-xs font-bold text-gray-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-extrabold shadow-lg shadow-amber-500/20 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                >
                  {saving ? "Saving..." : editingCategory ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Asset Picker Modal */}
      <AssetPickerModal
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={handleSelectAsset}
        title="Select Category Image"
      />
    </div>
  );
}
