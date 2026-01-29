"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Package, Truck, CheckCircle, MapPin, Clock, Image as ImageIcon, ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";

export default function TrackingResult() {
  const { awb } = useParams();
  
  const [shipment, setShipment] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [podImages, setPodImages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!awb) return;

    const fetchData = async () => {
      // 1. Get Shipment
      const { data: shipData } = await supabase.from('shipments').select('*').eq('awb_code', awb).single();

      if (shipData) {
        setShipment(shipData);
        
        // 2. Get History (Sorted by newest first)
        const { data: events } = await supabase.from('tracking_events').select('*').eq('shipment_id', shipData.id).order('timestamp', { ascending: false });
        setHistory(events || []);

        // 3. Get Images
        const { data: images } = await supabase.from('pod_images').select('*').eq('shipment_id', shipData.id);
        setPodImages(images || []);
      }
      setLoading(false);
    };
    fetchData();
  }, [awb]);

  if (loading) return <div className="min-h-[60vh] flex items-center justify-center text-blue-600"><Loader2 className="animate-spin mr-2"/> Tracking Shipment...</div>;

  if (!shipment) return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-sm text-center max-w-md w-full border border-slate-200">
        <div className="bg-red-50 text-red-500 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"><Package size={32} /></div>
        <h1 className="text-xl font-bold text-slate-800 mb-2">Shipment Not Found</h1>
        <p className="text-slate-500 mb-6">Could not find AWB: <span className="font-mono font-bold text-slate-800">{awb}</span></p>
        <Link href="/" className="block w-full bg-slate-900 text-white px-6 py-3 rounded-xl font-bold hover:bg-slate-800">Track Another</Link>
      </div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-6">
      <Link href="/" className="inline-flex items-center text-slate-500 hover:text-slate-800 font-medium mb-4"><ArrowLeft size={18} className="mr-1" /> Back to Search</Link>

      {/* Status Card */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden animate-slide-up">
        <div className="p-8 border-b border-slate-100 flex flex-col md:flex-row justify-between gap-4">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Tracking Number</p>
            <h1 className="text-3xl font-black text-blue-600 font-mono">{shipment.awb_code}</h1>
          </div>
          <div className={`px-5 py-2 rounded-full font-bold uppercase text-xs tracking-wide inline-flex items-center gap-2 self-start ${shipment.current_status === 'delivered' ? 'bg-green-100 text-green-700' : 'bg-blue-50 text-blue-700'}`}>
            {shipment.current_status === 'delivered' ? <CheckCircle size={16}/> : <Truck size={16}/>}
            {shipment.current_status.replace('_', ' ')}
          </div>
        </div>
        
        <div className="grid md:grid-cols-2">
          <div className="p-8 border-b md:border-b-0 md:border-r border-slate-100">
            <p className="text-xs text-slate-400 uppercase font-bold mb-2">Sender</p>
            <p className="font-bold text-slate-800 text-lg">{shipment.sender_name}</p>
            <p className="text-slate-500 text-sm mt-1">{shipment.sender_address}</p>
          </div>
          <div className="p-8">
            <p className="text-xs text-slate-400 uppercase font-bold mb-2">Receiver</p>
            <p className="font-bold text-slate-800 text-lg">{shipment.receiver_name}</p>
            <p className="text-slate-500 text-sm mt-1">{shipment.receiver_address}</p>
          </div>
        </div>
      </div>

      {/* Proof of Delivery (Staggered Animation) */}
      {podImages.length > 0 && (
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8 animate-slide-up" style={{ animationDelay: '0.2s' }}>
          <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><ImageIcon size={20} className="text-blue-600"/> Proof of Delivery</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {podImages.map((img) => (
              <a key={img.id} href={img.image_url} target="_blank" className="block aspect-square rounded-xl overflow-hidden border border-slate-200 hover:opacity-90 transition-opacity">
                <img src={img.image_url} alt="POD" className="w-full h-full object-cover" />
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Timeline Journey (Animated) */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8 animate-slide-up" style={{ animationDelay: '0.3s' }}>
        <h3 className="font-bold text-slate-800 mb-8 flex items-center gap-2"><Clock size={20} className="text-blue-600"/> Shipment History</h3>
        
        <div className="relative border-l-2 border-slate-100 ml-3 space-y-8 pb-2">
          
          {/* Live Current Status */}
          <div className="relative pl-8 animate-slide-up" style={{ animationDelay: '0.4s' }}>
              {/* Radar Pulse Effect */}
              <span className="absolute -left-[9px] top-1 h-4 w-4 rounded-full bg-blue-600 animate-radar opacity-75"></span>
              <span className="absolute -left-[9px] top-1 h-4 w-4 rounded-full border-4 border-white bg-blue-600 shadow-md ring-1 ring-blue-100 z-10"></span>
              
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1">
                  <div>
                      <span className="block font-bold text-slate-800 text-lg capitalize">{shipment.current_status.replace('_', ' ')}</span>
                      <span className="text-sm text-blue-600 font-bold uppercase tracking-wider animate-pulse">Live Update</span>
                  </div>
              </div>
          </div>

          {/* History Items (Staggered) */}
          {history.map((event, index) => (
            <div 
                key={event.id} 
                className="relative pl-8 animate-slide-up"
                style={{ animationDelay: `${0.5 + (index * 0.15)}s` }} // Stagger Delay: 0.5s, 0.65s, 0.8s...
            >
              <span className="absolute -left-[7px] top-1.5 h-3 w-3 rounded-full bg-slate-300 ring-4 ring-white"></span>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 hover:border-blue-200 transition-colors">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-bold text-slate-700 capitalize">{event.status.replace('_', ' ')}</span>
                  <span className="text-xs text-slate-400 font-mono">{new Date(event.timestamp).toLocaleDateString()}</span>
                </div>
                {event.location && <div className="text-slate-500 text-xs font-medium uppercase mt-2 flex items-center gap-1"><MapPin size={10} /> {event.location}</div>}
              </div>
            </div>
          ))}

          {/* Start Point */}
          <div className="relative pl-8 animate-slide-up" style={{ animationDelay: `${0.5 + (history.length * 0.15)}s` }}>
             <span className="absolute -left-[7px] top-1.5 h-3 w-3 rounded-full bg-slate-300 ring-4 ring-white"></span>
             <span className="font-bold text-slate-400">Order Placed</span>
          </div>

        </div>
      </div>
    </div>
  );
}