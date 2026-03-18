"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { generateInvoice } from "@/lib/invoiceGenerator"; 
import { 
  Truck, Save, Upload, ArrowLeft, Loader2, Trash2, 
  Image as ImageIcon, Clock, FileText, Printer, AlertTriangle, UserCheck, 
  MapPin, Box, CreditCard, ChevronRight, Activity, CheckCircle2, Link2
} from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

// ✅ MASTER STATUS OPTIONS 
const STATUS_OPTIONS = [
  { group: "1. Pickup Phase", options: [
    { code: "99", label: "PENDING PICKUP", remark: "Shipment created; waiting for courier collection" },
    { code: "100", label: "PICKUP DONE", remark: "Package successfully collected from sender" },
    { code: "900", label: "PICKUP CANCELLED", remark: "Order cancelled by client before pickup" },
    { code: "900A", label: "PICKUP CANCELLED", remark: "Product description or count mismatch" },
    { code: "900B", label: "PICKUP CANCELLED", remark: "Physical damage observed at pickup" },
  ]},
  { group: "2. In-Transit Movement", options: [
    { code: "102", label: "IN-TRANSIT", remark: "Processing at origin hub" },
    { code: "105", label: "IN-TRANSIT", remark: "Ready to dispatch from origin" },
    { code: "200", label: "IN-TRANSIT", remark: "Left from origin facility" },
    { code: "201", label: "IN-TRANSIT", remark: "Standard movement between hubs" },
    { code: "204", label: "IN-TRANSIT", remark: "Network delay / Operational backlog" },
    { code: "211", label: "IN-TRANSIT", remark: "Misrouted; package rerouting in progress" },
    { code: "301", label: "IN-TRANSIT", remark: "Arrived at destination branch" },
    { code: "312", label: "IN-TRANSIT", remark: "Maximum transit attempts reached" },
  ]},
  { group: "3. Final Leg Delivery", options: [
    { code: "305", label: "OUT FOR DELIVERY", remark: "Handed over to delivery agent for final leg" },
    { code: "400", label: "DELIVERED", remark: "Shipment successfully received by consignee" },
    { code: "951", label: "REATTEMPT", remark: "Automated trigger for a second delivery attempt" },
    { code: "1001", label: "UNATTEMPTED", remark: "Agent could not reach address (time constraint)" },
  ]},
  { group: "4. Exceptions (Undelivered)", options: [
    { code: "500", label: "UNDELIVERED", remark: "Consignee refused to accept package" },
    { code: "501", label: "UNDELIVERED", remark: "Incomplete or incorrect address" },
    { code: "502", label: "UNDELIVERED", remark: "ODA (Out of Delivery Area) location" },
    { code: "503", label: "UNDELIVERED", remark: "Consignee has shifted address" },
    { code: "507", label: "UNDELIVERED", remark: "Consignee not ready with COD amount" },
    { code: "508", label: "UNDELIVERED", remark: "Office or residence closed" },
    { code: "515", label: "UNDELIVERED", remark: "Consignee not reachable on phone" },
    { code: "517", label: "UNDELIVERED", remark: "Misrouted during local delivery leg" },
    { code: "520", label: "UNDELIVERED", remark: "Package taken by consignee without payment" },
    { code: "526", label: "UNDELIVERED", remark: "OTP for delivery not shared by customer" },
  ]},
  { group: "5. Returns & Terminals (RTO/Lost)", options: [
    { code: "600", label: "RTO INITIATED", remark: "Return process started back to sender" },
    { code: "601", label: "RTO IN-TRANSIT", remark: "Parcel moving back toward origin" },
    { code: "620", label: "RTO OUT FOR DELIVERY", remark: "Agent delivering returned parcel to vendor" },
    { code: "401", label: "RTO DELIVERED", remark: "Return successfully received by original sender" },
    { code: "621", label: "RTO UNDELIVERED", remark: "Vendor refused to accept return" },
    { code: "901", label: "LOST", remark: "Shipment confirmed lost in network" },
    { code: "902", label: "SHIPMENT DAMAGE", remark: "Parcel damaged beyond repair in transit" },
  ]}
];

// 🎭 ANIMATION VARIANTS
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 200, damping: 20 } }
};

