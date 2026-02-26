"use client";

import React, { useState, useEffect } from "react";
import { 
  UploadCloud, Package, Plane, Truck, CheckCircle2, AlertCircle, 
  FileSpreadsheet, X, Info, Database, Activity, Banknote
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// 1. Define types
type StatDetail = { total: number; used: number; available: number };

// 2. Move animation variants OUTSIDE so they don't get recreated on every render
const containerVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, staggerChildren: 0.1 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0 }
};

// 3. Move StatCard OUTSIDE the main component to prevent it from fading away!
const StatCard = ({ title, icon: Icon, colorClass, data }: { title: string, icon: any, colorClass: string, data: StatDetail }) => {
  const percentLeft = data.total === 0 ? 0 : Math.round((data.available / data.total) * 100);
  const isLow = data.available > 0 && data.available <= 20;
  const isOut = data.total > 0 && data.available === 0;

  return (
    <motion.div variants={itemVariants} className={`relative overflow-hidden bg-white dark:bg-[#0f0202] p-6 rounded-2xl shadow-sm border ${isOut ? 'border-red-500/50 dark:border-red-500/50' : 'border-gray-100 dark:border-red-900/20'} transition-all`}>
      <div className={`absolute top-0 right-0 p-4 opacity-10 ${colorClass.replace('bg-', 'text-').replace('/20', '')}`}>
        <Icon size={80} />
      </div>
      
      <div className="relative z-10">
        <div className="flex items-center gap-4 mb-4">
          <div className={`p-4 rounded-xl ${colorClass}`}>
            <Icon size={28} />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">{title}</p>
            <div className="flex items-baseline gap-2">
              <p className={`text-3xl font-black mt-1 ${isOut ? 'text-red-600' : 'text-gray-900 dark:text-white'}`}>
                {data.available.toLocaleString()}
              </p>
              <span className="text-xs font-semibold text-gray-400">LEFT</span>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-100 dark:bg-gray-800 h-2 rounded-full mb-4 overflow-hidden">
          <div 
            className={`h-full rounded-full transition-all duration-1000 ${
              isOut ? 'bg-red-500' : isLow ? 'bg-yellow-500' : 'bg-green-500'
            }`}
            style={{ width: `${percentLeft}%` }}
          />
        </div>

        <div className="grid grid-cols-2 gap-4 border-t border-gray-100 dark:border-red-900/20 pt-4 mt-2">
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase">Total Uploaded</p>
            <p className="text-sm font-bold text-gray-700 dark:text-gray-300">{data.total.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase">Total Used</p>
            <p className="text-sm font-bold text-gray-700 dark:text-gray-300">{data.used.toLocaleString()}</p>
          </div>
        </div>

        {isOut && <p className="text-xs font-bold text-red-500 mt-3 flex items-center gap-1"><AlertCircle size={14}/> OUT OF STOCK</p>}
        {isLow && <p className="text-xs font-bold text-yellow-600 mt-3 flex items-center gap-1"><AlertCircle size={14}/> RUNNING LOW</p>}
      </div>
    </motion.div>
  );
};


// 4. MAIN PAGE COMPONENT
export default function AWBBankPage() {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  
  // Detailed State
  const [stats, setStats] = useState<{ prime: StatDetail; express: StatDetail; cargo: StatDetail; cod: StatDetail }>({
    prime: { total: 0, used: 0, available: 0 },
    express: { total: 0, used: 0, available: 0 },
    cargo: { total: 0, used: 0, available: 0 },
    cod: { total: 0, used: 0, available: 0 }
  });

  const fetchStats = async () => {
    try {
      const res = await fetch("/api/admin/awb-bank/stats");
      const data = await res.json();
      if (data.success) {
        setStats({
          prime: data.prime || { total: 0, used: 0, available: 0 },
          express: data.express || { total: 0, used: 0, available: 0 },
          cargo: data.cargo || { total: 0, used: 0, available: 0 },
          cod: data.cod || { total: 0, used: 0, available: 0 }
        });
      }
    } catch (error) {
      console.error("Failed to fetch AWB stats", error);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setMessage(null);
    }
  };

  const removeFile = () => {
    setFile(null);
    setMessage(null);
    const fileInput = document.getElementById('file-upload') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  };

  const handleUpload = async () => {
    if (!file) {
      setMessage({ type: "error", text: "Please select an Excel file first." });
      return;
    }

    setIsUploading(true);
    setMessage(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/admin/awb-bank/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setMessage({ type: "success", text: data.message });
        setFile(null); 
        fetchStats();  
      } else {
        setMessage({ type: "error", text: data.error || "Upload failed." });
      }
    } catch (error) {
      setMessage({ type: "error", text: "Something went wrong during upload." });
    } finally {
      setIsUploading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="p-2 md:p-6 max-w-7xl mx-auto space-y-8">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-gray-900 dark:text-white flex items-center gap-3">
            <Database className="text-red-600 dark:text-red-500" size={32} />
            Advanced AWB Bank
          </h1>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mt-1">
            Monitor inventory and upload single or multi-column AWB sheets.
          </p>
        </div>
        <motion.button 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={fetchStats}
          className="px-4 py-2 bg-white dark:bg-[#0f0202] border border-gray-200 dark:border-red-900/30 rounded-lg shadow-sm text-sm font-bold text-gray-700 dark:text-red-200 hover:text-red-600 dark:hover:text-red-400 transition-colors flex items-center gap-2"
        >
          <Activity size={16}/> Refresh Stock
        </motion.button>
      </div>

      {/* --- STATS CARDS --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <StatCard title="DTDC Prime" icon={Package} colorClass="bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400" data={stats.prime} />
        <StatCard title="DTDC Air /Ground Express" icon={Plane} colorClass="bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400" data={stats.express} />
        <StatCard title="DP World Ground Cargo" icon={Truck} colorClass="bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400" data={stats.cargo} />
        <StatCard title="COD Orders" icon={Banknote} colorClass="bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400" data={stats.cod} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* --- UPLOAD SECTION --- */}
        <motion.div variants={itemVariants} className="lg:col-span-2 bg-white dark:bg-[#0f0202] rounded-2xl shadow-sm border border-gray-100 dark:border-red-900/20 overflow-hidden flex flex-col">
          <div className="p-6 border-b border-gray-100 dark:border-red-900/20 bg-gray-50/50 dark:bg-black/20">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <UploadCloud size={20} className="text-red-600 dark:text-red-500" /> Upload New AWBs
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Select an Excel file. You can upload files containing a single column or all columns.</p>
          </div>

          <div className="p-6 flex-1 flex flex-col justify-center">
            <AnimatePresence mode="wait">
              {!file ? (
                <motion.div 
                  key="upload-zone"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 dark:border-red-900/40 rounded-xl p-12 bg-gray-50/50 dark:bg-[#1a0505]/50 hover:bg-gray-100 dark:hover:bg-[#1a0505] transition-colors group cursor-pointer"
                  onClick={() => document.getElementById('file-upload')?.click()}
                >
                  <div className="p-4 bg-white dark:bg-black/40 rounded-full shadow-sm mb-4 group-hover:scale-110 transition-transform">
                    <FileSpreadsheet size={36} className="text-red-500 dark:text-red-400" />
                  </div>
                  <input type="file" id="file-upload" accept=".xlsx, .xls, .csv" className="hidden" onChange={handleFileChange} />
                  <p className="text-base font-bold text-gray-700 dark:text-gray-200">Click to browse or drag file here</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center max-w-xs">Supports .xlsx, .xls, and .csv formats.</p>
                </motion.div>
              ) : (
                <motion.div 
                  key="file-preview"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-gray-50 dark:bg-[#1a0505] border border-gray-200 dark:border-red-900/30 rounded-xl p-6"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-white dark:bg-black/40 rounded-lg shadow-sm">
                        <FileSpreadsheet size={32} className="text-green-600 dark:text-green-500" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900 dark:text-white truncate max-w-[200px] md:max-w-xs">{file.name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{formatFileSize(file.size)}</p>
                      </div>
                    </div>
                    <button onClick={removeFile} className="p-2 text-gray-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"><X size={20} /></button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Feedback Messages */}
            <AnimatePresence>
              {message && (
                <motion.div initial={{ opacity: 0, height: 0, mt: 0 }} animate={{ opacity: 1, height: "auto", mt: 16 }} exit={{ opacity: 0, height: 0, mt: 0 }} className="overflow-hidden">
                  <div className={`p-4 rounded-xl flex items-start gap-3 border ${message.type === 'success' ? 'bg-green-50/50 dark:bg-green-900/10 border-green-200 dark:border-green-900/30 text-green-800 dark:text-green-400' : 'bg-red-50/50 dark:bg-red-900/10 border-red-200 dark:border-red-900/30 text-red-800 dark:text-red-400'}`}>
                    <div className="mt-0.5 flex-shrink-0">{message.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}</div>
                    <span className="text-sm font-medium leading-relaxed">{message.text}</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="mt-8 flex justify-end">
              <motion.button
                whileHover={!isUploading && file ? { scale: 1.02 } : {}}
                whileTap={!isUploading && file ? { scale: 0.98 } : {}}
                onClick={handleUpload}
                disabled={isUploading || !file}
                className={`relative overflow-hidden flex items-center justify-center gap-2 px-8 py-3 rounded-xl font-bold text-sm text-white shadow-sm transition-all ${
                  isUploading || !file ? "bg-gray-300 dark:bg-gray-800 text-gray-500 dark:text-gray-500 cursor-not-allowed" : "bg-red-600 hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700 shadow-red-600/20 hover:shadow-lg hover:shadow-red-600/30"
                }`}
              >
                {isUploading ? "Processing File..." : <><Database size={18} /> Process & Save to Bank</>}
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* --- INSTRUCTIONS SIDEBAR --- */}
        <motion.div variants={itemVariants} className="bg-white dark:bg-[#0f0202] rounded-2xl shadow-sm border border-gray-100 dark:border-red-900/20 overflow-hidden h-fit">
          <div className="p-5 border-b border-gray-100 dark:border-red-900/20 flex items-center gap-2 bg-gray-50/50 dark:bg-black/20">
            <Info size={18} className="text-blue-500" />
            <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">Formatting Guide</h3>
          </div>
          <div className="p-6 space-y-6">
            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
              Upload an Excel file with the headers below. <strong>You do not need all headers.</strong> If you upload a sheet with only the <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">COD</code> column, only COD stock will increase.
            </p>
            
            <div className="space-y-4">
              <div className="p-3 bg-gray-50 dark:bg-[#1a0505] rounded-xl border border-gray-200 dark:border-red-900/20 flex justify-between items-center">
                <div>
                  <span className="text-xs font-black uppercase text-blue-600 dark:text-blue-400 block mb-1">Column Header</span>
                  <code className="text-sm font-mono text-gray-800 dark:text-gray-200">"Prime"</code>
                </div>
              </div>

              <div className="p-3 bg-gray-50 dark:bg-[#1a0505] rounded-xl border border-gray-200 dark:border-red-900/20 flex justify-between items-center">
                <div>
                  <span className="text-xs font-black uppercase text-purple-600 dark:text-purple-400 block mb-1">Column Header</span>
                  <code className="text-sm font-mono text-gray-800 dark:text-gray-200">"Air/Ground Express"</code>
                </div>
              </div>

              <div className="p-3 bg-gray-50 dark:bg-[#1a0505] rounded-xl border border-gray-200 dark:border-red-900/20 flex justify-between items-center">
                <div>
                  <span className="text-xs font-black uppercase text-green-600 dark:text-green-400 block mb-1">Column Header</span>
                  <code className="text-sm font-mono text-gray-800 dark:text-gray-200">"Ground Cargo"</code>
                </div>
              </div>

              <div className="p-3 bg-gray-50 dark:bg-[#1a0505] rounded-xl border border-gray-200 dark:border-red-900/20 flex justify-between items-center">
                <div>
                  <span className="text-xs font-black uppercase text-orange-600 dark:text-orange-400 block mb-1">Column Header</span>
                  <code className="text-sm font-mono text-gray-800 dark:text-gray-200">"COD"</code>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}