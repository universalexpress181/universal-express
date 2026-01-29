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
    <div className="flex h-[50vh] items-center justify-center text-slate-500">
        <Loader2 className="animate-spin mr-2"/> Loading Partner Profile...
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20 relative p-4 lg:p-0">
      
      <Link 
        href="/admin/sellers" 
        className="text-slate-400 hover:text-white text-sm flex items-center gap-2 mb-4 inline-flex transition-colors"
      >
        <ArrowLeft size={16}/> Back to Partners
      </Link>

      {/* 🏢 Header Section */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-xl">
        <div className="flex items-start md:items-center gap-4 w-full">
            <div className="h-16 w-16 bg-blue-900/20 text-blue-400 rounded-xl flex items-center justify-center border border-blue-900/50 shrink-0">
                <Building2 size={32} />
            </div>
            <div className="min-w-0 flex-1">
                <h1 className="text-xl md:text-2xl font-bold text-white truncate">
                    {profile?.business_name || profile?.company_name || "Unnamed Business"}
                </h1>
                
                {/* ✅ UPDATED HEADER DETAILS WITH OWNER NAME */}
                <div className="flex flex-wrap items-center gap-2 text-slate-400 text-sm mt-1">
                    <span className="flex items-center gap-1 whitespace-nowrap"><ShieldCheck size={14} className="text-green-500"/> Verified</span>
                    
                    <span className="hidden md:inline text-slate-600">•</span>
                    <span className="truncate max-w-[200px] block md:inline">{profile?.email}</span>
                    
                    <span className="hidden md:inline text-slate-600">•</span>
                    <span className="flex items-center gap-1 text-slate-300">
                        <User size={14} className="text-slate-500"/> 
                        Owner: {profile?.full_name || "Unknown"}
                    </span>
                </div>

            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* 🔑 Left Column: API & Contact Info */}
        <div className="lg:col-span-1 space-y-6">
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-lg">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-white font-bold flex items-center gap-2">
                        <Key size={18} className="text-yellow-500"/> Integration
                    </h3>
                    {/* Regenerate Button (Small) */}
                    {apiKey && (
                        <button 
                            onClick={handleGenerateKey}
                            disabled={generating}
                            className="text-xs text-slate-500 hover:text-white flex items-center gap-1"
                        >
                            {generating ? <Loader2 className="animate-spin" size={12}/> : <RefreshCw size={12}/>} Reset
                        </button>
                    )}
                </div>
                
                {/* API Key Box */}
                {apiKey ? (
                    <div className="bg-black/50 p-3 rounded-lg border border-slate-800 mb-4 flex justify-between items-center overflow-hidden">
                        <code className="text-xs text-slate-300 font-mono truncate flex-1 min-w-0 mr-2">
                            {apiKey}
                        </code>
                        <button onClick={copyKey} className="shrink-0 p-1 hover:bg-slate-800 rounded">
                            {copied ? <Check size={14} className="text-green-500"/> : <Copy size={14} className="text-slate-400 hover:text-white"/>}
                        </button>
                    </div>
                ) : (
                    <div className="mb-4">
                        <div className="p-3 bg-red-900/10 border border-red-900/30 rounded-lg text-center">
                            <p className="text-xs text-red-400 mb-3">No API Key found.</p>
                            <button 
                                onClick={handleGenerateKey}
                                disabled={generating}
                                className="w-full py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded flex items-center justify-center gap-2 transition-all"
                            >
                                {generating ? <Loader2 className="animate-spin" size={14}/> : <Key size={14}/>}
                                Generate Key
                            </button>
                        </div>
                    </div>
                )}

                {/* Contact Details */}
                <div className="space-y-3 pt-4 border-t border-slate-800">
                    <div className="flex items-start gap-3 text-sm text-slate-400 break-words">
                        <MapPin size={16} className="mt-1 shrink-0 text-slate-500"/> 
                        <p>{profile?.address || "No Address Provided"}</p>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-slate-400">
                        <Phone size={16} className="text-slate-500 shrink-0"/> 
                        <p>{profile?.phone || profile?.phone_number || "No Phone Provided"}</p>
                    </div>
                </div>
            </div>
        </div>

        {/* 📦 Right Column: Shipment History Table */}
        <div className="lg:col-span-2">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
                <div className="p-6 border-b border-slate-800 flex justify-between items-center">
                    <h3 className="text-white font-bold text-lg">Shipments</h3>
                    <span className="text-xs text-slate-500 bg-slate-950 px-3 py-1 rounded-full border border-slate-800">
                        {shipments.length} Total
                    </span>
                </div>
                
                {/* Scrollable Table Container */}
                <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-left text-sm text-slate-400 whitespace-nowrap">
                        <thead className="bg-slate-950 text-slate-500 uppercase font-bold text-xs">
                            <tr>
                                <th className="p-4">AWB Code</th>
                                <th className="p-4">Receiver</th>
                                <th className="p-4">Status</th>
                                <th className="p-4 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                            {shipments.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="p-8 text-center text-slate-500">
                                        No shipments found for this partner.
                                    </td>
                                </tr>
                            ) : (
                                shipments.map((ship) => (
                                    <tr key={ship.id} className="hover:bg-slate-800/50 transition-colors">
                                        
                                        {/* AWB Column */}
                                        <td className="p-4 font-mono text-white font-medium">
                                            {ship.awb_code}
                                            <div className="text-[10px] text-slate-600 font-normal">
                                                {new Date(ship.created_at).toLocaleDateString()}
                                            </div>
                                        </td>
                                        
                                        {/* Receiver Column */}
                                        <td className="p-4 text-white max-w-[150px] truncate">
                                            {ship.receiver_name}
                                            <div className="text-[10px] text-slate-500 truncate">
                                                {ship.receiver_city}
                                            </div>
                                        </td>
                                        
                                        {/* Status Column */}
                                        <td className="p-4">
                                            <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase border ${
                                                ship.current_status === 'delivered' ? 'bg-green-900/20 text-green-400 border-green-900/50' : 
                                                ship.current_status === 'cancelled' ? 'bg-red-900/20 text-red-400 border-red-900/50' :
                                                'bg-blue-900/20 text-blue-400 border-blue-900/50'
                                            }`}>
                                                {ship.current_status?.replace(/_/g, ' ')}
                                            </span>
                                        </td>
                                        
                                        {/* Actions Column */}
                                        <td className="p-4 flex justify-center gap-2">
                                            
                                            <Link 
                                                href={`/print/${ship.awb_code}`} 
                                                target="_blank" 
                                                className="p-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg border border-slate-700 transition-all"
                                                title="Print Label"
                                            >
                                                <Printer size={16} />
                                            </Link>
                                            
                                            <button 
                                                onClick={() => generateInvoice(ship, profile)}
                                                className="p-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg border border-slate-700 transition-all"
                                                title="Invoice"
                                            >
                                                <FileText size={16} />
                                            </button>

                                            <button 
                                                onClick={() => {
                                                    setSelectedShipment(ship);
                                                    setStatusToUpdate(ship.current_status);
                                                }}
                                                className="p-2 bg-blue-900/30 hover:bg-blue-600 text-blue-400 hover:text-white border border-blue-900/50 hover:border-blue-500 rounded-lg transition-all"
                                                title="Manage"
                                            >
                                                <ExternalLink size={16} />
                                            </button>
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
      {selectedShipment && (
        <div className="fixed inset-0 z-50 flex justify-end">
            <div 
                className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity" 
                onClick={() => setSelectedShipment(null)}
            ></div>
            
            <div className="relative w-full md:max-w-md bg-slate-900 h-full border-l border-slate-800 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
                <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-950">
                    <div>
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            <Truck className="text-blue-500"/> Manage Order
                        </h2>
                        <p className="text-xs text-slate-500 font-mono mt-1">AWB: {selectedShipment.awb_code}</p>
                    </div>
                    <button 
                        onClick={() => setSelectedShipment(null)} 
                        className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
                        <label className="text-xs font-bold text-slate-400 uppercase mb-2 block flex items-center gap-2">
                            <AlertTriangle size={14} className="text-yellow-500"/> Update Status
                        </label>
                        <select 
                            value={statusToUpdate}
                            onChange={(e) => setStatusToUpdate(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-700 text-white p-3 rounded-lg mb-4 focus:outline-none focus:border-blue-500"
                        >
                            <option value="created">Created</option>
                            <option value="picked_up">Picked Up</option>
                            <option value="in_transit">In Transit</option>
                            <option value="out_for_delivery">Out for Delivery</option>
                            <option value="delivered">Delivered</option>
                            <option value="cancelled">Cancelled</option>
                            <option value="rto_initiated">RTO Initiated</option>
                        </select>
                        <button 
                            onClick={handleUpdateStatus} 
                            disabled={updating || statusToUpdate === selectedShipment.current_status} 
                            className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-lg flex justify-center items-center gap-2 transition-all"
                        >
                            {updating ? <Loader2 className="animate-spin" size={16}/> : <Save size={16}/>} 
                            Save Changes
                        </button>
                    </div>

                    <div className="space-y-4">
                        <h3 className="font-bold text-white border-b border-slate-800 pb-2">Shipment Details</h3>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div><p className="text-xs text-slate-500">Origin</p><p className="text-slate-300">{selectedShipment.sender_city}</p></div>
                            <div><p className="text-xs text-slate-500">Destination</p><p className="text-slate-300">{selectedShipment.receiver_city}</p></div>
                            <div><p className="text-xs text-slate-500">Weight</p><p className="text-slate-300">{selectedShipment.weight} KG</p></div>
                            <div><p className="text-xs text-slate-500">Total Cost</p><p className="text-slate-300">₹{selectedShipment.total_cost}</p></div>
                        </div>
                        <div className="bg-black/30 p-4 rounded-lg text-sm text-slate-400">
                            <p><span className="text-slate-500 block text-xs font-bold uppercase">Receiver Name</span> {selectedShipment.receiver_name}</p>
                            <p className="mt-2"><span className="text-slate-500 block text-xs font-bold uppercase">Full Address</span> {selectedShipment.receiver_address}</p>
                            <p className="mt-2"><span className="text-slate-500 block text-xs font-bold uppercase">Contact</span> {selectedShipment.receiver_phone}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      )}

    </div>
  );
}