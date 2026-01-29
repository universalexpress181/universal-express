"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image"; 
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { 
  Box, LogOut, Loader2, Users, 
  UserCheck, Menu, X, Building2, Package, Moon, Sun, ShieldAlert 
} from "lucide-react";
import LogoutOnBack from "@/components/LogoutOnBack"; 
import { motion, AnimatePresence } from "framer-motion";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  
  // State
  const [authorized, setAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false); 
  const [isMobile, setIsMobile] = useState(true);
  
  // 🌓 Theme State
  const [isDarkMode, setIsDarkMode] = useState(true);

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    
    if (savedTheme === "dark" || (!savedTheme && systemPrefersDark)) {
        setIsDarkMode(true);
        document.documentElement.classList.add("dark");
    } else {
        setIsDarkMode(false);
        document.documentElement.classList.remove("dark");
    }

    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize(); 
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const toggleTheme = () => {
      const newMode = !isDarkMode;
      setIsDarkMode(newMode);
      if (newMode) {
          document.documentElement.classList.add("dark");
          localStorage.setItem("theme", "dark");
      } else {
          document.documentElement.classList.remove("dark");
          localStorage.setItem("theme", "light");
      }
  };

  useEffect(() => {
    if (isMobile) setSidebarOpen(false);
  }, [pathname, isMobile]);

  useEffect(() => {
    checkAdmin();
  }, []);

  const checkAdmin = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return router.replace("/login");

    const { data: roleData, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .maybeSingle(); 

    if (error || roleData?.role !== 'admin') {
      router.replace("/dashboard");
    } else {
      setAuthorized(true);
    }
    setLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace("/login");
  };

  if (loading) return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#050b14] flex items-center justify-center text-red-600 font-bold tracking-widest animate-pulse">
        <ShieldAlert className="mr-2" /> VERIFYING CLEARANCE...
    </div>
  );

  if (!authorized) return null;

  // --- ANIMATION VARIANTS ---
  const sidebarVariants: any = {
    closed: { x: "-100%", transition: { type: "spring" as const, stiffness: 300, damping: 30 } },
    open: { x: 0, transition: { type: "spring" as const, stiffness: 300, damping: 30, staggerChildren: 0.05, delayChildren: 0.1 } }
  };

  const animationState = !isMobile || sidebarOpen ? "open" : "closed";

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-[#050b14] text-slate-900 dark:text-white overflow-hidden relative transition-colors duration-300">
      <LogoutOnBack />

      {/* 📱 Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-white dark:bg-[#0f0202] backdrop-blur-md border-b border-gray-200 dark:border-red-900/30 flex items-center justify-between px-4 z-40">
        <div className="flex items-center gap-3">
            <div className="relative h-8 w-8">
                <Image src="/logo.png" alt="Admin Logo" fill className="object-contain" priority />
            </div>
            <div className="text-red-600 font-black tracking-tighter flex items-center gap-2">ADMIN</div>
        </div>
        <motion.button whileTap={{ scale: 0.9 }} onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 text-slate-500 dark:text-red-500">
          {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </motion.button>
      </div>

      {/* 🌑 Mobile Overlay */}
      <AnimatePresence>
        {isMobile && sidebarOpen && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 z-40 md:hidden backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* 📁 Animated Sidebar */}
      <motion.aside 
        initial={false} animate={animationState} variants={sidebarVariants}
        className="fixed top-0 bottom-0 left-0 z-50 w-64 bg-white dark:bg-[#0f0202] border-r border-gray-200 dark:border-red-900/20 flex flex-col md:static md:h-full shadow-2xl md:shadow-none"
      >
        {/* Logo Area */}
        <div className="h-20 flex-shrink-0 p-6 border-b border-gray-100 dark:border-red-900/20 flex items-center gap-3">
          <div className="relative h-10 w-10">
              <Image src="/logo.png" alt="Admin Logo" fill className="object-contain" priority />
          </div>
          <div>
              <h1 className="font-black tracking-widest text-red-600 text-sm">ADMIN</h1>
              <p className="text-[10px] text-gray-400 dark:text-red-400 font-bold uppercase tracking-wide">Command Center</p>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto custom-scrollbar mt-2">
          {/* ✨ FIXED: Brighter Text Color for Dark Mode */}
          <p className="px-2 text-[10px] font-black text-slate-400 dark:text-red-300/70 uppercase tracking-widest mb-2 opacity-100">Management</p>
          
          <NavLink href="/admin/shipments" icon={<Box size={20} />} label="All Shipments" currentPath={pathname} />
          <NavLink href="/admin/sellers" icon={<Building2 size={20} />} label="B2B Partners" currentPath={pathname} />
          <NavLink href="/admin/users" icon={<Users size={20} />} label="Customers" currentPath={pathname} />
          
          <div className="h-6"></div>
          {/* ✨ FIXED: Brighter Text Color for Dark Mode */}
          <p className="px-2 text-[10px] font-black text-slate-400 dark:text-red-300/70 uppercase tracking-widest mb-2 opacity-100">Configuration</p>
          
          <NavLink href="/admin/rates" icon={<Package size={20} />} label="Package Type" currentPath={pathname} />
          <NavLink href="/admin/staff" icon={<UserCheck size={20} />} label="Staff & Drivers" currentPath={pathname} />
        </nav>

        {/* Footer Actions */}
        <div className="p-4 border-t border-gray-100 dark:border-red-900/20 space-y-3 bg-gray-50/50 dark:bg-[#0f0202]">
          
          {/* 🌓 THEME TOGGLE */}
          <motion.button 
            whileTap={{ scale: 0.95 }}
            onClick={toggleTheme}
            className="flex items-center justify-between w-full px-4 py-3 rounded-xl bg-white dark:bg-[#1a0505] border border-gray-200 dark:border-red-900/30 text-xs font-bold text-slate-600 dark:text-red-200 transition-colors shadow-sm hover:border-red-400"
          >
            <span className="flex items-center gap-3">
                {isDarkMode ? <Moon size={16} className="text-red-400"/> : <Sun size={16} className="text-orange-500"/>}
                <span>{isDarkMode ? "Dark Mode" : "Light Mode"}</span>
            </span>
            <div className={`w-9 h-5 rounded-full relative transition-colors duration-300 ${isDarkMode ? "bg-red-700" : "bg-gray-300"}`}>
                <motion.div 
                    className="absolute top-1 w-3 h-3 bg-white rounded-full shadow-sm" 
                    initial={false}
                    animate={{ x: isDarkMode ? 20 : 4 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
            </div>
          </motion.button>

          {/* LOGOUT */}
          <motion.button 
            whileHover={{ backgroundColor: "rgba(220, 38, 38, 0.1)", color: "#dc2626" }}
            whileTap={{ scale: 0.98 }}
            onClick={handleLogout} 
            className="flex items-center justify-center gap-3 px-4 py-3 text-slate-500 dark:text-red-400/80 w-full rounded-xl transition-all font-bold text-xs border border-transparent hover:border-red-200 dark:hover:border-red-900/50"
          >
            <LogOut size={16} /> <span>Sign Out</span>
          </motion.button>
        </div>
      </motion.aside>

      {/* 📄 Main Content */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative z-0">
          <div className="h-16 md:hidden flex-shrink-0"></div> 
          
          <main className="flex-1 overflow-y-auto p-4 md:p-8 scroll-smooth">
            <motion.div
              key={pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              {children}
            </motion.div>
          </main>
      </div>
      
    </div>
  );
}

// 🎨 NAV LINK
function NavLink({ href, icon, label, currentPath }: { href: string, icon: any, label: string, currentPath: string }) {
    const isActive = currentPath.includes(href);
    
    return (
        <Link href={href} className="block relative group mb-1.5">
            {isActive && (
                <motion.div 
                    layoutId="activeAdminNav"
                    className="absolute inset-0 bg-red-600 dark:bg-red-700 rounded-xl shadow-lg shadow-red-600/30"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
            )}

            <div className={`relative flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all duration-300
                ${isActive 
                    ? 'text-white' 
                    // ✨ FIXED: Much brighter inactive text for Dark Mode (slate-300)
                    : 'text-slate-500 dark:text-slate-300 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20'}
            `}>
                <div className="relative z-10 transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3">
                    {icon}
                </div>
                <span className="relative z-10 tracking-wide">{label}</span>
                
                {isActive && (
                    <motion.div 
                        initial={{ scale: 0 }} animate={{ scale: 1 }}
                        className="absolute right-3 w-1.5 h-1.5 bg-white rounded-full shadow-sm"
                    />
                )}
            </div>
        </Link>
    );
}