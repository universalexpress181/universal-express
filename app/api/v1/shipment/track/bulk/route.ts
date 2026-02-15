import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Initialize Supabase Admin Client
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  let userId = null;

  try {
    // ---------------------------------------------------------
    // 1. AUTHENTICATION (API Key Check)
    // ---------------------------------------------------------
    const apiKey = request.headers.get('x-api-key');

    if (!apiKey) {
      return NextResponse.json({ error: 'Missing x-api-key header' }, { status: 401 });
    }

    const { data: keyData, error: keyError } = await supabaseAdmin
      .from('api_keys')
      .select('user_id, is_active, id')
      .eq('secret_key', apiKey)
      .single();

    if (keyError || !keyData || !keyData.is_active) {
      return NextResponse.json({ error: 'Invalid or inactive API Key' }, { status: 401 });
    }

    userId = keyData.user_id;

    // ---------------------------------------------------------
    // 2. PARSE REQUEST BODY & VALIDATION
    // ---------------------------------------------------------
    const body = await request.json();
    const awbs = body.awbs; // Expecting { "awbs": ["UEX1...", "UEX2..."] }

    if (!awbs || !Array.isArray(awbs) || awbs.length === 0) {
      return NextResponse.json({ error: 'Please provide an array of "awbs"' }, { status: 400 });
    }

    if (awbs.length > 100) {
      return NextResponse.json({ error: 'Maximum 100 AWBs allowed per request' }, { status: 400 });
    }

    // ---------------------------------------------------------
    // 3. FETCH SHIPMENTS (Bulk)
    // ---------------------------------------------------------
    const { data: shipments, error: shipError } = await supabaseAdmin
      .from('shipments')
      .select(`
        id, awb_code, reference_id, current_status, created_at,
        sender_name, sender_city, sender_state,
        receiver_name, receiver_city, receiver_state,
        weight, package_type,
        payment_mode, cod_amount, declared_value, cost,
        payment_status
      `)
      .eq('user_id', userId)
      .in('awb_code', awbs); // ⚡ Optimized: Fetch all matches in one query

    if (shipError) throw shipError;

    // ---------------------------------------------------------
    // 4. FETCH TRACKING HISTORY (Bulk Optimization)
    // ---------------------------------------------------------
    // Extract IDs to fetch all related events in one go
    const shipmentIds = shipments.map(s => s.id);
    
    const { data: allEvents } = await supabaseAdmin
      .from('tracking_events')
      .select('shipment_id, status, location, description, timestamp')
      .in('shipment_id', shipmentIds)
      .order('timestamp', { ascending: false });

    // ---------------------------------------------------------
    // 5. LOGGING
    // ---------------------------------------------------------
    supabaseAdmin.rpc('increment_key_usage', { key_id: keyData.id });

    supabaseAdmin.from('api_logs').insert({
        user_id: userId,
        endpoint: '/api/v1/shipment/track/bulk',
        method: 'POST',
        status_code: 200,
        request_body: { count: awbs.length },
        response_body: { success: true, found: shipments?.length }
    });

    // ---------------------------------------------------------
    // 6. MAP RESPONSE (Combine Shipment + History)
    // ---------------------------------------------------------
    const results = shipments.map(shipment => {
        // Filter history events specific to this shipment
        const history = allEvents?.filter(e => e.shipment_id === shipment.id) || [];
        
        return {
            awb: shipment.awb_code,
            reference_id: shipment.reference_id,
            status: {
                current: shipment.current_status === 'created' ? 'Pending' : shipment.current_status,
                booked_on: shipment.created_at,
            },
            route: {
                origin: `${shipment.sender_city}, ${shipment.sender_state}`,
                destination: `${shipment.receiver_city}, ${shipment.receiver_state}`
            },
            parties: {
                sender: shipment.sender_name,
                receiver: shipment.receiver_name
            },
            details: {
                weight: shipment.weight,
                type: shipment.package_type,
            },
            financials: {
                payment_mode: shipment.payment_mode,
                cod_to_collect: shipment.payment_mode === 'COD' ? shipment.cod_amount : 0,
                insured_value: shipment.declared_value,
            },
            documents: {
                label_url: `${process.env.NEXT_PUBLIC_SITE_URL}/print/${shipment.awb_code}`
            },
            history: history
        };
    });

    return NextResponse.json({
      success: true,
      total_requested: awbs.length,
      total_found: shipments.length,
      data: results
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}