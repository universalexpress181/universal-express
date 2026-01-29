"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { Rocket, Building2, User, Mail, Lock, Phone, MapPin, ArrowRight, Loader2 } from "lucide-react";
import Link from "next/link";

export default function PartnerSignupPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    businessName: "",
    contactName: "",
    email: "",
    phone: "",
    address: "",
    gst: "",
    password: ""
  });

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. Create Auth User
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
            data: { display_name: formData.businessName }
        }
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error("No user created");

      const userId = authData.user.id;

      // 2. Create Profile Entry
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
            id: userId,
            business_name: formData.businessName,
            full_name: formData.contactName,
            phone: formData.phone,
            address: formData.address,
            gst_number: formData.gst,
            email: formData.email
        });

      if (profileError) throw profileError;

      // 3. Assign 'seller' Role
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
            user_id: userId,
            role: 'seller'
        });

      if (roleError) throw roleError;

      // Success!
      alert("✅ Registration Successful! Please login to access your dashboard.");
      router.push('/login');

    } catch (error: any) {
      console.error(error);
      alert("❌ Registration Failed: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen py-20 px-4 flex justify-center items-center">
      <div className="w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 md:p-12 shadow-2xl relative overflow-hidden">
        
        {/* Decor */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>

        <div className="relative">
            <div className="flex items-center gap-3 mb-2">
                <div className="p-3 bg-blue-600 rounded-xl text-white shadow-lg shadow-blue-600/20">
                    <Rocket size={24} />
                </div>
                <h1 className="text-3xl font-black text-slate-900 dark:text-white">Partner Program</h1>
            </div>
            <p className="text-slate-500 dark:text-slate-400 mb-8 ml-1">Join 500+ businesses shipping smarter with Universal Express.</p>

            <form onSubmit={handleSignup} className="space-y-6">
                
                {/* Business Details Section */}
                <div className="space-y-4">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 border-b border-slate-200 dark:border-slate-800 pb-2 mb-4">Business Details</h3>
                    
                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-500 ml-1">Business Name</label>
                            <div className="relative">
                                <Building2 className="absolute left-3 top-3.5 text-slate-400" size={18}/>
                                <input required type="text" placeholder="Acme Logistics Ltd." 
                                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-3 pl-10 rounded-xl focus:border-blue-500 outline-none transition-colors"
                                    value={formData.businessName} onChange={e => setFormData({...formData, businessName: e.target.value})}
                                />
                            </div>
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-500 ml-1">GST / Tax ID (Optional)</label>
                            <input type="text" placeholder="22AAAAA0000A1Z5" 
                                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-3 rounded-xl focus:border-blue-500 outline-none transition-colors"
                                value={formData.gst} onChange={e => setFormData({...formData, gst: e.target.value})}
                            />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 ml-1">Business Address</label>
                        <div className="relative">
                            <MapPin className="absolute left-3 top-3.5 text-slate-400" size={18}/>
                            <input required type="text" placeholder="123 Market Street, Mumbai..." 
                                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-3 pl-10 rounded-xl focus:border-blue-500 outline-none transition-colors"
                                value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})}
                            />
                        </div>
                    </div>
                </div>

                {/* Contact Person Section */}
                <div className="space-y-4">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 border-b border-slate-200 dark:border-slate-800 pb-2 mb-4 pt-4">Contact Person</h3>
                    
                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-500 ml-1">Full Name</label>
                            <div className="relative">
                                <User className="absolute left-3 top-3.5 text-slate-400" size={18}/>
                                <input required type="text" placeholder="John Doe" 
                                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-3 pl-10 rounded-xl focus:border-blue-500 outline-none transition-colors"
                                    value={formData.contactName} onChange={e => setFormData({...formData, contactName: e.target.value})}
                                />
                            </div>
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-500 ml-1">Phone Number</label>
                            <div className="relative">
                                <Phone className="absolute left-3 top-3.5 text-slate-400" size={18}/>
                                <input required type="tel" placeholder="+91 98765 43210" 
                                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-3 pl-10 rounded-xl focus:border-blue-500 outline-none transition-colors"
                                    value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Login Credentials */}
                <div className="space-y-4">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 border-b border-slate-200 dark:border-slate-800 pb-2 mb-4 pt-4">Login Credentials</h3>
                    
                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-500 ml-1">Email Address</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-3.5 text-slate-400" size={18}/>
                                <input required type="email" placeholder="admin@company.com" 
                                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-3 pl-10 rounded-xl focus:border-blue-500 outline-none transition-colors"
                                    value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})}
                                />
                            </div>
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-500 ml-1">Password</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-3.5 text-slate-400" size={18}/>
                                <input required type="password" placeholder="••••••••" 
                                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-3 pl-10 rounded-xl focus:border-blue-500 outline-none transition-colors"
                                    value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="pt-6">
                    <button disabled={loading} className="w-full bg-blue-600 hover:bg-blue-500 text-white py-4 rounded-xl font-bold text-lg shadow-xl shadow-blue-600/20 flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98]">
                        {loading ? <Loader2 className="animate-spin" /> : <>Create Partner Account <ArrowRight /></>}
                    </button>
                    <p className="text-center mt-4 text-slate-500 text-sm">
                        Already have an account? <Link href="/login" className="text-blue-500 hover:underline font-bold">Login here</Link>
                    </p>
                </div>

            </form>
        </div>
      </div>
    </div>
  );
}