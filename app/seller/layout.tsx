"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image"; 
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { 
  LayoutDashboard, Package, Plus, Code, 
  LogOut, Menu, X, User, FileText, Settings, 
  Moon, Sun 
} from "lucide-react";
import LogoutOnBack from "@/components/LogoutOnBack"; 
import { motion, AnimatePresence } from "framer-motion";

export default function SellerLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profile, setProfile] = useState<any>(null); 
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
    checkSeller();
  }, []);

  const checkSeller = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return router.replace("/login");

    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single(); 

    if (roleData?.role !== 'seller') {
      router.replace("/dashboard"); 
      return;
    }

    const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
    
    setProfile(profileData);
    setLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace("/login");
  };

  if (loading) return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#020617] flex items-center justify-center text-blue-500 font-medium animate-pulse">
        Loading Partner Portal...
    </div>
  );

  const sidebarVariants = {
    closed: { x: "-100%", transition: { type: "spring", stiffness: 300, damping: 30 } },
    open: { x: 0, transition: { type: "spring", stiffness: 300, damping: 30, staggerChildren: 0.05, delayChildren: 0.1 } }
  };

  const animationState = !isMobile || sidebarOpen ? "open" : "closed";

  return (
    // 🎨 UPDATED BACKGROUND COLORS HERE
    <div className="flex h-screen bg-[#F1F5F9] dark:bg-[#020617] text-slate-900 dark:text-white overflow-hidden relative transition-colors duration-500">
      <LogoutOnBack />

      {/* 🌈 Ambient Background Mesh (Subtle Gradient) */}
      <div className="fixed inset-0 pointer-events-none z-0">
          <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-blue-400/10 dark:bg-blue-600/5 rounded-full blur-[120px]" />
          <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-purple-400/10 dark:bg-violet-600/5 rounded-full blur-[120px]" />
      </div>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-white/80 dark:bg-[#0B1121]/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800/50 flex items-center justify-between px-4 z-40">
        <div className="flex items-center gap-3">
            <div className="relative h-8 w-8">
                <Image src="/logo.png" alt="Universal Logo" fill className="object-contain" priority />
            </div>
            <span className="font-black text-blue-600 dark:text-blue-500 tracking-tight">UNIVERSAL</span>
        </div>
        <motion.button whileTap={{ scale: 0.9 }} onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 text-slate-500 dark:text-slate-300">
          {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </motion.button>
      </div>

      {/* MOBILE OVERLAY */}
      <AnimatePresence>
        {isMobile && sidebarOpen && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* SIDEBAR - UPDATED COLORS */}
      <motion.aside 
        initial={false} animate={animationState} variants={sidebarVariants}
        className="fixed top-0 bottom-0 left-0 z-50 w-64 bg-white dark:bg-[#0B1121] border-r border-slate-200 dark:border-slate-800/50 flex flex-col md:static md:h-full shadow-2xl md:shadow-none transition-colors duration-300"
      >
        {/* Logo Area */}
        <div className="h-16 flex-shrink-0 px-6 border-b border-slate-100 dark:border-slate-800/50 flex items-center gap-3 justify-between md:justify-start">
            <div className="flex items-center gap-3">
                <div className="relative h-9 w-9">
                    <Image src="/logo.png" alt="Logo" fill className="object-contain" priority />
                </div>
                <div>
                    <h1 className="font-black text-sm tracking-wide text-slate-900 dark:text-white">UNIVERSAL</h1>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Partner Hub</p>
                </div>
            </div>
            <button onClick={() => setSidebarOpen(false)} className="md:hidden text-slate-400 hover:text-slate-600 dark:hover:text-white">
                <X size={20}/>
            </button>
        </div>

        {/* User Profile Card */}
        <div className="p-4">
            <motion.div whileHover={{ scale: 1.02 }} className="bg-slate-50 dark:bg-[#151e32] p-3 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center gap-3 shadow-sm group cursor-default transition-colors">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center shrink-0 shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform">
                    <User size={18} />
                </div>
                <div className="overflow-hidden">
                    <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                        {profile?.business_name || "Partner"}
                    </p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate font-medium">
                        {profile?.email}
                    </p>
                </div>
            </motion.div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 space-y-2 overflow-y-auto custom-scrollbar mt-2">
          <p className="px-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 opacity-70">Dashboard</p>
          
          <NavLink href="/seller" icon={<LayoutDashboard size={20} />} label="Overview" currentPath={pathname} />
          <NavLink href="/seller/create" icon={<Plus size={20} />} label="New Shipment" currentPath={pathname} />
          <NavLink href="/seller/shipments" icon={<Package size={20} />} label="My Orders" currentPath={pathname} />
          
          <div className="h-4"></div> 

          <p className="px-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 opacity-70">Tools</p>
          
          <NavLink href="/seller/developer" icon={<Code size={20} />} label="Developer API" currentPath={pathname} />
          <NavLink href="/seller/invoices" icon={<FileText size={20} />} label="Invoices" currentPath={pathname} />
          <NavLink href="/seller/settings" icon={<Settings size={20} />} label="Settings" currentPath={pathname} />
        </nav>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800/50 space-y-3 bg-slate-50/50 dark:bg-[#0B1121]/90 backdrop-blur-sm">
          
          {/* 🌓 THEME TOGGLE */}
          <motion.button 
            whileTap={{ scale: 0.95 }}
            onClick={toggleTheme}
            className="flex items-center justify-between w-full px-4 py-3 rounded-2xl bg-white dark:bg-[#151e32] border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-600 dark:text-slate-300 transition-colors shadow-sm hover:border-blue-500/30"
          >
            <span className="flex items-center gap-3">
                {isDarkMode ? <Moon size={16} className="text-violet-400 fill-violet-400/20"/> : <Sun size={16} className="text-orange-500 fill-orange-500/20"/>}
                <span>{isDarkMode ? "Dark Mode" : "Light Mode"}</span>
            </span>
            <div className={`w-9 h-5 rounded-full relative transition-colors duration-300 ${isDarkMode ? "bg-violet-600" : "bg-slate-200"}`}>
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
            whileHover={{ backgroundColor: "rgba(239, 68, 68, 0.1)", color: "#ef4444" }}
            whileTap={{ scale: 0.98 }}
            onClick={handleLogout} 
            className="flex items-center justify-center gap-3 px-4 py-3 text-slate-500 w-full rounded-2xl transition-all font-bold text-xs border border-transparent hover:border-red-200 dark:hover:border-red-900/30"
          >
            <LogOut size={16} /> <span>Sign Out</span>
          </motion.button>
        </div>
      </motion.aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative z-10">
          <div className="h-16 md:hidden flex-shrink-0"></div> 
          <main className="flex-1 overflow-y-auto p-4 md:p-8 scroll-smooth no-scrollbar">
            <motion.div
              key={pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              {children}
            </motion.div>
          </main>
      </div>
    </div>
  );
}

// 🎨 REDESIGNED NAV LINK
function NavLink({ href, icon, label, currentPath }: any) {
    const isActive = currentPath === href;
    
    return (
        <Link href={href} className="block relative group mb-1">
            {isActive && (
                <motion.div 
                    layoutId="activeNavBackground"
                    className="absolute inset-0 bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 rounded-xl shadow-lg shadow-blue-500/20 dark:shadow-blue-900/40"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
            )}

            <div className={`relative flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300
                ${isActive ? 'text-white' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}
            `}>
                {!isActive && (
                    <div className="absolute inset-0 bg-slate-200/50 dark:bg-[#151e32] rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-300 scale-90 group-hover:scale-100 origin-center" />
                )}

                <div className="relative z-10 transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3">
                    {icon}
                </div>
                <span className="relative z-10 tracking-wide">{label}</span>
                
                {isActive && (
                    <motion.div 
                        initial={{ scale: 0 }} animate={{ scale: 1 }}
                        className="absolute right-3 w-1.5 h-1.5 bg-white rounded-full shadow-[0_0_8px_white]"
                    />
                )}
            </div>
        </Link>
    );
}