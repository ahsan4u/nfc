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
  FiTag,
  FiLayers,
  FiBox
} from "react-icons/fi";
import toast from "react-hot-toast";
import { getDishImageUrl, formatPrice, parseGrams } from "@/lib/functions";
import AssetPickerModal from "./AssetPickerModal";

const PRICING_TYPES = [
  { 
    id: "count", 
    label: "Count / Per Piece", 
    desc: "Single price (Burgers, Sandwiches, Beverages)",
    icon: FiBox 
  },
  { 
    id: "portion", 
    label: "Portion Sizes", 
    desc: "Quarter / Half / Full with quantity note in ()",
    icon: FiLayers 
  },
  { 
    id: "weight", 
    label: "Weight / Grams", 
    desc: "Plus/Minus stepper with batches (100g, 250g, 500g, 1kg) for Sweets & Bakery",
    icon: FiTag 
  },
  { 
    id: "custom", 
    label: "Custom Variants", 
    desc: "Custom size/portion options",
    icon: FiPlus 
  },
];

const INITIAL_FORM_DATA = {
  category_id: "",
  name: "",
  price: "",
  compare_price: "",
  image_url: "",
  available: true,
  pricing_type: "count",
  portion_variants: {
    quarter: { enabled: true, price: "", compare_price: "", note: "2 pcs / 250ml" },
    half: { enabled: true, price: "", compare_price: "", note: "4 pcs / 500ml" },
    full: { enabled: true, price: "", compare_price: "", note: "8 pcs / 1000ml" },
  },
  weight_batches: [
    { id: "wb_1", name: "250g", price: "", compare_price: "", note: "Approx 6-8 pcs" },
    { id: "wb_2", name: "500g", price: "", compare_price: "", note: "Approx 12-16 pcs" },
    { id: "wb_3", name: "1000g", price: "", compare_price: "", note: "1 Kg Pack" },
  ],
  custom_variants: [
    { id: "v1", name: "Regular", note: "", price: "", compare_price: "" },
    { id: "v2", name: "Large", note: "", price: "", compare_price: "" },
  ],
};

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
  const [formData, setFormData] = useState(INITIAL_FORM_DATA);
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

  // Lock body scroll while modal is open
  useEffect(() => {
    if (modalOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [modalOpen]);

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
      if (!res.ok || !data.success) throw new Error(data.message || "Update failed");
      toast.success(`${dish.name} marked ${newStatus ? "in stock" : "out of stock"}`);
    } catch (err) {
      toast.error(err.message || "Could not update availability");
      fetchDishes();
    }
  };

  const openAddModal = () => {
    setEditingDish(null);
    setFormData({
      ...INITIAL_FORM_DATA,
      category_id: categories[0]?.id || "",
    });
    setModalOpen(true);
  };

  const openEditModal = (dish) => {
    setEditingDish(dish);
    const pType = dish.pricing_type || "count";

    let portionVars = { ...INITIAL_FORM_DATA.portion_variants };
    let weightBatches = [...INITIAL_FORM_DATA.weight_batches];
    let customVars = [...INITIAL_FORM_DATA.custom_variants];

    let parsedVariants = [];
    try {
      if (dish.variants_json) {
        parsedVariants = typeof dish.variants_json === "string" ? JSON.parse(dish.variants_json) : dish.variants_json;
      }
    } catch {}

    if (pType === "portion" && Array.isArray(parsedVariants)) {
      const q = parsedVariants.find((v) => v.id === "quarter");
      const h = parsedVariants.find((v) => v.id === "half");
      const f = parsedVariants.find((v) => v.id === "full");
      portionVars = {
        quarter: q ? { enabled: true, price: q.price || "", compare_price: q.compare_price || "", note: q.note || "" } : { enabled: false, price: "", compare_price: "", note: "" },
        half: h ? { enabled: true, price: h.price || "", compare_price: h.compare_price || "", note: h.note || "" } : { enabled: false, price: "", compare_price: "", note: "" },
        full: f ? { enabled: true, price: f.price || "", compare_price: f.compare_price || "", note: f.note || "" } : { enabled: false, price: "", compare_price: "", note: "" },
      };
    } else if (pType === "weight") {
      if (Array.isArray(parsedVariants) && parsedVariants.length > 0) {
        weightBatches = parsedVariants.map((v, i) => ({
          id: v.id || `wb_${i}`,
          name: v.name || v.label || (v.step_grams ? `${v.step_grams}g` : "250g"),
          price: String(v.price ?? ""),
          compare_price: String(v.compare_price ?? ""),
          note: v.note || "",
        }));
      } else if (parsedVariants && typeof parsedVariants === "object" && !Array.isArray(parsedVariants)) {
        weightBatches = [{
          id: "wb_0",
          name: parsedVariants.unit_label || (parsedVariants.step_grams ? `${parsedVariants.step_grams}g` : "250g"),
          price: String(parsedVariants.price || dish.price || ""),
          compare_price: String(parsedVariants.compare_price || dish.compare_price || ""),
          note: parsedVariants.note || "",
        }];
      } else {
        weightBatches = [{
          id: "wb_0",
          name: "250g",
          price: String(dish.price || ""),
          compare_price: String(dish.compare_price || ""),
          note: "",
        }];
      }
    } else if (pType === "custom" && Array.isArray(parsedVariants)) {
      customVars = parsedVariants.map((v, i) => ({
        id: v.id || `v_${i}`,
        name: v.name,
        note: v.note || "",
        price: v.price || "",
        compare_price: v.compare_price || "",
      }));
    }

    setFormData({
      category_id: dish.category_id,
      name: dish.name,
      price: dish.price,
      compare_price: dish.compare_price || "",
      image_url: dish.image_url || "",
      available: dish.available,
      pricing_type: pType,
      portion_variants: portionVars,
      weight_batches: weightBatches,
      custom_variants: customVars,
    });
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.category_id) {
      toast.error("Please enter a dish name and category");
      return;
    }

    let calculatedBasePrice = parseFloat(formData.price) || 0;
    let variantsToSave = [];

    if (formData.pricing_type === "portion") {
      const { quarter, half, full } = formData.portion_variants;
      if (!quarter.enabled && !half.enabled && !full.enabled) {
        toast.error("Please enable at least one portion size (Quarter, Half, or Full)");
        return;
      }

      if (quarter.enabled && quarter.price) {
        variantsToSave.push({
          id: "quarter",
          name: "Quarter",
          label: "Quarter",
          note: quarter.note.trim(),
          price: parseFloat(quarter.price),
          compare_price: quarter.compare_price ? parseFloat(quarter.compare_price) : null,
        });
      }
      if (half.enabled && half.price) {
        variantsToSave.push({
          id: "half",
          name: "Half",
          label: "Half",
          note: half.note.trim(),
          price: parseFloat(half.price),
          compare_price: half.compare_price ? parseFloat(half.compare_price) : null,
        });
      }
      if (full.enabled && full.price) {
        variantsToSave.push({
          id: "full",
          name: "Full",
          label: "Full",
          note: full.note.trim(),
          price: parseFloat(full.price),
          compare_price: full.compare_price ? parseFloat(full.compare_price) : null,
        });
      }

      if (variantsToSave.length === 0) {
        toast.error("Please enter prices for the enabled portions");
        return;
      }
      calculatedBasePrice = Math.min(...variantsToSave.map((v) => v.price));
    } else if (formData.pricing_type === "weight") {
      const validBatches = formData.weight_batches.filter((b) => b.name && b.price !== "");
      if (validBatches.length === 0) {
        toast.error("Please add at least one weight batch with a price (e.g. 250g, 500g, 1000g)");
        return;
      }

      // Sort batches by numeric grams
      const sortedBatches = [...validBatches].sort((a, b) => (parseGrams(a.name) || 0) - (parseGrams(b.name) || 0));

      variantsToSave = sortedBatches.map((b, i) => {
        const grams = parseGrams(b.name) || 250;
        return {
          id: b.id || `wb_${i}`,
          name: b.name.trim(),
          label: b.name.trim(),
          step_grams: grams,
          unit_label: b.name.trim(),
          price: parseFloat(b.price),
          compare_price: b.compare_price ? parseFloat(b.compare_price) : null,
          note: b.note ? b.note.trim() : "",
        };
      });

      calculatedBasePrice = variantsToSave[0].price;
    } else if (formData.pricing_type === "custom") {
      const validCustom = formData.custom_variants.filter((c) => c.name && c.price);
      if (validCustom.length === 0) {
        toast.error("Please add at least one variant with name and price");
        return;
      }
      variantsToSave = validCustom.map((c, i) => ({
        id: c.id || `v_${i}`,
        name: c.name,
        note: c.note?.trim() || "",
        price: parseFloat(c.price),
        compare_price: c.compare_price ? parseFloat(c.compare_price) : null,
      }));
      calculatedBasePrice = Math.min(...variantsToSave.map((v) => v.price));
    } else {
      // Standard count
      if (formData.price === "" || isNaN(parseFloat(formData.price))) {
        toast.error("Please enter a selling price");
        return;
      }
      calculatedBasePrice = parseFloat(formData.price);
    }

    setSaving(true);
    try {
      const url = "/api/admin/dishes";
      const method = editingDish ? "PUT" : "POST";
      const payload = {
        category_id: formData.category_id,
        name: formData.name.trim(),
        price: calculatedBasePrice,
        compare_price: formData.compare_price ? parseFloat(formData.compare_price) : null,
        image_url: formData.image_url || null,
        available: formData.available,
        pricing_type: formData.pricing_type,
        variants_json: JSON.stringify(variantsToSave),
      };

      if (editingDish) {
        payload.id = editingDish.id;
      }

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
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
      {/* Top Header Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#16161c] border border-white/10 rounded-2xl p-4 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <FiCoffee size={20} />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              Dishes & Menu Management
            </h2>
            <p className="text-xs text-gray-400">
              Manage items, portion sizes (Quarter/Half/Full), weight batch increments (100g, 250g, 500g, 1kg), and prices
            </p>
          </div>
        </div>

        <button
          onClick={openAddModal}
          className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold transition-all shadow-lg shadow-amber-500/20 active:scale-95 cursor-pointer"
        >
          <FiPlus size={16} />
          <span>Add New Dish</span>
        </button>
      </div>

      {/* Filters & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            placeholder="Search dish by name or category..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#16161c] border border-white/10 focus:border-amber-500/50 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-gray-500 outline-none transition-colors"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
            >
              <FiX size={14} />
            </button>
          )}
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          <button
            onClick={() => setSelectedCategory("all")}
            className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
              selectedCategory === "all"
                ? "bg-amber-500 text-black shadow-md shadow-amber-500/20"
                : "bg-[#16161c] text-gray-300 hover:text-white border border-white/10"
            }`}
          >
            All Categories
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(String(cat.id))}
              className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
                selectedCategory === String(cat.id)
                  ? "bg-amber-500 text-black shadow-md shadow-amber-500/20"
                  : "bg-[#16161c] text-gray-300 hover:text-white border border-white/10"
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Dishes Table / List */}
      {loading ? (
        <div className="p-12 text-center text-gray-500 text-xs">
          Loading dishes...
        </div>
      ) : dishes.length === 0 ? (
        <div className="p-12 text-center bg-[#16161c] border border-white/10 rounded-2xl">
          <FiCoffee size={32} className="mx-auto text-gray-600 mb-2" />
          <p className="text-xs font-bold text-gray-400">No dishes found</p>
          <p className="text-[10px] text-gray-500 mt-1">
            Try adjusting your search filter or click &quot;Add New Dish&quot; above
          </p>
        </div>
      ) : (
        <div className="bg-[#16161c] border border-white/10 rounded-2xl overflow-hidden shadow-xl divide-y divide-white/5">
          {dishes.map((dish) => {
            const { dishImgUrl, fallbackImgUrl } = getDishImageUrl(dish.name, dish.category_img || "all");
            const finalImg = dish.image_url || dishImgUrl;

            return (
              <div
                key={dish.id}
                className="flex items-center justify-between p-3 sm:px-4 hover:bg-white/[0.02] transition-colors gap-3"
              >
                {/* Left: Image & Info */}
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="w-11 h-11 rounded-xl bg-black/60 border border-white/10 overflow-hidden flex-shrink-0 relative">
                    <img
                      src={finalImg}
                      alt={dish.name}
                      onError={(e) => { e.currentTarget.src = fallbackImgUrl; }}
                      className="w-full h-full object-cover"
                    />
                    {dish.compare_price && parseFloat(dish.compare_price) > parseFloat(dish.price) && (
                      <div className="absolute inset-x-0 bottom-0 bg-red-600/95 py-0.5 text-center text-[7px] font-black uppercase text-white tracking-tighter leading-none shadow-md">
                        {Math.round(((parseFloat(dish.compare_price) - parseFloat(dish.price)) / parseFloat(dish.compare_price)) * 100)}% OFF
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1 flex flex-col sm:flex-row sm:items-center sm:gap-4">
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-white truncate">{dish.name}</h4>
                      <p className="text-[10px] text-gray-500">
                        {dish.category_name}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 mt-0.5 sm:mt-0">
                      <span className="text-xs font-black text-green-400 font-mono">
                        {formatPrice(dish.price)}
                      </span>
                      {dish.compare_price && parseFloat(dish.compare_price) > parseFloat(dish.price) && (
                        <span className="text-[10px] text-gray-500 line-through font-mono">
                          {formatPrice(dish.compare_price)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Status Toggle & Actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => toggleAvailability(dish)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                      dish.available
                        ? "bg-green-500/15 text-green-400 border border-green-500/30 hover:bg-green-500/25"
                        : "bg-red-500/15 text-red-400 border border-red-500/30 hover:bg-red-500/25"
                    }`}
                  >
                    {dish.available ? "In Stock" : "Out of Stock"}
                  </button>

                  <button
                    onClick={() => openEditModal(dish)}
                    className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-colors cursor-pointer"
                    title="Edit Dish"
                  >
                    <FiEdit2 size={13} />
                  </button>
                  <button
                    onClick={() => handleDelete(dish.id, dish.name)}
                    className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors cursor-pointer"
                    title="Delete Dish"
                  >
                    <FiTrash2 size={13} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Dish Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
          <div className="w-full max-w-lg bg-[#16161c] border border-white/10 rounded-2xl p-5 shadow-2xl my-auto max-h-[92vh] overflow-y-auto no-scrollbar">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-white/10 sticky top-0 bg-[#16161c] z-10">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <FiCoffee className="text-amber-400" />
                <span>{editingDish ? "Edit Dish" : "Add New Dish"}</span>
              </h3>
              <button onClick={() => setModalOpen(false)} className="text-gray-400 hover:text-white p-1 cursor-pointer">
                <FiX size={18} />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Category */}
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                    Category *
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

                {/* Dish Name */}
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                    Dish Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Kaju Katli, Gulab Jamun, Biryani"
                    className="w-full mt-1 bg-[#101014] border border-white/10 focus:border-amber-500/50 rounded-xl px-3 py-2 text-xs text-white outline-none"
                    required
                  />
                </div>
              </div>

              {/* Quantity / Pricing Type Selector */}
              <div className="p-3 rounded-2xl bg-[#101014] border border-white/10 space-y-2.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                  <FiLayers size={13} />
                  <span>Quantity & Pricing Type</span>
                </label>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {PRICING_TYPES.map((t) => {
                    const active = formData.pricing_type === t.id;
                    const Icon = t.icon;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setFormData({ ...formData, pricing_type: t.id })}
                        className={`p-2 rounded-xl text-left border transition-all cursor-pointer flex flex-col justify-between ${
                          active
                            ? "bg-amber-500 text-black border-amber-500 shadow-md shadow-amber-500/20 font-bold"
                            : "bg-white/5 border-white/10 text-gray-300 hover:text-white hover:bg-white/10"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <Icon size={14} className={active ? "text-black" : "text-amber-400"} />
                          {active && <FiCheck size={12} className="stroke-[3]" />}
                        </div>
                        <span className="text-[11px] leading-tight font-bold">{t.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 1. COUNT / SINGLE PIECE PRICING */}
              {formData.pricing_type === "count" && (
                <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                      Selling Price (₹) *
                    </label>
                    <input
                      type="number"
                      step="1"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      placeholder="e.g. 120"
                      className="w-full mt-1 bg-[#101014] border border-white/10 focus:border-amber-500/50 rounded-xl px-3 py-2 text-xs text-white outline-none font-mono"
                      required
                      min="0"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                      Compare Price (₹) <span className="text-gray-500 font-normal">Crossed</span>
                    </label>
                    <input
                      type="number"
                      step="1"
                      value={formData.compare_price}
                      onChange={(e) => setFormData({ ...formData, compare_price: e.target.value })}
                      placeholder="e.g. 150"
                      className="w-full mt-1 bg-[#101014] border border-white/10 focus:border-amber-500/50 rounded-xl px-3 py-2 text-xs text-white outline-none font-mono"
                      min="0"
                    />
                  </div>
                </div>
              )}

              {/* 2. PORTION SIZES: QUARTER, HALF, FULL */}
              {formData.pricing_type === "portion" && (
                <div className="space-y-2.5 p-3 rounded-xl bg-white/[0.02] border border-white/5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
                      Portion Sizes & Quantity Descriptions in ()
                    </span>
                    <span className="text-[10px] text-gray-400">e.g. Quarter (2 pcs / 250ml)</span>
                  </div>

                  {["quarter", "half", "full"].map((portionKey) => {
                    const portion = formData.portion_variants[portionKey];
                    const label = portionKey.charAt(0).toUpperCase() + portionKey.slice(1);

                    return (
                      <div
                        key={portionKey}
                        className={`p-2.5 rounded-xl border transition-all ${
                          portion.enabled
                            ? "bg-[#101014] border-amber-500/30 shadow-sm"
                            : "bg-black/30 border-white/5 opacity-60"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={portion.enabled}
                              onChange={(e) => {
                                setFormData({
                                  ...formData,
                                  portion_variants: {
                                    ...formData.portion_variants,
                                    [portionKey]: { ...portion, enabled: e.target.checked },
                                  },
                                });
                              }}
                              className="w-3.5 h-3.5 rounded accent-amber-500 cursor-pointer"
                            />
                            <span className="text-xs font-bold text-white">{label}</span>
                          </label>
                          <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">
                            {portionKey === "quarter" ? "Smallest" : portionKey === "half" ? "Medium" : "Large"}
                          </span>
                        </div>

                        {portion.enabled && (
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                            <div>
                              <label className="text-[9px] font-bold text-gray-400 uppercase">
                                Quantity in () *
                              </label>
                              <input
                                type="text"
                                value={portion.note}
                                onChange={(e) => {
                                  setFormData({
                                    ...formData,
                                    portion_variants: {
                                      ...formData.portion_variants,
                                      [portionKey]: { ...portion, note: e.target.value },
                                    },
                                  });
                                }}
                                placeholder="e.g. 2 pcs / 250ml"
                                className="w-full mt-0.5 bg-black/50 border border-white/10 focus:border-amber-500/50 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none"
                              />
                            </div>

                            <div>
                              <label className="text-[9px] font-bold text-gray-400 uppercase">
                                Price (₹) *
                              </label>
                              <input
                                type="number"
                                step="1"
                                value={portion.price}
                                onChange={(e) => {
                                  setFormData({
                                    ...formData,
                                    portion_variants: {
                                      ...formData.portion_variants,
                                      [portionKey]: { ...portion, price: e.target.value },
                                    },
                                  });
                                }}
                                placeholder="e.g. 120"
                                className="w-full mt-0.5 bg-black/50 border border-white/10 focus:border-amber-500/50 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono outline-none"
                              />
                            </div>

                            <div>
                              <label className="text-[9px] font-bold text-gray-400 uppercase">
                                Compare (₹)
                              </label>
                              <input
                                type="number"
                                step="1"
                                value={portion.compare_price}
                                onChange={(e) => {
                                  setFormData({
                                    ...formData,
                                    portion_variants: {
                                      ...formData.portion_variants,
                                      [portionKey]: { ...portion, compare_price: e.target.value },
                                    },
                                  });
                                }}
                                placeholder="e.g. 140"
                                className="w-full mt-0.5 bg-black/50 border border-white/10 focus:border-amber-500/50 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono outline-none"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* 3. WEIGHT IN GRAMS & KG (Configurable Weight Batches) */}
              {formData.pricing_type === "weight" && (
                <div className="space-y-3 p-3 rounded-xl bg-white/[0.02] border border-white/5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
                      Weight Batches & Prices (Steps through with Plus / Minus)
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setFormData({
                          ...formData,
                          weight_batches: [
                            ...formData.weight_batches,
                            { id: `wb_${Date.now()}`, name: "1000g", price: "", compare_price: "", note: "" },
                          ],
                        });
                      }}
                      className="text-[10px] font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 cursor-pointer"
                    >
                      <FiPlus size={11} />
                      <span>Add Batch</span>
                    </button>
                  </div>

                  <div className="space-y-2">
                    {formData.weight_batches.map((batch, idx) => (
                      <div key={batch.id || idx} className="p-2.5 rounded-xl bg-[#101014] border border-white/10">
                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 items-center">
                          <div>
                            <label className="text-[9px] font-bold text-gray-400 uppercase">
                              Weight (g/kg) *
                            </label>
                            <input
                              type="text"
                              value={batch.name}
                              onChange={(e) => {
                                const updated = [...formData.weight_batches];
                                updated[idx].name = e.target.value;
                                setFormData({ ...formData, weight_batches: updated });
                              }}
                              placeholder="e.g. 100g, 250g, 500g, 1000g"
                              className="w-full mt-0.5 bg-black/50 border border-white/10 focus:border-amber-500/50 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none"
                              required
                            />
                          </div>

                          <div>
                            <label className="text-[9px] font-bold text-gray-400 uppercase">
                              Price (₹) *
                            </label>
                            <input
                              type="number"
                              step="1"
                              value={batch.price}
                              onChange={(e) => {
                                const updated = [...formData.weight_batches];
                                updated[idx].price = e.target.value;
                                setFormData({ ...formData, weight_batches: updated });
                              }}
                              placeholder="e.g. 120"
                              className="w-full mt-0.5 bg-black/50 border border-white/10 focus:border-amber-500/50 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono outline-none"
                              required
                            />
                          </div>

                          <div>
                            <label className="text-[9px] font-bold text-gray-400 uppercase">
                              Compare (₹)
                            </label>
                            <input
                              type="number"
                              step="1"
                              value={batch.compare_price}
                              onChange={(e) => {
                                const updated = [...formData.weight_batches];
                                updated[idx].compare_price = e.target.value;
                                setFormData({ ...formData, weight_batches: updated });
                              }}
                              placeholder="e.g. 150"
                              className="w-full mt-0.5 bg-black/50 border border-white/10 focus:border-amber-500/50 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono outline-none"
                            />
                          </div>

                          <div className="flex items-center gap-1.5">
                            <div className="flex-1">
                              <label className="text-[9px] font-bold text-gray-400 uppercase">
                                Note in ()
                              </label>
                              <input
                                type="text"
                                value={batch.note}
                                onChange={(e) => {
                                  const updated = [...formData.weight_batches];
                                  updated[idx].note = e.target.value;
                                  setFormData({ ...formData, weight_batches: updated });
                                }}
                                placeholder="e.g. 6-8 pcs"
                                className="w-full mt-0.5 bg-black/50 border border-white/10 focus:border-amber-500/50 rounded-lg px-2 py-1.5 text-xs text-white outline-none"
                              />
                            </div>
                            {formData.weight_batches.length > 1 && (
                              <button
                                type="button"
                                onClick={() => {
                                  setFormData({
                                    ...formData,
                                    weight_batches: formData.weight_batches.filter((_, i) => i !== idx),
                                  });
                                }}
                                className="p-1.5 mt-3.5 rounded bg-red-500/10 text-red-400 hover:bg-red-500/20 cursor-pointer"
                                title="Remove batch"
                              >
                                <FiTrash2 size={12} />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <p className="text-[10px] text-gray-400">
                    On the menu card, customer will see the lowest batch price and can click <strong className="text-amber-400">[+]</strong> and <strong className="text-amber-400">[-]</strong> to step through these exact batches.
                  </p>
                </div>
              )}

              {/* 4. CUSTOM VARIANTS */}
              {formData.pricing_type === "custom" && (
                <div className="space-y-2.5 p-3 rounded-xl bg-white/[0.02] border border-white/5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
                      Custom Size / Quantity Variants
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setFormData({
                          ...formData,
                          custom_variants: [
                            ...formData.custom_variants,
                            { id: `cv_${Date.now()}`, name: "", note: "", price: "", compare_price: "" },
                          ],
                        });
                      }}
                      className="text-[10px] font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 cursor-pointer"
                    >
                      <FiPlus size={11} />
                      <span>Add Variant</span>
                    </button>
                  </div>

                  {formData.custom_variants.map((v, idx) => (
                    <div key={idx} className="p-2.5 rounded-xl bg-[#101014] border border-white/10">
                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 items-center">
                        <div>
                          <label className="text-[9px] font-bold text-gray-400 uppercase">Variant Name *</label>
                          <input
                            type="text"
                            value={v.name}
                            onChange={(e) => {
                              const updated = [...formData.custom_variants];
                              updated[idx].name = e.target.value;
                              setFormData({ ...formData, custom_variants: updated });
                            }}
                            placeholder="e.g. Single / Double"
                            className="w-full mt-0.5 bg-black/50 border border-white/10 focus:border-amber-500/50 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none"
                          />
                        </div>

                        <div>
                          <label className="text-[9px] font-bold text-gray-400 uppercase">Note in ()</label>
                          <input
                            type="text"
                            value={v.note}
                            onChange={(e) => {
                              const updated = [...formData.custom_variants];
                              updated[idx].note = e.target.value;
                              setFormData({ ...formData, custom_variants: updated });
                            }}
                            placeholder="e.g. Serves 1-2"
                            className="w-full mt-0.5 bg-black/50 border border-white/10 focus:border-amber-500/50 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none"
                          />
                        </div>

                        <div>
                          <label className="text-[9px] font-bold text-gray-400 uppercase">Price (₹) *</label>
                          <input
                            type="number"
                            step="1"
                            value={v.price}
                            onChange={(e) => {
                              const updated = [...formData.custom_variants];
                              updated[idx].price = e.target.value;
                              setFormData({ ...formData, custom_variants: updated });
                            }}
                            placeholder="e.g. 199"
                            className="w-full mt-0.5 bg-black/50 border border-white/10 focus:border-amber-500/50 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono outline-none"
                          />
                        </div>

                        <div className="flex items-center gap-1.5">
                          <div className="flex-1">
                            <label className="text-[9px] font-bold text-gray-400 uppercase">Compare (₹)</label>
                            <input
                              type="number"
                              step="1"
                              value={v.compare_price}
                              onChange={(e) => {
                                const updated = [...formData.custom_variants];
                                updated[idx].compare_price = e.target.value;
                                setFormData({ ...formData, custom_variants: updated });
                              }}
                              placeholder="e.g. 240"
                              className="w-full mt-0.5 bg-black/50 border border-white/10 focus:border-amber-500/50 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono outline-none"
                            />
                          </div>
                          {formData.custom_variants.length > 1 && (
                            <button
                              type="button"
                              onClick={() => {
                                setFormData({
                                  ...formData,
                                  custom_variants: formData.custom_variants.filter((_, i) => i !== idx),
                                });
                              }}
                              className="p-1.5 mt-4 rounded bg-red-500/10 text-red-400 hover:bg-red-500/20 cursor-pointer"
                            >
                              <FiTrash2 size={12} />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

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
                      className="mt-1 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 text-[10px] font-bold border border-amber-500/30 transition-colors cursor-pointer"
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

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-gray-400 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-extrabold shadow-lg shadow-amber-500/20 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                >
                  {saving ? "Saving..." : editingDish ? "Update Dish" : "Add Dish"}
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
