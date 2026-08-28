"use client";

import React, { useState, useEffect } from "react";
import { 
  FiSave, 
  FiGlobe, 
  FiUser, 
  FiPhone, 
  FiImage, 
  FiCheck, 
  FiLayout, 
  FiLayers,
  FiSearch,
  FiEye,
  FiKey,
  FiMail,
  FiLock,
  FiServer,
  FiMapPin,
  FiPlus,
  FiTrash2,
  FiEdit2,
  FiDollarSign,
  FiCheckCircle,
  FiClock,
  FiAlertCircle
} from "react-icons/fi";
import toast from "react-hot-toast";
import { getBlobUrl } from "@/lib/functions";
import AssetPickerModal from "./AssetPickerModal";
// import StoreRadiusMap from "./StoreRadiusMap";

const TAB_FIELDS = {
  branding: ["site_title", "tagline", "logo_image"],
  hero: [
    "hero_banner_image",
    "hero_dish_image",
    "hero_title",
    "hero_desc",
    "hero_button_text",
    "coming_soon_image",
  ],
  founder: [
    "founder_image",
    "founder_badge",
    "founder_name",
    "founder_quote",
    "founder_role",
  ],
  footer: [
    "footer_logo_image",
    "legacy_year",
    "footer_follow_title",
    "footer_copyright",
    "whatsapp_number",
    "instagram_url",
    "threads_url",
    "youtube_url",
    "facebook_url",
  ],
  seo: [
    "meta_title",
    "meta_description",
    "meta_keywords",
    "favicon_image",
    "og_image",
    "google_site_verification",
    "canonical_url",
  ],
  email: [
    "smtp_host",
    "smtp_port",
    "smtp_user",
    "smtp_pass",
    "smtp_from_email",
    "admin_notification_email",
  ],
  radius: [
    "delivery_locations_json",
    "store_address",
    "serviceability_check_enabled",
  ],
};

