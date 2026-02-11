"use client";

import { useState } from "react";
import * as XLSX from "xlsx";
import { supabase } from "@/lib/supabase";
import { 
  Upload, FileSpreadsheet, CheckCircle, Loader2, 
  AlertCircle, Download, FileText 
} from "lucide-react";
import { motion } from "framer-motion";

export default function BulkPage() {
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [stats, setStats] = useState<{ count: number; errors: string[] } | null>(null);

  // 📥 Function to Download Sample Excel
  const downloadSample = () => {
    // Define the correct headers
    const headers = [
      {
        "Receiver Name": "John Doe",
        "Mobile": "9876543210",
        "Address": "Flat 101, Galaxy Apts, Mumbai",
        "Pincode": "400001",
        "Weight (kg)": 0.5,
        "Payment Mode": "Prepaid"
      },
      {
        "Receiver Name": "Jane Smith",
        "Mobile": "9123456780",
        "Address": "12th Main Road, Bangalore",
        "Pincode": "560001",
        "Weight (kg)": 1.2,
        "Payment Mode": "COD"
      }
    ];

    const ws = XLSX.utils.json_to_sheet(headers);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sample Format");
    XLSX.writeFile(wb, "Universal_Bulk_Sample.xlsx");
  };

  // 📤 Function to Upload File
  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    setStats(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Please log in first");

      const formData = new FormData();
      formData.append("file", file);
      formData.append("userId", user.id);

      const response = await fetch("/api/shipments/bulk", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) throw new Error(result.error);

      setStats({ count: result.count, errors: result.errors || [] });
      setFile(null); // Reset file
      alert(`✅ Success! Generated ${result.count} AWBs.`);

    } catch (error: any) {
      alert("❌ Upload Failed: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-black text-slate-900 dark:text-white">Bulk Order Upload</h1>
        <p className="text-slate-500 dark:text-slate-400">Upload multiple shipments via Excel and auto-generate AWBs.</p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        
        {/* Left Column: Instructions & Sample */}
        <div className="md:col-span-1 space-y-6">
          <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800 p-6 rounded-2xl">
            <h3 className="font-bold text-blue-700 dark:text-blue-400 flex items-center gap-2 mb-4">
              <FileText size={20} /> Instructions
            </h3>
            <ul className="text-sm space-y-3 text-slate-600 dark:text-slate-300">
              <li className="flex gap-2"><span className="font-bold text-blue-500">1.</span> Download the sample file.</li>
              <li className="flex gap-2"><span className="font-bold text-blue-500">2.</span> Fill in your shipment details.</li>
              <li className="flex gap-2"><span className="font-bold text-blue-500">3.</span> Don't change the column headers.</li>
              <li className="flex gap-2"><span className="font-bold text-blue-500">4.</span> Upload the updated file here.</li>
            </ul>
            
            <button 
              onClick={downloadSample}
              className="mt-6 w-full py-3 bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors shadow-sm"
            >
              <Download size={18} /> Download Sample
            </button>
          </div>
        </div>

        {/* Right Column: Upload Area */}
        <div className="md:col-span-2">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-sm">
            
            <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-10 text-center relative hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all group">
              <input 
                type="file" 
                accept=".xlsx, .xls" 
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <FileSpreadsheet size={32} />
              </div>
              
              {file ? (
                <div className="space-y-2">
                    <p className="font-bold text-lg text-slate-900 dark:text-white">{file.name}</p>
                    <p className="text-sm text-slate-500">{(file.size / 1024).toFixed(2)} KB</p>
                    <button onClick={(e) => { e.preventDefault(); setFile(null); }} className="text-red-500 text-xs font-bold hover:underline z-20 relative">Remove File</button>
                </div>
              ) : (
                <>
                  <p className="text-lg font-bold text-slate-900 dark:text-white">Click to upload or drag & drop</p>
                  <p className="text-sm text-slate-500 mt-2">Excel files (.xlsx) up to 5MB</p>
                </>
              )}
            </div>

            <button 
              onClick={handleUpload}
              disabled={loading || !file}
              className="w-full mt-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/20 transition-all active:scale-[0.98]"
            >
              {loading ? <Loader2 className="animate-spin" /> : <><Upload size={20} /> Process & Generate AWBs</>}
            </button>

            {/* Success/Error Stats */}
            {stats && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }} 
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl"
              >
                <div className="flex items-center gap-3 text-green-700 dark:text-green-400 font-bold">
                  <CheckCircle size={20} />
                  <span>Success! {stats.count} AWBs Generated.</span>
                </div>
                {stats.errors.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-green-200 dark:border-green-800/30">
                    <p className="text-xs font-bold text-red-500 mb-1 flex items-center gap-1"><AlertCircle size={12}/> skipped rows:</p>
                    <ul className="text-xs text-red-400 list-disc list-inside">
                        {stats.errors.slice(0, 3).map((err, i) => <li key={i}>{err}</li>)}
                        {stats.errors.length > 3 && <li>...and {stats.errors.length - 3} more issues</li>}
                    </ul>
                  </div>
                )}
              </motion.div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}