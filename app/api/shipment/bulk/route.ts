import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase Admin Client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Helper function to generate unique AWB
const generateAWB = () => {
  const prefix = "UEX";
  const timestamp = Date.now().toString().slice(-6); // Last 6 digits of timestamp
  const random = Math.floor(1000 + Math.random() * 9000); // 4 random digits
  return `${prefix}${timestamp}${random}`;
};

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const userId = formData.get("userId") as string;

    if (!file || !userId) {
      return NextResponse.json({ error: "Missing file or user ID" }, { status: 400 });
    }

    // 1. Convert File to Buffer & Parse
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(sheet);

    if (jsonData.length === 0) {
      return NextResponse.json({ error: "Excel sheet is empty" }, { status: 400 });
    }

    // 2. Map & Validate Data (Add AWB here)
    const validShipments = [];
    const errors = [];

    for (const [index, row] of jsonData.entries()) {
        const anyRow = row as any;
        
        // Basic Validation
        if (!anyRow["Receiver Name"] || !anyRow["Mobile"] || !anyRow["Address"]) {
            errors.push(`Row ${index + 2}: Missing required fields`);
            continue;
        }

        validShipments.push({
            user_id: userId,
            awb: generateAWB(), // 👈 AUTO-GENERATED AWB
            receiver_name: anyRow["Receiver Name"],
            receiver_phone: String(anyRow["Mobile"]), // Ensure string
            destination_address: anyRow["Address"],
            pincode: anyRow["Pincode"],
            weight: Number(anyRow["Weight (kg)"]) || 0.5,
            payment_mode: anyRow["Payment Mode"] || "Prepaid",
            status: "Pending",
            origin: "Mumbai Hub", // Default or dynamic
            curr_loc: "Mumbai Hub",
            payment_status: "Unpaid"
        });
    }

    if (validShipments.length === 0) {
         return NextResponse.json({ error: "No valid rows found. Check column headers." }, { status: 400 });
    }

    // 3. Insert into Supabase
    const { data, error } = await supabase
      .from("shipments")
      .insert(validShipments)
      .select();

    if (error) throw error;

    return NextResponse.json({ 
      success: true, 
      count: data.length, 
      errors: errors,
      message: `Successfully created ${data.length} shipments.` 
    });

  } catch (error: any) {
    console.error("Bulk Upload Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}