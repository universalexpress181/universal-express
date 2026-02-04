"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image"; 
import { usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase"; 
import { Globe, Search, Rocket, Menu, X, ChevronRight, LogIn, LayoutDashboard, Loader2 } from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";
import { motion, AnimatePresence } from "framer-motion";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // 🔐 AUTH STATE
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [dashboardPath, setDashboardPath] = useState("/dashboard");
  const [authLoading, setAuthLoading] = useState(true);

  // 1. Check Login Status & Role
  useEffect(() => {
    const checkUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          setIsLoggedIn(true);
          
          // Check Role for Redirection
          const { data: roleData } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', user.id)
            .maybeSingle();

          const role = roleData?.role;

          if (role === 'admin') setDashboardPath('/admin/shipments');
          else if (role === 'seller') setDashboardPath('/seller');
          else setDashboardPath('/dashboard'); // Default customer dashboard
        }
      } catch (error) {
        console.error("Auth check failed", error);
      } finally {
        setAuthLoading(false);
      }
    };

    checkUser();
  }, []);

  const closeMenu = () => setIsMobileMenuOpen(false);

  const menuVariants = {
    initial: { height: 0, opacity: 0 },
    animate: { 
      height: "auto", 
      opacity: 1, 
      transition: { type: "spring", stiffness: 250, damping: 25, staggerChildren: 0.05 } 
    },
    exit: { 
      height: 0, 
      opacity: 0, 
      transition: { duration: 0.2, ease: "easeInOut" } 
    }
  };

  const itemVariants = {
    initial: { x: -20, opacity: 0 },
    animate: { 
      x: 0, 
      opacity: 1, 
      transition: { type: "spring", stiffness: 300, damping: 30 } 
    }
  };

  return (
    <div className="min-h-screen flex flex-col font-sans transition-colors duration-300
      bg-slate-50 text-slate-900 
      dark:bg-slate-950 dark:text-slate-100 selection:bg-blue-100 dark:selection:bg-blue-900 relative overflow-x-hidden">
      
      {/* Background Decor */}
      <div className="fixed top-[-10%] right-[-5%] w-96 h-96 bg-blue-500/30 dark:bg-blue-600/10 rounded-full blur-3xl z-0 pointer-events-none" />
      <div className="fixed bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-orange-500/20 dark:bg-purple-600/10 rounded-full blur-3xl z-0 pointer-events-none" />

      {/* NAVBAR */}
      <header className="relative z-50 w-full sticky top-0 transition-colors duration-300
        border-b border-slate-200/60 dark:border-slate-800/60 
        bg-white/80 dark:bg-slate-950/80 
        backdrop-blur-xl shadow-sm">
        
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          
          {/* Logo Section */}
          <Link href="/" onClick={closeMenu} className="flex items-center gap-3 group z-50 relative">
            <div className="relative h-10 w-10 md:h-11 md:w-11 group-hover:scale-105 transition-transform duration-300">
               <Image 
                 src="/logo.png" 
                 alt="Universal Logo" 
                 fill 
                 className="object-contain" 
                 priority
               />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight text-slate-900 dark:text-white leading-none">UNIVERSAL</h1>
              <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 tracking-[0.2em] uppercase mt-0.5">Express</p>
            </div>
          </Link>

          {/* Navigation */}
          <nav className="flex items-center gap-2 md:gap-4 z-50 relative">
            
            {/* Desktop Links */}
            <div className="hidden md:flex items-center gap-2">
                <Link href="/" className={`flex items-center gap-2 text-sm font-bold transition-colors px-3 py-2 rounded-lg
                    ${pathname === '/' 
                        ? 'text-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400' 
                        : 'text-slate-600 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400'}`}>
                    <Search size={18} /> <span>Track</span>
                </Link>
                <Link href="/Partner-signup" className={`flex items-center gap-2 text-sm font-bold transition-colors px-3 py-2 rounded-lg
                    ${pathname === '/Partner-signup' 
                        ? 'text-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400' 
                        : 'text-slate-600 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400'}`}>
                    <Rocket size={18} /> <span>Become a Partner</span>
                </Link>
            </div>

            {/* 🟢 DYNAMIC LOGIN / DASHBOARD BUTTON */}
            {authLoading ? (
                <div className="h-10 w-24 bg-slate-100 dark:bg-slate-800 rounded-full animate-pulse" />
            ) : isLoggedIn ? (
                <Link href={dashboardPath} className="flex items-center gap-2 text-sm font-bold transition-all px-4 py-2 md:px-5 md:py-2.5 rounded-full hover:shadow-md text-white bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-500">
                    <LayoutDashboard size={18} /> <span className="hidden sm:inline">Dashboard</span>
                </Link>
            ) : (
                <Link href="/login" className="flex items-center gap-2 text-sm font-bold transition-all px-4 py-2 md:px-5 md:py-2.5 rounded-full hover:shadow-md text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500">
                    <LogIn size={18} /> <span className="hidden sm:inline">Login</span>
                </Link>
            )}

            <div className="pl-2 border-l border-slate-200 dark:border-slate-800 ml-1">
                <ThemeToggle />
            </div>

            {/* Mobile Toggle */}
            <button 
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors ml-1 active:scale-95"
            >
                {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </nav>
        </div>

        {/* --- MOBILE MENU --- */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div 
              variants={menuVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="md:hidden absolute top-full left-0 w-full overflow-hidden shadow-2xl
                bg-slate-50 dark:bg-slate-950 
                border-b border-slate-200 dark:border-slate-800"
            >
                <motion.div className="flex flex-col p-6 space-y-3">
                    <MobileNavLink 
                        href="/" 
                        icon={<Search size={24} />} 
                        title="Track Shipment" 
                        desc="Find your package instantly"
                        variants={itemVariants}
                        onClick={closeMenu}
                        isActive={pathname === '/'} 
                    />
                    <MobileNavLink 
                        href="/Partner-signup" 
                        icon={<Rocket size={24} />} 
                        title="Become a Partner" 
                        desc="Join our logistics network"
                        variants={itemVariants}
                        onClick={closeMenu}
                        isActive={pathname === '/Partner-signup'}
                    />
                    <motion.div variants={itemVariants} className="h-px w-full bg-slate-200 dark:bg-slate-800 my-2" />
                    
                    {/* Mobile Dashboard Link if Logged In */}
                    {isLoggedIn && (
                        <MobileNavLink 
                            href={dashboardPath}
                            icon={<LayoutDashboard size={24} />} 
                            title="My Dashboard" 
                            desc="Access your account"
                            variants={itemVariants}
                            onClick={closeMenu}
                            isActive={false}
                        />
                    )}

                    <MobileNavLink 
                        href="#" 
                        icon={<Globe size={24} />} 
                        title="Global Support" 
                        desc="Contact our 24/7 help center"
                        variants={itemVariants}
                        onClick={closeMenu}
                        isActive={false}
                    />
                </motion.div>
                
                <motion.div 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1, transition: { delay: 0.3 } }}
                    className="w-full text-center pb-6 opacity-40 text-[10px] font-bold uppercase tracking-widest text-slate-500 pointer-events-none"
                >
                    Universal Express
                </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

      </header>

      <main className="flex-1 relative z-10">{children}</main>
    </div>
  );
}

