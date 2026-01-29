"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { 
  User, Building2, MapPin, Save, Loader2, 
  Lock, ShieldCheck, Mail, Phone, Settings as SettingsIcon 
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

// 💎 PREMIUM INPUT STYLE
const inputClass = `
  w-full bg-slate-50 dark:bg-slate-950/50 
  border border-slate-200 dark:border-slate-800 
  text-slate-900 dark:text-white 
  rounded-xl p-3.5 
  outline-none 
  focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 
  transition-all duration-300 
  placeholder-slate-400 dark:placeholder-slate-600 
  text-sm font-medium backdrop-blur-sm
`;

export default function SettingsPage() {
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  
  // Profile State
  const [profile, setProfile] = useState({
    id: "",
    email: "",
    full_name: "",
    business_name: "",
    phone: "",
    address: "",
    gst_number: "", 
  });

  // Password State
  const [passwords, setPasswords] = useState({ new: "", confirm: "" });

  useEffect(() => {
    const getProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (data) {
        setProfile({
            id: user.id,
            email: user.email || "",
            full_name: data.full_name || "",
            business_name: data.business_name || "",
            phone: data.phone || "",
            address: data.address || "",
            gst_number: data.gst_number || ""
        });
      }
      setFetching(false);
    };
    getProfile();
  }, []);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: profile.full_name,
        business_name: profile.business_name,
        phone: profile.phone,
        address: profile.address,
        gst_number: profile.gst_number
      })
      .eq('id', profile.id);

    if (error) {
      alert("Failed to update profile: " + error.message);
    } else {
      alert("✅ Profile updated successfully!");
    }
    setLoading(false);
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwords.new !== passwords.confirm) {
        alert("Passwords do not match!");
        return;
    }
    if (passwords.new.length < 6) {
        alert("Password must be at least 6 characters.");
        return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: passwords.new });

    if (error) {
        alert("Error changing password: " + error.message);
    } else {
        alert("✅ Password changed successfully!");
        setPasswords({ new: "", confirm: "" });
    }
    setLoading(false);
  };

  if (fetching) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 text-slate-400 gap-4">
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}>
            <Loader2 className="text-blue-500" size={40}/> 
        </motion.div>
        <p className="animate-pulse font-medium">Loading Settings...</p>
    </div>
  );

  return (
    <motion.div 
      initial="hidden" animate="visible" variants={containerVariants}
      className="max-w-5xl mx-auto space-y-8 pb-20 px-4 md:px-0 relative"
    >
      {/* ✨ Background Glows */}
      <div className="fixed top-20 right-20 w-96 h-96 bg-blue-500/10 dark:bg-blue-500/5 rounded-full blur-[100px] pointer-events-none -z-10" />
      <div className="fixed bottom-20 left-20 w-96 h-96 bg-purple-500/10 dark:bg-purple-500/5 rounded-full blur-[100px] pointer-events-none -z-10" />

      {/* 🟢 HEADER */}
      <motion.div variants={itemVariants} className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
            <h1 className="text-3xl font-black text-slate-900 dark:text-white flex items-center gap-3 tracking-tight">
                <div className="p-2.5 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl text-white shadow-lg shadow-blue-500/20">
                    <SettingsIcon size={24}/>
                </div>
                Account Settings
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 font-medium ml-1">
                Manage your business profile and security preferences.
            </p>
        </div>
      </motion.div>

      <div className="grid lg:grid-cols-3 gap-8">
        
        {/* 📝 LEFT: BUSINESS PROFILE FORM */}
        <motion.div variants={itemVariants} className="lg:col-span-2 space-y-6">
            <form onSubmit={handleUpdateProfile} className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-3xl p-6 md:p-8 shadow-xl shadow-slate-200/50 dark:shadow-none relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-blue-500 to-cyan-500"></div>
                
                <div className="border-b border-slate-100 dark:border-slate-800 pb-4 mb-6">
                    <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 text-lg">
                        <Building2 size={20} className="text-blue-500"/> Business Details
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        This info appears on your shipping labels and invoices.
                    </p>
                </div>

                <div className="grid md:grid-cols-2 gap-5">
                    <div>
                        <label className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 block">Business Name</label>
                        <input type="text" value={profile.business_name} onChange={e => setProfile({...profile, business_name: e.target.value})}
                            className={inputClass} />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 block">GST Number (Optional)</label>
                        <input type="text" value={profile.gst_number} onChange={e => setProfile({...profile, gst_number: e.target.value})}
                            className={inputClass} />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 block">Contact Person</label>
                        <input type="text" value={profile.full_name} onChange={e => setProfile({...profile, full_name: e.target.value})}
                            className={inputClass} />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 block">Phone Number</label>
                        <input type="text" value={profile.phone} onChange={e => setProfile({...profile, phone: e.target.value})}
                            className={inputClass} />
                    </div>
                </div>

                <div className="mt-5">
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 block">Default Pickup Address</label>
                    <textarea rows={3} value={profile.address} onChange={e => setProfile({...profile, address: e.target.value})}
                        className={`${inputClass} resize-none`} />
                </div>

                <div className="flex justify-end pt-6">
                    <motion.button 
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        disabled={loading} 
                        className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl font-bold text-sm flex items-center gap-2 transition-all shadow-lg shadow-blue-500/20"
                    >
                        {loading ? <Loader2 className="animate-spin" size={18}/> : <Save size={18}/>} Save Changes
                    </motion.button>
                </div>
            </form>
        </motion.div>

        {/* 🔐 RIGHT: SECURITY & LOGIN INFO */}
        <motion.div variants={itemVariants} className="space-y-6">
            
            {/* Login Info (Read Only) */}
            <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-xl shadow-slate-200/50 dark:shadow-none relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-emerald-400 to-green-600"></div>
                
                <h3 className="font-bold flex items-center gap-2 mb-4 text-slate-900 dark:text-white">
                    <ShieldCheck size={20} className="text-emerald-500"/> Login Details
                </h3>
                <div className="space-y-4 text-sm">
                    <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-950/50 border border-slate-100 dark:border-slate-800 p-3 rounded-xl">
                        <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-500">
                            <Mail size={16}/>
                        </div>
                        <div>
                            <p className="text-[10px] uppercase font-bold text-slate-400">Email Address</p>
                            <p className="font-bold text-slate-700 dark:text-white truncate max-w-[180px]">{profile.email}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-950/50 border border-slate-100 dark:border-slate-800 p-3 rounded-xl">
                        <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-500">
                            <User size={16}/>
                        </div>
                        <div>
                            <p className="text-[10px] uppercase font-bold text-slate-400">User ID</p>
                            <p className="font-mono text-xs text-slate-600 dark:text-slate-300">{profile.id.slice(0, 18)}...</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Change Password */}
            <form onSubmit={handleUpdatePassword} className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xl shadow-slate-200/50 dark:shadow-none relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-orange-400 to-red-500"></div>
                
                <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-4">
                    <Lock size={20} className="text-orange-500"/> Change Password
                </h3>
                
                <div className="space-y-4">
                    <div>
                        <label className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 block">New Password</label>
                        <input type="password" required minLength={6}
                            value={passwords.new} onChange={e => setPasswords({...passwords, new: e.target.value})}
                            className={inputClass} />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 block">Confirm Password</label>
                        <input type="password" required minLength={6}
                            value={passwords.confirm} onChange={e => setPasswords({...passwords, confirm: e.target.value})}
                            className={inputClass} />
                    </div>
                    <motion.button 
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        disabled={loading} 
                        className="w-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-white py-3 rounded-xl font-bold text-sm transition-all border border-slate-200 dark:border-slate-700"
                    >
                        Update Password
                    </motion.button>
                </div>
            </form>

        </motion.div>
      </div>
    </motion.div>
  );
}