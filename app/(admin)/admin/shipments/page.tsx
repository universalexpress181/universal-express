"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { 
  Package, Truck, CheckCircle, Clock, Search, 
  RefreshCw, XCircle, Trash2, ArrowRight, 
  AlertTriangle, ShieldAlert, MapPin
} from "lucide-react"; 
import Link from "next/link";

export default function AllShipmentsPage() {
  const [shipments, setShipments] = useState<any[]>([]);
  const [filterStatus, setFilterStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchAll = async () => {
    const { data } = await supabase
      .from('shipments')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (data) setShipments(data);
    setLoading(false);
  };

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

  // 🚀 ULTRA-ROBUST FILTER LOGIC
  const checkStatusMatch = (tabId: string, statusRaw: string) => {
      if (tabId === 'all') return true;
      if (!statusRaw) return false;
      
      const s = statusRaw.toLowerCase().replace(/[^a-z0-9]/g, '');
      
      switch(tabId) {
          case 'pending': 
              return ['created', 'manifested', 'pendingpickup', 'orderplaced'].includes(s);
          case 'intransit': 
              // Removed outfordelivery from here
              return ['intransit', 'pickedup'].includes(s) || (s.includes('transit') && !s.includes('rto'));
          case 'outfordelivery': 
              return s.includes('outfordelivery');
          case 'delivered': 
              return ['delivered'].includes(s) && !s.includes('rto');
          case 'undelivered': 
              return s.includes('undelivered') && !s.includes('rto');
          case 'rto': 
              return s.includes('rto');
          case 'exceptions':
              return s.includes('lost') || s.includes('damage') || s.includes('fail');
          case 'cancelled': 
              return ['cancelled', 'cancel', 'pickupcancelled'].includes(s) || s.includes('cancel');
          default: 
              return true;
      }
  };

  const filteredShipments = shipments.filter(s => {
    const matchesStatus = checkStatusMatch(filterStatus, s.current_status);
    const matchesSearch = 
      s.awb_code.toLowerCase().includes(search.toLowerCase()) || 
      s.receiver_name.toLowerCase().includes(search.toLowerCase());

    return matchesStatus && matchesSearch;
  });

  const tabs = [
    { id: "all", label: "All", icon: Package },
    { id: "pending", label: "Pending", icon: Clock },
    { id: "intransit", label: "Transit", icon: Truck },
    { id: "outfordelivery", label: "Out for Delivery", icon: MapPin }, // 🚀 New Filter Tab
    { id: "delivered", label: "Delivered", icon: CheckCircle },
    { id: "undelivered", label: "Undelivered", icon: AlertTriangle },
    { id: "rto", label: "RTO", icon: RefreshCw },
    { id: "exceptions", label: "Lost/Damage", icon: ShieldAlert },
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
             <p className="text-gray-500 dark:text-slate-400 text-sm font-medium mt-1">Real-time shipment tracking and control panel.</p>
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

        {/* 🔵 FILTER TABS */}
        <div className="flex flex-wrap gap-2 border-b border-gray-200 dark:border-slate-800 pb-1">
          {tabs.map((tab) => {
             const Icon = tab.icon;
             const isActive = filterStatus === tab.id;
             const count = shipments.filter(s => checkStatusMatch(tab.id, s.current_status)).length;

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

        {/* 📦 TABLE */}
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
                              {s.current_status?.toLowerCase().includes('cancel') && (
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
    if (!status) return <span className="px-3 py-1 rounded-lg border text-[10px] font-bold uppercase tracking-wide bg-gray-100 text-gray-600 dark:bg-slate-800 dark:text-slate-400 border-gray-200 dark:border-slate-700">UNKNOWN</span>;
    
    const s = status.toLowerCase().replace(/[^a-z0-9]/g, '');
    let styleClass = "bg-gray-100 text-gray-600 dark:bg-slate-800 dark:text-slate-400 border-gray-200 dark:border-slate-700";

    if (['orderplaced', 'created', 'pendingpickup', 'manifested'].includes(s)) {
        styleClass = "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-900/50";
    } else if (s.includes('pickedup')) {
        styleClass = "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 border-orange-200 dark:border-orange-900/50";
    } else if (s.includes('transit') && !s.includes('rto')) {
        styleClass = "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 border-purple-200 dark:border-purple-900/50";
    } else if (s.includes('delivery') && !s.includes('rto')) {
        styleClass = "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-200 dark:border-yellow-900/50";
    } else if (s.includes('delivered') && !s.includes('rto')) {
        styleClass = "bg-emerald-100 text-emerald-700 dark:bg-green-900/30 dark:text-green-400 border-emerald-200 dark:border-green-900/50";
    } else if (s.includes('rto')) {
        styleClass = s.includes('undelivered') || s.includes('fail') 
            ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-900/50"
            : "bg-orange-200 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300 border-orange-300 dark:border-orange-800";
    } else if (s.includes('undelivered')) {
        styleClass = "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400 border-rose-200 dark:border-rose-900/50";
    } else if (s.includes('cancel') || s.includes('fail') || s.includes('lost') || s.includes('damage')) {
        styleClass = "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-900/50";
    }

    return (
        <span className={`px-3 py-1 rounded-lg border text-[10px] font-bold uppercase tracking-wide ${styleClass}`}>
            {status.replace(/[_\-]/g, ' ')}
        </span>
    );
}