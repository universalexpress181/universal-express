"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { 
  Lock, Mail, ArrowRight, Loader2, Phone, 
  ChevronLeft, KeyRound, CheckCircle, Smartphone, Search
} from "lucide-react";
import Link from "next/link";

type LoginView = 'LOGIN' | 'RECOVER';
type RecoveryMethod = 'EMAIL' | 'PHONE';
type RecoveryStep = 'INPUT' | 'OTP' | 'NEW_PASSWORD' | 'RETRIEVED_EMAIL';

export default function LoginPage() {
  const router = useRouter();
  
  const [view, setView] = useState<LoginView>('LOGIN');
  const [method, setMethod] = useState<RecoveryMethod>('EMAIL');
  const [step, setStep] = useState<RecoveryStep>('INPUT');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    phone: "",
    otp: "",
    newPassword: ""
  });

  const [retrievedEmail, setRetrievedEmail] = useState("");

  // 1. LOGIN LOGIC
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setStatus("Authenticating...");

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (authError) throw authError;

      if (data.session) {
        await checkRoleAndRedirect(data.session.user.id);
      }
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  // 2. RECOVERY LOGIC
  const handleRecoverySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    
    try {
      if (method === 'EMAIL') {
        setStatus("Sending verification code...");
        const { error } = await supabase.auth.signInWithOtp({
          email: formData.email,
          options: { shouldCreateUser: false }
        });
        if (error) throw error;
        setStep('OTP');
      } 
      else {
        setStatus("Searching for account...");
        
        // Direct Lookup by Phone
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('email')
            .eq('phone', formData.phone)
            .maybeSingle();

        if (profileError || !profile) {
            throw new Error("No account found with this phone number.");
        }

        setRetrievedEmail(profile.email); 
        setStep('RETRIEVED_EMAIL');
      }
    } catch (err: any) {
      setError(err.message || "Request failed.");
    } finally {
      setLoading(false);
      setStatus("");
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setStatus("Verifying...");

    try {
      const verifyResult = await supabase.auth.verifyOtp({ 
          email: formData.email, 
          token: formData.otp, 
          type: 'email' 
      });

      if (verifyResult.error) throw verifyResult.error;
      setStep('NEW_PASSWORD');

    } catch (err: any) {
      setError("Invalid Code. Please try again.");
    } finally {
      setLoading(false);
      setStatus("");
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatus("Updating...");

    try {
      const { error } = await supabase.auth.updateUser({ password: formData.newPassword });
      if (error) throw error;
      const { data: { user } } = await supabase.auth.getUser();
      if (user) await checkRoleAndRedirect(user.id);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  const checkRoleAndRedirect = async (userId: string) => {
    setStatus("Redirecting...");
    router.refresh();
    const { data: staff } = await supabase.from('staff').select('id').eq('auth_id', userId).maybeSingle();
    if (staff) {
      await supabase.auth.signOut();
      setError("⚠️ Drivers must use the Mobile App.");
      setLoading(false);
      return;
    }
    const { data: roleData } = await supabase.from('user_roles').select('role').eq('user_id', userId).maybeSingle();
    const role = roleData?.role || 'user';
    if (role === 'admin') router.replace("/admin/shipments");
    else if (role === 'seller') router.replace("/seller");
    else router.replace("/dashboard");
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-950 relative overflow-hidden font-sans">
      
      {/* Background Decor */}
      <div className="fixed top-[-10%] right-[-5%] w-96 h-96 bg-blue-500/20 dark:bg-blue-600/10 rounded-full blur-3xl animate-pulse" />
      <div className="fixed bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-indigo-500/20 dark:bg-purple-600/10 rounded-full blur-3xl" />

      <div className="w-full max-w-[420px] bg-white/70 dark:bg-slate-900/70 backdrop-blur-2xl border border-white/50 dark:border-slate-800 rounded-3xl shadow-2xl p-8 relative z-10 transition-all duration-300">
        
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6 relative">
             {view === 'RECOVER' && (
                <button 
                  onClick={() => { setView('LOGIN'); setStep('INPUT'); setError(""); }}
                  className="absolute left-0 top-1/2 -translate-y-1/2 p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 dark:hover:text-white transition-all"
                >
                  <ChevronLeft size={20} />
                </button>
              )}
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg transform transition-all duration-500 ${view === 'LOGIN' ? 'bg-gradient-to-tr from-blue-600 to-blue-400 text-white rotate-0' : 'bg-gradient-to-tr from-orange-500 to-amber-400 text-white rotate-12'}`}>
                {view === 'LOGIN' ? <Lock size={28} /> : <KeyRound size={28} />}
              </div>
          </div>
          
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white mb-2">
            {view === 'LOGIN' ? "Welcome Back" : step === 'NEW_PASSWORD' ? "Reset Password" : "Account Recovery"}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">
            {view === 'LOGIN' ? "Enter your credentials to access your account." : step === 'NEW_PASSWORD' ? "Create a strong new password." : "Recover access via Email or Phone."}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-100 text-red-600 text-xs font-bold text-center dark:bg-red-900/20 dark:border-red-800 dark:text-red-400 flex items-center justify-center gap-2 animate-in fade-in slide-in-from-top-2">
             <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"/> {error}
          </div>
        )}

        {/* ---------------- VIEW: LOGIN ---------------- */}
        {view === 'LOGIN' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider ml-1">Email Address</label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={18} />
                  <input 
                    type="email" 
                    required 
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-3.5 pl-11 pr-4 text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all placeholder:text-slate-400" 
                    placeholder="name@company.com"
                    value={formData.email} 
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider ml-1">Password</label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={18} />
                  <input 
                    type="password" 
                    required 
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-3.5 pl-11 pr-4 text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all placeholder:text-slate-400"
                    placeholder="••••••••"
                    value={formData.password} 
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                  />
                </div>
                <div className="flex justify-end mt-1">
                    <button type="button" onClick={() => setView('RECOVER')} className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 hover:underline">
                        Forgot Password?
                    </button>
                </div>
              </div>

              <button 
                type="submit" 
                disabled={loading} 
                className="w-full bg-slate-900 dark:bg-blue-600 hover:bg-slate-800 dark:hover:bg-blue-500 text-white font-bold py-3.5 rounded-xl transition-all transform active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-blue-900/10"
              >
                {loading ? <Loader2 className="animate-spin" size={18}/> : <>Sign In <ArrowRight size={18}/></>}
              </button>
            </form>

            <div className="mt-8 text-center text-sm text-slate-500 dark:text-slate-400">
              New to Universal Express? <Link href="/signup" className="font-bold text-slate-900 dark:text-white hover:underline">Create Account</Link>
            </div>
          </div>
        )}

        {/* ---------------- VIEW: RECOVERY ---------------- */}
        {view === 'RECOVER' && (
          <div className="animate-in fade-in slide-in-from-right-8 duration-500 space-y-6">
            
            {step === 'INPUT' && (
              <div className="bg-slate-100 dark:bg-slate-800 p-1.5 rounded-xl flex gap-1">
                <button 
                  onClick={() => setMethod('EMAIL')}
                  className={`flex-1 py-2.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${method === 'EMAIL' ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-white' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}
                >
                  <Mail size={14}/> Email
                </button>
                <button 
                  onClick={() => setMethod('PHONE')}
                  className={`flex-1 py-2.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${method === 'PHONE' ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-white' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}
                >
                  <Smartphone size={14}/> Phone
                </button>
              </div>
            )}

            {/* STEP 1 */}
            {step === 'INPUT' && (
              <form onSubmit={handleRecoverySubmit} className="space-y-5">
                {method === 'EMAIL' ? (
                  <div className="space-y-2">
                    <div className="relative group">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={18} />
                      <input 
                        type="email" 
                        required 
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-3.5 pl-11 pr-4 text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all placeholder:text-slate-400"
                        placeholder="name@company.com"
                        value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})}
                      />
                    </div>
                    <p className="text-[11px] font-medium text-slate-400 text-center">We'll send a 6-digit code to this email.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="relative group">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={18} />
                      <input 
                        type="tel" 
                        required 
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-3.5 pl-11 pr-4 text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all placeholder:text-slate-400"
                        placeholder="+91 98765 43210"
                        value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      />
                    </div>
                    <p className="text-[11px] font-medium text-slate-400 text-center">
                        Forgot your email? We'll find it using your phone number.
                    </p>
                  </div>
                )}
                
                <button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2">
                  {loading ? <Loader2 className="animate-spin" size={18}/> : (method === 'EMAIL' ? "Send Reset Code" : "Find Email")}
                </button>
              </form>
            )}

            {/* STEP 2: OTP */}
            {step === 'OTP' && (
              <form onSubmit={handleVerifyOtp} className="space-y-6 animate-in fade-in slide-in-from-right-4">
                <div className="text-center bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Code sent to</p>
                    <span className="font-mono font-bold text-slate-900 dark:text-white text-sm">
                        {formData.email}
                    </span>
                </div>
                <div className="relative group">
                  <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500" size={18} />
                  <input 
                    type="text" 
                    required 
                    className="w-full bg-white dark:bg-slate-950 border-2 border-slate-200 dark:border-slate-700 rounded-xl py-4 pl-12 text-center text-2xl font-mono font-bold tracking-[0.5em] text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all placeholder:text-slate-300 placeholder:tracking-normal placeholder:font-sans placeholder:text-sm"
                    placeholder="000000" 
                    maxLength={6}
                    value={formData.otp} onChange={(e) => setFormData({...formData, otp: e.target.value})}
                  />
                </div>
                <button type="submit" disabled={loading} className="w-full bg-slate-900 dark:bg-white dark:text-slate-900 text-white font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2">
                  {loading ? <Loader2 className="animate-spin" size={18}/> : "Verify & Reset"}
                </button>
                <button type="button" onClick={() => setStep('INPUT')} className="w-full text-xs font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                    Wrong email? Change it
                </button>
              </form>
            )}

            {/* STEP 3: SHOW EMAIL (FULL EMAIL VISIBLE) */}
            {step === 'RETRIEVED_EMAIL' && (
                <div className="space-y-6 text-center animate-in zoom-in-95">
                    <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 text-green-600 rounded-full flex items-center justify-center mx-auto shadow-xl shadow-green-900/10">
                        <Search size={40}/>
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white">Account Found</h3>
                        <p className="text-sm text-slate-500 mt-2">Here is the email linked to your number:</p>
                    </div>
                    <div className="p-5 bg-slate-50 dark:bg-slate-950 rounded-2xl border-2 border-slate-200 dark:border-slate-800 border-dashed">
                        {/* ⚡ UPDATED: Shows Full Email without masking */}
                        <p className="font-mono text-lg font-bold text-slate-900 dark:text-white tracking-wide break-all">
                            {retrievedEmail}
                        </p>
                    </div>
                    <div className="grid gap-3 pt-2">
                        <button 
                            onClick={() => {
                                setFormData(prev => ({ ...prev, email: retrievedEmail }));
                                setMethod('EMAIL');
                                setStep('INPUT');
                            }} 
                            className="w-full bg-blue-600 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                        >
                            <Mail size={16}/> Reset Password
                        </button>
                        <button onClick={() => {setView('LOGIN'); setStep('INPUT')}} className="w-full py-3.5 font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors">
                            Return to Login
                        </button>
                    </div>
                </div>
            )}

            {/* STEP 4: RESET PASSWORD */}
            {step === 'NEW_PASSWORD' && (
              <form onSubmit={handlePasswordReset} className="space-y-5 animate-in fade-in slide-in-from-right-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">New Password</label>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={18} />
                    <input 
                        type="password" 
                        required 
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-3.5 pl-11 pr-4 text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all placeholder:text-slate-400"
                        placeholder="Min 8 chars"
                        value={formData.newPassword} onChange={(e) => setFormData({...formData, newPassword: e.target.value})}
                    />
                  </div>
                </div>
                <button type="submit" disabled={loading} className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-green-600/20 flex items-center justify-center gap-2">
                  {loading ? <Loader2 className="animate-spin" size={18}/> : "Set New Password"}
                </button>
              </form>
            )}

          </div>
        )}

      </div>
    </div>
  );
}