const inputClass = `
  w-full bg-gray-50 dark:bg-[#111827] 
  border border-gray-200 dark:border-gray-800 
  text-gray-900 dark:text-gray-100 
  rounded-xl p-3.5 text-sm outline-none 
  focus:ring-2 focus:ring-indigo-500/30 dark:focus:ring-cyan-500/30 
  focus:border-indigo-500 dark:focus:border-cyan-500
  transition-all placeholder-gray-400 dark:placeholder-gray-600
`;

// 🚀 SMART HELPER: Forces mapping based strictly on the text status first
const resolveStatusCode = (status: string, remarkCode?: string, masterCode?: string) => {
    let code = "";
    if (status) {
        const cStatus = status.toUpperCase().replace(/_/g, ' ');
        const match = STATUS_OPTIONS.flatMap(g => g.options).find(o => o.label === cStatus);
        
        if (match) code = match.code;
        else if (cStatus.includes('CREATED') || cStatus.includes('PENDING') || cStatus.includes('ORDER PLACED')) code = "99";
        else if (cStatus.includes('IN TRANSIT') || cStatus.includes('IN-TRANSIT')) code = "102";
        else if (cStatus.includes('DELIVERED')) code = "400";
        else if (cStatus.includes('CANCEL')) code = "900";
        else if (cStatus.includes('RTO')) code = "600";
    }
    return code || remarkCode || masterCode || "99";
};

