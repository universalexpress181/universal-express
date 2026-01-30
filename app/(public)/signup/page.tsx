"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { Lock, Mail, User, Phone, Loader2 } from "lucide-react";
import Link from "next/link";

export default function SignupPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
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
          // This ensures they come back to your site after clicking the email link
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: { 
            name: formData.name, 
            phone: formData.phone 
          }
        }
      });

      if (authError) throw authError;

      // 2. Create Profile
      if (authData.user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({
            id: authData.user.id,
            name: formData.name,
            email: formData.email,
            phone: formData.phone,
          });

        if (profileError) {
            // Ignore duplicate key errors if user retries
            if (!profileError.message.includes("duplicate key")) {
                throw profileError;
            }
        }

        // 3. ✅ SUCCESS LOGIC (Updated for your flow)
        
        // If 'authData.session' is null, it means email confirmation is REQUIRED by Supabase
        if (authData.user && !authData.session) {
           alert("✅ Confirmation mail has been sent!\n\nPlease check your email to confirm your account. You will only be able to login after verification.");
           router.push("/login"); // Redirect to login page
        } 
        else {
           // Fallback: If email confirmation is disabled in settings, just log them in or send to login
           alert("✅ Account created successfully!");
           router.push("/login");
        }
      }

    } catch (error: any) {
      alert("Error: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 transition-colors duration-300 bg-slate-50 dark:bg-slate-950 relative overflow-hidden">
      
      {/* BACKGROUND DECOR */}
      <div className="fixed top-[-10%] right-[-5%] w-96 h-96 bg-blue-500/30 dark:bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-orange-500/20 dark:bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Card */}
      <div className="w-full max-w-md rounded-2xl p-8 shadow-2xl transition-colors duration-300 relative z-10
        bg-white/80 border border-slate-200 backdrop-blur-xl
        dark:bg-slate-900/80 dark:border-slate-800">
        
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Create Account</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2">Join us to start shipping</p>
        </div>

        <form onSubmit={handleSignup} className="space-y-4">
          
          {/* Name Input */}
          <div>
            <label className="text-xs font-bold uppercase ml-1 text-slate-500 dark:text-slate-400">Full Name</label>
            <div className="relative">
                <User className="absolute left-3 top-3.5 text-slate-400 dark:text-slate-500" size={18} />
                <input 
                  required
                  placeholder="John Doe"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full rounded-xl p-3 pl-10 outline-none transition-colors border focus:border-blue-500
                    bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400
                    dark:bg-slate-950 dark:border-slate-800 dark:text-white dark:placeholder:text-slate-600"
                />
            </div>
          </div>

          {/* Phone Input */}
          <div>
            <label className="text-xs font-bold uppercase ml-1 text-slate-500 dark:text-slate-400">Phone Number</label>
            <div className="relative">
                <Phone className="absolute left-3 top-3.5 text-slate-400 dark:text-slate-500" size={18} />
                <input 
                  required
                  placeholder="9876543210"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  className="w-full rounded-xl p-3 pl-10 outline-none transition-colors border focus:border-blue-500
                    bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400
                    dark:bg-slate-950 dark:border-slate-800 dark:text-white dark:placeholder:text-slate-600"
                />
            </div>
          </div>

          {/* Email Input */}
          <div>
            <label className="text-xs font-bold uppercase ml-1 text-slate-500 dark:text-slate-400">Email</label>
            <div className="relative">
                <Mail className="absolute left-3 top-3.5 text-slate-400 dark:text-slate-500" size={18} />
                <input 
                  type="email"
                  required
                  placeholder="john@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full rounded-xl p-3 pl-10 outline-none transition-colors border focus:border-blue-500
                    bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400
                    dark:bg-slate-950 dark:border-slate-800 dark:text-white dark:placeholder:text-slate-600"
                />
            </div>
          </div>

          {/* Password Input */}
          <div>
            <label className="text-xs font-bold uppercase ml-1 text-slate-500 dark:text-slate-400">Password</label>
            <div className="relative">
                <Lock className="absolute left-3 top-3.5 text-slate-400 dark:text-slate-500" size={18} />
                <input 
                  type="password"
                  required
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  className="w-full rounded-xl p-3 pl-10 outline-none transition-colors border focus:border-blue-500
                    bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400
                    dark:bg-slate-950 dark:border-slate-800 dark:text-white dark:placeholder:text-slate-600"
                />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full font-bold py-4 rounded-xl flex items-center justify-center gap-2 mt-4 transition-all
              text-white bg-blue-600 hover:bg-blue-700
              dark:bg-blue-600 dark:hover:bg-blue-500 disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin" /> : "Sign Up"}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
          Already have an account? <Link href="/login" className="font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300">Log in</Link>
        </div>

      </div>
    </div>
  );
}