"use client";

import { useState } from "react";
import * as XLSX from "xlsx";
import { supabase } from "@/lib/supabase";
import { 
  Upload, FileSpreadsheet, CheckCircle, Loader2, 
  Download, FileText, ArrowLeft, Copy, Info, AlertTriangle, Zap // ✅ Fixed: Added Zap import
} from "lucide-react";

export default function BulkPage() {
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [successData, setSuccessData] = useState<any[] | null>(null);

  const downloadSample = () => {
    const data = [
      {
        "Client Order ID": "ORD101", 
        "Service Type": "Prime", 
        "Sender Name": "Global Store", "Sender Mobile": "9876543210", "Pickup Address": "123 Hub St", 
        "Sender City": "Mumbai", "Sender State": "Maharashtra", "Pickup Pincode": "400001", 
        "Receiver Name": "Rahul Kumar", "Receiver Mobile": "9123456789", "Receiver Address": "Flat 402, Green Villa", 
        "Receiver City": "Delhi", "Receiver State": "Delhi", "Receiver Pincode": "110001", 
        "Weight (kg)": "0.5", 
        "Payment Mode": "Prepaid", 
        "Product Value": "1500" 
      }
    ];
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Bulk Template");
    XLSX.writeFile(wb, "Universal_Express_Bulk_Template.xlsx");
  };

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Please log in first");
      const formData = new FormData();
      formData.append("file", file);
      formData.append("userId", user.id);
      const response = await fetch("/api/v1/shipment/bulk", { method: "POST", body: formData });
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

  if (successData) {
    return (
      <div className="max-w-5xl mx-auto py-10 px-4">
        <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
                <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-full text-green-600">
                    <CheckCircle size={32} />
                </div>
                <div>
                    <h1 className="text-2xl font-black text-slate-900 dark:text-white">Batch Processed!</h1>
                    <p className="text-slate-500">{successData.length} AWBs Allocated.</p>
                </div>
            </div>
            <button onClick={() => setSuccessData(null)} className="flex items-center gap-2 px-5 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-lg font-bold transition-all active:scale-95">
                <ArrowLeft size={18} /> Upload More
            </button>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
            <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 font-bold uppercase">
                    <tr>
                        <th className="px-6 py-4 text-[10px]">Service</th>
                        <th className="px-6 py-4 text-[10px]">AWB Code</th>
                        <th className="px-6 py-4 text-[10px]">Receiver</th>
                        <th className="px-6 py-4 text-[10px]">Payment</th>
                        <th className="px-6 py-4 text-[10px]">Copy</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {successData.map((shipment, i) => (
                        <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                            <td className="px-6 py-4">
                                <span className="font-bold text-[10px] bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 px-2 py-0.5 rounded-full uppercase">
                                    {shipment.service_type || 'Prime'}
                                </span>
                            </td>
                            <td className="px-6 py-4 font-mono text-blue-600 dark:text-blue-400 font-bold">{shipment.awb_code}</td>
                            <td className="px-6 py-4 dark:text-slate-300 text-xs">{shipment.receiver_name}</td>
                            <td className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">{shipment.payment_mode}</td>
                            <td className="px-6 py-4">
                                <button onClick={() => navigator.clipboard.writeText(shipment.awb_code)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
                                    <Copy size={16} />
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4">
        <div>
            <h1 className="text-3xl font-black text-slate-900 dark:text-white">Bulk Management</h1>
            <p className="text-slate-500 dark:text-slate-400">Process batches and tracking numbers.</p>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-1 space-y-4">
          <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800 p-6 rounded-2xl">
            <h3 className="font-bold text-blue-700 dark:text-blue-400 flex items-center gap-2 mb-4">
              <Download size={20} /> Template Guide
            </h3>
            <ul className="text-[12px] space-y-3 text-slate-600 dark:text-slate-300 font-medium">
              <li>• Service: Prime / Express / Ground</li>
              <li>• Mode: Prepaid / COD</li>
              <li>• Note: Product Value required for COD</li>
            </ul>
            <button onClick={downloadSample} className="mt-6 w-full py-3 bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-800 text-blue-600 font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-blue-50 transition-all shadow-sm">
              <FileSpreadsheet size={18} /> Get Template
            </button>
          </div>
        </div>

        <div className="md:col-span-2">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-sm">
            <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-10 text-center relative hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all group">
              <input type="file" accept=".xlsx, .xls, .csv" onChange={(e) => setFile(e.target.files?.[0] || null)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <Upload size={32} />
              </div>
              {file ? (
                <div>
                    <p className="font-bold text-slate-900 dark:text-white">{file.name}</p>
                    <button onClick={() => setFile(null)} className="text-red-500 text-xs font-bold hover:underline relative z-20">Change File</button>
                </div>
              ) : (
                <p className="text-sm text-slate-500 font-medium">Click to upload or drag completed template here</p>
              )}
            </div>

            <button onClick={handleUpload} disabled={loading || !file} className="w-full mt-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black rounded-xl flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-blue-500/20 transition-all active:scale-[0.98]">
              {loading ? <Loader2 className="animate-spin" /> : <><Zap size={20} /> Book Shipments </>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}