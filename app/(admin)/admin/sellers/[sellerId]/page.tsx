"use client";

import { useEffect, useState, use } from "react";
import { supabase } from "@/lib/supabase";
import { 
  Building2, MapPin, Phone, Copy, Check, ShieldCheck, 
  Package, Loader2, Key, Printer, ExternalLink, 
  FileText, X, Save, AlertTriangle, Truck, RefreshCw, ArrowLeft, User
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { generateInvoice } from "@/lib/invoiceGenerator"; 
import { motion, AnimatePresence } from "framer-motion";

// Helper for status colors
const getStatusColor = (status: string) => {
  switch (status) {
    case 'delivered': return 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-900/50';
    case 'cancelled': 
    case 'rto_initiated': return 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-900/50';
    case 'in_transit': 
    case 'out_for_delivery': return 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-900/50';
    default: return 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700';
  }
};

export default function SellerDetailPage({ params }: { params: Promise<{ sellerId: string }> }) {
  const router = useRouter();
  const { sellerId } = use(params);
  
  // --- STATE MANAGEMENT ---
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [shipments, setShipments] = useState<any[]>([]);
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [generating, setGenerating] = useState(false); 
  
  // Side Panel State
  const [selectedShipment, setSelectedShipment] = useState<any>(null);
  const [statusToUpdate, setStatusToUpdate] = useState("");
  const [updating, setUpdating] = useState(false);

  // --- EFFECTS ---
  useEffect(() => {
    if (sellerId) fetchSellerDetails();
  }, [sellerId]);

  // --- DATA FETCHING ---
  const fetchSellerDetails = async () => {
    // 1. Get Profile
    const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', sellerId)
        .single();
    
    if (profileError) console.error("Profile Error:", profileError);
    if (profileData) setProfile(profileData);

    // 2. Get API Key
    const { data: keyData, error: keyError } = await supabase
        .from('api_keys')
        .select('secret_key')
        .eq('user_id', sellerId)
        .maybeSingle(); 
    
    if (keyData) setApiKey(keyData.secret_key);

    // 3. Get Shipments
    fetchShipments();
  };

  const fetchShipments = async () => {
    const { data, error } = await supabase
      .from('shipments')
      .select('*')
      .eq('user_id', sellerId)
      .order('created_at', { ascending: false });
    
    if (error) console.error("Shipment Error:", error);
    setShipments(data || []);
    setLoading(false);
  };

  // --- ACTIONS ---
  const handleGenerateKey = async () => {
    if (apiKey) {
        if (!confirm("⚠️ Warning: Regenerating this key will break the partner's existing integration. Are you sure?")) return;
    }

    setGenerating(true);
    const newKey = 'sk_live_' + Math.random().toString(36).substr(2, 9) + Math.random().toString(36).substr(2, 9);

    try {
        const { error } = await supabase
            .from('api_keys')
            .upsert(
                { user_id: sellerId, secret_key: newKey }, 
                { onConflict: 'user_id' }
            );

        if (error) throw error;
        setApiKey(newKey); 
        alert("✅ API Key Generated Successfully!");
    } catch (err: any) {
        alert("Error generating key: " + err.message);
    } finally {
        setGenerating(false);
    }
  };

  const handleUpdateStatus = async () => {
    if (!selectedShipment) return;
    setUpdating(true);

    const { error } = await supabase
        .from('shipments')
        .update({ current_status: statusToUpdate })
        .eq('id', selectedShipment.id);

    if (error) {
        alert("Failed to update status");
        setUpdating(false);
        return;
    }
    
    await supabase.from('tracking_events').insert({
        shipment_id: selectedShipment.id,
        status: statusToUpdate,
        location: 'Admin Panel (Manual Update)',
        timestamp: new Date().toISOString()
    });

    await fetchShipments();
    setUpdating(false);
    setSelectedShipment(null); 
  };

  const copyKey = () => {
    if (apiKey) {
        navigator.clipboard.writeText(apiKey);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#050b14] text-slate-500">
        <Loader2 className="animate-spin mr-2"/> Loading Partner Profile...
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#050b14] transition-colors duration-300 font-sans relative overflow-hidden">
      
      {/* 🌟 Ambient Background Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-64 bg-blue-500/10 dark:bg-blue-500/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto space-y-6 pb-20 relative p-4 lg:p-8 z-10">
      
        <Link 
          href="/admin/sellers" 
          className="group inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white mb-4 transition-colors"
        >
          <div className="p-1 rounded-full group-hover:bg-slate-200 dark:group-hover:bg-slate-800 transition-colors">
            <ArrowLeft size={16}/>
          </div>
          Back to Partners
        </Link>

        {/* 🏢 Header Section - Glassmorphism */}
        <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-gray-200 dark:border-slate-800 p-6 rounded-3xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-sm dark:shadow-2xl">
          <div className="flex items-start md:items-center gap-5 w-full">
            <div className="h-16 w-16 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center border border-blue-100 dark:border-blue-800/50 shadow-inner shrink-0">
                <Building2 size={32} />
            </div>
            <div className="min-w-0 flex-1">
                <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white truncate tracking-tight">
                    {profile?.business_name || profile?.company_name || "Unnamed Business"}
                </h1>
                
                {/* Header Details */}
                <div className="flex flex-wrap items-center gap-3 text-sm mt-2">
                    <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800 font-medium text-xs">
                        <ShieldCheck size={12} strokeWidth={3}/> Verified
                    </span>
                    
                    <span className="hidden md:inline text-slate-300 dark:text-slate-700">|</span>
                    <span className="text-slate-600 dark:text-slate-400 font-medium">{profile?.email}</span>
                    
                    <span className="hidden md:inline text-slate-300 dark:text-slate-700">|</span>
                    <span className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                        <User size={14} className="text-slate-400 dark:text-slate-500"/> 
                        Owner: <span className="text-slate-700 dark:text-slate-300 font-medium">{profile?.full_name || "Unknown"}</span>
                    </span>
                </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* 🔑 Left Column: API & Contact Info */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm dark:shadow-xl h-full flex flex-col">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-slate-900 dark:text-white font-bold flex items-center gap-2">
                        <div className="p-1.5 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                            <Key size={16} className="text-yellow-600 dark:text-yellow-500"/> 
                        </div>
                        Integration
                    </h3>
                    {/* Regenerate Button */}
                    {apiKey && (
                        <button 
                            onClick={handleGenerateKey}
                            disabled={generating}
                            className="text-xs font-medium text-slate-500 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400 flex items-center gap-1.5 px-2 py-1 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                        >
                            {generating ? <Loader2 className="animate-spin" size={12}/> : <RefreshCw size={12}/>} Reset Key
                        </button>
                    )}
                </div>
                
                {/* API Key Box */}
                {apiKey ? (
                    <div className="relative group">
                        <div className="bg-slate-100 dark:bg-black/40 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 flex justify-between items-center overflow-hidden">
                            <code className="text-xs text-slate-600 dark:text-slate-300 font-mono truncate flex-1 min-w-0 mr-2 tracking-wide">
                                {apiKey}
                            </code>
                            <button onClick={copyKey} className="shrink-0 p-1.5 hover:bg-white dark:hover:bg-slate-700 rounded-lg transition-colors shadow-sm">
                                {copied ? <Check size={14} className="text-green-500"/> : <Copy size={14} className="text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white"/>}
                            </button>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-2 px-1">Use this secret key for server-side integration.</p>
                    </div>
                ) : (
                    <div className="mb-4">
                        <div className="p-4 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 rounded-xl text-center">
                            <p className="text-xs font-medium text-red-600 dark:text-red-400 mb-3">No API Key active.</p>
                            <button 
                                onClick={handleGenerateKey}
                                disabled={generating}
                                className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg flex items-center justify-center gap-2 transition-all shadow-lg shadow-red-600/20"
                            >
                                {generating ? <Loader2 className="animate-spin" size={14}/> : <Key size={14}/>}
                                Generate Key
                            </button>
                        </div>
                    </div>
                )}

                {/* Contact Details */}
                <div className="mt-auto pt-6 border-t border-gray-100 dark:border-slate-800 space-y-4">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Contact Info</h4>
                    <div className="flex items-start gap-3 text-sm text-slate-600 dark:text-slate-400 group">
                        <MapPin size={18} className="mt-0.5 shrink-0 text-slate-400 group-hover:text-blue-500 transition-colors"/> 
                        <p className="leading-relaxed">{profile?.address || "No Address Provided"}</p>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400 group">
                        <Phone size={18} className="text-slate-400 shrink-0 group-hover:text-blue-500 transition-colors"/> 
                        <p>{profile?.phone || profile?.phone_number || "No Phone Provided"}</p>
                    </div>
                </div>
            </div>
          </div>

          {/* 📦 Right Column: Shipment History Table */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm dark:shadow-xl h-full flex flex-col">
                <div className="p-6 border-b border-gray-100 dark:border-slate-800 flex justify-between items-center">
                    <h3 className="text-slate-900 dark:text-white font-bold text-lg flex items-center gap-2">
                        <Package className="text-blue-500" size={20}/> Shipments
                    </h3>
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full border border-slate-200 dark:border-slate-700">
                        {shipments.length} Orders
                    </span>
                </div>
                
                {/* Scrollable Table Container */}
                <div className="overflow-x-auto custom-scrollbar flex-1">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-gray-50 dark:bg-slate-950/50 text-slate-500 dark:text-slate-400 uppercase font-bold text-[11px] tracking-wider border-b border-gray-200 dark:border-slate-800">
                            <tr>
                                <th className="p-4 pl-6">AWB Code</th>
                                <th className="p-4">Receiver</th>
                                <th className="p-4">Status</th>
                                <th className="p-4 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                            {shipments.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="p-12 text-center flex flex-col items-center justify-center text-slate-500">
                                        <Package size={48} className="mb-3 opacity-20"/>
                                        <p>No shipments found for this partner.</p>
                                    </td>
                                </tr>
                            ) : (
                                shipments.map((ship) => (
                                    <tr key={ship.id} className="hover:bg-blue-50/50 dark:hover:bg-slate-800/40 transition-colors group">
                                        
                                        {/* AWB Column */}
                                        <td className="p-4 pl-6">
                                            <div className="font-mono text-slate-900 dark:text-white font-medium group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                                {ship.awb_code}
                                            </div>
                                            <div className="text-[10px] text-slate-500 mt-0.5">
                                                {new Date(ship.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                            </div>
                                        </td>
                                        
                                        {/* Receiver Column */}
                                        <td className="p-4">
                                            <div className="text-slate-700 dark:text-slate-200 font-medium max-w-[150px] truncate">
                                                {ship.receiver_name}
                                            </div>
                                            <div className="text-[10px] text-slate-500 truncate flex items-center gap-1">
                                                <MapPin size={10}/> {ship.receiver_city}
                                            </div>
                                        </td>
                                        
                                        {/* Status Column */}
                                        <td className="p-4">
                                            <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase border shadow-sm ${getStatusColor(ship.current_status)}`}>
                                                {ship.current_status?.replace(/_/g, ' ')}
                                            </span>
                                        </td>
                                        
                                        {/* Actions Column */}
                                        <td className="p-4">
                                            <div className="flex justify-center gap-2 opacity-100 sm:opacity-60 sm:group-hover:opacity-100 transition-opacity">
                                                <Link 
                                                    href={`/print/${ship.awb_code}`} 
                                                    target="_blank" 
                                                    className="p-2 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg border border-gray-200 dark:border-slate-700 transition-all shadow-sm"
                                                    title="Print Label"
                                                >
                                                    <Printer size={16} />
                                                </Link>
                                                
                                                <button 
                                                    onClick={() => generateInvoice(ship, profile)}
                                                    className="p-2 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg border border-gray-200 dark:border-slate-700 transition-all shadow-sm"
                                                    title="Invoice"
                                                >
                                                    <FileText size={16} />
                                                </button>

                                                <button 
                                                    onClick={() => {
                                                        setSelectedShipment(ship);
                                                        setStatusToUpdate(ship.current_status);
                                                    }}
                                                    className="p-2 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800/50 rounded-lg transition-all shadow-sm"
                                                    title="Manage"
                                                >
                                                    <ExternalLink size={16} />
                                                </button>
                                            </div>
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

        {/* 🟦 SIDE PANEL (Responsive Drawer) */}
        <AnimatePresence>
        {selectedShipment && (
            <div className="fixed inset-0 z-50 flex justify-end">
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-slate-900/30 dark:bg-black/60 backdrop-blur-sm" 
                    onClick={() => setSelectedShipment(null)}
                />
                
                <motion.div 
                    initial={{ x: "100%" }}
                    animate={{ x: 0 }}
                    exit={{ x: "100%" }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    className="relative w-full md:max-w-md bg-white dark:bg-slate-900 h-full border-l border-gray-200 dark:border-slate-800 shadow-2xl flex flex-col"
                >
                    <div className="p-6 border-b border-gray-100 dark:border-slate-800 flex justify-between items-center bg-gray-50/50 dark:bg-slate-950/50">
                        <div>
                            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                <Truck className="text-blue-500" size={20}/> Manage Order
                            </h2>
                            <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-1">AWB: {selectedShipment.awb_code}</p>
                        </div>
                        <button 
                            onClick={() => setSelectedShipment(null)} 
                            className="p-2 hover:bg-gray-200 dark:hover:bg-slate-800 rounded-full text-slate-500 dark:text-slate-400 transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 space-y-8">
                        
                        {/* Status Updater */}
                        <div className="bg-blue-50/50 dark:bg-slate-800/50 p-5 rounded-2xl border border-blue-100 dark:border-slate-700">
                            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-3 block flex items-center gap-2">
                                <AlertTriangle size={14} className="text-amber-500"/> Update Status
                            </label>
                            
                            <div className="relative">
                                <select 
                                    value={statusToUpdate}
                                    onChange={(e) => setStatusToUpdate(e.target.value)}
                                    className="w-full appearance-none bg-white dark:bg-slate-950 border border-gray-200 dark:border-slate-700 text-slate-900 dark:text-white p-3.5 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer"
                                >
                                    <option value="created">Created</option>
                                    <option value="picked_up">Picked Up</option>
                                    <option value="in_transit">In Transit</option>
                                    <option value="out_for_delivery">Out for Delivery</option>
                                    <option value="delivered">Delivered</option>
                                    <option value="cancelled">Cancelled</option>
                                    <option value="rto_initiated">RTO Initiated</option>
                                </select>
                                <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                                    <RefreshCw size={14}/>
                                </div>
                            </div>

                            <button 
                                onClick={handleUpdateStatus} 
                                disabled={updating || statusToUpdate === selectedShipment.current_status} 
                                className="w-full mt-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl flex justify-center items-center gap-2 transition-all shadow-lg shadow-blue-600/20"
                            >
                                {updating ? <Loader2 className="animate-spin" size={16}/> : <Save size={16}/>} 
                                Save Changes
                            </button>
                        </div>

                        {/* Details */}
                        <div className="space-y-4">
                            <h3 className="font-bold text-slate-900 dark:text-white border-b border-gray-100 dark:border-slate-800 pb-2">Shipment Details</h3>
                            
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div className="p-3 bg-gray-50 dark:bg-slate-800/50 rounded-lg">
                                    <p className="text-[10px] text-slate-400 uppercase font-bold mb-1">Origin</p>
                                    <p className="text-slate-700 dark:text-slate-300 font-medium">{selectedShipment.sender_city}</p>
                                </div>
                                <div className="p-3 bg-gray-50 dark:bg-slate-800/50 rounded-lg">
                                    <p className="text-[10px] text-slate-400 uppercase font-bold mb-1">Destination</p>
                                    <p className="text-slate-700 dark:text-slate-300 font-medium">{selectedShipment.receiver_city}</p>
                                </div>
                                <div className="p-3 bg-gray-50 dark:bg-slate-800/50 rounded-lg">
                                    <p className="text-[10px] text-slate-400 uppercase font-bold mb-1">Weight</p>
                                    <p className="text-slate-700 dark:text-slate-300 font-medium">{selectedShipment.weight} KG</p>
                                </div>
                                <div className="p-3 bg-gray-50 dark:bg-slate-800/50 rounded-lg">
                                    <p className="text-[10px] text-slate-400 uppercase font-bold mb-1">Total Cost</p>
                                    <p className="text-slate-700 dark:text-slate-300 font-medium">₹{selectedShipment.total_cost}</p>
                                </div>
                            </div>

                            <div className="bg-gray-100 dark:bg-black/30 p-5 rounded-xl text-sm border border-gray-200 dark:border-slate-800">
                                <div className="space-y-4">
                                    <div>
                                        <span className="text-slate-500 dark:text-slate-500 block text-[10px] font-bold uppercase mb-0.5">Receiver Name</span> 
                                        <span className="text-slate-900 dark:text-slate-200 font-medium">{selectedShipment.receiver_name}</span>
                                    </div>
                                    <div>
                                        <span className="text-slate-500 dark:text-slate-500 block text-[10px] font-bold uppercase mb-0.5">Full Address</span> 
                                        <span className="text-slate-700 dark:text-slate-300 leading-relaxed">{selectedShipment.receiver_address}</span>
                                    </div>
                                    <div>
                                        <span className="text-slate-500 dark:text-slate-500 block text-[10px] font-bold uppercase mb-0.5">Contact</span> 
                                        <span className="text-slate-900 dark:text-slate-200 font-mono">{selectedShipment.receiver_phone}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        )}
        </AnimatePresence>
      </div>
    </div>
  );
}