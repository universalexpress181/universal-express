import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase Admin Client
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    // ---------------------------------------------------------
    // 1. RECEIVE THE FILE
    // ---------------------------------------------------------
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No Excel file provided" }, { status: 400 });
    }

    // ---------------------------------------------------------
    // 2. PARSE EXCEL DATA
    // ---------------------------------------------------------
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(Buffer.from(arrayBuffer), { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    
    // Convert to JSON (Array of Objects)
    // Example output: [{ "Prime": "D123", "Ground Cargo": "DP999" }, ...]
    const jsonData = XLSX.utils.sheet_to_json(sheet);

    const insertData: any[] = [];
    let duplicateCount = 0;

    // ---------------------------------------------------------
    // 3. MAP COLUMNS TO PARTNERS & CATEGORIES
    // ---------------------------------------------------------
    for (const row of jsonData) {
      const anyRow = row as Record<string, any>;

      // We loop through EVERY column in the current row
      for (const [columnName, cellValue] of Object.entries(anyRow)) {
        if (!cellValue) continue; // Skip empty cells

        const awb = String(cellValue).trim();
        const colHeader = columnName.trim().toLowerCase();

        let partnerName = "";
        let serviceCategory = "";

        // 🧠 Smart Column Mapping Logic
        if (colHeader.includes("prime")) {
          partnerName = "DTDC";
          serviceCategory = "Prime";
        } else if (colHeader.includes("air") || colHeader.includes("express")) {
          partnerName = "DTDC";
          serviceCategory = "Air/Ground Express";
        } else if (colHeader.includes("cargo") || colHeader.includes("ground cargo")) {
          partnerName = "DPWORLD";
          serviceCategory = "Ground Cargo";
        } else if (colHeader === "cod") { // ADD THIS
          partnerName = "DTDC"; // Assuming COD is handled by DTDC
          serviceCategory = "COD";
        } else {
          continue; 
        }

        insertData.push({
          partner_awb: awb,
          partner_name: partnerName,
          service_category: serviceCategory,
          is_used: false,
        });
      }
    }

    if (insertData.length === 0) {
      return NextResponse.json({ error: "No valid AWBs found in recognized columns." }, { status: 400 });
    }

    // ---------------------------------------------------------
    // 4. BULK INSERT INTO DATABASE
    // ---------------------------------------------------------
    // We insert in chunks of 1000 to prevent database payload limits
    const chunkSize = 1000;
    let successCount = 0;

    for (let i = 0; i < insertData.length; i += chunkSize) {
      const chunk = insertData.slice(i, i + chunkSize);
      
      const { error } = await supabaseAdmin
        .from("awb_bank")
        .upsert(chunk, { 
            onConflict: 'partner_awb', // If AWB exists, ignore it to prevent crashing
            ignoreDuplicates: true 
        });

      if (error) {
        console.error("Insert Chunk Error:", error);
        throw new Error("Database insertion failed.");
      }
      
      successCount += chunk.length; 
    }

    return NextResponse.json({ 
        success: true, 
        message: `Successfully processed ${successCount} AWBs.`,
        total_scanned: insertData.length
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}