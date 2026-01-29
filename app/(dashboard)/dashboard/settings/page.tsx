"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { User, Building, Phone, MapPin, Save, Loader2, Mail } from "lucide-react";
import { useRouter } from "next/navigation";

export default function SettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);

  const [formData, setFormData] = useState({
    email: "", 
    fullName: "",
    companyName: "",
    phone: "",
    address: "",
  });

  // --- HELPER: Get Local Time (IST) for Database ---
  // This calculates the exact time on your computer (e.g., 5:30 PM) 
  // and formats it so the database stores exactly that number.
  const getLocalTime = () => {
    const now = new Date();
    const offsetMs = now.getTimezoneOffset() * 60 * 1000; // Get timezone offset in ms
    const localTime = new Date(now.getTime() - offsetMs); // Adjust time
    return localTime.toISOString().slice(0, -1); // Remove 'Z' to prevent UTC conversion
  };

  useEffect(() => {
    const getProfile = async () => {
      // 1. Get Auth User
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push("/login");
        return;
      }

      setUser(user);

      // 2. Get Profile Data
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      // 3. Set Form Data
      setFormData({
        email: user.email || "", 
        fullName: profile?.full_name || "",
        companyName: profile?.company_name || "",
        phone: profile?.phone || "",
        address: profile?.address || "",
      });
    };
    
    getProfile();
  }, [router]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);

    const { error } = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        full_name: formData.fullName,
        company_name: formData.companyName,
        phone: formData.phone,
        address: formData.address,
        email: user.email,
        updated_at: getLocalTime(), // ✅ Sends "2026-01-09T17:30:00" (IST)
      });

    setLoading(false);

    if (error) {
      console.error(error);
      alert("Error updating: " + error.message);
    } else {
      alert("✅ Profile updated successfully!");
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Account Settings</h1>
      <p className="text-slate-500 dark:text-slate-400 mb-8">Manage your default shipment details.</p>

      <form onSubmit={handleUpdate} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 shadow-sm">
        
        {/* Email Address (Locked) */}
        <div className="mb-6">
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2 flex items-center gap-1">
                <Mail size={14} /> Email Address
            </label>
            <input 
                value={formData.email}
                disabled
                readOnly
                className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 cursor-not-allowed opacity-80"
            />
            <p className="text-[10px] text-slate-400 mt-1">To change your email, please contact support.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-6">
            {/* Full Name */}
            <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2 flex items-center gap-1">
                    <User size={14} /> Full Name
                </label>
                <input 
                    value={formData.fullName}
                    onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                    placeholder="John Doe"
                    className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-slate-900 dark:focus:ring-white outline-none transition-all"
                />
            </div>

            {/* Company Name */}
            <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2 flex items-center gap-1">
                    <Building size={14} /> Company (Optional)
                </label>
                <input 
                    value={formData.companyName}
                    onChange={(e) => setFormData({...formData, companyName: e.target.value})}
                    placeholder="Universal Ltd."
                    className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-slate-900 dark:focus:ring-white outline-none transition-all"
                />
            </div>
        </div>

        {/* Phone Number */}
        <div className="mb-6">
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2 flex items-center gap-1">
                <Phone size={14} /> Phone Number
            </label>
            <input 
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                placeholder="+91 98765 43210"
                className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-slate-900 dark:focus:ring-white outline-none transition-all"
            />
        </div>

        {/* Address */}
        <div className="mb-8">
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1 flex items-center gap-1">
                <MapPin size={14} /> Default Sender Address
            </label>
            <p className="text-xs text-slate-400 dark:text-slate-500 mb-2">This will autofill your future bookings.</p>
            <textarea 
                value={formData.address}
                onChange={(e) => setFormData({...formData, address: e.target.value})}
                placeholder="123 Main St, Mumbai, India..."
                className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-slate-900 dark:focus:ring-white outline-none transition-all min-h-[100px] resize-y"
            />
        </div>

        <button 
            type="submit" 
            disabled={loading}
            className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-colors hover:bg-slate-800 dark:hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
            {loading ? <Loader2 className="animate-spin" size={18}/> : <Save size={18} />}
            Save Changes
        </button>
      </form>
    </div>
  );
}