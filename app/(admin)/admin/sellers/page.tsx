"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { 
  Building2, ChevronRight, Loader2, Plus, X, 
  CheckCircle, AlertTriangle, RefreshCw, Mail, Phone, Hash 
} from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

// 🎭 ANIMATION VARIANTS
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 200, damping: 20 } }
};

// 💎 INPUT STYLE
const inputClass = `
  w-full bg-gray-50 dark:bg-[#111827] 
  border border-gray-200 dark:border-gray-700 
  text-gray-900 dark:text-white 
  rounded-xl p-3.5 text-sm outline-none 
  focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 
  transition-all placeholder-gray-400 dark:placeholder-gray-500
`;

export default function AdminSellersPage() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false); 
  const [sellers, setSellers] = useState<any[]>([]);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [formData, setFormData] = useState({
    email: "", password: "", business_name: "", phone: "", gst_number: ""
  });

  useEffect(() => {
    fetchSellers();
  }, []);

  const fetchSellers = async () => {
    setRefreshing(true); 
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .not('business_name', 'is', null)
      .order('created_at', { ascending: false });

    if (error) console.error("Error fetching sellers:", error);
    setSellers(data || []);
    setLoading(false);
    setRefreshing(false); 
  };

  const handleCreatePartner = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);

    try {
        const res = await fetch('/api/admin/create-partner', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });

        const data = await res.json();

        if (!res.ok) throw new Error(data.error);

        alert("✅ Partner Account Created Successfully!");
        setIsModalOpen(false);
        setFormData({ email: "", password: "", business_name: "", phone: "", gst_number: "" }); 
        fetchSellers(); 

    } catch (error: any) {
        alert("❌ Failed: " + error.message);
    } finally {
        setCreating(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#050b14] text-blue-500 gap-3">
        <Loader2 className="animate-spin" size={32}/> <span className="font-medium animate-pulse tracking-widest">LOADING PARTNERS...</span>
    </div>
  );

  return (
    <motion.div 
      initial="hidden" animate="visible" variants={containerVariants}
      className="min-h-screen bg-gray-50 dark:bg-[#050b14] p-4 md:p-8 relative overflow-x-hidden transition-colors duration-500"
    >
      
      {/* 🔮 Background Atmosphere */}
      <div className="fixed top-[-20%] right-[-10%] w-[800px] h-[800px] bg-blue-100/40 dark:bg-blue-900/10 rounded-full blur-[150px] pointer-events-none" />
      <div className="fixed bottom-[-20%] left-[-10%] w-[800px] h-[800px] bg-indigo-100/40 dark:bg-indigo-900/10 rounded-full blur-[150px] pointer-events-none" />

      {/* Header Actions */}
      <div className="flex justify-between items-center mb-8 relative z-10">
        <div>
            <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-3">
                B2B Partners
                <span className="flex h-3 w-3 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
                </span>
            </h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm font-medium mt-1">Manage registered sellers & businesses.</p>
        </div>
        
        <div className="flex items-center gap-3">
            <button 
                onClick={fetchSellers}
                className="p-3 bg-white dark:bg-[#111827] border border-gray-200 dark:border-gray-800 rounded-xl text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-300 dark:hover:border-blue-900 transition-all shadow-sm"
                title="Refresh List"
            >
                <RefreshCw size={20} className={refreshing ? "animate-spin" : ""} />
            </button>

            <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsModalOpen(true)}
                className="hidden md:flex bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl font-bold text-sm items-center gap-2 shadow-lg shadow-blue-500/20 transition-all"
            >
                <Plus size={20} /> Add Partner
            </motion.button>
        </div>
      </div>

      {/* Partner List Grid */}
      <AnimatePresence>
        {sellers.length === 0 ? (
            <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="text-center py-20 bg-white/50 dark:bg-[#111827]/50 rounded-3xl border border-dashed border-gray-300 dark:border-gray-800 backdrop-blur-sm"
            >
                <Building2 size={48} className="mx-auto text-gray-300 dark:text-gray-700 mb-4"/>
                <p className="text-gray-500 dark:text-gray-400 font-medium">No partners found in the system.</p>
            </motion.div>
        ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10">
                {sellers.map((seller) => (
                    <Link key={seller.id} href={`/admin/sellers/${seller.id}`}>
                        <motion.div 
                            variants={itemVariants}
                            whileHover={{ y: -5 }}
                            className="bg-white dark:bg-[#0a101f] border border-gray-200 dark:border-[#1e293b] p-6 rounded-3xl cursor-pointer group transition-all shadow-sm hover:shadow-xl hover:border-blue-300 dark:hover:border-blue-900 relative overflow-hidden"
                        >
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            
                            <div className="flex items-start justify-between mb-6">
                                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-2xl text-blue-600 dark:text-blue-400 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                    <Building2 size={24}/>
                                </div>
                                <div className="p-2 rounded-full bg-gray-50 dark:bg-gray-800 text-gray-400 group-hover:text-blue-500 transition-colors">
                                    <ChevronRight size={16}/>
                                </div>
                            </div>

                            <div className="mb-6">
                                <h3 className="font-black text-lg text-gray-900 dark:text-white truncate" title={seller.business_name}>
                                    {seller.business_name}
                                </h3>
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mt-1">ID: {seller.id.slice(0,8)}...</p>
                            </div>
                            
                            <div className="space-y-3 pt-6 border-t border-gray-100 dark:border-gray-800">
                                <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                                    <Mail size={16} className="text-gray-400"/>
                                    <span className="truncate">{seller.email}</span>
                                </div>
                                <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                                    <Phone size={16} className="text-gray-400"/>
                                    <span>{seller.phone || "Not Provided"}</span>
                                </div>
                                <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                                    <Hash size={16} className="text-gray-400"/>
                                    <span className="font-mono text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-md">{seller.gst_number || "NO GST"}</span>
                                </div>
                            </div>
                        </motion.div>
                    </Link>
                ))}
            </div>
        )}
      </AnimatePresence>

      {/* 🟢 FAB for Mobile */}
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsModalOpen(true)}
        className="md:hidden fixed bottom-6 right-6 w-14 h-14 bg-blue-600 text-white rounded-full shadow-2xl flex items-center justify-center z-50"
      >
        <Plus size={28} />
      </motion.button>

      {/* 🟦 ADD PARTNER MODAL */}
      <AnimatePresence>
        {isModalOpen && (
            <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4"
            >
                <motion.div 
                    initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                    className="bg-white dark:bg-[#0B1121] border border-gray-200 dark:border-gray-700 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden relative"
                >
                    {/* Header */}
                    <div className="flex justify-between items-center p-6 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50">
                        <div>
                            <h2 className="text-xl font-black text-gray-900 dark:text-white">Add New Partner</h2>
                            <p className="text-xs text-gray-500 font-medium mt-1">Create a dedicated seller account.</p>
                        </div>
                        <button onClick={() => setIsModalOpen(false)} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-800 text-gray-500 transition-colors">
                            <X size={20}/>
                        </button>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleCreatePartner} className="p-6 space-y-5">
                        
                        <div>
                            <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1.5 block">Business Name *</label>
                            <input required name="business_name" value={formData.business_name} onChange={handleChange} 
                                className={inputClass} placeholder="e.g. Acme Logistics"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1.5 block">Email *</label>
                                <input required type="email" name="email" value={formData.email} onChange={handleChange} 
                                    className={inputClass} placeholder="partner@mail.com"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1.5 block">Phone</label>
                                <input required name="phone" value={formData.phone} onChange={handleChange} 
                                    className={inputClass} placeholder="9876543210"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1.5 block">Password *</label>
                            <input required type="password" name="password" value={formData.password} onChange={handleChange} 
                                className={inputClass} placeholder="Min 6 characters"
                            />
                        </div>

                        <div>
                            <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1.5 block">GST Number (Optional)</label>
                            <input name="gst_number" value={formData.gst_number} onChange={handleChange} 
                                className={inputClass} placeholder="GSTIN..."
                            />
                        </div>

                        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/50 p-4 rounded-xl flex gap-3">
                            <AlertTriangle className="text-blue-600 dark:text-blue-400 shrink-0" size={20}/>
                            <p className="text-xs text-blue-800 dark:text-blue-200 leading-relaxed font-medium">
                                This creates a secure <b>Seller Account</b>. The partner can login immediately using these credentials.
                            </p>
                        </div>

                        <div className="pt-2">
                            <motion.button 
                                whileTap={{ scale: 0.98 }}
                                type="submit" 
                                disabled={creating}
                                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3.5 rounded-xl transition-all flex justify-center items-center gap-2 shadow-lg shadow-blue-500/25"
                            >
                                {creating ? <Loader2 className="animate-spin"/> : <><CheckCircle size={18}/> Create Account</>}
                            </motion.button>
                        </div>

                    </form>
                </motion.div>
            </motion.div>
        )}
      </AnimatePresence>

    </motion.div>
  );
}