export default function AdminConfig() {
  const [config, setConfig] = useState({});

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("branding");
  const [showPassword, setShowPassword] = useState(false);

  // Delivery Location Management State
  const [showLocationForm, setShowLocationForm] = useState(false);
  const [editingLocationIndex, setEditingLocationIndex] = useState(null);
  const [locationForm, setLocationForm] = useState({
    name: "",
    charge: "0",
    time: "25-35 mins"
  });

  // Email Test State
  const [testingEmail, setTestingEmail] = useState(false);

  // Asset Picker State
  const [pickerField, setPickerField] = useState(null);

  const handleSendTestEmail = async () => {
    setTestingEmail(true);
    const toastId = toast.loading("Sending test email using saved SMTP credentials...");
    try {
      // First save current tab fields so credentials in DB are up to date
      await fetch("/api/admin/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          smtp_host: config.smtp_host,
          smtp_port: config.smtp_port,
          smtp_user: config.smtp_user,
          smtp_pass: config.smtp_pass,
          smtp_from_email: config.smtp_from_email,
          admin_notification_email: config.admin_notification_email,
        }),
      });

      const res = await fetch("/api/admin/test-email", { method: "POST" });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Test email failed");
      }
      toast.success(data.message || "Test email sent successfully!", { id: toastId });
    } catch (err) {
      toast.error(err.message || "Failed to send test email", { id: toastId });
    } finally {
      setTestingEmail(false);
    }
  };

  const fetchConfig = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/config");
      const data = await res.json();
      if (data.success && data.config) {
        setConfig((prev) => ({ ...prev, ...data.config }));
      }
    } catch {
      toast.error("Failed to load configuration");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  const handleChange = (key, value) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
  };

  const handleSelectAsset = (asset) => {
    if (pickerField) {
      handleChange(pickerField, asset.url);
      toast.success(`Selected image for ${pickerField.replace(/_/g, ' ')}`);
      setPickerField(null);
    }
  };

  // Parse delivery locations array safely
  const getDeliveryLocations = () => {
    try {
      if (!config.delivery_locations_json) return [];
      const parsed = typeof config.delivery_locations_json === 'string' 
        ? JSON.parse(config.delivery_locations_json) 
        : config.delivery_locations_json;
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  };

  const handleOpenAddLocation = () => {
    setEditingLocationIndex(null);
    setLocationForm({ name: "", charge: "0", time: config.delivery_time || "25-35 mins" });
    setShowLocationForm(true);
  };

  const handleOpenEditLocation = (index, loc) => {
    setEditingLocationIndex(index);
    setLocationForm({
      name: loc.name || "",
      charge: String(loc.charge ?? 0),
      time: loc.time || "25-35 mins"
    });
    setShowLocationForm(true);
  };

  const handleSaveLocation = (e) => {
    if (e) e.preventDefault();
    if (!locationForm.name.trim()) {
      toast.error("Please enter a location / area name");
      return;
    }

    const locations = [...getDeliveryLocations()];
    const newLoc = {
      id: editingLocationIndex !== null && locations[editingLocationIndex]?.id 
        ? locations[editingLocationIndex].id 
        : `loc_${Date.now().toString().slice(-6)}`,
      name: locationForm.name.trim(),
      charge: Math.max(0, parseFloat(locationForm.charge) || 0),
      time: locationForm.time.trim() || config.delivery_time || "25-35 mins"
    };

    if (editingLocationIndex !== null && editingLocationIndex >= 0) {
      locations[editingLocationIndex] = newLoc;
      toast.success(`Updated location: ${newLoc.name}`);
    } else {
      locations.push(newLoc);
      toast.success(`Added new delivery location: ${newLoc.name}`);
    }

    handleChange("delivery_locations_json", JSON.stringify(locations));
    setShowLocationForm(false);
    setEditingLocationIndex(null);
  };

  const handleDeleteLocation = (index) => {
    const locations = getDeliveryLocations().filter((_, i) => i !== index);
    handleChange("delivery_locations_json", JSON.stringify(locations));
    toast.success("Location removed");
  };

  const tabs = [
    { id: "branding", label: "Branding & Header", icon: FiGlobe },
    { id: "hero", label: "Hero & Banner", icon: FiLayout },
    { id: "founder", label: "Founder Section", icon: FiUser },
    { id: "footer", label: "Footer & Social", icon: FiPhone },
    { id: "seo", label: "Google Console & SEO", icon: FiSearch },
    { id: "email", label: "Email Setup", icon: FiMail },
    { id: "radius", label: "Delivery Areas & Charges", icon: FiMapPin },
  ];

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    setSaving(true);

    const relevantKeys = TAB_FIELDS[activeTab] || Object.keys(config);
    const tabPayload = {};
    relevantKeys.forEach((k) => {
      if (config[k] !== undefined) {
        tabPayload[k] = config[k];
      }
    });

    const activeTabObj = tabs.find((t) => t.id === activeTab);
    const tabLabel = activeTabObj ? activeTabObj.label : "Settings";

    try {
      const res = await fetch("/api/admin/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(tabPayload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Save failed");

      toast.success(`${tabLabel} saved successfully!`);
    } catch (err) {
      toast.error(err.message || "Failed to save configuration");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4 pb-12">
      {/* Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar pt-0.5">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer border ${
                active
                  ? "bg-amber-500/20 text-amber-400 border-amber-500/50 shadow-md shadow-amber-500/10 scale-[1.02]"
                  : "bg-[#141419] text-gray-400 border-white/5 hover:text-white hover:border-white/20"
              }`}
            >
              <Icon size={14} className={active ? "text-amber-400" : "text-gray-500"} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Form Area */}
      <form onSubmit={handleSave} className="bg-[#131318] border border-white/10 rounded-2xl p-4 sm:p-6 space-y-4 shadow-xl">
        {/* 1. BRANDING & HEADER */}
        {activeTab === "branding" && (
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-amber-400 uppercase tracking-widest border-b border-white/5 pb-2">
              Header & Identity
            </h3>

            {/* Header Logo Image */}
            <div className="p-3 rounded-xl bg-[#101014] border border-white/10 flex items-center gap-3">
              <div className="w-14 h-14 rounded-lg bg-black/60 border border-white/10 flex items-center justify-center p-1 overflow-hidden flex-shrink-0">
                <img
                  src={getBlobUrl(config.logo_image || "/icons/logo2.png")}
                  alt="Header Logo"
                  className="max-h-full max-w-full object-contain"
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-white">Header Logo Image</p>
                <p className="text-[10px] text-gray-400 truncate mt-0.5">{config.logo_image || "/icons/logo2.png"}</p>
                <button
                  type="button"
                  onClick={() => setPickerField("logo_image")}
                  className="mt-1.5 flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 text-[10px] font-bold border border-amber-500/30 transition-colors"
                >
                  <FiImage size={12} />
                  <span>Choose from Assets</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  Site / Brand Title
                </label>
                <input
                  type="text"
                  value={config.site_title || ""}
                  onChange={(e) => handleChange("site_title", e.target.value)}
                  className="w-full mt-1 bg-[#101014] border border-white/10 focus:border-amber-500/50 rounded-xl px-3 py-2 text-xs text-white outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  Tagline / Sub-header
                </label>
                <input
                  type="text"
                  value={config.tagline || ""}
                  onChange={(e) => handleChange("tagline", e.target.value)}
                  className="w-full mt-1 bg-[#101014] border border-white/10 focus:border-amber-500/50 rounded-xl px-3 py-2 text-xs text-white outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  Legacy / Established Text
                </label>
                <input
                  type="text"
                  value={config.legacy_year || ""}
                  onChange={(e) => handleChange("legacy_year", e.target.value)}
                  className="w-full mt-1 bg-[#101014] border border-white/10 focus:border-amber-500/50 rounded-xl px-3 py-2 text-xs text-white outline-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* 2. HERO & BANNER */}
        {activeTab === "hero" && (
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-amber-400 uppercase tracking-widest border-b border-white/5 pb-2">
              Hero Section & Banners
            </h3>

            {/* Hero Background Image */}
            <div className="p-3 rounded-xl bg-[#101014] border border-white/10 flex items-center gap-3">
              <div className="w-20 h-14 rounded-lg bg-black/60 border border-white/10 flex items-center justify-center overflow-hidden flex-shrink-0">
                <img
                  src={getBlobUrl(config.hero_banner_image || "/hero-banner.jpg")}
                  alt="Hero Banner"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-white">Hero Background Banner</p>
                <p className="text-[10px] text-gray-400 truncate mt-0.5">{config.hero_banner_image || "/hero-banner.jpg"}</p>
                <button
                  type="button"
                  onClick={() => setPickerField("hero_banner_image")}
                  className="mt-1.5 flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 text-[10px] font-bold border border-amber-500/30 transition-colors"
                >
                  <FiImage size={12} />
                  <span>Choose Banner Image</span>
                </button>
              </div>
            </div>

            {/* Hero Floating Dish Image */}
            <div className="p-3 rounded-xl bg-[#101014] border border-white/10 flex items-center gap-3">
              <div className="w-14 h-14 rounded-lg bg-black/60 border border-white/10 flex items-center justify-center p-1 overflow-hidden flex-shrink-0">
                <img
                  src={getBlobUrl(config.hero_dish_image || "/dish.png")}
                  alt="Hero Dish"
                  className="max-h-full max-w-full object-contain"
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-white">Hero Floating Dish Image</p>
                <p className="text-[10px] text-gray-400 truncate mt-0.5">{config.hero_dish_image || "/dish.png"}</p>
                <button
                  type="button"
                  onClick={() => setPickerField("hero_dish_image")}
                  className="mt-1.5 flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 text-[10px] font-bold border border-amber-500/30 transition-colors"
                >
                  <FiImage size={12} />
                  <span>Choose Dish Image</span>
                </button>
              </div>
            </div>

            {/* Coming Soon Board Image */}
            <div className="p-3 rounded-xl bg-[#101014] border border-white/10 flex items-center gap-3">
              <div className="w-14 h-14 rounded-lg bg-black/60 border border-white/10 flex items-center justify-center p-1 overflow-hidden flex-shrink-0">
                <img
                  src={getBlobUrl(config.coming_soon_image || "/commin-soon.png")}
                  alt="Coming Soon Board"
                  className="max-h-full max-w-full object-contain"
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-white">Coming Soon Hanging Board</p>
                <p className="text-[10px] text-gray-400 truncate mt-0.5">{config.coming_soon_image || "/commin-soon.png"}</p>
                <button
                  type="button"
                  onClick={() => setPickerField("coming_soon_image")}
                  className="mt-1.5 flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 text-[10px] font-bold border border-amber-500/30 transition-colors"
                >
                  <FiImage size={12} />
                  <span>Choose Board Image</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  Hero Headline
                </label>
                <input
                  type="text"
                  value={config.hero_title || ""}
                  onChange={(e) => handleChange("hero_title", e.target.value)}
                  className="w-full mt-1 bg-[#101014] border border-white/10 focus:border-amber-500/50 rounded-xl px-3 py-2 text-xs text-white outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  Hero Button Text
                </label>
                <input
                  type="text"
                  value={config.hero_button_text || ""}
                  onChange={(e) => handleChange("hero_button_text", e.target.value)}
                  className="w-full mt-1 bg-[#101014] border border-white/10 focus:border-amber-500/50 rounded-xl px-3 py-2 text-xs text-white outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                Hero Description
              </label>
              <textarea
                rows="2"
                value={config.hero_desc || ""}
                onChange={(e) => handleChange("hero_desc", e.target.value)}
                className="w-full mt-1 bg-[#101014] border border-white/10 focus:border-amber-500/50 rounded-xl px-3 py-2 text-xs text-white outline-none resize-none"
              />
            </div>
          </div>
        )}

        {/* 3. FOUNDER SECTION */}
        {activeTab === "founder" && (
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-amber-400 uppercase tracking-widest border-b border-white/5 pb-2">
              Founder & Story Section
            </h3>

            {/* Founder Photo Image */}
            <div className="p-3 rounded-xl bg-[#101014] border border-white/10 flex items-center gap-3">
              <div className="w-14 h-14 rounded-lg bg-black/60 border border-white/10 flex items-center justify-center p-1 overflow-hidden flex-shrink-0">
                <img
                  src={getBlobUrl(config.founder_image || "/new-founder.png")}
                  alt="Founder"
                  className="max-h-full max-w-full object-contain"
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-white">Founder Photo</p>
                <p className="text-[10px] text-gray-400 truncate mt-0.5">{config.founder_image || "/new-founder.png"}</p>
                <button
                  type="button"
                  onClick={() => setPickerField("founder_image")}
                  className="mt-1.5 flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 text-[10px] font-bold border border-amber-500/30 transition-colors"
                >
                  <FiImage size={12} />
                  <span>Choose Founder Photo</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  Badge Title
                </label>
                <input
                  type="text"
                  value={config.founder_badge || ""}
                  onChange={(e) => handleChange("founder_badge", e.target.value)}
                  className="w-full mt-1 bg-[#101014] border border-white/10 focus:border-amber-500/50 rounded-xl px-3 py-2 text-xs text-white outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  Founder Name
                </label>
                <input
                  type="text"
                  value={config.founder_name || ""}
                  onChange={(e) => handleChange("founder_name", e.target.value)}
                  className="w-full mt-1 bg-[#101014] border border-white/10 focus:border-amber-500/50 rounded-xl px-3 py-2 text-xs text-white outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  Signature Role
                </label>
                <input
                  type="text"
                  value={config.founder_role || ""}
                  onChange={(e) => handleChange("founder_role", e.target.value)}
                  className="w-full mt-1 bg-[#101014] border border-white/10 focus:border-amber-500/50 rounded-xl px-3 py-2 text-xs text-white outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                Founder Quote / Vision Statement
              </label>
              <textarea
                rows="3"
                value={config.founder_quote || ""}
                onChange={(e) => handleChange("founder_quote", e.target.value)}
                className="w-full mt-1 bg-[#101014] border border-white/10 focus:border-amber-500/50 rounded-xl px-3 py-2 text-xs text-white outline-none resize-none"
              />
            </div>
          </div>
        )}

        {/* 4. FOOTER & SOCIAL */}
        {activeTab === "footer" && (
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-amber-400 uppercase tracking-widest border-b border-white/5 pb-2">
              Footer & Social Media Links
            </h3>

            {/* Footer Logo */}
            <div className="p-3 rounded-xl bg-[#101014] border border-white/10 flex items-center gap-3">
              <div className="w-14 h-14 rounded-lg bg-black/60 border border-white/10 flex items-center justify-center p-1 overflow-hidden flex-shrink-0">
                <img
                  src={getBlobUrl(config.footer_logo_image || config.logo_image || "/icons/logo2.png")}
                  alt="Footer Logo"
                  className="max-h-full max-w-full object-contain"
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-white">Footer Logo Image</p>
                <p className="text-[10px] text-gray-400 truncate mt-0.5">{config.footer_logo_image || "/icons/logo2.png"}</p>
                <button
                  type="button"
                  onClick={() => setPickerField("footer_logo_image")}
                  className="mt-1.5 flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 text-[10px] font-bold border border-amber-500/30 transition-colors"
                >
                  <FiImage size={12} />
                  <span>Choose Footer Logo</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  Follow Us Title
                </label>
                <input
                  type="text"
                  value={config.footer_follow_title || ""}
                  onChange={(e) => handleChange("footer_follow_title", e.target.value)}
                  className="w-full mt-1 bg-[#101014] border border-white/10 focus:border-amber-500/50 rounded-xl px-3 py-2 text-xs text-white outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  Copyright Notice
                </label>
                <input
                  type="text"
                  value={config.footer_copyright || ""}
                  onChange={(e) => handleChange("footer_copyright", e.target.value)}
                  className="w-full mt-1 bg-[#101014] border border-white/10 focus:border-amber-500/50 rounded-xl px-3 py-2 text-xs text-white outline-none"
                />
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  WhatsApp Contact Number
                </label>
                <input
                  type="text"
                  value={config.whatsapp_number || ""}
                  onChange={(e) => handleChange("whatsapp_number", e.target.value)}
                  placeholder="e.g. 919838383836"
                  className="w-full mt-1 bg-[#101014] border border-white/10 focus:border-amber-500/50 rounded-xl px-3 py-2 text-xs text-white outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  Instagram Link
                </label>
                <input
                  type="url"
                  value={config.instagram_url || ""}
                  onChange={(e) => handleChange("instagram_url", e.target.value)}
                  className="w-full mt-1 bg-[#101014] border border-white/10 focus:border-amber-500/50 rounded-xl px-3 py-2 text-xs text-white outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  Threads Link
                </label>
                <input
                  type="url"
                  value={config.threads_url || ""}
                  onChange={(e) => handleChange("threads_url", e.target.value)}
                  className="w-full mt-1 bg-[#101014] border border-white/10 focus:border-amber-500/50 rounded-xl px-3 py-2 text-xs text-white outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  YouTube Link
                </label>
                <input
                  type="url"
                  value={config.youtube_url || ""}
                  onChange={(e) => handleChange("youtube_url", e.target.value)}
                  className="w-full mt-1 bg-[#101014] border border-white/10 focus:border-amber-500/50 rounded-xl px-3 py-2 text-xs text-white outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  Facebook Link
                </label>
                <input
                  type="url"
                  value={config.facebook_url || ""}
                  onChange={(e) => handleChange("facebook_url", e.target.value)}
                  className="w-full mt-1 bg-[#101014] border border-white/10 focus:border-amber-500/50 rounded-xl px-3 py-2 text-xs text-white outline-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* 5. GOOGLE CONSOLE & SEO */}
        {activeTab === "seo" && (
          <div className="space-y-5">
            <div className="flex items-center justify-between gap-2 border-b border-white/5 pb-2">
              <h3 className="text-xs font-bold text-amber-400 uppercase tracking-widest flex items-center gap-2 truncate">
                <FiSearch size={14} className="flex-shrink-0" />
                <span className="truncate">Google Search Appearance & Console</span>
              </h3>
              <span className="text-[10px] text-gray-400 bg-white/5 px-2.5 py-0.5 rounded-full border border-white/10 whitespace-nowrap flex-shrink-0">
                SEO Optimizer
              </span>
            </div>

            {/* Google Search Live Preview Card */}
            <div className="p-4 rounded-2xl bg-[#0e0e12] border border-blue-500/30 shadow-lg shadow-blue-500/5 space-y-2">
              <div className="flex items-center gap-1.5 text-xs text-gray-400 font-bold">
                <FiEye size={13} className="text-blue-400" />
                <span>Google Search Result Snippet Preview</span>
              </div>
              
              <div className="bg-[#18181f] p-3.5 rounded-xl border border-white/5 space-y-1">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-black/70 border border-white/10 overflow-hidden flex items-center justify-center p-0.5 flex-shrink-0">
                    <img
                      src={getBlobUrl(config.favicon_image || "/icons/og-logo2.png")}
                      alt="Favicon"
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>
                  <div className="truncate text-[11px] text-gray-300 flex items-center gap-1">
                    <span className="font-semibold text-white truncate">{config.site_title || "The Nawab Sahab"}</span>
                    <span className="text-gray-500">›</span>
                    <span className="text-gray-400 truncate">{config.canonical_url || "https://thenawabsahab.com"}</span>
                  </div>
                </div>
                
                <h4 className="text-sm font-medium text-[#8ab4f8] hover:underline cursor-pointer leading-tight truncate">
                  {config.meta_title || `${config.site_title} | Cafe • Bakery • Sweets`}
                </h4>
                
                <p className="text-xs text-[#bdc1c6] line-clamp-2 leading-relaxed">
                  {config.meta_description || "Welcome to The Nawab Sahab Cafe, Bakery & Sweets. Order delicious street bites, gourmet pizzas, burgers, fresh bakery & royal sweets online."}
                </p>
              </div>
            </div>

            {/* Favicon & OpenGraph Image Pickers */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Favicon Icon */}
              <div className="p-3 rounded-xl bg-[#101014] border border-white/10 flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-black/60 border border-white/10 flex items-center justify-center p-1 overflow-hidden flex-shrink-0">
                  <img
                    src={getBlobUrl(config.favicon_image || "/icons/og-logo2.png")}
                    alt="Favicon"
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-white">Browser Tab Favicon</p>
                  <p className="text-[9px] text-gray-400 truncate mt-0.5">{config.favicon_image || "/icons/og-logo2.png"}</p>
                  <button
                    type="button"
                    onClick={() => setPickerField("favicon_image")}
                    className="mt-1.5 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 text-[10px] font-bold border border-amber-500/30 transition-colors"
                  >
                    <FiImage size={11} />
                    <span>Choose Favicon</span>
                  </button>
                </div>
              </div>

              {/* Social Share OG Image */}
              <div className="p-3 rounded-xl bg-[#101014] border border-white/10 flex items-center gap-3">
                <div className="w-16 h-12 rounded-lg bg-black/60 border border-white/10 flex items-center justify-center overflow-hidden flex-shrink-0">
                  <img
                    src={getBlobUrl(config.og_image || "/hero-banner.jpg")}
                    alt="Social Share Banner"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-white">Social Share (OG) Image</p>
                  <p className="text-[9px] text-gray-400 truncate mt-0.5">{config.og_image || "/hero-banner.jpg"}</p>
                  <button
                    type="button"
                    onClick={() => setPickerField("og_image")}
                    className="mt-1.5 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 text-[10px] font-bold border border-amber-500/30 transition-colors"
                  >
                    <FiImage size={11} />
                    <span>Choose OG Banner</span>
                  </button>
                </div>
              </div>
            </div>

            {/* SEO Inputs */}
            <div className="space-y-3.5">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 flex items-center justify-between gap-2">
                  <span className="truncate">Google / SEO Title</span>
                  <span className="text-gray-500 whitespace-nowrap text-[9px]">Recommended: 50-60 chars</span>
                </label>
                <input
                  type="text"
                  value={config.meta_title || ""}
                  onChange={(e) => handleChange("meta_title", e.target.value)}
                  placeholder="e.g. THE NAWAB SAHAB | Cafe • Bakery • Sweets"
                  className="w-full mt-1 bg-[#101014] border border-white/10 focus:border-amber-500/50 rounded-xl px-3 py-2 text-xs text-white outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 flex items-center justify-between gap-2">
                  <span className="truncate">Google Meta Description</span>
                  <span className="text-gray-500 whitespace-nowrap text-[9px]">{config.meta_description?.length || 0} / 160 chars</span>
                </label>
                <textarea
                  rows="3"
                  value={config.meta_description || ""}
                  onChange={(e) => handleChange("meta_description", e.target.value)}
                  placeholder="e.g. Welcome to The Nawab Sahab Cafe, Bakery & Sweets. Order delicious street bites, gourmet pizzas, burgers, fresh bakery & royal sweets online."
                  className="w-full mt-1 bg-[#101014] border border-white/10 focus:border-amber-500/50 rounded-xl px-3 py-2 text-xs text-white outline-none resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                    Canonical / Website URL
                  </label>
                  <input
                    type="url"
                    value={config.canonical_url || ""}
                    onChange={(e) => handleChange("canonical_url", e.target.value)}
                    placeholder="https://thenawabsahab.com"
                    className="w-full mt-1 bg-[#101014] border border-white/10 focus:border-amber-500/50 rounded-xl px-3 py-2 text-xs text-white outline-none"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1">
                    <FiKey size={11} className="text-amber-400" />
                    <span>Google Search Console Verification Tag</span>
                  </label>
                  <input
                    type="text"
                    value={config.google_site_verification || ""}
                    onChange={(e) => handleChange("google_site_verification", e.target.value)}
                    placeholder="e.g. google-site-verification token or code"
                    className="w-full mt-1 bg-[#101014] border border-white/10 focus:border-amber-500/50 rounded-xl px-3 py-2 text-xs text-white outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  Meta Keywords (comma-separated)
                </label>
                <input
                  type="text"
                  value={config.meta_keywords || ""}
                  onChange={(e) => handleChange("meta_keywords", e.target.value)}
                  placeholder="e.g. cafe, bakery, sweets, food delivery, nawab sahab, gourmet burgers"
                  className="w-full mt-1 bg-[#101014] border border-white/10 focus:border-amber-500/50 rounded-xl px-3 py-2 text-xs text-white outline-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* 6. EMAIL SETUP */}
        {activeTab === "email" && (
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-amber-400 uppercase tracking-widest border-b border-white/5 pb-2 flex items-center gap-2">
              <FiMail size={14} />
              <span>Email Setup</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div className="sm:col-span-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  SMTP Host Server
                </label>
                <input
                  type="text"
                  value={config.smtp_host || ""}
                  onChange={(e) => handleChange("smtp_host", e.target.value)}
                  placeholder="e.g. smtp.gmail.com or mail.yourdomain.com"
                  className="w-full mt-1 bg-[#101014] border border-white/10 focus:border-amber-500/50 rounded-xl px-3 py-2 text-xs text-white outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  SMTP Port
                </label>
                <input
                  type="text"
                  value={config.smtp_port || "587"}
                  onChange={(e) => handleChange("smtp_port", e.target.value)}
                  placeholder="587 or 465"
                  className="w-full mt-1 bg-[#101014] border border-white/10 focus:border-amber-500/50 rounded-xl px-3 py-2 text-xs text-white outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  SMTP Username / Email
                </label>
                <input
                  type="text"
                  value={config.smtp_user || ""}
                  onChange={(e) => handleChange("smtp_user", e.target.value)}
                  placeholder="e.g. orders@thenawabsahab.com"
                  className="w-full mt-1 bg-[#101014] border border-white/10 focus:border-amber-500/50 rounded-xl px-3 py-2 text-xs text-white outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 flex justify-between">
                  <span>SMTP Password / App Password</span>
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-[9px] text-amber-400 hover:underline"
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </label>
                <input
                  type={showPassword ? "text" : "password"}
                  value={config.smtp_pass || ""}
                  onChange={(e) => handleChange("smtp_pass", e.target.value)}
                  placeholder="••••••••••••••••"
                  className="w-full mt-1 bg-[#101014] border border-white/10 focus:border-amber-500/50 rounded-xl px-3 py-2 text-xs text-white outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  Sender From Address Display
                </label>
                <input
                  type="text"
                  value={config.smtp_from_email || ""}
                  onChange={(e) => handleChange("smtp_from_email", e.target.value)}
                  placeholder="e.g. &quot;The Nawab Sahab&quot; <orders@thenawabsahab.com>"
                  className="w-full mt-1 bg-[#101014] border border-white/10 focus:border-amber-500/50 rounded-xl px-3 py-2 text-xs text-white outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  Admin Notification Email(s) (Comma-separated)
                </label>
                <input
                  type="text"
                  value={config.admin_notification_email || ""}
                  onChange={(e) => handleChange("admin_notification_email", e.target.value)}
                  placeholder="e.g. owner@thenawabsahab.com, manager@thenawabsahab.com"
                  className="w-full mt-1 bg-[#101014] border border-white/10 focus:border-amber-500/50 rounded-xl px-3 py-2 text-xs text-white outline-none"
                />
              </div>
            </div>

            {/* Test Email Action Card */}
            <div className="p-3.5 rounded-xl bg-[#101015] border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3">
              <div className="space-y-0.5">
                <p className="text-xs font-bold text-white flex items-center gap-1.5">
                  <FiCheckCircle size={13} className="text-amber-400" />
                  <span>Verify Email Dispatch</span>
                </p>
              </div>

              <button
                type="button"
                onClick={handleSendTestEmail}
                disabled={testingEmail || !config.smtp_host || !config.smtp_user || !config.smtp_pass}
                className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 hover:text-amber-300 text-xs font-bold border border-amber-500/40 transition-all cursor-pointer disabled:opacity-40 flex-shrink-0"
              >
                {testingEmail ? (
                  <div className="w-3.5 h-3.5 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <FiMail size={13} />
                )}
                <span>{testingEmail ? "Sending Test..." : "Send Test Email"}</span>
              </button>
            </div>
          </div>
        )}

        {/* 7. DELIVERY AREAS & CHARGES */}
        {activeTab === "radius" && (
          <div className="space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/5 pb-3">
              <div>
                <h3 className="text-xs font-bold text-amber-400 uppercase tracking-widest flex items-center gap-2">
                  <FiMapPin size={14} />
                  <span>Serviceable Delivery Areas & Charges</span>
                </h3>
                <p className="text-[11px] text-gray-400 mt-0.5">
                  Add the areas/villages you deliver to and set their delivery charge (₹0 = Free Delivery).
                </p>
              </div>

              {!showLocationForm && (
                <button
                  type="button"
                  onClick={handleOpenAddLocation}
                  className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black text-xs font-black shadow-lg shadow-amber-500/20 active:scale-95 transition-all cursor-pointer flex-shrink-0 text-center"
                >
                  <FiPlus size={14} />
                  <span>Add Delivery Area</span>
                </button>
              )}
            </div>

            {/* Inline Add / Edit Location Batch Card */}
            {showLocationForm && (
              <div className="p-4 rounded-2xl bg-[#16161f] border border-amber-500/40 shadow-xl shadow-amber-500/5 space-y-3.5 animate-fadeIn">
                <div className="flex items-center justify-between border-b border-white/10 pb-2">
                  <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                    {editingLocationIndex !== null ? <FiEdit2 size={13} className="text-amber-400" /> : <FiPlus size={13} className="text-amber-400" />}
                    <span>{editingLocationIndex !== null ? "Edit Delivery Area" : "Add New Delivery Area"}</span>
                  </h4>
                  <span className="text-[10px] text-gray-400">Set ₹0 for Free Delivery</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                      Location / Area Name *
                    </label>
                    <input
                      type="text"
                      value={locationForm.name}
                      onChange={(e) => setLocationForm({ ...locationForm, name: e.target.value })}
                      placeholder="e.g. Anwak, Nizamabad, Hazratganj"
                      className="w-full mt-1 bg-[#101014] border border-white/10 focus:border-amber-500/50 rounded-xl px-3 py-2 text-xs text-white outline-none"
                      autoFocus
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                      Delivery Charge (₹) *
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={locationForm.charge}
                      onChange={(e) => setLocationForm({ ...locationForm, charge: e.target.value })}
                      placeholder="0 for Free Delivery"
                      className="w-full mt-1 bg-[#101014] border border-white/10 focus:border-amber-500/50 rounded-xl px-3 py-2 text-xs text-white outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                      Est. Delivery Time
                    </label>
                    <input
                      type="text"
                      value={locationForm.time}
                      onChange={(e) => setLocationForm({ ...locationForm, time: e.target.value })}
                      placeholder="e.g. 20-30 mins"
                      className="w-full mt-1 bg-[#101014] border border-white/10 focus:border-amber-500/50 rounded-xl px-3 py-2 text-xs text-white outline-none"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setShowLocationForm(false);
                      setEditingLocationIndex(null);
                    }}
                    className="px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white text-xs font-bold transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveLocation}
                    className="px-4 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-black shadow-md shadow-amber-500/20 active:scale-95 transition-all cursor-pointer flex items-center gap-1"
                  >
                    <FiCheck size={14} />
                    <span>{editingLocationIndex !== null ? "Update Area" : "Save Area"}</span>
                  </button>
                </div>
              </div>
            )}

            {/* List of Configured Delivery Locations */}
            <div className="space-y-2.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 flex items-center justify-between">
                <span>Configured Serviceable Areas ({getDeliveryLocations().length})</span>
                <span className="text-gray-500 text-[10px]">Selectable by customers at checkout</span>
              </label>

              {getDeliveryLocations().length === 0 ? (
                <div className="p-8 rounded-2xl bg-[#101014] border border-white/5 text-center space-y-2">
                  <FiMapPin className="mx-auto text-gray-600" size={28} />
                  <p className="text-xs text-gray-400 font-bold">No delivery locations added yet</p>
                  <p className="text-[11px] text-gray-500 max-w-xs mx-auto">
                    Add your delivery areas so customers can select where to receive their order.
                  </p>
                  <button
                    type="button"
                    onClick={handleOpenAddLocation}
                    className="mt-2 inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 text-xs font-bold border border-amber-500/30 transition-all cursor-pointer text-center"
                  >
                    <FiPlus size={13} />
                    <span>Add First Location</span>
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {getDeliveryLocations().map((loc, idx) => {
                    const isFree = !loc.charge || parseFloat(loc.charge) === 0;
                    return (
                      <div
                        key={loc.id || idx}
                        className="p-3.5 rounded-2xl bg-[#111116] border border-white/10 hover:border-amber-500/30 transition-all flex items-center justify-between gap-3 group"
                      >
                        <div className="min-w-0 flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <FiMapPin size={13} className="text-amber-400 flex-shrink-0" />
                            <h4 className="text-xs font-black text-white truncate">{loc.name}</h4>
                          </div>

                          <div className="flex items-center gap-2 pt-0.5 flex-wrap">
                            {/* Delivery Fee Badge */}
                            {isFree ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-green-500/15 border border-green-500/30 text-green-400 text-[10px] font-black tracking-wide uppercase">
                                <FiCheckCircle size={10} />
                                <span>Free Delivery</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 text-[10px] font-black tracking-wide">
                                <span>₹{loc.charge} Delivery Fee</span>
                              </span>
                            )}

                            {loc.time && (
                              <span className="text-[10px] text-gray-400 flex items-center gap-1">
                                <FiClock size={10} className="text-gray-500" />
                                <span>{loc.time}</span>
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <button
                            type="button"
                            onClick={() => handleOpenEditLocation(idx, loc)}
                            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-amber-400 transition-colors cursor-pointer"
                            title="Edit Location"
                          >
                            <FiEdit2 size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteLocation(idx)}
                            className="p-2 rounded-xl bg-white/5 hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition-colors cursor-pointer"
                            title="Delete Location"
                          >
                            <FiTrash2 size={13} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Store Address Field */}
            <div className="pt-2 border-t border-white/5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                Store Base / Kitchen Address (Display only)
              </label>
              <input
                type="text"
                value={config.store_address || ""}
                onChange={(e) => handleChange("store_address", e.target.value)}
                placeholder="e.g. The Nawab Sahab, Anwak, Nizamabad, Azamgarh"
                className="w-full mt-1 bg-[#101014] border border-white/10 focus:border-amber-500/50 rounded-xl px-3 py-2 text-xs text-white outline-none"
              />
            </div>

            {/* 
            ===========================================================
            MAP & GPS RADIUS SECTION (COMMENTED OUT AS REQUESTED)
            ===========================================================
            <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-2 opacity-60">
              <StoreRadiusMap
                lat={parseFloat(config.store_lat) || 26.8467}
                lng={parseFloat(config.store_lng) || 80.9462}
                radiusKm={parseFloat(config.delivery_radius_km) || 5}
                onChangeCoordinates={(newLat, newLng) => {
                  setConfig((prev) => ({ ...prev, store_lat: String(newLat), store_lng: String(newLng) }));
                }}
                onChangeRadius={(newRadius) => {
                  setConfig((prev) => ({ ...prev, delivery_radius_km: String(newRadius) }));
                }}
              />
            </div>
            ===========================================================
            */}
          </div>
        )}

        {/* Bottom Save Bar */}
        <div className="pt-3 border-t border-white/5 flex items-center justify-end">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-extrabold shadow-lg shadow-amber-500/20 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
          >
            {saving ? (
              <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <FiCheck size={15} className="stroke-[3]" />
                <span>Save</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Asset Picker Modal */}
      <AssetPickerModal
        open={Boolean(pickerField)}
        onClose={() => setPickerField(null)}
        onSelect={handleSelectAsset}
        title={`Select Image for ${pickerField?.replace(/_/g, ' ') || 'Section'}`}
      />
    </div>
  );
}
