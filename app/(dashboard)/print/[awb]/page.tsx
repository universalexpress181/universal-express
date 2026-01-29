"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Loader2, Printer, X } from "lucide-react";
import Barcode from "react-barcode";
import { useParams } from "next/navigation";

export default function PrintLabelPage() {
  const params = useParams();
  const awb = params?.awb as string;

  const [shipment, setShipment] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!awb) return;
    const fetchShipment = async () => {
      const { data } = await supabase
        .from("shipments")
        .select("*")
        .eq("awb_code", awb)
        .single();
      setShipment(data);
      setLoading(false);
    };
    fetchShipment();
  }, [awb]);

  if (loading) return <div className="flex justify-center items-center h-screen"><Loader2 className="animate-spin" /></div>;
  if (!shipment) return <div className="p-10 text-center text-red-500 font-bold">Shipment not found</div>;

  return (
    <div className="min-h-screen bg-gray-100 p-8 flex flex-col items-center justify-center">
      
      {/* Controls - Hidden when printing */}
      <div className="mb-6 flex gap-4 print:hidden">
        <button 
            onClick={() => window.print()} 
            className="bg-blue-600 text-white px-6 py-2 rounded-full font-bold flex items-center gap-2 hover:bg-blue-700 shadow-lg"
        >
            <Printer size={18}/> Print Label
        </button>
        <button 
            onClick={() => window.close()} 
            className="bg-gray-200 text-gray-700 px-6 py-2 rounded-full font-bold flex items-center gap-2 hover:bg-gray-300"
        >
            <X size={18}/> Close
        </button>
      </div>

      {/* --- THE LABEL (Standard 4x6 inch ratio) --- */}
      {/* UPDATED: Added 'text-black' to ensure all text is solid black */}
      <div className="bg-white text-black w-[400px] h-[600px] border-2 border-black p-6 flex flex-col relative shadow-2xl print:shadow-none print:w-full print:h-full print:border-none print:m-0 box-border">
        
        {/* Header */}
        <div className="flex justify-between items-start border-b-2 border-black pb-4 mb-4 shrink-0">
            <div>
                <h1 className="text-2xl font-black uppercase tracking-tighter">Universal</h1>
                <p className="text-xs font-bold uppercase tracking-widest">Express Logistics</p>
            </div>
            <div className="text-right">
                <p className="text-xs font-bold">DATE: {new Date(shipment.created_at).toLocaleDateString()}</p>
                <p className="text-xs font-bold">WGT: {shipment.weight} KG</p>
            </div>
        </div>

        {/* Big AWB */}
        <div className="text-center mb-4 shrink-0">
             <h2 className="text-4xl font-black font-mono tracking-tight">{shipment.awb_code}</h2>
             <p className="text-xs font-bold uppercase mt-1">Standard Delivery</p>
        </div>

        {/* Addresses */}
        <div className="grid grid-rows-2 gap-3 flex-1 min-h-0">
            {/* TO (Receiver) */}
            <div className="border-2 border-black p-2.5 rounded-lg relative flex flex-col justify-center">
                <span className="absolute -top-2.5 left-3 bg-white px-1 text-xs font-black uppercase">Deliver To:</span>
                <p className="text-xl font-bold uppercase truncate leading-tight">{shipment.receiver_name}</p>
                <p className="text-sm font-medium leading-tight mt-1">{shipment.receiver_address}</p>
                <div className="mt-2 flex justify-between items-end">
                    <p className="text-sm font-bold">Tel: {shipment.receiver_phone}</p>
                    <div className="text-right leading-tight">
                        <span className="text-lg font-black uppercase block">{shipment.receiver_city}</span>
                        {shipment.receiver_pincode && <span className="text-lg font-black block">{shipment.receiver_pincode}</span>}
                    </div>
                </div>
            </div>

            {/* FROM (Sender) */}
            {/* UPDATED: Removed 'grayscale' and 'opacity-75'. Changed border to black. */}
            <div className="border border-black p-2.5 rounded-lg relative flex flex-col justify-center">
                {/* UPDATED: Changed text color to black */}
                <span className="absolute -top-2 left-3 bg-white px-1 text-[10px] font-bold uppercase text-black">Return To (If Undelivered):</span>
                <p className="text-sm font-bold uppercase truncate leading-tight">{shipment.sender_name}</p>
                <p className="text-xs font-medium leading-tight mt-1">{shipment.sender_address}</p>
                <p className="text-xs font-bold mt-1">Tel: {shipment.sender_phone}</p>
            </div>
        </div>

        {/* Footer Info */}
        <div className="mt-3 flex justify-between items-center border-t-2 border-black pt-2 shrink-0">
            <div>
                <p className="text-[10px] font-bold uppercase">Payment Mode</p>
                <p className="text-xl font-black uppercase">{shipment.payment_mode}</p>
            </div>
            {shipment.payment_mode === "COD" && (
                <div className="border-2 border-black px-2 py-1 bg-black text-white">
                    <p className="text-xl font-black">₹{shipment.cost}</p>
                </div>
            )}
        </div>

        {/* Barcode */}
        <div className="mt-2 flex justify-center pt-1 shrink-0">
            <Barcode value={shipment.awb_code} width={2} height={45} fontSize={14} />
        </div>

      </div>
      
      <p className="text-gray-400 text-xs mt-4 print:hidden">Recommended: Print on 4x6 Thermal Label or A4 Scale 100%</p>
    </div>
  );
}