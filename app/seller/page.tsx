"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Box, TrendingUp, CheckCircle, Plus, Code, ArrowRight } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

// 🎭 ANIMATION VARIANTS
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 200, damping: 20 } }
};

export default function SellerDashboard() {
  const [stats, setStats] = useState({ total: 0, active: 0, delivered: 0 });

  useEffect(() => {
    async function loadStats() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { count: total } = await supabase.from('shipments').select('*', { count: 'exact', head: true }).eq('user_id', user.id);
      const { count: active } = await supabase.from('shipments').select('*', { count: 'exact', head: true }).eq('user_id', user.id).in('current_status', ['created', 'picked_up', 'in_transit']);
      
      setStats({ 
        total: total || 0, 
        active: active || 0, 
        delivered: (total || 0) - (active || 0) 
      });
    }
    loadStats();
  }, []);

  return (
    <motion.div 
      initial="hidden" animate="visible" variants={containerVariants}
      className="max-w-6xl mx-auto space-y-8 relative pb-10"
    >
      {/* ☁️ SOFT EYE-CARE BACKGROUND */}
      {/* This creates a soft grey/blue tint over the whole page in light mode */}
      <div className="fixed inset-0 bg-slate-100/80 dark:bg-slate-950 pointer-events-none -z-20" />
      
      {/* 🌑 Subtle Blobs (Reduced Opacity for less glare) */}
      <div className="fixed top-0 left-0 w-full h-[500px] bg-gradient-to-b from-blue-100/40 to-transparent dark:from-blue-900/10 pointer-events-none -z-10" />

      {/* 🟢 HEADER */}
      <motion.div variants={itemVariants}>
        <h1 className="text-3xl md:text-4xl font-black text-slate-800 dark:text-slate-100 tracking-tight">
          Overview
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium">
          Your logistics snapshot for today.
        </p>
      </motion.div>

      {/* 📊 STATS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard 
            title="Active Shipments" 
            value={stats.active} 
            icon={<TrendingUp size={24}/>} 
            color="blue"
            desc="Orders in transit"
        />
        <StatCard 
            title="Total Orders" 
            value={stats.total} 
            icon={<Box size={24}/>} 
            color="purple"
            desc="Lifetime volume"
        />
        <StatCard 
            title="Delivered" 
            value={stats.delivered} 
            icon={<CheckCircle size={24}/>} 
            color="emerald"
            desc="Successfully completed"
        />
      </div>
      
      {/* 🚀 QUICK ACTIONS - Matte Finish */}
      <motion.div variants={itemVariants} className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200/60 dark:border-slate-800 rounded-3xl p-8 md:p-10 text-center shadow-sm relative overflow-hidden group">
        
        {/* Soft Top Gradient Line */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400/50 via-purple-400/50 to-pink-400/50"></div>

        <h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-3 relative z-10">
            Ready to Ship?
        </h3>
        <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-md mx-auto relative z-10 text-sm md:text-base">
            Create a new shipment manually for individual orders or integrate our API for automated bulk processing.
        </p>
        
        <div className="flex flex-col sm:flex-row justify-center gap-4 relative z-10">
            <Link href="/seller/create">
                <motion.button 
                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.95 }}
                    className="w-full sm:w-auto bg-slate-800 dark:bg-blue-600 hover:bg-slate-700 dark:hover:bg-blue-500 text-white px-8 py-3.5 rounded-xl font-bold transition-all shadow-lg shadow-slate-300/50 dark:shadow-blue-900/30 flex items-center justify-center gap-2"
                >
                    <Plus size={18} strokeWidth={3}/> Create Shipment
                </motion.button>
            </Link>
            
            <Link href="/seller/developer">
                <motion.button 
                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.95 }}
                    className="w-full sm:w-auto bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-white px-8 py-3.5 rounded-xl font-bold transition-all flex items-center justify-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-700"
                >
                    <Code size={18} strokeWidth={3}/> API Integration
                </motion.button>
            </Link>
        </div>
      </motion.div>
    </motion.div>
  );
}

// 🧩 STAT CARD COMPONENT (Matte Design)
function StatCard({ title, value, icon, color, desc }: any) {
    const colorStyles: any = {
        blue: "bg-blue-100 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400",
        purple: "bg-purple-100 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400",
        emerald: "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400",
    };

    return (
        <motion.div 
            variants={itemVariants}
            whileHover={{ y: -4 }}
            className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200/50 dark:border-slate-800 p-6 rounded-3xl shadow-sm hover:shadow-md transition-all relative overflow-hidden"
        >
            <div className="flex justify-between items-start">
                <div>
                    <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">{title}</p>
                    <p className="text-4xl font-black text-slate-800 dark:text-white mb-2 tracking-tight">{value}</p>
                    <p className="text-[11px] font-medium text-slate-400 dark:text-slate-500 flex items-center gap-1 bg-slate-50 dark:bg-slate-800/50 px-2 py-1 rounded-lg w-fit">
                        <ArrowRight size={10} /> {desc}
                    </p>
                </div>
                <div className={`p-4 rounded-2xl ${colorStyles[color]}`}>
                    {icon}
                </div>
            </div>
        </motion.div>
    );
}