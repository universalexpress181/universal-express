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
    // 2. PARSE REQUEST BODY & VALIDATION
    // ---------------------------------------------------------
    const body = await request.json();
    const awbs = body.awbs;

    if (!awbs || !Array.isArray(awbs) || awbs.length === 0) {
      return NextResponse.json(
        { error: 'Please provide an array of "awbs"' },
        { status: 400 }
      );
    }

    if (awbs.length > 100) {
      return NextResponse.json(
        { error: 'Maximum 100 AWBs allowed per request' },
        { status: 400 }
      );
    }

    // ---------------------------------------------------------
    // 3. FETCH SHIPMENTS (Bulk)
    // ---------------------------------------------------------
    const { data: shipments, error: shipError } = await supabaseAdmin
      .from('shipments')
      .select(`
        id, awb_code, current_status, remark_status_code, created_at,
        sender_name, sender_city, sender_state,
        receiver_name, receiver_city, receiver_state,
        weight, package_type,
        payment_mode, cod_amount, declared_value
      `)
      .eq('user_id', userId)
      .in('awb_code', awbs);

    if (shipError) throw shipError;

    if (!shipments || shipments.length === 0) {
      return NextResponse.json({
        success: true,
        total_requested: awbs.length,
        total_found: 0,
        data: []
      });
    }

    // ---------------------------------------------------------
    // 4. FETCH TRACKING HISTORY (Bulk)
    // ---------------------------------------------------------
    const shipmentIds = shipments.map((s) => s.id);

    const { data: allEvents } = await supabaseAdmin
      .from('tracking_events')
      .select(
        'shipment_id, status, location, remark:description, timestamp, remark_status_code'
      )
      .in('shipment_id', shipmentIds)
      .order('timestamp', { ascending: false });

    // ---------------------------------------------------------
    // 5. 🚀 BULK POD FETCH (ONLY DELIVERED)
    // ---------------------------------------------------------
    const deliveredShipmentIds = shipments
      .filter((s) =>
        ['delivered', 'completed'].includes(
          s.current_status?.toLowerCase()
        )
      )
      .map((s) => s.id);

    let podMap: Record<string, string[]> = {};

    if (deliveredShipmentIds.length > 0) {
      const { data: podImages } = await supabaseAdmin
        .from('pod_images')
        .select('shipment_id, image_url')
        .in('shipment_id', deliveredShipmentIds);

      if (podImages && podImages.length > 0) {
        podMap = podImages.reduce((acc: any, item) => {
          if (!acc[item.shipment_id]) {
            acc[item.shipment_id] = [];
          }
          acc[item.shipment_id].push(item.image_url);
          return acc;
        }, {});
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
      endpoint: '/api/v1/shipment/track/bulk',
      method: 'POST',
      status_code: 200,
      request_body: { count: awbs.length },
      response_body: { success: true, found: shipments.length },
    });

    // ---------------------------------------------------------
    // 7. MAP RESPONSE
    // ---------------------------------------------------------
    const results = shipments.map((shipment) => {
      const history =
        allEvents
          ?.filter((e) => e.shipment_id === shipment.id)
          .map(({ shipment_id, ...rest }) => rest) || [];

      const isDelivered = ['delivered', 'completed'].includes(
        shipment.current_status?.toLowerCase()
      );

      return {
        awb: shipment.awb_code,

        status: {
          current:
            shipment.current_status === 'created'
              ? 'PENDING PICKUP'
              : shipment.current_status,
          remark_status_code: shipment.remark_status_code || '99',
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
          pod_available: isDelivered,
          pod_urls: isDelivered
            ? podMap[shipment.id] || []
            : [],
        },

        history: history,
      };
    });

    return NextResponse.json({
      success: true,
      total_requested: awbs.length,
      total_found: shipments.length,
      data: results,
    });

  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}