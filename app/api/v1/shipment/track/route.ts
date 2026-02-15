import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Initialize Supabase Admin Client
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: Request) {
  let userId = null;
  const { searchParams } = new URL(request.url);
  const awb = searchParams.get('awb');

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
    // 2. VALIDATION
    // ---------------------------------------------------------
    if (!awb) {
      return NextResponse.json({ error: 'Missing "awb" query parameter' }, { status: 400 });
    }

    // ---------------------------------------------------------
    // 3. FETCH FULL SHIPMENT DETAILS (Added reference_id)
    // ---------------------------------------------------------
    const { data: shipment, error: shipError } = await supabaseAdmin
      .from('shipments')
      .select(`
        id, awb_code, reference_id, current_status, created_at,
        sender_name, sender_city, sender_state,
        receiver_name, receiver_city, receiver_state,
        weight, package_type,
        payment_mode, cod_amount, declared_value, cost,
        payment_status
      `)
      .eq('awb_code', awb)
      .eq('user_id', userId) // 🔒 SECURITY: Only show if it belongs to this Seller
      .single();

    if (shipError || !shipment) {
      return NextResponse.json({ error: 'Shipment not found or access denied' }, { status: 404 });
    }

    // ---------------------------------------------------------
    // 4. FETCH TRACKING HISTORY
    // ---------------------------------------------------------
    const { data: history } = await supabaseAdmin
      .from('tracking_events')
      .select('status, location, description, timestamp')
      .eq('shipment_id', shipment.id)
      .order('timestamp', { ascending: false });

    // ---------------------------------------------------------
    // 5. LOGGING (For Analytics/Billing)
    // ---------------------------------------------------------
    
    // Increment API Usage
    supabaseAdmin.rpc('increment_key_usage', { key_id: keyData.id });

    // Log the request
    supabaseAdmin.from('api_logs').insert({
        user_id: userId,
        endpoint: '/api/v1/shipment/track',
        method: 'GET',
        status_code: 200,
        request_body: { awb },
        response_body: { success: true, awb } // Keep log payload light
    });

    // ---------------------------------------------------------
    // 6. RETURN RICH RESPONSE
    // ---------------------------------------------------------
    return NextResponse.json({
      success: true,
      data: {
        awb: shipment.awb_code,
        reference_id: shipment.reference_id, // ✅ Now included in the response
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
        history: history || []
      }
    });

  } catch (error: any) {
    // Log Failure
    if (userId) {
        await supabaseAdmin.from('api_logs').insert({
            user_id: userId,
            endpoint: '/api/v1/shipment/track',
            method: 'GET',
            status_code: 500,
            request_body: { awb },
            response_body: { error: error.message }
        });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}