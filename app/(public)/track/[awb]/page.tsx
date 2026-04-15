"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Package, Truck, CheckCircle, MapPin, Clock, Image as ImageIcon, ArrowLeft, Loader2, XCircle } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

// 🚀 MASTER FLOW RANKS: Used to detect missing middle steps
const FLOW_RANKS: Record<string, number> = {
  "created": 1, "order placed": 1,
  "pending pickup": 2, 
  "pickup done": 3, 
  "in transit": 4, 
  "out for delivery": 5, 
  "delivered": 6,
  "undelivered": 6, 
  "rto initiated": 6 
};

// 🚀 NAMES TO INJECT WHEN GAPS ARE FOUND
const RANK_NAMES: Record<number, string> = {
  1: "Order Placed",
  2: "Pending Pickup",
  3: "Pickup Done",
  4: "In Transit",
  5: "Out for Delivery",
  6: "Delivered"
};

// 🚀 DYNAMIC LOCATION RESOLVER (As per your requested labels)
const getLogicalLocation = (rank: number, shipData: any) => {
  switch(rank) {
    case 1: return "System Generated";
    case 2: return shipData.sender_city ? `${shipData.sender_city} (Waiting for courier)` : "Origin Location";
    case 3: return "Origin Warehouse"; 
    case 4: return "Standard movement between hubs"; 
    case 5: return "Package left the final warehouse for final delivery"; 
    case 6: return shipData.receiver_city ? `${shipData.receiver_city} Destination` : "Destination Address";
    default: return "Processing Center";
  }
};

