import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function GET(
  request: Request,
  // 1. Update the type definition to be a Promise
  { params }: { params: Promise<{ awb: string }> }
) {
  try {
    // 2. AWAIT the params before accessing properties
    const resolvedParams = await params;
    const awb = resolvedParams.awb.trim();

    console.log(`🔍 Searching for AWB: "${awb}"`);

    // 3. Search Database (Case Insensitive)
    const { data: shipment, error } = await supabaseAdmin
      .from('shipments')
      .select('*')
      .ilike('awb_code', awb)
      .maybeSingle();

    if (error) {
      console.error("❌ Supabase Error:", error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!shipment) {
      console.log("⚠️ No shipment found in DB.");
      return NextResponse.json({ error: "Shipment not found" }, { status: 404 });
    }

    console.log("✅ Found Shipment:", shipment.id);

    // 4. Fetch History
    const { data: events } = await supabaseAdmin
      .from('tracking_events')
      .select('*')
      .eq('shipment_id', shipment.id)
      .order('timestamp', { ascending: false });

    return NextResponse.json({
      ...shipment,
      history: events || []
    });

  } catch (err: any) {
    console.error("Server Error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}