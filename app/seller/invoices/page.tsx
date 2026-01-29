"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { generateInvoice } from "@/lib/invoiceGenerator"; 
import { 
  FileText, Download, Search, Loader2, User, MapPin, 
  Receipt, Calendar, Box
} from "lucide-react";
import { motion } from "framer-motion";

// 🎭 ANIMATION VARIANTS
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 200, damping: 20 } }
};

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // 1. Get Profile
    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    setProfile(profileData);

    // 2. Get Paid Shipments
    const { data: shipments, error } = await supabase
      .from('shipments')
      .select('*')
      .eq('user_id', user.id)
      .eq('payment_status', 'paid') 
      .order('created_at', { ascending: false });

    if (!error) setInvoices(shipments || []);
  };

  const filteredInvoices = invoices.filter(inv => 
    inv.awb_code.toLowerCase().includes(search.toLowerCase()) ||
    inv.receiver_name.toLowerCase().includes(search.toLowerCase()) ||
    inv.receiver_city.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <motion.div 
      initial="hidden" animate="visible" variants={containerVariants}
      className="max-w-6xl mx-auto space-y-8 pb-20 px-4 md:px-0 relative"
    >
      {/* ✨ Background Glows */}
      <div className="fixed top-20 right-20 w-96 h-96 bg-violet-500/10 dark:bg-violet-500/5 rounded-full blur-[100px] pointer-events-none -z-10" />
      <div className="fixed bottom-20 left-20 w-96 h-96 bg-cyan-500/10 dark:bg-cyan-500/5 rounded-full blur-[100px] pointer-events-none -z-10" />

      {/* 🟢 HEADER */}
      <motion.div variants={itemVariants} className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
            <h1 className="text-3xl font-black text-slate-900 dark:text-white flex items-center gap-3 tracking-tight">
                <div className="p-2.5 bg-gradient-to-br from-violet-500 to-fuchsia-600 rounded-xl text-white shadow-lg shadow-violet-500/20">
                    <FileText size={24}/>
                </div>
                Invoices
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 font-medium ml-1">
                Access and download GST compliant tax invoices.
            </p>
        </div>
      </motion.div>

      {/* 🔍 SEARCH BAR */}
      <motion.div variants={itemVariants} className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-2 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none">
        <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20}/>
            <input 
                type="text" 
                placeholder="Search by AWB, Name or City..." 
                className="w-full pl-12 pr-4 py-3 bg-transparent text-slate-900 dark:text-white placeholder-slate-500 outline-none text-sm font-medium"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
            />
        </div>
      </motion.div>

      {/* 📄 INVOICE TABLE */}
      <motion.div variants={itemVariants} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-400">
                <thead className="bg-slate-50 dark:bg-slate-950/50 text-xs uppercase font-bold text-slate-500 dark:text-slate-400">
                    <tr>
                        <th className="p-5 pl-6">AWB Number</th>
                        <th className="p-5">Date</th>
                        <th className="p-5">Sender</th>
                        <th className="p-5">Receiver</th>
                        <th className="p-5">City</th>
                        <th className="p-5 text-right pr-6">Download</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                    {filteredInvoices.length === 0 ? (
                        <tr>
                            <td colSpan={6} className="p-12 text-center">
                                <div className="flex flex-col items-center gap-3">
                                    <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800/50 rounded-full flex items-center justify-center text-slate-400">
                                        <Search size={24}/>
                                    </div>
                                    <p className="text-slate-500 font-medium">No invoices found matching your search.</p>
                                </div>
                            </td>
                        </tr>
                    ) : (
                        filteredInvoices.map((inv) => (
                            <motion.tr 
                                key={inv.id} 
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                whileHover={{ backgroundColor: "rgba(30, 41, 59, 0.3)" }} 
                                className="group transition-colors"
                            >
                                <td className="p-5 pl-6">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-violet-500/10 text-violet-500 flex items-center justify-center shrink-0">
                                            <Box size={14}/>
                                        </div>
                                        <span className="font-mono font-bold text-violet-600 dark:text-violet-400">
                                            {inv.awb_code}
                                        </span>
                                    </div>
                                </td>
                                <td className="p-5">
                                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                                        <Calendar size={14} className="text-slate-400"/>
                                        {new Date(inv.created_at).toLocaleDateString()}
                                    </div>
                                </td>
                                <td className="p-5">
                                    <div className="flex items-center gap-2">
                                        <User size={14} className="text-slate-400"/> 
                                        <span className="font-medium text-slate-700 dark:text-slate-200 truncate max-w-[120px]" title={inv.sender_name}>
                                            {inv.sender_name}
                                        </span>
                                    </div>
                                </td>
                                <td className="p-5">
                                    <span className="block font-medium text-slate-700 dark:text-slate-200 truncate max-w-[150px]" title={inv.receiver_name}>
                                        {inv.receiver_name}
                                    </span>
                                </td>
                                <td className="p-5">
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-xs border border-slate-200 dark:border-slate-700">
                                        <MapPin size={10} className="text-violet-500"/> 
                                        {inv.receiver_city || "N/A"}
                                    </span>
                                </td>
                                <td className="p-5 text-right pr-6">
                                    <motion.button 
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => generateInvoice(inv, profile)}
                                        className="bg-slate-100 dark:bg-slate-800 hover:bg-violet-600 hover:text-white text-slate-600 dark:text-slate-300 px-4 py-2 rounded-xl transition-all shadow-sm flex items-center gap-2 ml-auto text-xs font-bold border border-slate-200 dark:border-slate-700 group-hover:border-violet-500/50"
                                    >
                                        <Download size={14}/> <span>PDF</span>
                                    </motion.button>
                                </td>
                            </motion.tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
      </motion.div>
    </motion.div>
  );
}