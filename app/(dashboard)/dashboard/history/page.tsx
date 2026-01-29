"use client";

import { useEffect, useState } from "react";
import { generateInvoice } from "@/lib/invoiceGenerator";
import { supabase } from "@/lib/supabase";
import { 
  Loader2, Search, Calendar, User, AlertTriangle, 
  ArrowRight, X, MapPin, Clock, FileText, IndianRupee, 
  CreditCard, Image as ImageIcon, Truck, Printer, Filter, CalendarDays 
} from "lucide-react";

// --- MAIN PAGE COMPONENT ---
export default function HistoryPage() {
  const [loading, setLoading] = useState(true);
  const [shipments, setShipments] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  
  // 🆕 Filter States
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all"); 
  const [customDate, setCustomDate] = useState(""); 

  // State for the Side Panel (The Drawer)
  const [selectedAwb, setSelectedAwb] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
          setErrorMsg("User not logged in.");
          setLoading(false);
          return;
        }

        const { data, error } = await supabase
          .from('shipments')
          .select('id, awb_code, created_at, receiver_name, receiver_phone, cost, payment_mode, current_status, user_id')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) {
          setErrorMsg(error.message);
        } else {
          setShipments(data || []);
        }
      } catch (err: any) {
        setErrorMsg(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // 🗓️ Smart Date Filter Handler
  const handleDateFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const val = e.target.value;
      setDateFilter(val);
      if (val === 'specific_date' && !customDate) {
          const today = new Date().toISOString().split('T')[0];
          setCustomDate(today);
      }
  };

  // 🔍 FILTER LOGIC
  const filtered = shipments.filter(s => {
    // 1. Search Logic
    const matchesSearch = 
        s.awb_code?.toLowerCase().includes(search.toLowerCase()) || 
        s.receiver_name?.toLowerCase().includes(search.toLowerCase());

    // 2. Status Logic
    const matchesStatus = statusFilter === 'all' || s.current_status === statusFilter;

    // 3. Date Logic
    let matchesDate = true;
    const orderDate = new Date(s.created_at);
    const today = new Date();
    today.setHours(0,0,0,0);

    if (dateFilter === 'today') {
        matchesDate = orderDate >= today;
    } else if (dateFilter === 'last_7_days') {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(today.getDate() - 7);
        matchesDate = orderDate >= sevenDaysAgo;
    } else if (dateFilter === 'last_30_days') {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(today.getDate() - 30);
        matchesDate = orderDate >= thirtyDaysAgo;
    } else if (dateFilter === 'specific_date' && customDate) {
        const orderDateStr = orderDate.toLocaleDateString('en-CA');
        matchesDate = orderDateStr === customDate;
    }

    return matchesSearch && matchesStatus && matchesDate;
  });

  return (
    <div className="flex h-[calc(100vh-100px)] overflow-hidden relative">
      
      {/* --- LEFT SIDE: THE TABLE (Flexible Width) --- */}
      <div className={`flex-1 flex flex-col space-y-6 transition-all duration-300 ${selectedAwb ? 'w-2/3 pr-6 hidden md:flex' : 'w-full'}`}>
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 shrink-0">
          <div>
             <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Shipment History</h1>
             <p className="text-slate-500 dark:text-slate-400 text-sm">View and manage your past deliveries.</p>
          </div>
        </div>

        {/* 🔍 FILTER BAR */}
        <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row gap-4 shrink-0">
            {/* Search */}
            <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                    type="text" 
                    placeholder="Search AWB or Name..." 
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 transition-all w-full shadow-sm"
                />
            </div>

            {/* Date Filter */}
            <div className="relative w-full md:w-48">
                <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16}/>
                <select 
                    className="w-full pl-9 pr-4 py-2.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer text-slate-900 dark:text-white shadow-sm"
                    value={dateFilter}
                    onChange={handleDateFilterChange}
                >
                    <option value="all">All Dates</option>
                    <option value="today">Today</option>
                    <option value="last_7_days">Last 7 Days</option>
                    <option value="last_30_days">Last 30 Days</option>
                    <option value="specific_date">Specific Date</option>
                </select>
            </div>

            {/* Specific Date Picker (Conditional) */}
            {dateFilter === 'specific_date' && (
                <div className="relative w-full md:w-auto animate-in fade-in slide-in-from-left-2">
                    <input 
                        type="date"
                        className="w-full md:w-40 pl-4 pr-2 py-2.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white cursor-pointer shadow-sm [color-scheme:light] dark:[color-scheme:dark]"
                        value={customDate}
                        onChange={(e) => setCustomDate(e.target.value)}
                    />
                </div>
            )}

            {/* Status Filter */}
            <div className="relative w-full md:w-48">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16}/>
                <select 
                    className="w-full pl-9 pr-4 py-2.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer text-slate-900 dark:text-white shadow-sm"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                >
                    <option value="all">All Status</option>
                    <option value="created">Created</option>
                    <option value="picked_up">Picked Up</option>
                    <option value="in_transit">In Transit</option>
                    <option value="out_for_delivery">Out for Delivery</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                </select>
            </div>
        </div>

        {errorMsg && (
          <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-100 flex items-center gap-2 shrink-0">
              <AlertTriangle size={20}/>
              <span>Error: {errorMsg}</span>
          </div>
        )}

        {/* Scrollable Table Container */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm flex-1 flex flex-col min-h-0">
          <div className="overflow-auto">
              <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 sticky top-0 z-10">
                      <tr>
                          <th className="p-4 font-semibold text-slate-500 dark:text-slate-400 uppercase text-xs tracking-wider">AWB Code</th>
                          <th className="p-4 font-semibold text-slate-500 dark:text-slate-400 uppercase text-xs tracking-wider">Date</th>
                          <th className="p-4 font-semibold text-slate-500 dark:text-slate-400 uppercase text-xs tracking-wider">Customer</th>
                          <th className="p-4 font-semibold text-slate-500 dark:text-slate-400 uppercase text-xs tracking-wider">Payment Mode</th> 
                          <th className="p-4 font-semibold text-slate-500 dark:text-slate-400 uppercase text-xs tracking-wider">Status</th>
                          <th className="p-4 font-semibold text-slate-500 dark:text-slate-400 uppercase text-xs tracking-wider text-right">Action</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {loading ? (
                          <tr><td colSpan={6} className="p-8 text-center text-slate-500"><Loader2 className="animate-spin inline mr-2"/> Loading...</td></tr>
                      ) : filtered.length === 0 ? (
                          <tr><td colSpan={6} className="p-12 text-center text-slate-500">No shipments found.</td></tr>
                      ) : (
                          filtered.map((s) => {
                              const isSelected = selectedAwb === s.awb_code;
                              return (
                                <tr 
                                    key={s.id} 
                                    className={`transition-colors duration-200 group 
                                        ${isSelected 
                                            ? 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-600'
                                            : 'hover:bg-slate-50 dark:hover:bg-slate-800/40 border-l-4 border-transparent'
                                        }`}
                                >
                                    <td className="p-4"><span className="font-mono font-bold text-blue-600 dark:text-blue-400">{s.awb_code}</span></td>
                                    <td className="p-4 text-slate-600 dark:text-slate-300">
                                        <div className="flex items-center gap-2"><Calendar size={14} className="text-slate-400"/><span>{new Date(s.created_at).toLocaleDateString()}</span></div>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-2">
                                            <div className="bg-slate-100 dark:bg-slate-800 p-1.5 rounded-full text-slate-500"><User size={14}/></div>
                                            <div><p className="font-medium text-slate-900 dark:text-white">{s.receiver_name}</p></div>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider ${s.payment_mode === 'Prepaid' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'}`}>
                                            {s.payment_mode === 'Prepaid' ? <CreditCard size={12}/> : <IndianRupee size={12}/>}
                                            {s.payment_mode || "COD"}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold capitalize border ${s.current_status === 'delivered' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-blue-50 text-blue-700 border-blue-200'}`}>
                                            {s.current_status.replace('_', ' ')}
                                        </span>
                                    </td>
                                    <td className="p-4 text-right">
                                        <button 
                                            onClick={() => setSelectedAwb(s.awb_code)}
                                            className="inline-flex items-center gap-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wide hover:opacity-90 transition-opacity shadow-sm"
                                        >
                                            Track <ArrowRight size={14} />
                                        </button>
                                    </td>
                                </tr>
                              );
                          })
                      )}
                  </tbody>
              </table>
          </div>
        </div>
      </div>

      {/* --- RIGHT SIDE: THE DRAWER (Sidebar) --- */}
      {selectedAwb && (
        <div className="absolute inset-y-0 right-0 w-full md:w-[480px] bg-white dark:bg-slate-900 shadow-2xl border-l border-slate-200 dark:border-slate-800 z-50 flex flex-col animate-slide-in-right">
            <TrackingSidePanel awb={selectedAwb} onClose={() => setSelectedAwb(null)} />
        </div>
      )}

    </div>
  );
}


// --- SUB-COMPONENT: TRACKING SIDE PANEL ---
function TrackingSidePanel({ awb, onClose }: { awb: string, onClose: () => void }) {
    const [loading, setLoading] = useState(true);
    const [shipment, setShipment] = useState<any>(null);
    const [history, setHistory] = useState<any[]>([]);
    const [podImages, setPodImages] = useState<any[]>([]);
    const [senderProfile, setSenderProfile] = useState<any>(null);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  
    useEffect(() => {
      const fetchData = async () => {
        setLoading(true);
        const { data: userData } = await supabase.auth.getUser();
        setCurrentUserId(userData.user?.id || null);

        const { data: shipData } = await supabase.from("shipments").select("*").eq("awb_code", awb).single();
        
        if (shipData) {
          setShipment(shipData);
          const { data: profileData } = await supabase.from("profiles").select("*").eq("id", shipData.user_id).single();
          setSenderProfile(profileData);
          const { data: events } = await supabase.from("tracking_events").select("*").eq("shipment_id", shipData.id).order('timestamp', { ascending: false });
          setHistory(events || []);
          const { data: images } = await supabase.from("pod_images").select("*").eq("shipment_id", shipData.id);
          setPodImages(images || []);
        }
        setLoading(false);
      };
      if (awb) fetchData();
    }, [awb]);

    const formatLocation = (loc: string) => {
        if (!loc) return "Processing Center";
        const lowerLoc = loc.toLowerCase();
        if (lowerLoc.includes("admin") || lowerLoc.includes("panel")) return "Central Hub (Manual Update)";
        if (lowerLoc.includes("api") || lowerLoc.includes("system")) return "System Automated Check";
        return loc; 
    };
  
    return (
        <div className="flex flex-col h-full bg-white dark:bg-slate-900">
            {/* Header */}
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-start bg-slate-50/50 dark:bg-slate-800/20">
                <div>
                    <h2 className="text-2xl font-black text-slate-900 dark:text-white">#{awb}</h2>
                    <p className="text-slate-500 text-xs uppercase font-bold tracking-wider mt-1 flex items-center gap-1">
                        {loading ? "Loading..." : shipment?.current_status.replace('_', ' ')}
                    </p>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-colors">
                    <X size={20} className="text-slate-500"/>
                </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {loading ? (
                    <div className="flex flex-col items-center justify-center h-40 text-slate-400">
                        <Loader2 className="animate-spin mb-2" size={30}/> Loading details...
                    </div>
                ) : !shipment ? (
                    <div className="text-center text-red-500">Failed to load shipment data.</div>
                ) : (
                    <>
                        {/* 1. Route Info */}
                        <div className="space-y-4">
                             {/* Receiver Card */}
                            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-100 dark:border-slate-800">
                                <div className="flex items-start gap-3">
                                    <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-full text-green-600 dark:text-green-400">
                                        <MapPin size={16}/>
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-xs font-bold text-slate-400 uppercase mb-1">Receiver</p>
                                        <p className="font-bold text-slate-900 dark:text-white text-base">{shipment.receiver_name}</p>
                                        <p className="text-sm text-slate-600 dark:text-slate-300 leading-snug mt-1 mb-2">{shipment.receiver_address}</p>
                                        <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-white dark:bg-slate-800 rounded-md border border-slate-200 dark:border-slate-700">
                                            <span className="text-[10px] font-bold text-slate-400 uppercase">Tel:</span>
                                            <span className="text-xs font-mono font-medium text-slate-700 dark:text-slate-200">{shipment.receiver_phone || "N/A"}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Sender Card */}
                            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-100 dark:border-slate-800 opacity-75 hover:opacity-100 transition-opacity">
                                <div className="flex items-start gap-3">
                                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-full text-blue-600 dark:text-blue-400">
                                        <Truck size={16}/>
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-xs font-bold text-slate-400 uppercase mb-1">Sender</p>
                                        <p className="font-bold text-slate-900 dark:text-white text-base">{shipment.sender_name || "N/A"}</p>
                                        <p className="text-sm text-slate-600 dark:text-slate-300 leading-snug mt-1 mb-2">{shipment.sender_address || "N/A"}</p>
                                        <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-white dark:bg-slate-800 rounded-md border border-slate-200 dark:border-slate-700">
                                            <span className="text-[10px] font-bold text-slate-400 uppercase">Tel:</span>
                                            <span className="text-xs font-mono font-medium text-slate-700 dark:text-slate-200">{shipment.sender_phone || "N/A"}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 2. Financials */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
                                <p className="text-xs text-slate-400 uppercase font-bold mb-1 flex items-center gap-1"><IndianRupee size={12}/> Cost</p>
                                <p className="text-xl font-black text-slate-900 dark:text-white">₹{shipment.cost}</p>
                            </div>
                            <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
                                <p className="text-xs text-slate-400 uppercase font-bold mb-1 flex items-center gap-1"><CreditCard size={12}/> Mode</p>
                                <p className={`text-xl font-black uppercase ${shipment.payment_mode === 'Prepaid' ? 'text-green-600' : 'text-orange-500'}`}>{shipment.payment_mode}</p>
                            </div>
                        </div>

                        {/* 3. Timeline */}
                        <div>
                            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase mb-4 flex items-center gap-2">
                                <Clock size={16}/> Journey
                            </h3>
                            <div className="border-l-2 border-slate-200 dark:border-slate-700 ml-2 space-y-6 pb-2">
                                {history.map((event, idx) => (
                                    <div key={event.id} className="relative pl-6">
                                        <span className={`absolute -left-[5px] top-1.5 h-2.5 w-2.5 rounded-full ring-4 ring-white dark:ring-slate-900 ${idx===0 ? 'bg-blue-600' : 'bg-slate-300'}`}></span>
                                        <p className="text-sm font-bold text-slate-800 dark:text-slate-200 capitalize">{event.status.replace('_', ' ')}</p>
                                        <p className="text-xs text-slate-400 mt-0.5">{new Date(event.timestamp).toLocaleString()}</p>
                                        
                                        {event.location && (
                                            <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                                                <MapPin size={10}/> {formatLocation(event.location)}
                                            </p>
                                        )}
                                    </div>
                                ))}
                                <div className="relative pl-6">
                                    <span className="absolute -left-[5px] top-1.5 h-2.5 w-2.5 rounded-full bg-slate-300 ring-4 ring-white dark:ring-slate-900"></span>
                                    <p className="text-sm font-bold text-slate-400">Order Placed</p>
                                </div>
                            </div>
                        </div>

                        {/* 4. PODs */}
                        {podImages.length > 0 && (
                            <div>
                                <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase mb-3 flex items-center gap-2">
                                    <ImageIcon size={16}/> Proof of Delivery
                                </h3>
                                <div className="grid grid-cols-3 gap-2">
                                    {podImages.map((img) => (
                                        <a key={img.id} href={img.image_url} target="_blank" className="block aspect-square rounded-lg overflow-hidden border border-slate-200 bg-slate-100 hover:opacity-90">
                                            <img src={img.image_url} className="w-full h-full object-cover"/>
                                        </a>
                                    ))}
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
            
            {/* Footer Actions */}
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 grid grid-cols-2 gap-3">
                <button 
                    onClick={() => generateInvoice(shipment, senderProfile)}
                    disabled={loading || !shipment}
                    className={`w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-opacity 
                        ${currentUserId !== shipment?.user_id 
                            ? 'col-span-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900' 
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white'
                        }`}
                >
                    <FileText size={16}/> {currentUserId !== shipment?.user_id ? 'Download Invoice' : 'Invoice'}
                </button>

                {currentUserId === shipment?.user_id && (
                    <button 
                        onClick={() => window.open(`/print/${awb}`, '_blank')}
                        className="w-full py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
                    >
                        <Printer size={16}/> Print Label
                    </button>
                )}
            </div>
        </div>
    );
}