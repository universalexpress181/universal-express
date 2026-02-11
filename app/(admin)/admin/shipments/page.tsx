"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { 
  Package, Truck, CheckCircle, Clock, Search, 
  RefreshCw, XCircle, Trash2, ArrowRight, FileUp, Settings 
} from "lucide-react"; 
import Link from "next/link";

// 🆕 LIST OF UPDATABLE COLUMNS
const UPDATABLE_COLUMNS = [
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

  // 🔹 Bulk Sync States
  const [bulkFile, setBulkFile] = useState<File | null>(null);
  const [targetColumn, setTargetColumn] = useState("current_status");
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

  // 2. Bulk Sync Logic
  const handleBulkSync = async () => {
    if (!bulkFile) return alert("Select a file first");
    setBulkLoading(true);

    try {
        const formData = new FormData();
        formData.append("file", bulkFile);
        formData.append("targetColumn", targetColumn);

        const res = await fetch("/api/admin/shipments/bulk-sync", {
            method: "POST",
            body: formData
        });
        const data = await res.json();

        if (data.error) throw new Error(data.error);

        alert(`✅ Sync Complete: ${data.results.success} Rows Updated`);
        setBulkFile(null);
        fetchAll(); 
    } catch (err: any) {
        alert("Sync Error: " + err.message);
    } finally {
        setBulkLoading(false);
    }
  };

  // 3. Delete Logic
  const handleDelete = async (id: string, awb: string) => {
      if (!confirm(`⚠️ PERMANENT ACTION\n\nDelete shipment #${awb}?`)) return;
      const { error } = await supabase.from('shipments').delete().eq('id', id);
      if (error) {
          alert("Failed to delete: " + error.message);
      } else {
          setShipments(prev => prev.filter(s => s.id !== id));
      }
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
        
        {/* 🟢 HEADER SECTION */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
             <h1 className="text-3xl font-black text-gray-900 dark:text-white flex items-center gap-3 tracking-tight">
               Global Operations
               <span className="flex h-3 w-3 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
               </span>
             </h1>
             <p className="text-gray-500 dark:text-slate-400 text-sm font-medium mt-1">Live monitoring & flexible bulk sync.</p>
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

        {/* 🚀 DYNAMIC BULK SYNC PANEL (Fixed Layout) */}
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-gray-200 dark:border-slate-800 rounded-[2rem] p-8 shadow-2xl relative overflow-hidden group">
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-blue-500/10 dark:bg-blue-500/5 rounded-full blur-[80px] pointer-events-none" />

            <div className="flex flex-col lg:flex-row items-center gap-8 relative z-10">
                <div className="flex items-center gap-5 shrink-0">
                    <div className="p-4 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl text-white shadow-lg">
                        <Settings size={28} />
                    </div>
                    <div>
                        <h3 className="font-black text-xl text-gray-900 dark:text-white tracking-tight">Dynamic Bulk Sync</h3>
                        <p className="text-sm text-gray-500 dark:text-slate-400 font-medium mt-0.5">Update columns by Reference ID.</p>
                    </div>
                </div>

                <div className="flex-1 w-full grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
                    <div className="space-y-2.5">
                        <label className="text-[11px] font-black text-gray-400 dark:text-slate-500 uppercase ml-1 tracking-widest">Update Field</label>
                        <select 
                            value={targetColumn}
                            onChange={(e) => setTargetColumn(e.target.value)}
                            className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-3.5 text-sm outline-none text-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500/20 transition-all cursor-pointer"
                        >
                            {UPDATABLE_COLUMNS.map(col => <option key={col.value} value={col.value}>{col.label}</option>)}
                        </select>
                    </div>

                    <div className="space-y-2.5">
                        <label className="text-[11px] font-black text-gray-400 dark:text-slate-500 uppercase ml-1 tracking-widest">Excel/CSV File</label>
                        <label className="relative group cursor-pointer block">
                            <input 
                                type="file" accept=".xlsx, .xls, .csv" 
                                className="hidden" onChange={(e) => setBulkFile(e.target.files?.[0] || null)}
                            />
                            <div className="flex items-center gap-3 px-4 py-3.5 bg-gray-50 dark:bg-slate-800 border border-dashed border-gray-300 dark:border-slate-700 rounded-xl text-sm text-gray-600 dark:text-slate-400 group-hover:border-blue-500 transition-all">
                                <FileUp size={20} className={bulkFile ? "text-blue-500" : ""} />
                                <span className="truncate font-medium">{bulkFile ? bulkFile.name : "Select File"}</span>
                            </div>
                        </label>
                    </div>

                    <button 
                        onClick={handleBulkSync}
                        disabled={bulkLoading || !bulkFile}
                        className="h-[52px] w-full bg-blue-600 hover:bg-blue-500 disabled:bg-gray-100 dark:disabled:bg-slate-800/50 disabled:text-gray-400 text-white rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-3 shadow-lg shadow-blue-500/20"
                    >
                        {bulkLoading ? <RefreshCw className="animate-spin" size={20}/> : <><RefreshCw size={20} /> Apply Sync</>}
                    </button>
                </div>
            </div>
        </div>

        {/* 🔵 FILTER TABS */}
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

        {/* 📄 TABLE CONTAINER */}
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