export default function TrackingResult() {
  const { awb } = useParams();
  
  const [shipment, setShipment] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [podImages, setPodImages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!awb) return;

    const fetchData = async () => {
      const { data: shipData } = await supabase.from('shipments').select('*').eq('awb_code', awb).single();

      if (shipData) {
        setShipment(shipData);
        
        // Fetch database history (Sorted Oldest First to run the algorithm)
        const { data: eventsData } = await supabase
          .from('tracking_events')
          .select('*')
          .eq('shipment_id', shipData.id)
          .order('timestamp', { ascending: true }); 

        // ====================================================================
        // 🧠 AI AUTO-INTERPOLATION ALGORITHM 
        // Identifies bulk-update gaps and injects missing timeline steps
        // ====================================================================
        const actualEvents = [...(eventsData || [])];
        const currentStatusNorm = shipData.current_status.toLowerCase().trim().replace('_', ' ');
        const currentRankForSynth = FLOW_RANKS[currentStatusNorm] || 99;
        
        // 1. Force the current status into the timeline if it wasn't logged in tracking_events
        const lastRecordedStatus = actualEvents.length > 0 ? actualEvents[actualEvents.length - 1].status.toLowerCase().trim().replace('_', ' ') : "";
        if (lastRecordedStatus !== currentStatusNorm) {
          actualEvents.push({
            id: 'synthetic-current',
            status: shipData.current_status,
            timestamp: shipData.updated_at || new Date().toISOString(), // Use last updated time
            // 🚀 FIXED: Now uses the exact same dynamic location resolver as the middle steps!
            location: getLogicalLocation(currentRankForSynth, shipData) 
          });
        }

        let processedEvents: any[] = [];
        let lastRank = 0;
        let lastTime = new Date(shipData.created_at).getTime();

        actualEvents.forEach((evt) => {
          const normStatus = evt.status.toLowerCase().trim().replace('_', ' ');
          const currentRank = FLOW_RANKS[normStatus] || 99; // 99 for exceptions

          // 2. Detect Gaps: e.g., jumping from Rank 2 (Pending) to Rank 6 (Undelivered)
          if (currentRank > 1 && currentRank < 99 && currentRank > lastRank + 1) {
            const currentTime = new Date(evt.timestamp).getTime();
            const timeDiff = Math.max(0, currentTime - lastTime);
            const missingStepsCount = currentRank - lastRank - 1;
            const timeStepInterval = timeDiff / (missingStepsCount + 1); 

            // 3. Inject missing steps with perfectly spaced timestamps AND logical locations
            for (let r = lastRank + 1; r < currentRank; r++) {
              processedEvents.push({
                id: `auto-${r}-${evt.id}`,
                status: RANK_NAMES[r],
                timestamp: new Date(lastTime + timeStepInterval * (r - lastRank)).toISOString(),
                location: getLogicalLocation(r, shipData) // Dynamically assigns Origin Warehouse, etc.
              });
            }
          }

          // Push the actual event 
          processedEvents.push({ ...evt });

          if (currentRank < 99) {
            lastRank = currentRank;
            lastTime = new Date(evt.timestamp).getTime();
          }
        });

        // 4. Sort descending so newest is at the top of the UI
        processedEvents.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        setHistory(processedEvents);

        // Fetch Images
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
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-white p-8 rounded-2xl shadow-sm text-center max-w-md w-full border border-slate-200">
        <div className="bg-red-50 text-red-500 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"><Package size={32} /></div>
        <h1 className="text-xl font-bold text-slate-800 mb-2">Shipment Not Found</h1>
        <p className="text-slate-500 mb-6">Could not find AWB: <span className="font-mono font-bold text-slate-800">{awb}</span></p>
        <Link href="/" className="block w-full bg-slate-900 text-white px-6 py-3 rounded-xl font-bold hover:bg-slate-800 transition-colors">Track Another</Link>
      </motion.div>
    </div>
  );

  const isDelivered = shipment.current_status.toLowerCase() === 'delivered';
  const isUndelivered = shipment.current_status.toLowerCase() === 'undelivered';

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-6">
      <Link href="/" className="inline-flex items-center text-slate-500 hover:text-slate-800 font-medium mb-4 transition-colors"><ArrowLeft size={18} className="mr-1" /> Back to Search</Link>

      {/* Header Card */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-8 border-b border-slate-100 flex flex-col md:flex-row justify-between gap-4">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Tracking Number</p>
            <h1 className="text-3xl font-black text-blue-600 font-mono tracking-tight">{shipment.awb_code}</h1>
          </div>
          
          <div className={`px-5 py-2 rounded-full font-bold uppercase text-xs tracking-wide inline-flex items-center gap-2 self-start 
            ${isDelivered ? 'bg-green-100 text-green-700' : isUndelivered ? 'bg-red-100 text-red-700' : 'bg-blue-50 text-blue-700'}`}>
            {isDelivered ? <CheckCircle size={16}/> : isUndelivered ? <XCircle size={16}/> : <Truck size={16}/>}
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
      </motion.div>

      {/* Proof of Delivery */}
      {podImages.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8">
          <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><ImageIcon size={20} className="text-blue-600"/> Proof of Delivery</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {podImages.map((img, i) => (
              <motion.a 
                initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 + (i * 0.1) }}
                key={img.id} href={img.image_url} target="_blank" className="block aspect-square rounded-xl overflow-hidden border border-slate-200 hover:opacity-90 transition-opacity"
              >
                <img src={img.image_url} alt="POD" className="w-full h-full object-cover" />
              </motion.a>
            ))}
          </div>
        </motion.div>
      )}

      {/* 🚀 Animated Timeline Journey */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8 overflow-hidden">
        <h3 className="font-bold text-slate-800 mb-8 flex items-center gap-2"><Clock size={20} className="text-blue-600"/> Shipment History</h3>
        
        <div className="relative ml-2 space-y-8 pb-2">
          
          {/* Animated Draw-Down Line */}
          <motion.div 
            initial={{ height: 0 }} animate={{ height: "100%" }} transition={{ duration: 1.5, ease: "easeInOut" }}
            className="absolute left-[7px] top-4 bottom-0 w-[2px] bg-slate-200"
          />

          {/* Master Timeline Loop */}
          {history.map((event, index) => {
            const isLatest = index === 0;
            const isEndState = isLatest && (event.status.toLowerCase() === 'delivered' || event.status.toLowerCase() === 'undelivered');

            return (
              <motion.div 
                  key={event.id} 
                  initial={{ opacity: 0, y: 15, x: -10 }} 
                  animate={{ opacity: 1, y: 0, x: 0 }} 
                  transition={{ delay: 0.4 + (index * 0.15) }} 
                  className="relative pl-10"
              >
                {/* 🟢 TOP/LATEST NODE */}
                {isLatest ? (
                  <>
                    {!isEndState && <span className="absolute -left-[1px] top-1 h-4 w-4 rounded-full bg-blue-600 animate-ping opacity-75"></span>}
                    <span className={`absolute -left-[1px] top-1 h-4 w-4 rounded-full border-4 border-white shadow-md ring-1 z-10 ${
                      event.status.toLowerCase() === 'delivered' ? 'bg-green-500 ring-green-100' : 
                      event.status.toLowerCase() === 'undelivered' ? 'bg-red-500 ring-red-100' : 
                      'bg-blue-600 ring-blue-100'
                    }`}></span>
                    
                    <div>
                        <span className="block font-black text-slate-800 text-xl capitalize tracking-tight">{event.status.replace('_', ' ')}</span>
                        <span className={`text-xs font-bold uppercase tracking-wider ${
                          event.status.toLowerCase() === 'delivered' ? 'text-green-600' : 
                          event.status.toLowerCase() === 'undelivered' ? 'text-red-600' : 
                          'text-blue-600 animate-pulse'
                        }`}>
                          {isEndState ? 'Final Status' : 'Live Update'}
                        </span>
                        <span className="block text-xs text-slate-400 font-mono mt-1">{new Date(event.timestamp).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</span>
                        
                        {/* Display location on the current status if it exists */}
                        {event.location && (
                          <div className="text-sm font-medium text-slate-500 mt-2 flex items-center gap-1">
                            <MapPin size={14} /> {event.location}
                          </div>
                        )}
                    </div>
                  </>
                ) : (
                  
                /* 🔵 HISTORICAL NODES (Auto-Updated badge removed!) */
                <>
                  <span className="absolute left-[3px] top-1.5 h-2.5 w-2.5 rounded-full ring-4 ring-white z-10 bg-slate-300"></span>
                  
                  <div className="p-4 rounded-xl border transition-colors bg-slate-50 border-slate-100 hover:border-blue-200">
                    <div className="flex justify-between items-center mb-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-700 capitalize">{event.status.replace('_', ' ')}</span>
                      </div>
                      <span className="text-xs text-slate-400 font-mono">{new Date(event.timestamp).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</span>
                    </div>
                    {event.location && (
                      <div className="text-xs font-medium mt-2 flex items-center gap-1 text-slate-500">
                        <MapPin size={10} /> {event.location}
                      </div>
                    )}
                  </div>
                </>
                )}
              </motion.div>
            );
          })}

        </div>
      </motion.div>
    </div>
  );
}