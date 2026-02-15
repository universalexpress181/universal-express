import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx"; // 📦 Run: npm install xlsx
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase Admin Client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    // ---------------------------------------------------------
    // 1. PARSE FORM DATA
    // ---------------------------------------------------------
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const targetDbColumn = formData.get("targetDbColumn") as string; // e.g. "current_status"
    const excelRefCol = formData.get("excelRefCol") as string;       // e.g. "Reference ID"
    const excelValCol = formData.get("excelValCol") as string;       // e.g. "New Status"

    if (!file || !targetDbColumn || !excelRefCol || !excelValCol) {
      return NextResponse.json({ error: "Missing configuration or file" }, { status: 400 });
    }

    // ---------------------------------------------------------
    // 2. READ EXCEL FILE
    // ---------------------------------------------------------
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(Buffer.from(arrayBuffer), { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    
    // Convert to JSON (Array of Objects)
    const jsonData = XLSX.utils.sheet_to_json(sheet);

    const results = { success: 0, failed: 0 };

    // ---------------------------------------------------------
    // 3. ITERATE & UPDATE
    // ---------------------------------------------------------
    for (const row of jsonData) {
        const anyRow = row as any;
        
        // Extract values dynamically based on Admin's selection
        const refId = String(anyRow[excelRefCol] || "").trim();
        let newValue = anyRow[excelValCol];

        // Skip invalid rows
        if (!refId || newValue === undefined || newValue === null) {
            results.failed++;
            continue;
        }

        // Clean up value (trim strings)
        if (typeof newValue === 'string') newValue = newValue.trim();

        // --- A. UPDATE SHIPMENT ---
        // We find the shipment by 'reference_id' and update the chosen column
        const { data: updatedShipment, error } = await supabase
            .from('shipments')
            .update({ [targetDbColumn]: newValue })
            .eq('reference_id', refId)
            .select('id') // Return ID so we can log history
            .single();

        if (error || !updatedShipment) {
            console.error(`Failed to update Ref: ${refId}`, error?.message);
            results.failed++;
        } else {
            results.success++;

            // --- B. AUTO-LOG HISTORY (Only if updating Status) ---
            // If the admin is updating "current_status", we must add a timeline event
            if (targetDbColumn === 'current_status') {
                const statusDescriptionMap: any = {
                    'manifested': 'Shipment details received',
                    'in_transit': 'Shipment on the way',
                    'out_for_delivery': 'Out for delivery',
                    'delivered': 'Delivered successfully',
                    'rto_initiated': 'Returning to origin',
                    'cancelled': 'Shipment cancelled'
                };

                const description = statusDescriptionMap[newValue] || `Status updated to ${newValue}`;

                await supabase.from('tracking_events').insert({
                    shipment_id: updatedShipment.id,
                    status: String(newValue),
                    location: 'System Bulk Update',
                    description: description,
                    timestamp: new Date().toISOString()
                });
            }
        }
    }

    return NextResponse.json({ results });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}