"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle, Loader2 } from "lucide-react";

export default function EmailConfirmedPage() {
  const router = useRouter();

  useEffect(() => {
    // Wait 3 seconds so the user can read the message, then send to login
    const timer = setTimeout(() => {
      router.push("/login");
    }, 3000);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
      <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-2xl text-center max-w-md w-full border border-slate-100 dark:border-slate-800">
        
        <div className="mx-auto w-20 h-20 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center mb-6">
          <CheckCircle size={40} strokeWidth={3} />
        </div>

        <h1 className="text-2xl font-black text-slate-900 dark:text-white mb-2">
          Email Verified!
        </h1>
        
        <p className="text-slate-500 dark:text-slate-400 mb-8">
          Your account has been successfully confirmed. Redirecting you to login...
        </p>

        <div className="flex justify-center text-blue-600 dark:text-blue-400 gap-2 items-center font-bold animate-pulse">
          <Loader2 className="animate-spin" size={20} />
          Redirecting...
        </div>

      </div>
    </div>
  );
}