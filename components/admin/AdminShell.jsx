"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { 
  FiMenu, 
  FiX, 
  FiRefreshCw, 
  FiFolder, 
  FiLogOut, 
  FiMoreVertical,
  FiExternalLink,
  FiShield,
  FiLayers,
  FiCoffee,
  FiSliders
} from "react-icons/fi";
import toast from "react-hot-toast";

export default function AdminShell({ children, onRefresh }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  // Prevent background scroll on mobile drawer open
  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [sidebarOpen]);

  // Close drawer on path navigation
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  const handleLogout = async () => {
    try {
      await fetch("/api/admin/auth", { method: "DELETE" });
      toast.success("Logged out");
      router.push("/admin");
      window.location.reload();
    } catch {
      toast.error("Logout failed");
    }
  };

  const navItems = [
    { label: "Assets Library", href: "/admin/assets", icon: FiFolder },
    { label: "Categories", href: "/admin/categories", icon: FiLayers },
    { label: "Dishes & Menu", href: "/admin/dishes", icon: FiCoffee },
    { label: "Page Config", href: "/admin/config", icon: FiSliders },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-white flex flex-col font-sans">
      {/* Mobile Drawer Backdrop */}
      <div
        className={`fixed inset-0 bg-black/70 backdrop-blur-sm z-40 transition-opacity duration-300 md:hidden ${
          sidebarOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* Mobile Drawer Sidebar */}
      <aside
        className={`fixed top-0 left-0 bottom-0 w-[260px] bg-[#121216] border-r border-white/10 flex flex-col z-50 transition-transform duration-300 ease-out md:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Drawer Header */}
        <div className="p-5 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center">
              <FiShield className="text-amber-400 text-sm" />
            </div>
            <div>
              <h2 className="font-bold text-sm text-white tracking-wider uppercase bogart">
                NAWAB SAHAB
              </h2>
              <p className="text-[9px] text-amber-500 tracking-widest font-semibold uppercase">
                Admin Console
              </p>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="md:hidden text-gray-400 hover:text-white p-1 rounded-lg hover:bg-white/5"
          >
            <FiX size={20} />
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = pathname.startsWith(item.href) || (pathname === "/admin" && item.href === "/admin/assets");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  active
                    ? "bg-amber-500/20 text-amber-400 border border-amber-500/30 shadow-lg shadow-amber-500/10"
                    : "text-gray-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <Icon size={16} />
                <span>{item.label}</span>
              </Link>
            );
          })}

          <div className="pt-4 mt-4 border-t border-white/5">
            <Link
              href="/"
              target="_blank"
              className="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs text-gray-400 hover:text-white hover:bg-white/5 transition-colors font-medium"
            >
              <span className="flex items-center gap-2.5">
                <FiExternalLink size={14} />
                <span>View Live Site</span>
              </span>
            </Link>
          </div>
        </nav>

        {/* Drawer Footer / Logout */}
        <div className="p-3 border-t border-white/10">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-bold text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors cursor-pointer"
          >
            <FiLogOut size={16} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 ml-0 md:ml-[260px] min-w-0 flex flex-col">
        {/* Sticky Mobile Topbar */}
        <header className="sticky top-0 z-30 h-14 bg-[#0e0e12]/80 backdrop-blur-xl border-b border-white/10 px-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* 3-Dot / Menu Toggle Button */}
            <button
              onClick={() => setSidebarOpen((v) => !v)}
              aria-label="Toggle menu"
              className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-gray-300 hover:text-white hover:bg-white/10 transition-colors md:hidden cursor-pointer"
            >
              <FiMoreVertical size={18} />
            </button>
            <div>
              <h1 className="font-extrabold text-sm sm:text-base text-white tracking-wide">
                {pathname.includes("/admin/categories") 
                  ? "Categories" 
                  : pathname.includes("/admin/dishes") 
                  ? "Dishes & Menu" 
                  : pathname.includes("/admin/config") 
                  ? "Page Configuration" 
                  : "Asset Library"}
              </h1>
              <p className="text-[9px] text-gray-400 hidden sm:block">
                {pathname.includes("/admin/categories") 
                  ? "Organize menu categories and images" 
                  : pathname.includes("/admin/dishes") 
                  ? "Manage food items, prices, and stock" 
                  : pathname.includes("/admin/config") 
                  ? "Customize site texts, links, and branding" 
                  : "Manage media & cloud images"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onRefresh}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-gray-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              title="Refresh Assets"
            >
              <FiRefreshCw size={13} />
              <span className="text-[11px] font-semibold hidden sm:inline">Refresh</span>
            </button>
          </div>
        </header>

        {/* Page Inner Container */}
        <main className="flex-1 p-3 sm:p-5 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
