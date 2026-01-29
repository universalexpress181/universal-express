"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { 
  Users, Plus, Trash2, UserCheck, Loader2, Save, X, Briefcase, Mail, 
  Lock, KeyRound, Eye, RefreshCw, Phone, User as UserIcon 
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// 🎭 ANIMATION VARIANTS
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 200, damping: 20 } }
};

// 💎 INPUT STYLE
const inputClass = `
  w-full bg-white dark:bg-[#111827] 
  border border-gray-200 dark:border-gray-700 
  text-gray-900 dark:text-white 
  rounded-xl p-3 text-sm outline-none 
  focus:ring-2 focus:ring-indigo-500/50 dark:focus:ring-cyan-500/50 focus:border-indigo-500 dark:focus:border-cyan-500
  transition-all placeholder-gray-400 dark:placeholder-gray-500
`;

export default function StaffPage() {
  const [staff, setStaff] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [creating, setCreating] = useState(false);

  // Modal State for Credentials
  const [selectedStaff, setSelectedStaff] = useState<any | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [resetting, setResetting] = useState(false);

  // Create Form State
  const [formData, setFormData] = useState({
    name: "", phone: "", designation: "Delivery Partner", email: "", password: ""
  });

  useEffect(() => {
    fetchStaff();
  }, []);

  const fetchStaff = async () => {
    const { data } = await supabase.from('staff').select('*').order('name');
    if (data) setStaff(data);
    setLoading(false);
  };

  const handleCreateDriver = async () => {
    if (!formData.email || !formData.password || !formData.name) return alert("Please fill all fields");
    setCreating(true);

    try {
      const res = await fetch('/api/auth/create-driver', {
        method: 'POST',
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      alert("✅ Driver Account Created!");
      setFormData({ name: "", phone: "", designation: "Delivery Partner", email: "", password: "" });
      setShowForm(false);
      fetchStaff(); 
      
    } catch (error: any) {
      alert("Error: " + error.message);
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: number, authId: string) => {
    if(!confirm("Are you sure? This will delete the staff profile.")) return;
    await supabase.from('staff').delete().eq('id', id);
    setStaff(staff.filter(s => s.id !== id));
  };

  const handleResetPassword = async () => {
    if (!newPassword || newPassword.length < 6) return alert("Password must be at least 6 characters");
    if (!selectedStaff?.auth_id) return alert("Error: Missing Auth ID");

    setResetting(true);
    try {
        const res = await fetch('/api/auth/reset-password', {
            method: 'POST',
            body: JSON.stringify({ userId: selectedStaff.auth_id, newPassword }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);

        alert(`✅ Password updated for ${selectedStaff.name}!`);
        setNewPassword("");
        setSelectedStaff(null);
    } catch (error: any) {
        alert("Error: " + error.message);
    } finally {
        setResetting(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#050b14] text-indigo-500 gap-3">
        <Loader2 className="animate-spin" size={32}/> <span className="font-medium animate-pulse tracking-widest">LOADING TEAM...</span>
    </div>
  );

  return (
    <motion.div 
      initial="hidden" animate="visible" variants={containerVariants}
      className="min-h-screen bg-gray-50 dark:bg-[#050b14] p-4 md:p-8 relative overflow-x-hidden transition-colors duration-500"
    >
      
      {/* 🔮 Background Atmosphere */}
      <div className="fixed top-[-20%] right-[-10%] w-[800px] h-[800px] bg-indigo-200/40 dark:bg-cyan-900/10 rounded-full blur-[150px] pointer-events-none" />
      <div className="fixed bottom-[-20%] left-[-10%] w-[800px] h-[800px] bg-fuchsia-200/40 dark:bg-purple-900/10 rounded-full blur-[150px] pointer-events-none" />

      <div className="max-w-5xl mx-auto space-y-8 relative z-10">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
                <h1 className="text-3xl font-black text-gray-900 dark:text-white flex items-center gap-3 tracking-tight">
                    <div className="p-2.5 bg-indigo-600 dark:bg-cyan-600 rounded-xl text-white shadow-lg shadow-indigo-500/30">
                        <Users size={24} />
                    </div>
                    Staff Management
                </h1>
                <p className="text-gray-500 dark:text-gray-400 font-medium ml-1 mt-1">Manage delivery partners & internal team access.</p>
            </div>
            
            <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowForm(!showForm)}
                className={`px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg text-white ${
                    showForm 
                    ? 'bg-red-500 hover:bg-red-600 shadow-red-500/30' 
                    : 'bg-indigo-600 hover:bg-indigo-500 dark:bg-cyan-600 dark:hover:bg-cyan-500 shadow-indigo-500/30'
                }`}
            >
                {showForm ? <X size={20}/> : <Plus size={20}/>} {showForm ? "Cancel" : "Add Staff"}
            </motion.button>
        </div>

        {/* Add Staff Form */}
        <AnimatePresence>
            {showForm && (
                <motion.div 
                    initial={{ opacity: 0, height: 0 }} 
                    animate={{ opacity: 1, height: 'auto' }} 
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                >
                    <div className="bg-white dark:bg-[#0a101f] border border-gray-200 dark:border-[#1e293b] p-6 md:p-8 rounded-3xl shadow-xl relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-1.5 h-full bg-indigo-500 dark:bg-cyan-500"></div>
                        
                        <h3 className="text-gray-900 dark:text-white font-bold mb-6 flex items-center gap-2 text-lg">
                            <UserCheck size={22} className="text-indigo-600 dark:text-cyan-400"/> New Account Setup
                        </h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <p className="text-xs text-gray-400 dark:text-gray-500 font-bold uppercase tracking-wider">Profile Details</p>
                                <div>
                                    <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1.5 font-bold">Full Name</label>
                                    <input 
                                        value={formData.name} 
                                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                                        className={inputClass}
                                        placeholder="e.g. Rahul Sharma"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1.5 font-bold">Phone</label>
                                    <input 
                                        value={formData.phone} 
                                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                                        className={inputClass}
                                        placeholder="e.g. 9876543210"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1.5 font-bold">Designation</label>
                                    <input 
                                        value={formData.designation} 
                                        onChange={(e) => setFormData({...formData, designation: e.target.value})}
                                        className={inputClass}
                                    />
                                </div>
                            </div>

                            <div className="space-y-4">
                                <p className="text-xs text-indigo-500 dark:text-cyan-500 font-bold uppercase tracking-wider">Login Credentials</p>
                                <div>
                                    <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1.5 font-bold">Email (Username)</label>
                                    <div className="relative">
                                        <Mail size={16} className="absolute left-3.5 top-3.5 text-gray-400"/>
                                        <input 
                                            value={formData.email} 
                                            onChange={(e) => setFormData({...formData, email: e.target.value})}
                                            placeholder="driver@company.com"
                                            className={`${inputClass} pl-10`}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1.5 font-bold">Password</label>
                                    <div className="relative">
                                        <Lock size={16} className="absolute left-3.5 top-3.5 text-gray-400"/>
                                        <input 
                                            type="text"
                                            value={formData.password} 
                                            onChange={(e) => setFormData({...formData, password: e.target.value})}
                                            placeholder="Secret123"
                                            className={`${inputClass} pl-10 font-mono`}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end mt-8 pt-6 border-t border-gray-100 dark:border-gray-800">
                            <motion.button 
                                whileTap={{ scale: 0.98 }}
                                onClick={handleCreateDriver}
                                disabled={creating}
                                className="bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-3.5 rounded-xl font-bold flex justify-center items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all w-full md:w-auto"
                            >
                                {creating ? <Loader2 className="animate-spin" size={20}/> : <Save size={20}/>} Create Account
                            </motion.button>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>

        {/* Staff List */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {staff.map((s) => (
                <motion.div 
                    variants={itemVariants}
                    key={s.id} 
                    // ✨ ADDED HOVER CLASSES HERE: hover:bg-gray-50 dark:hover:bg-[#111827]
                    className="bg-white dark:bg-[#0a101f] border border-gray-200 dark:border-[#1e293b] p-5 rounded-3xl flex items-center justify-between hover:border-indigo-300 dark:hover:border-cyan-800 hover:bg-gray-50 dark:hover:bg-[#111827] hover:shadow-md transition-all shadow-sm group"
                >
                    <div className="flex items-center gap-4">
                        {/* Avatar */}
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 dark:from-[#111827] dark:to-[#1e293b] flex items-center justify-center text-gray-500 dark:text-gray-400 font-bold text-xl border border-gray-200 dark:border-gray-700 shadow-inner group-hover:scale-105 transition-transform">
                            {s.name.charAt(0)}
                        </div>
                        
                        {/* Info Section */}
                        <div>
                            <h3 className="font-bold text-gray-900 dark:text-white text-lg leading-tight group-hover:text-indigo-600 dark:group-hover:text-cyan-400 transition-colors">
                                {s.name}
                            </h3>
                            <p className="text-[10px] text-indigo-600 dark:text-cyan-400 font-bold uppercase tracking-wide mb-1.5 bg-indigo-50 dark:bg-cyan-900/20 px-2 py-0.5 rounded-md w-fit mt-1">
                                {s.designation}
                            </p>
                            
                            <div className="space-y-0.5 mt-2">
                                {s.phone && (
                                    <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-2">
                                        <Phone size={12} className="text-emerald-500"/> {s.phone}
                                    </p>
                                )}
                                {s.email && (
                                    <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-2">
                                        <Mail size={12} className="text-blue-500"/> {s.email}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="flex flex-col gap-2 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                            onClick={() => setSelectedStaff(s)}
                            title="Manage Login Details"
                            className="w-10 h-10 rounded-xl bg-gray-100 hover:bg-indigo-100 text-gray-500 hover:text-indigo-600 dark:bg-[#111827] dark:hover:bg-cyan-900/30 dark:text-gray-400 dark:hover:text-cyan-400 flex items-center justify-center transition-all border border-gray-200 dark:border-gray-700"
                        >
                            <KeyRound size={18}/>
                        </button>

                        <button 
                            onClick={() => handleDelete(s.id, s.auth_id)} 
                            title="Delete User"
                            className="w-10 h-10 rounded-xl bg-gray-100 hover:bg-red-100 text-gray-500 hover:text-red-600 dark:bg-[#111827] dark:hover:bg-red-900/20 dark:text-gray-400 dark:hover:text-red-400 flex items-center justify-center transition-all border border-gray-200 dark:border-gray-700"
                        >
                            <Trash2 size={18}/>
                        </button>
                    </div>
                </motion.div>
            ))}
        </div>

        {/* 🔐 CREDENTIALS POPUP MODAL */}
        <AnimatePresence>
            {selectedStaff && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <motion.div 
                        initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                        className="bg-white dark:bg-[#0a101f] border border-gray-200 dark:border-[#1e293b] w-full max-w-md rounded-3xl shadow-2xl overflow-hidden"
                    >
                        <div className="p-6 border-b border-gray-100 dark:border-[#1e293b] flex justify-between items-center bg-gray-50/50 dark:bg-[#111827]/50">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <Lock size={20} className="text-yellow-500"/> Login Details
                            </h3>
                            <button onClick={() => setSelectedStaff(null)} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-800 text-gray-500 transition-colors">
                                <X size={20}/>
                            </button>
                        </div>
                        
                        <div className="p-6 space-y-6">
                            <div className="bg-gray-50 dark:bg-[#111827] p-5 rounded-2xl border border-gray-100 dark:border-[#1e293b] space-y-4">
                                <div>
                                    <p className="text-xs text-gray-400 dark:text-gray-500 uppercase font-bold mb-1">Staff Member</p>
                                    <p className="text-gray-900 dark:text-white font-bold text-lg">{selectedStaff.name}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-400 dark:text-gray-500 uppercase font-bold mb-1">Username / Email</p>
                                    <div className="flex items-center gap-2 text-indigo-600 dark:text-cyan-400 font-mono bg-white dark:bg-[#0a101f] p-2.5 rounded-lg border border-gray-200 dark:border-gray-800 text-sm">
                                        <Mail size={14}/> {selectedStaff.email || "No email found"}
                                    </div>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-400 dark:text-gray-500 uppercase font-bold mb-1">Current Password</p>
                                    <p className="text-gray-500 dark:text-gray-400 italic text-xs flex items-center gap-2 bg-gray-100 dark:bg-[#0a101f] p-2 rounded-lg w-fit">
                                        <Eye size={12}/> Hidden (Encrypted)
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-3 pt-2 border-t border-gray-100 dark:border-gray-800">
                                <label className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                    <RefreshCw size={16} className="text-emerald-500"/> Set New Password
                                </label>
                                <div className="flex gap-2">
                                    <input 
                                        type="text" 
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        placeholder="Enter new password..."
                                        className="flex-1 bg-white dark:bg-[#111827] border border-gray-200 dark:border-gray-700 rounded-xl px-4 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500/50 outline-none transition-all text-sm"
                                    />
                                    <button 
                                        onClick={handleResetPassword}
                                        disabled={resetting || !newPassword}
                                        className="bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2.5 rounded-xl font-bold disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg shadow-emerald-500/20"
                                    >
                                        {resetting ? <Loader2 className="animate-spin" size={18}/> : "Update"}
                                    </button>
                                </div>
                                <p className="text-xs text-gray-500 dark:text-gray-400 pl-1">
                                    Tell this new password to the staff member immediately.
                                </p>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>

      </div>
    </motion.div>
  );
}