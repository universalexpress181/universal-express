"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { 
  ArrowLeft, MapPin, User, FileText, 
  IndianRupee, CreditCard, Image as ImageIcon, 
  Loader2, Clock, CheckCircle, Truck, Package 
} from "lucide-react";

export default function PrivateTrackingPage() {
  const { awb } = useParams();
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [shipment, setShipment] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]); // Added History
  const [podImages, setPodImages] = useState<any[]>([]);

  useEffect(() => {
    const fetchAllData = async () => {
      // 1. Fetch Shipment (Master Data)
      const { data: shipData } = await supabase
        .from("shipments")
        .select("*")
        .eq("awb_code", awb)
        .single();
      
      if (shipData) {
        setShipment(shipData);

        // 2. Fetch History (Timeline) - Sorted Newest First
        const { data: events } = await supabase
          .from("tracking_events")
          .select("*")
          .eq("shipment_id", shipData.id)
          .order('timestamp', { ascending: false });
        setHistory(events || []);

        // 3. Fetch POD Images
        const { data: images } = await supabase
          .from("pod_images")
          .select("*")
          .eq("shipment_id", shipData.id);
        setPodImages(images || []);
      }
      setLoading(false);
    };

    if (awb) fetchAllData();
  }, [awb]);

  if (loading) return (
    <div className="h-[50vh] flex items-center justify-center text-slate-500 gap-2">
        <Loader2 className="animate-spin text-blue-600"/> Loading Shipment Data...
    </div>
  );

  if (!shipment) return (
    <div className="h-[50vh] flex flex-col items-center justify-center text-slate-400">
        <Package size={48} className="mb-4 opacity-20"/>
        <p>Shipment #{awb} not found.</p>
        <button onClick={() => router.back()} className="mt-4 text-blue-600 hover:underline">Go Back</button>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-10">
      
      {/* Top Navigation */}
      <button onClick={() => router.back()} className="flex items-center text-sm font-medium text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors">
        <ArrowLeft size={16} className="mr-2" /> Back to List
      </button>

      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div>
            <div className="flex items-center gap-3">
                <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">#{shipment.awb_code}</h1>
                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border ${
                    shipment.current_status === 'delivered' 
                    ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-900' 
                    : 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-900'
                }`}>
                    {shipment.current_status.replace('_', ' ')}
                </span>
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 flex items-center gap-2">
                <Clock size={14}/> Created on {new Date(shipment.created_at).toLocaleDateString('en-IN', { dateStyle: 'long' })}
            </p>
        </div>
        
        {/* Action Buttons (Future Proofing) */}
        <div className="flex gap-2">
            <button className="px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-lg text-sm font-bold flex items-center gap-2 hover:opacity-90 transition-opacity">
                <FileText size={16}/> Invoice
            </button>
        </div>
      </div>

      {/* Main Grid Layout */}
      <div className="grid lg:grid-cols-3 gap-6">

        {/* LEFT COLUMN: Customer & Finance Info (2/3 width) */}
        <div className="lg:col-span-2 space-y-6">
            
            {/* 1. Customer Details */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
                <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase mb-4 flex items-center gap-2">
                    <User size={16}/> Customer Information
                </h3>
                <div className="grid md:grid-cols-2 gap-6">
                    <div>
                        <span className="text-xs text-slate-400 uppercase font-bold block mb-1">Receiver Name</span>
                        <p className="font-medium text-slate-900 dark:text-white text-lg">{shipment.receiver_name}</p>
                    </div>
                    <div>
                        <span className="text-xs text-slate-400 uppercase font-bold block mb-1">Contact Number</span>
                        <p className="font-medium text-slate-900 dark:text-white text-lg">{shipment.receiver_phone || "N/A"}</p>
                    </div>
                    <div className="md:col-span-2">
                        <span className="text-xs text-slate-400 uppercase font-bold block mb-1">Delivery Address</span>
                        <p className="font-medium text-slate-700 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
                            {shipment.receiver_address || "No address provided"}
                        </p>
                    </div>
                </div>
            </div>

            {/* 2. Payment & Cost */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
                <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase mb-4 flex items-center gap-2">
                    <IndianRupee size={16}/> Billing Details
                </h3>
                <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-white dark:bg-slate-800 rounded-lg shadow-sm text-green-600">
                            <CreditCard size={24}/>
                        </div>
                        <div>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Payment Mode</p>
                            <p className="font-bold text-slate-900 dark:text-white uppercase">{shipment.payment_mode || "COD"}</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-sm text-slate-500 dark:text-slate-400">Total Amount</p>
                        <p className="text-2xl font-black text-slate-900 dark:text-white">₹{shipment.cost || "0"}</p>
                    </div>
                </div>
            </div>

            {/* 3. POD Gallery */}
            {podImages.length > 0 && (
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
                    <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase mb-4 flex items-center gap-2">
                        <ImageIcon size={16}/> Proof of Delivery
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        {podImages.map((img) => (
                            <a key={img.id} href={img.image_url} target="_blank" className="group relative aspect-square rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 cursor-zoom-in">
                                <img src={img.image_url} alt="POD" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <span className="text-white text-xs font-bold uppercase tracking-wider">View</span>
                                </div>
                            </a>
                        ))}
                    </div>
                </div>
            )}
        </div>

        {/* RIGHT COLUMN: Timeline (1/3 width) */}
        <div className="lg:col-span-1">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm h-full">
                <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase mb-6 flex items-center gap-2">
                    <Truck size={16}/> Shipment Journey
                </h3>
                
                <div className="relative border-l-2 border-slate-100 dark:border-slate-800 ml-3 space-y-8 pb-2">
                    {/* Map through History */}
                    {history.map((event, index) => (
                        <div key={event.id} className="relative pl-6">
                            {/* Dot */}
                            <span className={`absolute -left-[5px] top-1.5 h-2.5 w-2.5 rounded-full ring-4 ring-white dark:ring-slate-900 ${index === 0 ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-600'}`}></span>
                            
                            {/* Content */}
                            <div>
                                <p className={`text-sm font-bold capitalize ${index === 0 ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}>
                                    {event.status.replace('_', ' ')}
                                </p>
                                <p className="text-xs text-slate-400 font-mono mt-1">
                                    {new Date(event.timestamp).toLocaleString('en-IN', { 
                                        month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit' 
                                    })}
                                </p>
                                {event.location && (
                                    <p className="text-xs text-slate-500 mt-1 uppercase flex items-center gap-1">
                                        <MapPin size={10}/> {event.location}
                                    </p>
                                )}
                            </div>
                        </div>
                    ))}
                    
                    {/* Start Point */}
                    <div className="relative pl-6">
                        <span className="absolute -left-[5px] top-1.5 h-2.5 w-2.5 rounded-full bg-slate-300 dark:bg-slate-600 ring-4 ring-white dark:ring-slate-900"></span>
                        <p className="text-sm font-bold text-slate-500 dark:text-slate-400">Order Placed</p>
                    </div>
                </div>
            </div>
        </div>

      </div>
    </div>
  );
}