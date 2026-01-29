"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image"; // 👈 Import Image
import { usePathname, useRouter } from "next/navigation";
import { 
  LayoutDashboard, 
  PackagePlus, 
  History, 
  Settings, 
  LogOut, 
  Menu, 
  X,
  Package 
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import ThemeToggle from "@/components/ThemeToggle";
import LogoutOnBack from "@/components/LogoutOnBack"; 
import { motion, AnimatePresence } from "framer-motion";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(true);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (isMobile) {
        setSidebarOpen(false);
    }
  }, [pathname, isMobile]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace("/login");
  };

  const navItems = [
    { name: "Overview", href: "/dashboard", icon: LayoutDashboard },
    { name: "Book Shipment", href: "/dashboard/book", icon: PackagePlus },
    { name: "My History", href: "/dashboard/history", icon: History },
    { name: "Profile Settings", href: "/dashboard/settings", icon: Settings },
  ];

  const sidebarVariants = {
    closed: { 
      x: "-100%",
      transition: { type: "spring", stiffness: 300, damping: 30 }
    },
    open: { 
      x: 0,
      transition: { 
        type: "spring", stiffness: 300, damping: 30,
        staggerChildren: 0.05, delayChildren: 0.1 
      }
    }
  };

  const overlayVariants = {
    closed: { opacity: 0 },
    open: { opacity: 1 }
  };

  const sidebarState = !isMobile || isSidebarOpen ? "open" : "closed";

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300 relative overflow-hidden">
      
      <LogoutOnBack />

      {/* 📱 MOBILE HEADER */}
      <div className="md:hidden fixed top-0 w-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 z-50 px-4 h-16 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
            {/* ⚡ UPDATED: Mobile Logo */}
            <div className="relative h-8 w-8">
                <Image 
                    src="/logo.png" 
                    alt="Logo" 
                    fill 
                    className="object-contain" 
                    priority 
                />
            </div>
            <span className="font-bold text-slate-900 dark:text-white tracking-tight">UNIVERSAL</span>
        </div>
        <motion.button 
          whileTap={{ scale: 0.9 }}
          onClick={() => setSidebarOpen(true)} 
          className="text-slate-600 dark:text-slate-300"
        >
            <Menu size={24} />
        </motion.button>
      </div>

      {/* 🌑 MOBILE OVERLAY */}
      <AnimatePresence>
        {isMobile && isSidebarOpen && (
          <motion.div 
            initial="closed" animate="open" exit="closed"
            variants={overlayVariants}
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
          />
        )}
      </AnimatePresence>

      {/* 📁 SIDEBAR NAVIGATION */}
      <motion.aside 
        initial={false}
        animate={sidebarState} 
        variants={sidebarVariants}
        className={`
          fixed top-0 bottom-0 left-0 z-50 w-64 bg-slate-900 text-white border-r border-slate-800 flex flex-col
          md:static md:h-full
        `}
      >
        {/* Header Logo */}
        <div className="p-6 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            {/* ⚡ UPDATED: Sidebar Logo */}
            <div className="relative h-10 w-10">
                <Image 
                    src="/logo.png" 
                    alt="Logo" 
                    fill 
                    className="object-contain" 
                    priority 
                />
            </div>
            <div>
              <h1 className="font-black text-lg tracking-tighter">UNIVERSAL</h1>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest">Logistics</p>
            </div>
          </div>
          {/* Close Button for Mobile */}
          <motion.button 
            whileTap={{ scale: 0.9 }}
            onClick={() => setSidebarOpen(false)} 
            className="md:hidden text-slate-400 hover:text-white"
          >
            <X size={24} />
          </motion.button>
        </div>

        {/* Navigation Links */}
        <nav className="mt-4 px-4 space-y-2 flex-1 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink 
              key={item.href} 
              item={item} 
              isActive={pathname === item.href} 
            />
          ))}
        </nav>

        {/* Footer Actions */}
        <div className="p-4 space-y-4 border-t border-slate-800 bg-slate-900 z-10">
            {/* Theme Toggle */}
            <div className="flex items-center justify-between px-4 py-3 bg-slate-800/50 rounded-xl border border-slate-700/50">
                <span className="text-sm text-slate-400 font-medium">Theme</span>
                <ThemeToggle />
            </div>

            <motion.button 
                whileHover={{ scale: 1.02, backgroundColor: "rgba(239, 68, 68, 0.1)" }}
                whileTap={{ scale: 0.98 }}
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:text-red-300 transition-colors font-medium"
            >
                <LogOut size={20} /> Logout
            </motion.button>
        </div>
      </motion.aside>

      {/* 📄 MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
          <div className="h-16 md:hidden flex-shrink-0"></div> 
          
          <main className="flex-1 p-4 md:p-8 overflow-y-auto w-full max-w-[100vw] overflow-x-hidden scroll-smooth">
            <motion.div
              key={pathname}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              {children}
            </motion.div>
          </main>
      </div>

    </div>
  );
}

// 🎨 ANIMATED NAV LINK COMPONENT
function NavLink({ item, isActive }: { item: any, isActive: boolean }) {
  const itemVariants = {
    closed: { opacity: 0, x: -20 },
    open: { opacity: 1, x: 0 }
  };

  return (
    <Link href={item.href} className="block relative group">
      <motion.div
        variants={itemVariants}
        className={`relative flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors z-10
          ${isActive ? "text-white" : "text-slate-400 hover:text-white"}
        `}
      >
        {isActive && (
          <motion.div
            layoutId="activeDashboardNav"
            className="absolute inset-0 bg-blue-600 rounded-xl shadow-lg shadow-blue-900/30 z-[-1]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
          />
        )}

        {!isActive && (
          <div className="absolute inset-0 bg-slate-800/0 group-hover:bg-slate-800/50 rounded-xl transition-colors duration-200 z-[-1]" />
        )}

        <item.icon size={20} />
        {item.name}
      </motion.div>
    </Link>
  );
}