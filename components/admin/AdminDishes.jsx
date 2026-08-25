"use client";

import React, { useState, useEffect } from "react";
import { 
  FiPlus, 
  FiEdit2, 
  FiTrash2, 
  FiCoffee, 
  FiSearch, 
  FiX, 
  FiCheck,
  FiImage,
  FiTag
} from "react-icons/fi";
import toast from "react-hot-toast";
import { getDishImageUrl, formatPrice } from "@/lib/functions";
import AssetPickerModal from "./AssetPickerModal";

export default function AdminDishes() {
  const [dishes, setDishes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [editingDish, setEditingDish] = useState(null);
  const [formData, setFormData] = useState({ 
    category_id: "", 
    name: "", 
    price: "", 
    compare_price: "", 
    image_url: "", 
    available: true 
  });
  const [saving, setSaving] = useState(false);

  const fetchCategories = async () => {
    try {
      const res = await fetch("/api/admin/categories");
      const data = await res.json();
      if (data.success) {
        setCategories(data.categories || []);
        if (data.categories?.length > 0 && !formData.category_id) {
          setFormData((prev) => ({ ...prev, category_id: data.categories[0].id }));
        }
      }
    } catch {}
  };

  const fetchDishes = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedCategory !== "all") params.set("category_id", selectedCategory);
      if (search.trim()) params.set("search", search.trim());

      const res = await fetch(`/api/admin/dishes?${params.toString()}`);
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Failed to load dishes");
      setDishes(data.dishes || []);
    } catch (err) {
      toast.error(err.message || "Error loading dishes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchDishes();
  }, [selectedCategory]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchDishes();
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const toggleAvailability = async (dish) => {
    const newStatus = !dish.available;
    setDishes((prev) =>
      prev.map((d) => (d.id === dish.id ? { ...d, available: newStatus } : d))
    );

    try {
      const res = await fetch("/api/admin/dishes", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: dish.id, available: newStatus }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Failed to update status");
      toast.success(newStatus ? `${dish.name} in stock` : `${dish.name} out of stock`);
    } catch (err) {
      toast.error(err.message || "Update failed");
      fetchDishes();
    }
  };

  const openAddModal = () => {
    setEditingDish(null);
    setFormData({
      category_id: categories[0]?.id || "",
      name: "",
      price: "",
      compare_price: "",
      image_url: "",
      available: true,
    });
    setModalOpen(true);
  };

  const openEditModal = (dish) => {
    setEditingDish(dish);
    setFormData({
      category_id: dish.category_id,
      name: dish.name,
      price: dish.price,
      compare_price: dish.compare_price || "",
      image_url: dish.image_url || "",
      available: dish.available,
    });
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.category_id || formData.price === "") {
      toast.error("Please fill in required fields");
      return;
    }

    setSaving(true);
    try {
      const url = "/api/admin/dishes";
      const method = editingDish ? "PUT" : "POST";
      const body = editingDish 
        ? { id: editingDish.id, ...formData }
        : formData;

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Save failed");

      toast.success(editingDish ? "Dish updated!" : "Dish added!");
      setModalOpen(false);
      fetchDishes();
    } catch (err) {
      toast.error(err.message || "Operation failed");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete "${name}"?`)) return;
    try {
      const res = await fetch(`/api/admin/dishes?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Delete failed");
      toast.success("Dish deleted");
      fetchDishes();
    } catch (err) {
      toast.error(err.message || "Delete failed");
    }
  };

  const handleSelectAsset = (asset) => {
    setFormData((prev) => ({
      ...prev,
      image_url: asset.url,
    }));
    toast.success(`Selected image: ${asset.name}`);
  };

  return (
    <div className="space-y-4 pb-12">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#111116] border border-white/10 rounded-2xl p-3 sm:p-4">
        <div>
          <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
            <span>Dishes & Menu Items</span>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
              {dishes.length} Items
            </span>
          </h2>
          <p className="text-[11px] text-gray-400">
            Manage food pricing, compare discounts, and linked images
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-extrabold text-xs uppercase tracking-wider shadow-lg shadow-amber-500/20 active:scale-95 transition-all cursor-pointer"
        >
          <FiPlus size={16} />
          <span>Add Dish</span>
        </button>
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar pt-0.5">
        <button
          onClick={() => setSelectedCategory("all")}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer border ${
            selectedCategory === "all"
              ? "bg-amber-500/20 text-amber-400 border-amber-500/50 shadow-md shadow-amber-500/10 scale-[1.02]"
              : "bg-[#141419] text-gray-400 border-white/5 hover:text-white hover:border-white/20"
          }`}
        >
          All Dishes
        </button>
        {categories.map((cat) => {
          const active = String(selectedCategory) === String(cat.id);
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer border ${
                active
                  ? "bg-amber-500/20 text-amber-400 border-amber-500/50 shadow-md shadow-amber-500/10 scale-[1.02]"
                  : "bg-[#141419] text-gray-400 border-white/5 hover:text-white hover:border-white/20"
              }`}
            >
              {cat.name}
            </button>
          );
        })}
      </div>

      {/* Search Input */}
      <div className="bg-[#121216] p-2.5 rounded-xl border border-white/5 flex items-center gap-2">
        <FiSearch className="text-gray-500 ml-2" size={14} />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search dish by name..."
          className="w-full bg-transparent text-xs text-white placeholder-gray-500 outline-none"
        />
      </div>

      {/* Dishes List */}
      {loading ? (
        <div className="space-y-2">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-16 bg-[#131318] rounded-xl animate-pulse border border-white/5" />
          ))}
        </div>
      ) : dishes.length === 0 ? (
        <div className="text-center py-12 bg-[#111116] border border-dashed border-white/10 rounded-2xl p-6">
          <FiCoffee size={36} className="text-gray-600 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-gray-300">No dishes found</h3>
          <button
            onClick={openAddModal}
            className="mt-3 px-3 py-1.5 rounded-lg bg-white/10 text-xs font-bold text-white hover:bg-white/20"
          >
            Add New Dish
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {dishes.map((dish) => {
            const { dishImgUrl, fallbackImgUrl } = getDishImageUrl(dish.name, dish.category_img || "all");
            const finalImg = dish.image_url || dishImgUrl;
            
            const hasDiscount = dish.compare_price && parseFloat(dish.compare_price) > parseFloat(dish.price);
            const discountPct = hasDiscount 
              ? Math.round(((parseFloat(dish.compare_price) - parseFloat(dish.price)) / parseFloat(dish.compare_price)) * 100)
              : null;

            return (
              <div
                key={dish.id}
                className={`flex items-center justify-between p-2.5 sm:p-3 rounded-xl bg-[#131318] border transition-all ${
                  dish.available 
                    ? "border-white/5 hover:border-amber-500/30" 
                    : "border-red-500/20 opacity-75 bg-[#171113]"
                }`}
              >
                <div className="flex items-center gap-3 min-w-0 pr-2">
                  {/* Thumbnail with % OFF Badge */}
                  <div className="relative w-12 h-12 rounded-xl bg-black/60 border border-white/10 flex items-center justify-center overflow-hidden flex-shrink-0">
                    <img
                      src={finalImg}
                      alt={dish.name}
                      onError={(e) => { e.currentTarget.src = fallbackImgUrl; }}
                      className="w-full h-full object-cover"
                    />
                    {hasDiscount && (
                      <div className="absolute inset-x-0 bottom-0 bg-red-600/90 py-0.5 text-center text-[7px] font-black uppercase text-white tracking-tighter leading-none">
                        {discountPct}% OFF
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="truncate">
                    <h4 className="text-xs sm:text-sm font-bold text-white truncate">
                      {dish.name}
                    </h4>
                    <div className="flex items-center gap-2 text-[10px] mt-0.5">
                      <span className="text-green-400 font-extrabold text-xs">
                        {formatPrice(dish.price)}
                      </span>
                      {hasDiscount && (
                        <span className="line-through text-gray-400 text-[10px]">
                          {formatPrice(dish.compare_price)}
                        </span>
                      )}
                      <span className="text-gray-500">•</span>
                      <span className="text-amber-400/90 font-medium truncate">
                        {dish.category_name}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right Controls (Availability Toggle + Edit + Delete) */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  {/* In Stock Toggle Switch */}
                  <button
                    onClick={() => toggleAvailability(dish)}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-extrabold transition-all cursor-pointer ${
                      dish.available
                        ? "bg-green-500/20 text-green-400 border border-green-500/30"
                        : "bg-red-500/20 text-red-400 border border-red-500/30"
                    }`}
                    title="Click to toggle availability"
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${dish.available ? "bg-green-400 animate-pulse" : "bg-red-400"}`} />
                    <span>{dish.available ? "In Stock" : "Out"}</span>
                  </button>

                  <button
                    onClick={() => openEditModal(dish)}
                    className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-colors"
                    title="Edit"
                  >
                    <FiEdit2 size={13} />
                  </button>

                  <button
                    onClick={() => handleDelete(dish.id, dish.name)}
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
                {editingDish ? "Edit Dish" : "Add New Dish"}
              </h3>
              <button onClick={() => setModalOpen(false)} className="text-gray-400 hover:text-white">
                <FiX size={18} />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-3.5">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  Category
                </label>
                <select
                  value={formData.category_id}
                  onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                  className="w-full mt-1 bg-[#101014] border border-white/10 focus:border-amber-500/50 rounded-xl px-3 py-2 text-xs text-white outline-none"
                  required
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  Dish Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Zinger Burger"
                  className="w-full mt-1 bg-[#101014] border border-white/10 focus:border-amber-500/50 rounded-xl px-3 py-2 text-xs text-white outline-none"
                  required
                  autoFocus
                />
              </div>

              {/* Price & Compare Price */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                    Selling Price (₹)
                  </label>
                  <input
                    type="number"
                    step="1"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    placeholder="e.g. 120"
                    className="w-full mt-1 bg-[#101014] border border-white/10 focus:border-amber-500/50 rounded-xl px-3 py-2 text-xs text-white outline-none"
                    required
                    min="0"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                    Compare Price (₹) <span className="text-gray-600 font-normal">Crossed</span>
                  </label>
                  <input
                    type="number"
                    step="1"
                    value={formData.compare_price}
                    onChange={(e) => setFormData({ ...formData, compare_price: e.target.value })}
                    placeholder="e.g. 150"
                    className="w-full mt-1 bg-[#101014] border border-white/10 focus:border-amber-500/50 rounded-xl px-3 py-2 text-xs text-white outline-none"
                    min="0"
                  />
                </div>
              </div>

              {/* Dish Image Asset Picker */}
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  Dish Image (Custom or Preset)
                </label>
                <div className="mt-1 flex items-center gap-3 p-2 rounded-xl bg-[#101014] border border-white/10">
                  <div className="w-12 h-12 rounded-lg bg-black/60 border border-white/10 overflow-hidden flex items-center justify-center flex-shrink-0">
                    <img
                      src={formData.image_url || getDishImageUrl(formData.name || "dish", "all").dishImgUrl}
                      alt="Preview"
                      onError={(e) => { e.currentTarget.src = getDishImageUrl("dish", "all").fallbackImgUrl; }}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-bold text-gray-300 truncate">
                      {formData.image_url ? "Custom Asset Linked" : "Default Naming Pattern"}
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
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="available"
                  checked={formData.available}
                  onChange={(e) => setFormData({ ...formData, available: e.target.checked })}
                  className="w-4 h-4 rounded accent-amber-500 cursor-pointer"
                />
                <label htmlFor="available" className="text-xs text-gray-300 font-medium cursor-pointer">
                  Available in Stock
                </label>
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
                  {saving ? "Saving..." : editingDish ? "Update" : "Add Dish"}
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
        title="Select Dish Image"
      />
    </div>
  );
}
