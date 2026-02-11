import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/**
 * 🔹 PURE RANDOM GENERATOR (No Timestamp)
 * Generates AWBs like: UEX10293847
 */
const generateUniqueBatchAWBs = (count: number) => {
  const prefix = "UEX";
  const uniqueAWBs = new Set<string>();
  while (uniqueAWBs.size < count) {
    const random8Digits = Math.floor(10000000 + Math.random() * 90000000);
    uniqueAWBs.add(`${prefix}${random8Digits}`);
  }
  return Array.from(uniqueAWBs);
};

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const userId = formData.get("userId") as string;

    if (!file || !userId) {
      return NextResponse.json({ error: "Missing file or user ID" }, { status: 400 });
    }

    // 🔹 1. READ FILE (Supports .xlsx, .xls, and .csv)
    const arrayBuffer = await file.arrayBuffer();
    // 'read' automatically detects file type based on content (Excel or CSV)
    const workbook = XLSX.read(Buffer.from(arrayBuffer), { type: "buffer" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const jsonData = XLSX.utils.sheet_to_json(sheet);

    if (jsonData.length === 0) {
      return NextResponse.json({ error: "File is empty" }, { status: 400 });
    }

    const awbPool = generateUniqueBatchAWBs(jsonData.length);
    const validShipments = [];

    for (const [index, row] of jsonData.entries()) {
        const anyRow = row as any;
        if (!anyRow["Receiver Name"] || !anyRow["Receiver Address"]) continue;

        const paymentMode = anyRow["Payment Mode"] || "Prepaid";
        const productValue = Number(anyRow["Product Value"]) || 0; 
        
        const isCOD = paymentMode.toString().toLowerCase() === "cod";
        const codAmount = isCOD ? productValue : 0;

        validShipments.push({
            user_id: userId,
            awb_code: awbPool[index], 
            client_order_id: String(anyRow["Client Order ID"] || ""), 
            
            sender_name: anyRow["Sender Name"],
            sender_phone: String(anyRow["Sender Mobile"]),
            sender_address: anyRow["Pickup Address"],   
            sender_city: anyRow["Sender City"] || "",
            sender_state: anyRow["Sender State"] || "",
            sender_pincode: String(anyRow["Pickup Pincode"]), 

            receiver_name: anyRow["Receiver Name"],
            receiver_phone: String(anyRow["Receiver Mobile"]),
            receiver_address: anyRow["Receiver Address"], 
            receiver_city: anyRow["Receiver City"] || "",
            receiver_state: anyRow["Receiver State"] || "",
            receiver_pincode: String(anyRow["Receiver Pincode"]),
            
            weight: Number(anyRow["Weight (kg)"]) || 0.5,
            
            payment_mode: paymentMode,
            declared_value: productValue, 
            cod_amount: codAmount,
            
            current_status: "created", 
            payment_status: "Unpaid"
        });
    }

    if (validShipments.length === 0) {
        return NextResponse.json({ error: "No valid rows found." }, { status: 400 });
    }

    const { data, error } = await supabase.from("shipments").insert(validShipments).select();

    if (error) {
        console.error("Supabase Error:", error);
        throw error;
    }

    return NextResponse.json({ 
        success: true, 
        count: data.length, 
        shipments: data, 
        message: "Upload Successful" 
    });

  } catch (error: any) {
    console.error("Bulk Upload Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}