export default function AdminShipmentDetail() {
  const { awb } = useParams();
  
  const [shipment, setShipment] = useState<any>(null);
  const [podImages, setPodImages] = useState<any[]>([]); 
  
  // Form State
  const [selectedCode, setSelectedCode] = useState(""); 
  const [status, setStatus] = useState("");
  const [location, setLocation] = useState("Warehouse, Mumbai");
  const [remark, setRemark] = useState(""); 
  const [customTime, setCustomTime] = useState(""); 
  const [referenceId, setReferenceId] = useState(""); 
  const [podUrl, setPodUrl] = useState(""); 
  
  // Staff Assignment
  const [staffList, setStaffList] = useState<any[]>([]);
  const [assignedStaff, setAssignedStaff] = useState("");

  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);

  // 🎨 COLOR LOGIC
  const getStatusColor = (st: string) => {
    if (!st) return 'bg-gray-100 text-gray-500';
    const s = st.toUpperCase();
    if (s.includes('UNDELIVERED') || s.includes('CANCELLED') || s.includes('RTO') || s.includes('FAILED') || s.includes('LOST')) 
        return 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-900/50';
    if (s.includes('DELIVERED') && !s.includes('RTO')) 
        return 'bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-900/20 dark:text-teal-400 dark:border-teal-900/50';
    return 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-cyan-900/20 dark:text-cyan-400 dark:border-cyan-900/50';
  };

  const getLocalNow = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 16);
  };

  // 🔄 REAL-TIME & INITIAL LOAD
  useEffect(() => {
    loadData();
    fetchStaff(); 
    setCustomTime(getLocalNow()); 

    const channel = supabase
      .channel('realtime_shipment_detail')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'shipments', filter: `awb_code=eq.${awb}` },
        (payload) => {
          setShipment(payload.new);
          setStatus(payload.new.current_status);
          
          // 🚀 Sync dropdown via text status priority
          const updatedCode = resolveStatusCode(payload.new.current_status, payload.new.remark_status_code, payload.new.master_status_code);
          setSelectedCode(updatedCode);
          
          setReferenceId(payload.new.reference_id || ""); 
          if (payload.new.delivery_boy_id) setAssignedStaff(payload.new.delivery_boy_id);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [awb]);

  const fetchStaff = async () => {
    const { data } = await supabase.from('staff').select('*').eq('status', 'Active');
    if(data) setStaffList(data);
  };

  const loadData = async () => {
    if (!awb) return;

    const { data: shipData } = await supabase.from('shipments').select('*').eq('awb_code', awb).single();
    
    if (shipData) {
      setShipment(shipData);
      setStatus(shipData.current_status);
      setAssignedStaff(shipData.delivery_boy_id || ""); 
      setReferenceId(shipData.reference_id || ""); 
      
      // 🚀 Prioritize mapping from 'current_status' first
      const codeToSet = resolveStatusCode(shipData.current_status, shipData.remark_status_code, shipData.master_status_code);
      setSelectedCode(codeToSet);

      if (shipData.remark) setRemark(shipData.remark); 

      const { data: images } = await supabase.from('pod_images').select('*').eq('shipment_id', shipData.id).order('uploaded_at', { ascending: false });
      setPodImages(images || []);
    }
    setLoading(false);
  };

  const handleUpdate = async () => {
    if (!shipment?.id || !selectedCode) {
        alert("Please select a valid Status Code.");
        return;
    }

    const currentStatusObj = STATUS_OPTIONS.flatMap(g => g.options).find(o => o.code === selectedCode);
    if (!currentStatusObj) return;

    const { error: updateError } = await supabase
      .from('shipments')
      .update({ 
          current_status: currentStatusObj.label, 
          remark_status_code: selectedCode,       
          remark: remark, 
          reference_id: referenceId 
      })
      .eq('id', shipment.id);

    if (updateError) {
      alert("❌ Failed to update status: " + updateError.message);
      return;
    }

    await supabase.from('tracking_events').insert({
      shipment_id: shipment.id,
      status: currentStatusObj.label,           
      remark_status_code: selectedCode,         
      description: remark, 
      location: location,
      timestamp: new Date(customTime).toISOString() 
    });

    alert("✅ Status Code & Remark Updated Successfully!");
  };

  const handleAssignStaff = async () => {
    if (!shipment?.id) return;
    
    const { error } = await supabase
        .from('shipments')
        .update({ delivery_boy_id: assignedStaff || null }) 
        .eq('id', shipment.id);
    
    if (error) alert("Error: " + error.message);
    else alert("✅ Driver Assigned Successfully!");
  };

  const handleUrlUpload = async () => {
    if (!podUrl.trim() || !shipment?.id) return;
    
    setUploading(true);
    const { error } = await supabase.from('pod_images').insert({
        shipment_id: shipment.id,
        image_url: podUrl.trim()
    });

    if (error) {
        alert("❌ Failed to add URL: " + error.message);
        setUploading(false);
        return;
    }

    await supabase.from('shipments').update({ current_status: 'DELIVERED', remark_status_code: '400', remark: 'Shipment successfully received by consignee' }).eq('id', shipment.id);
    await loadData();
    setPodUrl("");
    setUploading(false);
    alert("✅ URL Added & Marked as Delivered!");
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    if (!shipment?.id) return;

    setUploading(true);
    const files = Array.from(e.target.files);
    
    for (const file of files) {
      const fileExt = file.name.split('.').pop();
      const uniqueId = Math.random().toString(36).substring(7);
      const fileName = `${awb}-pod-${uniqueId}.${fileExt}`;

      const { error: uploadError } = await supabase.storage.from('evidence').upload(fileName, file);
      if (uploadError) continue;

      const { data: { publicUrl } } = supabase.storage.from('evidence').getPublicUrl(fileName);
      await supabase.from('pod_images').insert({ shipment_id: shipment.id, image_url: publicUrl });
    }

    await supabase.from('shipments').update({ current_status: 'DELIVERED', remark_status_code: '400', remark: 'Shipment successfully received by consignee' }).eq('id', shipment.id); 
    await loadData();
    setUploading(false);
    alert("✅ Images Uploaded & Marked as Delivered!");
  };

  const handleDeleteImage = async (imageId: string, imageUrl: string) => {
    if(!confirm("Delete this image?")) return;
    
    if (imageUrl.includes('supabase.co')) {
        const fileName = imageUrl.split('/').pop();
        if (fileName) await supabase.storage.from('evidence').remove([fileName]);
    }
    
    await supabase.from('pod_images').delete().eq('id', imageId);
    setPodImages(podImages.filter(img => img.id !== imageId));
  };

  if (loading) return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#050b14] flex items-center justify-center text-indigo-500 dark:text-cyan-500 gap-3">
        <Loader2 className="animate-spin" size={32}/> <span className="font-medium animate-pulse tracking-widest">SYSTEM INITIALIZING...</span>
    </div>
  );
  
  if (!shipment) return <div className="p-10 text-gray-500">Shipment not found</div>;

  const isFailureStatus = status && ['UNDELIVERED', 'CANCELLED', 'RTO', 'LOST', 'DAMAGE'].some(word => status.toUpperCase().includes(word));
  const isDelivered = shipment.current_status?.toUpperCase() === 'DELIVERED';

  return (
    <motion.div 
      initial="hidden" animate="visible" variants={containerVariants}
      className="min-h-screen bg-[#F3F4F6] dark:bg-[#050b14] text-gray-900 dark:text-gray-200 p-4 md:p-8 relative overflow-x-hidden transition-colors duration-500"
    >
      <div className="fixed top-[-20%] right-[-10%] w-[800px] h-[800px] bg-indigo-200/40 dark:bg-cyan-900/10 rounded-full blur-[150px] pointer-events-none" />
      <div className="fixed bottom-[-20%] left-[-10%] w-[800px] h-[800px] bg-fuchsia-200/40 dark:bg-purple-900/10 rounded-full blur-[150px] pointer-events-none" />

      <motion.div variants={itemVariants}>
        <Link href="/admin/shipments" className="inline-flex items-center gap-2 text-gray-500 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-cyan-400 transition-colors mb-6 group">
            <div className="p-2 rounded-full bg-white dark:bg-[#111827] border border-gray-200 dark:border-gray-800 shadow-sm group-hover:shadow-md transition-all">
                <ArrowLeft size={16} />
            </div>
            <span className="text-sm font-bold tracking-wide">BACK TO COMMAND CENTER</span>
        </Link>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        <div className="lg:col-span-2 space-y-8">
            <motion.div variants={itemVariants} className="bg-white/80 dark:bg-[#0a101f]/80 backdrop-blur-xl border border-gray-200 dark:border-[#1e293b] rounded-3xl p-6 shadow-xl relative overflow-hidden">
                <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4 mb-8">
                    <div>
                        <p className="text-[10px] text-gray-400 dark:text-gray-500 font-black uppercase tracking-[0.2em] mb-1">TRACKING ID</p>
                        <h1 className="text-3xl md:text-5xl font-black text-gray-900 dark:text-white tracking-tighter font-mono">{shipment.awb_code}</h1>
                    </div>
                    <span className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest border backdrop-blur-md shadow-sm ${getStatusColor(shipment.current_status)}`}>
                        {shipment.current_status?.replace(/_/g, ' ') || 'PENDING'} {shipment.remark_status_code ? `(${shipment.remark_status_code})` : ''} 
                    </span>
                </div>

                <div className="relative bg-gray-50 dark:bg-[#111827] border border-gray-100 dark:border-gray-800 rounded-2xl p-6">
                    <div className={`absolute left-[35px] top-10 bottom-10 w-[2px] 
                        ${isDelivered 
                            ? 'bg-indigo-500 dark:bg-cyan-500' 
                            : 'bg-gradient-to-b from-indigo-400 to-gray-300 dark:from-cyan-600 dark:to-gray-800'} 
                    `}></div>
                    
                    <div className="space-y-10">
                        <div className="relative pl-10">
                            <div className={`absolute left-0 top-1 w-6 h-6 rounded-full z-10 transition-all duration-500
                                ${!isDelivered 
                                    ? 'bg-white dark:bg-[#111827] border-[3px] border-indigo-500 dark:border-cyan-500 shadow-[0_0_15px_rgba(99,102,241,0.6)] dark:shadow-[0_0_15px_rgba(6,182,212,0.6)] scale-110' 
                                    : 'bg-indigo-500 dark:bg-cyan-500 border-[3px] border-indigo-500 dark:border-cyan-500'} 
                            `}>
                                {!isDelivered && <div className="absolute inset-0 m-auto w-2 h-2 rounded-full bg-indigo-500 dark:bg-cyan-500 animate-pulse"></div>}
                            </div>
                            <p className={`text-xs font-bold uppercase tracking-wider mb-1 transition-colors ${!isDelivered ? 'text-indigo-600 dark:text-cyan-400' : 'text-gray-500'}`}>ORIGIN POINT</p>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">{shipment.sender_name}</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{shipment.sender_address}, {shipment.sender_city}</p>
                        </div>

                        <div className="relative pl-10">
                            <div className={`absolute left-0 top-1 w-6 h-6 rounded-full z-10 transition-all duration-500 flex items-center justify-center
                                ${isDelivered 
                                    ? 'bg-white dark:bg-[#111827] border-[3px] border-teal-500 dark:border-teal-400 shadow-[0_0_15px_rgba(20,184,166,0.6)] scale-110' 
                                    : 'bg-gray-200 dark:bg-gray-800 border-[3px] border-gray-400 dark:border-gray-600'} 
                            `}>
                                {isDelivered && <CheckCircle2 size={14} className="text-teal-500 dark:text-teal-400"/>}
                            </div>
                            <p className={`text-xs font-bold uppercase tracking-wider mb-1 transition-colors ${isDelivered ? 'text-teal-600 dark:text-teal-400' : 'text-gray-500 dark:text-gray-400'}`}>DESTINATION</p>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">{shipment.receiver_name}</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{shipment.receiver_address}, {shipment.receiver_city}</p>
                        </div>
                    </div>
                </div>
            </motion.div>

            <motion.div variants={itemVariants} className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <InfoCard icon={<Box size={18}/>} label="Weight" value={`${shipment.weight} kg`} />
                <InfoCard icon={<Truck size={18}/>} label="Type" value={shipment.package_type} capitalize />
                <InfoCard 
                    icon={<CreditCard size={18}/>} 
                    label="Payment" 
                    value={shipment.payment_mode} 
                    capitalize
                    valueColor={shipment.payment_mode === 'COD' ? 'text-orange-600 dark:text-orange-400' : 'text-teal-600 dark:text-teal-400'}
                />
                <InfoCard icon={<MapPin size={18}/>} label="Pincode" value={shipment.receiver_pincode} />
            </motion.div>

            <motion.div variants={itemVariants} className="bg-white dark:bg-[#0a101f] border border-gray-200 dark:border-[#1e293b] rounded-3xl p-8 shadow-lg">
                <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                    <ImageIcon size={20} className="text-indigo-500 dark:text-purple-500"/> 
                    PROOF OF DELIVERY
                </h3>
                
                {podImages.length === 0 ? (
                    <div className="text-center py-10 bg-gray-50 dark:bg-[#111827] rounded-2xl border border-dashed border-gray-200 dark:border-gray-800">
                        <ImageIcon size={32} className="mx-auto text-gray-400 mb-2"/>
                        <p className="text-gray-500 text-sm">No evidence uploaded yet.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {podImages.map((img) => (
                            <div key={img.id} className="relative group aspect-square rounded-xl overflow-hidden bg-gray-100 dark:bg-black border border-gray-200 dark:border-gray-700 shadow-sm">
                                <a href={img.image_url} target="_blank" className="block w-full h-full">
                                    <img src={img.image_url} alt="POD" className="object-cover w-full h-full opacity-90 group-hover:opacity-100 transition-all group-hover:scale-110 duration-500" />
                                </a>
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <button onClick={() => handleDeleteImage(img.id, img.image_url)} className="bg-red-600 hover:bg-red-500 text-white p-2 rounded-full transition-colors shadow-lg">
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </motion.div>
        </div>

        <div className="lg:col-span-1 space-y-6">
            
            <motion.div 
                variants={itemVariants} 
                className={`border p-6 rounded-3xl transition-colors duration-300 shadow-xl relative overflow-hidden ${
                    isFailureStatus 
                        ? 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900/50' 
                        : 'bg-white dark:bg-[#0a101f] border-gray-200 dark:border-[#1e293b]'
                }`}
            >
                <div className={`absolute -top-10 -right-10 w-40 h-40 rounded-full blur-3xl pointer-events-none opacity-20 ${isFailureStatus ? 'bg-red-500' : 'bg-indigo-500 dark:bg-cyan-500'}`} />

                <h3 className={`font-bold mb-6 flex items-center gap-2 text-sm uppercase tracking-widest ${isFailureStatus ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-white'}`}>
                    {isFailureStatus ? <AlertTriangle size={18}/> : <Activity size={18}/>} 
                    Update Status Code
                </h3>
                
                <div className="space-y-5 relative z-10">
                    <div>
                        <label className="text-[10px] text-gray-500 font-bold uppercase mb-1.5 block">Shipment Status</label>
                        <select 
                            value={selectedCode} 
                            onChange={(e) => {
                                const newCode = e.target.value;
                                setSelectedCode(newCode);
                                const match = STATUS_OPTIONS.flatMap(g => g.options).find(o => o.code === newCode);
                                if (match) {
                                    setRemark(match.remark);
                                    setStatus(match.label);
                                }
                            }}
                            className={inputClass}
                        >
                            <option value="" disabled>Select a Master Code...</option>
                            {STATUS_OPTIONS.map((group, idx) => (
                                <optgroup key={idx} label={group.group}>
                                    {group.options.map(opt => (
                                        <option key={opt.code} value={opt.code}>
                                            {opt.label} ({opt.code})
                                        </option>
                                    ))}
                                </optgroup>
                            ))}
                        </select>
                    </div>

                    <AnimatePresence>
                        {selectedCode && (
                            <motion.div 
                                initial={{ opacity: 0, height: 0 }} 
                                animate={{ opacity: 1, height: 'auto' }}
                                className="overflow-hidden"
                            >
                                <label className={`text-[10px] font-bold uppercase mb-1.5 block ${isFailureStatus ? 'text-red-500' : 'text-indigo-500 dark:text-cyan-400'}`}>
                                    {isFailureStatus ? 'Failure Remark (Editable)' : 'Status Remark (Editable)'}
                                </label>
                                <textarea 
                                    rows={2}
                                    value={remark}
                                    onChange={(e) => setRemark(e.target.value)}
                                    className={`w-full p-3.5 rounded-xl text-sm outline-none resize-none ${
                                        isFailureStatus 
                                        ? 'bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-900/60 text-red-900 dark:text-white focus:border-red-500'
                                        : 'bg-indigo-50 dark:bg-cyan-900/10 border border-indigo-200 dark:border-cyan-900/40 text-indigo-900 dark:text-cyan-100 focus:border-indigo-500 dark:focus:border-cyan-500'
                                    }`}
                                />
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <div>
                        <label className="text-[10px] text-gray-500 font-bold uppercase mb-1.5 block">Shipment Reference</label>
                        <div className="relative">
                            <Activity size={16} className="absolute left-3.5 top-3.5 text-gray-400"/>
                            <input 
                                placeholder="e.g. ORD-102, EBAY-99..."
                                value={referenceId}
                                onChange={(e) => setReferenceId(e.target.value)}
                                className={`${inputClass} pl-10`}
                            />
                        </div>
                    </div>
                    
                    <div>
                        <label className="text-[10px] text-gray-500 font-bold uppercase mb-1.5 block">Current Location</label>
                        <div className="relative">
                            <MapPin size={16} className="absolute left-3.5 top-3.5 text-gray-400"/>
                            <input 
                                value={location}
                                onChange={(e) => setLocation(e.target.value)}
                                className={`${inputClass} pl-10`}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="text-[10px] text-gray-500 font-bold uppercase mb-1.5 block">Event Time</label>
                        <div className="flex gap-2">
                            <input 
                                type="datetime-local"
                                value={customTime}
                                onChange={(e) => setCustomTime(e.target.value)}
                                className={`${inputClass} [color-scheme:light] dark:[color-scheme:dark]`}
                            />
                            <button onClick={() => setCustomTime(getLocalNow())} className="bg-gray-100 hover:bg-gray-200 dark:bg-[#111827] dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 p-3.5 rounded-xl border border-gray-200 dark:border-gray-800 transition-colors shadow-sm">
                                <Clock size={18} />
                            </button>
                        </div>
                    </div>

                    <motion.button 
                        whileTap={{ scale: 0.98 }}
                        onClick={handleUpdate} 
                        className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg text-sm text-white ${
                            isFailureStatus 
                                ? 'bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 shadow-red-500/20' 
                                : 'bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 shadow-indigo-500/20'
                        }`}
                    >
                        <Save size={18} /> Sync Code & Remark
                    </motion.button>
                </div>
            </motion.div>

            <motion.div variants={itemVariants} className="bg-white dark:bg-[#0a101f] border border-gray-200 dark:border-[#1e293b] p-6 rounded-3xl shadow-xl">
                <h3 className="font-bold mb-4 flex items-center gap-2 text-gray-900 dark:text-white text-sm uppercase tracking-widest">
                    <UserCheck size={18} className="text-teal-500"/> Assign Driver
                </h3>
                <div className="space-y-4">
                    <select 
                        value={assignedStaff}
                        onChange={(e) => setAssignedStaff(e.target.value)}
                        className={inputClass}
                    >
                        <option value="">-- Unassigned --</option>
                        {staffList.map(s => (
                            <option key={s.id} value={s.id}>{s.name} ({s.designation || 'Staff'})</option>
                        ))}
                    </select>
                    <button 
                        onClick={handleAssignStaff}
                        className="w-full bg-gray-100 hover:bg-teal-50 dark:bg-[#111827] dark:hover:bg-teal-900/30 text-gray-700 hover:text-teal-700 dark:text-gray-300 dark:hover:text-teal-400 py-3 rounded-xl font-bold transition-all text-sm border border-gray-200 dark:border-gray-800 hover:border-teal-300 dark:hover:border-teal-500 shadow-sm"
                    >
                        Assign Driver
                    </button>
                </div>
            </motion.div>

            <motion.div variants={itemVariants} className="bg-white dark:bg-[#0a101f] border border-gray-200 dark:border-[#1e293b] p-6 rounded-3xl shadow-xl space-y-3">
                <h3 className="font-bold mb-2 text-gray-400 text-[10px] uppercase tracking-widest opacity-80">Documents</h3>
                <button onClick={() => generateInvoice(shipment)} className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 dark:bg-[#111827] dark:hover:bg-gray-800 rounded-xl text-gray-700 dark:text-gray-300 transition-colors border border-gray-200 dark:border-gray-800 text-sm font-medium group">
                    <span className="flex items-center gap-2"><FileText size={16} className="text-emerald-500"/> Tax Invoice</span>
                    <ChevronRight size={14} className="text-gray-400 group-hover:text-gray-600 dark:group-hover:text-white"/>
                </button>
                <button onClick={() => window.open(`/print/${awb}`, '_blank')} className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 dark:bg-[#111827] dark:hover:bg-gray-800 rounded-xl text-gray-700 dark:text-gray-300 transition-colors border border-gray-200 dark:border-gray-800 text-sm font-medium group">
                    <span className="flex items-center gap-2"><Printer size={16} className="text-indigo-500"/> Shipping Label</span>
                    <ChevronRight size={14} className="text-gray-400 group-hover:text-gray-600 dark:group-hover:text-white"/>
                </button>
                
                <div className="border-t border-gray-100 dark:border-gray-800 my-4 pt-4 space-y-4">
                    <div>
                        <label className="text-[10px] text-gray-500 font-bold uppercase mb-1.5 block">Paste Image URL</label>
                        <div className="flex gap-2">
                            <div className="relative flex-1">
                                <Link2 size={16} className="absolute left-3.5 top-3.5 text-gray-400"/>
                                <input 
                                    type="url"
                                    placeholder="https://..."
                                    value={podUrl}
                                    onChange={(e) => setPodUrl(e.target.value)}
                                    className={`${inputClass} pl-10`}
                                />
                            </div>
                            <button 
                                onClick={handleUrlUpload}
                                disabled={uploading || !podUrl.trim()}
                                className="bg-gray-100 hover:bg-indigo-50 dark:bg-[#111827] dark:hover:bg-indigo-900/30 text-gray-700 hover:text-indigo-700 dark:text-gray-300 dark:hover:text-indigo-400 px-4 rounded-xl font-bold transition-all text-sm border border-gray-200 dark:border-gray-800 disabled:opacity-50"
                            >
                                Add
                            </button>
                        </div>
                    </div>

                    <div className="relative flex items-center py-2">
                        <div className="flex-grow border-t border-gray-200 dark:border-gray-800"></div>
                        <span className="flex-shrink-0 mx-4 text-[10px] font-bold text-gray-400 tracking-widest uppercase">OR</span>
                        <div className="flex-grow border-t border-gray-200 dark:border-gray-800"></div>
                    </div>

                    <label className="w-full flex flex-col items-center justify-center p-4 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl cursor-pointer hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/10 transition-all group">
                        <Upload size={24} className="text-gray-400 group-hover:text-indigo-500 mb-2 transition-colors"/>
                        <span className="text-xs font-bold text-gray-500 group-hover:text-gray-700 dark:group-hover:text-gray-200">Upload Evidence File</span>
                        <input type="file" accept="image/*" multiple onChange={handleFileUpload} className="hidden" />
                        {uploading && <p className="text-[10px] text-indigo-500 mt-1 animate-pulse font-bold">Processing...</p>}
                    </label>
                </div>
            </motion.div>

        </div>
      </div>
    </motion.div>
  );
}

function InfoCard({ icon, label, value, capitalize, valueColor }: any) {
    return (
        <div className="bg-white dark:bg-[#0a101f] border border-gray-200 dark:border-[#1e293b] p-4 rounded-2xl shadow-sm">
            <div className="flex items-center gap-2 mb-2 text-gray-500 dark:text-gray-400">
                {icon} <span className="text-[10px] font-bold uppercase tracking-wider">{label}</span>
            </div>
            <p className={`text-lg font-bold text-gray-900 dark:text-white ${capitalize ? 'capitalize' : ''} ${valueColor || ''}`}>
                {value}
            </p>
        </div>
    )
}