function MobileNavLink({ href, icon, title, desc, variants, onClick, isActive }: any) {
    return (
        <motion.div variants={variants}>
            <Link 
                href={href} 
                onClick={onClick}
                className={`
                    group flex items-center gap-5 p-4 rounded-2xl transition-all duration-200 border shadow-sm
                    hover:scale-[1.02] hover:shadow-md
                    ${isActive 
                        ? "bg-blue-50/80 dark:bg-blue-900/20 border-blue-500 dark:border-blue-400 ring-1 ring-blue-500/20" 
                        : "bg-white dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-700"
                    }
                `}
            >
                <div className={`
                    p-3.5 rounded-xl transition-colors
                    ${isActive 
                        ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" 
                        : "bg-slate-100 dark:bg-slate-800 text-blue-600 dark:text-blue-400 group-hover:bg-blue-50 dark:group-hover:bg-blue-900/30"
                    }
                `}>
                    {icon}
                </div>
                <div className="flex-1">
                    <h4 className={`
                        font-bold text-lg leading-tight mb-0.5 transition-colors
                        ${isActive ? "text-blue-700 dark:text-blue-300" : "text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400"}
                    `}>
                        {title}
                    </h4>
                    <p className={`
                        text-sm font-medium transition-colors
                        ${isActive ? "text-blue-600/70 dark:text-blue-400/70" : "text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-400"}
                    `}>
                        {desc}
                    </p>
                </div>
                <ChevronRight size={20} className={`
                    transition-all duration-300
                    ${isActive ? "text-blue-600 dark:text-blue-400" : "text-slate-300 group-hover:text-blue-500 group-hover:translate-x-1"}
                `} />
            </Link>
        </motion.div>
    );
}