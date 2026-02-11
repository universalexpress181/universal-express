"use client";

import { useState } from "react";
import * as XLSX from "xlsx";
import { supabase } from "@/lib/supabase";
import { 
  Upload, FileSpreadsheet, CheckCircle, Loader2, 
  Download, FileText, ArrowLeft, Copy 
} from "lucide-react";

export default function BulkPage() {
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  
  // 🔹 STATE TO HOLD THE TEMPORARY VIEW
  const [successData, setSuccessData] = useState<any[] | null>(null);

  // 📥 Download Template Function
  const downloadSample = () => {
    const data = [
      {
        "Client Order ID": "", 
        "Sender Name": "", "Sender Mobile": "", "Pickup Address": "", 
        "Sender City": "", "Sender State": "", "Pickup Pincode": "", 
        
        "Receiver Name": "", "Receiver Mobile": "", "Receiver Address": "", 
        "Receiver City": "", "Receiver State": "", "Receiver Pincode": "", 
        
        "Weight (kg)": "", 
        "Payment Mode": "",   // (Prepaid / COD)
        "Product Value": ""   
      }
    ];
    
    const ws = XLSX.utils.json_to_sheet(data);
    const w = { wch: 20 };
    ws['!cols'] = [
      { wch: 15 }, w, w, { wch: 30 }, w, w, { wch: 10 }, 
      w, w, { wch: 30 }, w, w, { wch: 10 }, 
      { wch: 10 }, { wch: 15 }, { wch: 15 }
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Bulk Template");
    XLSX.writeFile(wb, "Universal_Bulk_Template.xlsx");
  };

  // 📤 Upload Function
  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Please log in first");

      const formData = new FormData();
      formData.append("file", file);
      formData.append("userId", user.id);

      const response = await fetch("/api/v1/shipment/bulk", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error);

      setSuccessData(result.shipments); 
      setFile(null);

    } catch (error: any) {
      alert("❌ Upload Failed: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert(`Copied: ${text}`);
  };

  // ---------------------------------------------------------
  // 🟢 VIEW 1: SUCCESS TABLE
  // ---------------------------------------------------------
  if (successData) {
    return (
      <div className="max-w-5xl mx-auto py-10 px-4">
        <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
                <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-full text-green-600">
                    <CheckCircle size={32} />
                </div>
                <div>
                    <h1 className="text-2xl font-black text-slate-900 dark:text-white">Upload Successful!</h1>
                    <p className="text-slate-500">Generated {successData.length} new shipments.</p>
                </div>
            </div>
            <button 
                onClick={() => setSuccessData(null)} 
                className="flex items-center gap-2 px-5 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-lg font-bold hover:opacity-90"
            >
                <ArrowLeft size={18} /> Upload More
            </button>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 font-bold uppercase">
                        <tr>
                            <th className="px-6 py-4">Client Order ID</th>
                            <th className="px-6 py-4">Generated AWB</th>
                            <th className="px-6 py-4">Receiver</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {successData.map((shipment, i) => (
                            <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">
                                    {shipment.client_order_id || "-"}
                                </td>
                                <td className="px-6 py-4 font-mono text-blue-600 dark:text-blue-400 font-bold">
                                    {shipment.awb_code}
                                </td>
                                <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                                    {shipment.receiver_name}
                                </td>
                                <td className="px-6 py-4">
                                    <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-1 rounded text-xs font-bold uppercase">
                                        {shipment.current_status?.replace('_', ' ')}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <button 
                                        onClick={() => copyToClipboard(shipment.awb_code)}
                                        className="text-slate-400 hover:text-blue-600 transition-colors"
                                        title="Copy AWB"
                                    >
                                        <Copy size={16} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------
  // 🔵 VIEW 2: UPLOAD FORM
  // ---------------------------------------------------------
  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      <div className="space-y-2">
        <h1 className="text-3xl font-black text-slate-900 dark:text-white">Bulk Order Upload</h1>
        <p className="text-slate-500 dark:text-slate-400">Download the template and fill in your shipment details.</p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-1 space-y-6">
          <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800 p-6 rounded-2xl">
            <h3 className="font-bold text-blue-700 dark:text-blue-400 flex items-center gap-2 mb-4">
              <FileText size={20} /> Instructions
            </h3>
            <ul className="text-sm space-y-3 text-slate-600 dark:text-slate-300">
              <li className="flex gap-2"><span className="font-bold text-blue-500">1.</span> Download the blank template.</li>
              <li className="flex gap-2"><span className="font-bold text-blue-500">2.</span> Fill in details.</li>
              <li className="flex gap-2"><span className="font-bold text-blue-500">3.</span> Upload the Excel or CSV file.</li>
            </ul>
            <button 
              onClick={downloadSample}
              className="mt-6 w-full py-3 bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors shadow-sm"
            >
              <Download size={18} /> Download Template
            </button>
          </div>
        </div>

        <div className="md:col-span-2">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-sm">
            <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-10 text-center relative hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all group">
              <input 
                type="file" 
                // ✅ UPDATED: Added .csv to accepted types
                accept=".xlsx, .xls, .csv" 
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
                  <p className="text-sm text-slate-500 mt-2">Excel or CSV files up to 5MB</p>
                </>
              )}
            </div>

            <button 
              type="button" 
              onClick={handleUpload}
              disabled={loading || !file}
              className="w-full mt-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/20 transition-all active:scale-[0.98]"
            >
              {loading ? <Loader2 className="animate-spin" /> : <><Upload size={20} /> Process & Generate AWBs</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}