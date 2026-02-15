"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import * as XLSX from "xlsx"; // 📦 npm install xlsx
import { 
  Package, Truck, CheckCircle, Clock, Search, 
  RefreshCw, XCircle, Trash2, ArrowRight, FileUp, Settings, 
  ArrowLeftRight, Table, Database 
} from "lucide-react"; 
import Link from "next/link";

// 🆕 Fields allowed to be updated in your Database
const DB_COLUMNS = [
    { value: "current_status", label: "Shipment Status" },
    { value: "payment_status", label: "Payment Status" },
    { value: "weight", label: "Package Weight" },
    { value: "delivery_boy_id", label: "Assign Staff (ID)" },
    { value: "receiver_phone", label: "Receiver Phone" },
    { value: "cost", label: "Shipping Cost" }
];

export default function AllShipmentsPage() {
  const [shipments, setShipments] = useState<any[]>([]);
  const [filterStatus, setFilterStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  // 🔹 Bulk Sync & Mapping States
  const [bulkFile, setBulkFile] = useState<File | null>(null);
  const [sheetHeaders, setSheetHeaders] = useState<string[]>([]);
  
  // ⚙️ Mapping Configuration
  const [targetDbColumn, setTargetDbColumn] = useState("current_status"); // What to update in DB
  const [excelRefCol, setExcelRefCol] = useState(""); // Which Excel col has Reference ID
  const [excelValCol, setExcelValCol] = useState(""); // Which Excel col has the New Value
  
  const [bulkLoading, setBulkLoading] = useState(false);

  // 1. Fetch Logic
  const fetchAll = async () => {
    const { data } = await supabase
      .from('shipments')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (data) setShipments(data);
    setLoading(false);
  };

  // 2. Handle File Upload & Parse Headers
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setBulkFile(file);

    // Read headers immediately to populate dropdowns
    const reader = new FileReader();
    reader.onload = (evt) => {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        
        // Extract first row as headers
        const data: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1 });
        if (data && data.length > 0) {
            const headers = data[0].map(String); // Ensure strings
            setSheetHeaders(headers);
            
            // 🧠 Smart Auto-Select: Try to guess columns
            const likelyRef = headers.find(h => /ref|id|order|awb/i.test(h));
            const likelyVal = headers.find(h => /status|state|val/i.test(h));
            
            if (likelyRef) setExcelRefCol(likelyRef);
            else if(headers.length > 0) setExcelRefCol(headers[0]);

            if (likelyVal) setExcelValCol(likelyVal);
            else if(headers.length > 1) setExcelValCol(headers[1]);
        }
    };
    reader.readAsBinaryString(file);
  };

  // 3. Submit Bulk Sync
  const handleBulkSync = async () => {
    if (!bulkFile || !excelRefCol || !excelValCol) return alert("Please map the Excel columns first.");
    setBulkLoading(true);

    try {
        const formData = new FormData();
        formData.append("file", bulkFile);
        formData.append("targetDbColumn", targetDbColumn);
        formData.append("excelRefCol", excelRefCol);
        formData.append("excelValCol", excelValCol);

        const res = await fetch("/api/admin/shipments/bulk-sync", {
            method: "POST",
            body: formData
        });
        const data = await res.json();

        if (data.error) throw new Error(data.error);

        alert(`✅ Sync Complete!\nUpdated: ${data.results.success}\nFailed: ${data.results.failed}`);
        
        // Reset
        setBulkFile(null); 
        setSheetHeaders([]);
        fetchAll(); 
    } catch (err: any) {
        alert("Sync Error: " + err.message);
    } finally {
        setBulkLoading(false);
    }
  };

  // 4. Delete Logic
  const handleDelete = async (id: string, awb: string) => {
      if (!confirm(`⚠️ PERMANENT ACTION\n\nDelete shipment #${awb}?`)) return;
      const { error } = await supabase.from('shipments').delete().eq('id', id);
      if (!error) setShipments(prev => prev.filter(s => s.id !== id));
  };

  useEffect(() => {
    fetchAll();
    const channel = supabase.channel('realtime_shipments')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'shipments' }, () => fetchAll())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const filteredShipments = shipments.filter(s => {
    const matchesStatus = 
      filterStatus === 'all' ? true :
      filterStatus === 'pending' ? (s.current_status === 'created' || s.current_status === 'manifested') :
      filterStatus === 'intransit' ? (s.current_status === 'in_transit' || s.current_status === 'out_for_delivery') :
      filterStatus === 'delivered' ? s.current_status === 'delivered' :
      filterStatus === 'cancelled' ? s.current_status === 'cancelled' :
      filterStatus === 'rto' ? (s.current_status === 'rto_initiated' || s.current_status === 'rto_delivered') : true;

    const matchesSearch = 
      s.awb_code.toLowerCase().includes(search.toLowerCase()) || 
      s.receiver_name.toLowerCase().includes(search.toLowerCase());

    return matchesStatus && matchesSearch;
  });

  const tabs = [
    { id: "all", label: "All", icon: Package },
    { id: "pending", label: "Pending", icon: Clock },
    { id: "intransit", label: "Transit", icon: Truck },
    { id: "delivered", label: "Delivered", icon: CheckCircle },
    { id: "rto", label: "RTO", icon: RefreshCw },
    { id: "cancelled", label: "Cancelled", icon: XCircle },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#050b14] p-6 transition-colors duration-300">
      <div className="space-y-6 max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
             <h1 className="text-3xl font-black text-gray-900 dark:text-white flex items-center gap-3 tracking-tight">
               Global Operations
               <span className="flex h-3 w-3 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
               </span>
             </h1>
             <p className="text-gray-500 dark:text-slate-400 text-sm font-medium mt-1">Live monitoring & bulk update tools.</p>
          </div>
          
          <div className="relative group w-full md:w-auto">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-hover:text-blue-500 transition-colors" size={18} />
               <input 
                   type="text" 
                   placeholder="Search AWB or Receiver..." 
                   value={search}
                   onChange={(e) => setSearch(e.target.value)}
                   className="pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 text-gray-900 dark:text-white rounded-xl outline-none focus:ring-2 focus:ring-blue-500/50 w-full md:w-72 shadow-sm transition-all"
               />
          </div>
        </div>

        {/* 🚀 SMART DYNAMIC BULK SYNC PANEL */}
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-gray-200 dark:border-slate-800 rounded-[2rem] p-8 shadow-2xl relative overflow-hidden group">
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-blue-500/10 dark:bg-blue-500/5 rounded-full blur-[80px] pointer-events-none" />

            <div className="flex flex-col xl:flex-row items-start xl:items-end gap-8 relative z-10">
                {/* Intro Section */}
                <div className="flex items-center gap-5 shrink-0 xl:mb-2">
                    <div className="p-4 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl text-white shadow-lg">
                        <Settings size={28} />
                    </div>
                    <div>
                        <h3 className="font-black text-xl text-gray-900 dark:text-white tracking-tight">Dynamic Bulk Sync</h3>
                        <p className="text-sm text-gray-500 dark:text-slate-400 font-medium mt-0.5">Update database using Excel mapping.</p>
                    </div>
                </div>

                {/* Controls */}
                <div className="flex-1 w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                    
                    {/* 1. File Upload */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase ml-1 tracking-widest">1. Upload Excel</label>
                        <label className={`relative group cursor-pointer block ${bulkFile ? 'opacity-100' : 'opacity-100'}`}>
                            <input type="file" accept=".xlsx, .xls, .csv" className="hidden" onChange={handleFileChange} />
                            <div className={`flex items-center gap-3 px-4 py-3 bg-gray-50 dark:bg-slate-800/50 border border-dashed rounded-xl text-sm transition-all ${bulkFile ? 'border-emerald-500 bg-emerald-50/10 text-emerald-600' : 'border-gray-300 dark:border-slate-700 text-gray-500'}`}>
                                <FileUp size={18} />
                                <span className="truncate max-w-[140px] font-bold">{bulkFile ? bulkFile.name : "Select File"}</span>
                            </div>
                        </label>
                    </div>

                    {/* 2. Match Ref (EXCEL COLUMN) */}
                    <div className={`space-y-2 transition-opacity duration-500 ${sheetHeaders.length > 0 ? 'opacity-100' : 'opacity-30 pointer-events-none'}`}>
                        <label className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase ml-1 tracking-widest flex items-center gap-1">
                            <Search size={10}/> Excel: Match Ref By
                        </label>
                        <select 
                            value={excelRefCol}
                            onChange={(e) => setExcelRefCol(e.target.value)}
                            className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-3 text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500/20"
                        >
                            {sheetHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                        </select>
                    </div>

                    {/* 3. New Value (EXCEL COLUMN) */}
                    <div className={`space-y-2 transition-opacity duration-500 ${sheetHeaders.length > 0 ? 'opacity-100' : 'opacity-30 pointer-events-none'}`}>
                        <label className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase ml-1 tracking-widest flex items-center gap-1">
                            <Table size={10}/> Excel: Status/Value
                        </label>
                        <select 
                            value={excelValCol}
                            onChange={(e) => setExcelValCol(e.target.value)}
                            className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-3 text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500/20"
                        >
                            {sheetHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                        </select>
                    </div>

                    {/* 4. Target (DATABASE COLUMN) */}
                    <div className="flex gap-2">
                        <div className="space-y-2 flex-1">
                            <label className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase ml-1 tracking-widest flex items-center gap-1">
                                <Database size={10}/> Database Field
                            </label>
                            <select 
                                value={targetDbColumn}
                                onChange={(e) => setTargetDbColumn(e.target.value)}
                                className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-3 text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500/20"
                            >
                                {DB_COLUMNS.map(col => <option key={col.value} value={col.value}>{col.label}</option>)}
                            </select>
                        </div>
                        
                        <button 
                            onClick={handleBulkSync}
                            disabled={bulkLoading || !bulkFile || !excelRefCol || !excelValCol}
                            className="h-[46px] w-[46px] mt-auto bg-blue-600 hover:bg-blue-500 disabled:bg-gray-100 dark:disabled:bg-slate-800/50 disabled:text-gray-400 text-white rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20 transition-all shrink-0"
                            title="Run Sync"
                        >
                            {bulkLoading ? <RefreshCw className="animate-spin" size={20}/> : <ArrowRight size={20} />}
                        </button>
                    </div>

                </div>
            </div>
        </div>

        {/* 🔵 FILTER TABS & TABLE (Existing Code) */}
        <div className="flex flex-wrap gap-2 border-b border-gray-200 dark:border-slate-800 pb-1">
          {tabs.map((tab) => {
             const Icon = tab.icon;
             const isActive = filterStatus === tab.id;
             const count = shipments.filter(s => {
                  if(tab.id === 'all') return true;
                  if(tab.id === 'pending') return (s.current_status === 'created' || s.current_status === 'manifested');
                  if(tab.id === 'intransit') return (s.current_status === 'in_transit' || s.current_status === 'out_for_delivery');
                  if(tab.id === 'delivered') return s.current_status === 'delivered';
                  if(tab.id === 'cancelled') return s.current_status === 'cancelled';
                  if(tab.id === 'rto') return (s.current_status === 'rto_initiated' || s.current_status === 'rto_delivered');
                  return false;
             }).length;

             return (
                 <button
                     key={tab.id}
                     onClick={() => setFilterStatus(tab.id)}
                     className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl border-b-2 transition-all text-sm font-bold ${
                         isActive 
                         ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-white dark:bg-slate-900' 
                         : 'border-transparent text-gray-500 dark:text-slate-500 hover:text-gray-700 dark:hover:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800/50'
                     }`}
                 >
                     <Icon size={16} />
                     {tab.label}
                     <span className={`ml-1 text-[10px] px-2 py-0.5 rounded-full ${isActive ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' : 'bg-gray-200 dark:bg-slate-800 text-gray-500 dark:text-slate-500'}`}>
                         {count}
                     </span>
                 </button>
             )
          })}
        </div>

        <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-xl min-h-[400px]">
          <div className="overflow-x-auto">
              <table className="w-full text-left text-gray-600 dark:text-slate-300">
              <thead className="bg-gray-50 dark:bg-slate-950/50 text-gray-500 dark:text-slate-500 uppercase text-xs font-bold tracking-wider border-b border-gray-100 dark:border-slate-800">
                  <tr>
                  <th className="p-5 pl-6">AWB Code</th>
                  <th className="p-5">Sender</th>
                  <th className="p-5">Receiver</th>
                  <th className="p-5">Current Status</th>
                  <th className="p-5 text-right pr-6">Action</th>
                  </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-800/50">
                  {filteredShipments.length === 0 ? (
                      <tr><td colSpan={5} className="p-12 text-center text-gray-400 dark:text-slate-500 italic">No shipments found.</td></tr>
                  ) : (
                      filteredShipments.map((s, index) => (
                      <tr key={`${s.id}-${index}`} className="hover:bg-gray-50 dark:hover:bg-slate-800/40 transition-colors group">
                          <td className="p-5 pl-6 font-mono text-blue-600 dark:text-blue-400 font-bold text-sm group-hover:underline decoration-blue-300 underline-offset-4">{s.awb_code}</td>
                          <td className="p-5">
                              <p className="font-bold text-gray-900 dark:text-white text-sm">{s.sender_name}</p>
                              <p className="text-xs text-gray-500 dark:text-slate-500 mt-0.5">{s.sender_city}</p>
                          </td>
                          <td className="p-5">
                              <p className="font-bold text-gray-900 dark:text-white text-sm">{s.receiver_name}</p>
                              <p className="text-xs text-gray-500 dark:text-slate-500 truncate max-w-[200px] mt-0.5">{s.receiver_address}</p>
                          </td>
                          <td className="p-5">
                               <StatusBadge status={s.current_status} />
                          </td>
                          <td className="p-5 text-right pr-6 flex justify-end items-center gap-3">
                              <Link 
                                  href={`/admin/shipments/${s.awb_code}`} 
                                  className="bg-gray-100 hover:bg-white dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-700 hover:text-blue-600 dark:text-slate-300 dark:hover:text-white px-4 py-2 rounded-lg text-xs font-bold transition-all shadow-sm border border-gray-200 dark:border-slate-700 flex items-center gap-2 group/btn"
                              >
                                  Manage <ArrowRight size={14} className="group-hover/btn:translate-x-0.5 transition-transform"/>
                              </Link>
                              {s.current_status === 'cancelled' && (
                                  <button
                                      onClick={() => handleDelete(s.id, s.awb_code)}
                                      className="bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 text-red-500 dark:text-red-400 px-3 py-2 rounded-lg transition-all border border-red-100 dark:border-red-900/30"
                                      title="Delete Shipment"
                                  >
                                      <Trash2 size={16} />
                                  </button>
                              )}
                          </td>
                      </tr>
                      ))
                  )}
              </tbody>
              </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
    const styles: any = {
        created: "bg-gray-100 text-gray-600 dark:bg-slate-800 dark:text-slate-400 border-gray-200 dark:border-slate-700",
        manifested: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 border-purple-200 dark:border-purple-900/50",
        in_transit: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-900/50",
        out_for_delivery: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-200 dark:border-yellow-900/50",
        delivered: "bg-emerald-100 text-emerald-700 dark:bg-green-900/30 dark:text-green-400 border-emerald-200 dark:border-green-900/50",
        rto_initiated: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 border-orange-200 dark:border-orange-900/50",
        rto_delivered: "bg-orange-200 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300 border-orange-300 dark:border-orange-800",
        cancelled: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-900/50",
        pickup_failed: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-900/50",
    };
    const styleClass = styles[status] || styles.created;
    return (
        <span className={`px-3 py-1 rounded-lg border text-[10px] font-bold uppercase tracking-wide ${styleClass}`}>
            {status.replace(/_/g, ' ')}
        </span>
    );
}