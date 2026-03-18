"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Loader2, Printer, X } from "lucide-react";
import Barcode from "react-barcode";
import { useParams, useSearchParams, useRouter } from "next/navigation";

export default function PrintLabelPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter(); 
  
  const awb = params?.awb as string;
  const singlePiece = searchParams?.get("piece");
  const singleTotal = searchParams?.get("total"); 
  const printAll = searchParams?.get("all") === "true";

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

  // 🚀 AUTOMATIC PDF GENERATION LOGIC
  useEffect(() => {
    if (!loading && shipment) {
      const generatePDF = async () => {
        // Dynamically import to avoid SSR errors
        const html2pdf = (await import("html2pdf.js")).default;
        const element = document.getElementById("pdf-content");
        
        const options = {
          margin: 0.5,
          filename: `Label-${awb}.pdf`,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { scale: 2, logging: false, useCORS: true },
          jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
        };

        html2pdf().from(element).set(options).save();
      };

      // Small timeout to ensure Barcode renders fully before capture
      setTimeout(generatePDF, 500);
    }
  }, [loading, shipment]);

  const handleClose = () => {
    window.close();
    setTimeout(() => { router.back(); }, 150);
  };

  if (loading) return <div className="flex justify-center items-center h-screen bg-[#0a101f] text-white"><Loader2 className="animate-spin text-blue-500 mr-2" /> Generating PDF...</div>;
  if (!shipment) return <div className="p-10 text-center text-red-500 font-bold">Shipment not found</div>;

  const totalPackages = shipment.identical_package_count || 1;
  const labelsToRender = printAll 
    ? Array.from({ length: totalPackages }, (_, i) => ({ piece: i + 1, total: totalPackages }))
    : [{ piece: singlePiece || 1, total: singleTotal || totalPackages }];

  return (
    <div className="min-h-screen bg-[#0a101f] p-8 flex flex-col items-center justify-start">
      
      <div className="mb-6 flex gap-4 print:hidden">
        <button 
            onClick={() => window.print()} 
            className="bg-blue-600 text-white px-6 py-2 rounded-full font-bold flex items-center gap-2 hover:bg-blue-700 shadow-lg transition-all"
        >
            <Printer size={18}/> Browser Print
        </button>
        <button 
            onClick={handleClose} 
            className="bg-gray-200 text-gray-700 px-6 py-2 rounded-full font-bold flex items-center gap-2 hover:bg-gray-300 transition-all"
        >
            <X size={18}/> Close Window
        </button>
      </div>

      {/* 🚀 Wrapper for PDF Generation */}
      <div id="pdf-content" className="flex flex-col items-center">
        {labelsToRender.map((labelData, index) => {
          const boxDisplay = `${labelData.piece} OF ${labelData.total}`;

          return (
            <div 
              key={index} 
              // Added 'html2pdf__page-break' to handle multi-label PDFs correctly
              className={`bg-white text-black w-[400px] h-[600px] border-2 border-black p-4 flex flex-col box-border shadow-2xl print:shadow-none print:m-0 print:border-none print:w-full print:h-full html2pdf__page-break ${printAll ? 'mb-8' : ''}`}
            >
              {/* 🟢 TOP SECTION */}
              <div className="shrink-0">
                  <div className="flex justify-between items-start border-b-2 border-black pb-2 mb-2">
                      <div>
                          <h1 className="text-3xl font-black uppercase tracking-tighter m-0 leading-none">Universal</h1>
                          <p className="text-[10px] font-bold uppercase tracking-widest mt-1 m-0">Express</p>
                      </div>
                      <div className="text-right">
                          <p className="text-[10px] font-bold m-0 mb-1">DATE: {new Date(shipment.created_at).toLocaleDateString()}</p>
                          <p className="text-[10px] font-bold m-0 mb-1">WGT: {shipment.weight} KG</p>
                          <div className="bg-black text-white px-2 py-1 text-[10px] font-black uppercase tracking-widest inline-block">
                              BOX: {boxDisplay}
                          </div>
                      </div>
                  </div>

                  <div className="text-center mb-2">
                      <h2 className="text-[34px] font-black font-mono tracking-tight m-0 leading-none">{shipment.awb_code}</h2>
                      <p className="text-[10px] font-bold uppercase mt-1 m-0">Standard Delivery</p>
                      
                      <div className="mt-1.5 mx-auto border-2 border-black border-dashed px-3 py-1 bg-gray-50 inline-block">
                          <span className="text-[11px] font-black uppercase tracking-widest align-middle mr-2">
                              Total Packages: 
                          </span>
                          <span className="text-lg font-black align-middle">{labelData.total}</span>
                      </div>
                  </div>
              </div>

              {/* 🟢 MIDDLE SECTION (Addresses) */}
              <div className="flex-1 flex flex-col justify-center gap-4 py-1">
                  <div className="border-2 border-black rounded-lg relative bg-white">
                      <div className="absolute -top-2.5 left-4 bg-white px-2">
                          <span className="text-[11px] font-black uppercase">Deliver To:</span>
                      </div>
                      <div className="p-3 pt-5">
                          <p className="text-lg font-black uppercase m-0 pb-1 leading-tight">{shipment.receiver_name}</p>
                          <p className="text-xs font-medium m-0 pb-2 leading-tight">{shipment.receiver_address}</p>
                          
                          <div className="flex justify-between items-end border-t border-gray-200 pt-2 mt-1">
                              <p className="text-xs font-bold m-0">Tel: {shipment.receiver_phone}</p>
                              <div className="text-right">
                                  <p className="text-base font-black uppercase m-0 leading-none">{shipment.receiver_city}</p>
                                  {shipment.receiver_pincode && <p className="text-base font-black m-0 mt-1 leading-none">{shipment.receiver_pincode}</p>}
                              </div>
                          </div>
                      </div>
                  </div>

                  <div className="border border-black rounded-lg relative bg-white mb-2">
                      <div className="absolute -top-2.5 left-4 bg-white px-2">
                          <span className="text-[11px] font-black uppercase">Return To:</span>
                      </div>
                      <div className="p-3 pt-5">
                          <p className="text-sm font-black uppercase m-0 pb-1 leading-none">{shipment.sender_name}</p>
                          <p className="text-[11px] font-medium m-0 pb-1 leading-tight line-clamp-2">{shipment.sender_address}</p>
                          <p className="text-[11px] font-bold m-0 leading-none">Tel: {shipment.sender_phone}</p>
                      </div>
                  </div>
              </div>

              {/* 🟢 BOTTOM SECTION */}
              <div className="shrink-0 border-t-2 border-black pt-2 mt-1">
                  <div className="flex justify-between items-center mb-1">
                      <div>
                          <p className="text-[10px] font-bold uppercase m-0 pb-0.5">Payment Mode</p>
                          <p className="text-xl font-black uppercase m-0 leading-none">{shipment.payment_mode}</p>
                      </div>
                      {shipment.payment_mode === "COD" && (
                          <div className="border-2 border-black bg-black text-white px-4 py-1.5 text-center min-w-[100px]">
                              <p className="text-xl font-black m-0 tracking-widest leading-none">₹{shipment.cod_amount || 0}</p>
                          </div>
                      )}
                  </div>

                  <div className="flex justify-center w-full">
                      <Barcode value={shipment.awb_code} width={1.8} height={40} fontSize={11} margin={0} />
                  </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}