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
      return NextResponse.json(
        { error: 'Missing x-api-key header' },
        { status: 401 }
      );
    }

    const { data: keyData, error: keyError } = await supabaseAdmin
      .from('api_keys')
      .select('user_id, is_active, id')
      .eq('secret_key', apiKey)
      .single();

    if (keyError || !keyData || !keyData.is_active) {
      return NextResponse.json(
        { error: 'Invalid or inactive API Key' },
        { status: 401 }
      );
    }

    userId = keyData.user_id;

    // ---------------------------------------------------------
    // 2. VALIDATION
    // ---------------------------------------------------------
    if (!awb) {
      return NextResponse.json(
        { error: 'Missing "awb" query parameter' },
        { status: 400 }
      );
    }

    // ---------------------------------------------------------
    // 3. FETCH SHIPMENT DETAILS
    // ---------------------------------------------------------
    const { data: shipmentData, error: shipError } = await supabaseAdmin
      .from('shipments')
      .select(`
        id, awb_code, current_status, created_at,
        sender_name, sender_city, sender_state,
        receiver_name, receiver_city, receiver_state,
        weight, package_type,
        payment_mode, cod_amount, declared_value
      `)
      .eq('awb_code', awb)
      .eq('user_id', userId);

    if (shipError || !shipmentData || shipmentData.length === 0) {
      return NextResponse.json(
        { error: 'Shipment not found or access denied' },
        { status: 404 }
      );
    }

    const shipment = shipmentData[0];

    // ---------------------------------------------------------
    // 4. FETCH TRACKING HISTORY
    // ---------------------------------------------------------
    const { data: history } = await supabaseAdmin
      .from('tracking_events')
      .select(
        'status, location, description, timestamp, remark_status_code'
      )
      .eq('shipment_id', shipment.id)
      .order('timestamp', { ascending: false });

    // ---------------------------------------------------------
    // 5. CONDITIONAL POD FETCH (🔥 UPGRADE)
    // ---------------------------------------------------------
    let podUrls: string[] = [];

    const isDelivered = ['delivered', 'completed'].includes(
      shipment.current_status?.toLowerCase()
    );

    if (isDelivered) {
      const { data: podImages } = await supabaseAdmin
        .from('pod_images')
        .select('image_url')
        .eq('shipment_id', shipment.id);

      if (podImages && podImages.length > 0) {
        podUrls = podImages.map((img) => img.image_url);
      }
    }

    // ---------------------------------------------------------
    // 6. LOGGING & USAGE
    // ---------------------------------------------------------
    await supabaseAdmin.rpc('increment_key_usage', {
      key_id: keyData.id,
    });

    await supabaseAdmin.from('api_logs').insert({
      user_id: userId,
      endpoint: '/api/v1/shipment/track',
      method: 'GET',
      status_code: 200,
      request_body: { awb },
      response_body: { success: true, awb },
    });

    // ---------------------------------------------------------
    // 7. RESPONSE
    // ---------------------------------------------------------
    return NextResponse.json({
      success: true,
      data: {
        awb: shipment.awb_code,

        status: {
          current:
            shipment.current_status === 'created'
              ? 'Pending'
              : shipment.current_status,
          booked_on: shipment.created_at,
        },

        route: {
          origin: `${shipment.sender_city}, ${shipment.sender_state}`,
          destination: `${shipment.receiver_city}, ${shipment.receiver_state}`,
        },

        parties: {
          sender: shipment.sender_name,
          receiver: shipment.receiver_name,
        },

        details: {
          weight: shipment.weight,
          type: shipment.package_type,
        },

        financials: {
          payment_mode: shipment.payment_mode,
          cod_to_collect:
            shipment.payment_mode === 'COD'
              ? shipment.cod_amount
              : 0,
          insured_value: shipment.declared_value,
        },

        documents: {
          pod_available: isDelivered, // 🔥 extra clarity
          pod_urls: podUrls,
        },

        history: history || [],
      },
    });

  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}