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
    const apiKey = request.headers.get('x-api-key');
    if (!apiKey) return NextResponse.json({ error: 'Missing x-api-key header' }, { status: 401 });

    const { data: keyData, error: keyError } = await supabaseAdmin
      .from('api_keys')
      .select('user_id, is_active, id')
      .eq('secret_key', apiKey)
      .single();

    if (keyError || !keyData?.is_active) return NextResponse.json({ error: 'Invalid API Key' }, { status: 401 });
    userId = keyData.user_id;

    const requestBody = await request.json();
    
    let shipmentsToProcess = [];
    if (requestBody.data) {
        shipmentsToProcess = Array.isArray(requestBody.data) ? requestBody.data : [requestBody.data];
    } else {
        shipmentsToProcess = Array.isArray(requestBody) ? requestBody : [requestBody];
    }

    if (shipmentsToProcess.length === 0) {
        return NextResponse.json({ error: 'No shipment data provided' }, { status: 400 });
    }

    const insertData = [];
    const generatedResponseData = [];

    for (const item of shipmentsToProcess) {
        
        const order = item.order || item;
        const origin = item.origin || item;
        const dest = item.destination || item;
        const pkg = item.package || item.package_details || item;
        const fin = item.financials || item;

        const senderName = origin.name || item.sender_name;
        const receiverName = dest.name || item.receiver_name;
        const receiverAddress = dest.address || item.receiver_address;

        if (!senderName || !receiverName || !receiverAddress) {
            throw new Error(`Missing required origin/destination fields for order.`);
        }

        const packageCount = parseInt(pkg.package_count || item.identical_package_count) || 1;
        
        const inputMode = (fin.payment_mode || 'Prepaid').toUpperCase();
        const mode = inputMode === 'COD' ? 'COD' : 'Prepaid';
        const declaredValue = parseFloat(fin.declared_value) || 0;
        const codAmount = mode === 'COD' ? (parseFloat(fin.cod_amount) || declaredValue) : 0;

        const requestedService = order.service_type || 'Prime';
        const partnerName = requestedService === 'Ground Cargo' ? 'DPWORLD' : 'DTDC';

        const awb = `UEX${Math.floor(10000000 + Math.random() * 90000000)}`;

        const { data: partnerAwb, error: rpcError } = await supabaseAdmin.rpc('allocate_next_awb', { 
            requested_service: requestedService, 
            target_uex_awb: awb 
        });

        if (rpcError || !partnerAwb) {
            throw new Error(`Inventory stock empty for ${requestedService}. Please restock AWB Bank.`);
        }

        insertData.push({
            user_id: userId,
            awb_code: awb,
            reference_id: partnerAwb, 
            partner_name: partnerName,
            service_type: requestedService,
            client_order_id: order.client_order_id || null,
            shipment_type: order.shipment_type || 'forward',
            ship_from_company: origin.company || item.ship_from_company,
            sender_name: senderName,
            sender_phone: origin.phone || item.sender_phone,
            sender_address: origin.address || item.sender_address,
            sender_city: origin.city || item.sender_city,
            sender_state: origin.state || item.sender_state,
            sender_pincode: origin.pincode || item.sender_pincode,
            sender_email: origin.email || item.sender_email || null,
            ship_to_company: dest.company || item.ship_to_company,
            receiver_name: receiverName,
            receiver_phone: dest.phone || item.receiver_phone,
            receiver_address: receiverAddress,
            receiver_city: dest.city || item.receiver_city,
            receiver_state: dest.state || item.receiver_state,
            receiver_pincode: dest.pincode || item.receiver_pincode,
            package_type: pkg.type || item.package_type || 'Standard Box',
            product_description: pkg.description || item.product_description || 'General Goods',
            weight: parseFloat(pkg.weight) || 0.5,
            length: parseFloat(pkg.length) || 10,
            width: parseFloat(pkg.width) || 10,
            height: parseFloat(pkg.height) || 10,
            identical_package_count: packageCount, 
            payment_mode: mode,
            cod_amount: codAmount,
            declared_value: declaredValue,
            current_status: 'PENDING PICKUP',
            remark_status_code: '99',
            remark: 'Shipment created; waiting for courier collection'
        });

        const labelUrls = [];

        // ✅ UPDATED TO PDF API
        if (packageCount === 1) {
            labelUrls.push(`${process.env.NEXT_PUBLIC_SITE_URL}/api/label?awb=${awb}`);
        } else {
            for (let p = 1; p <= packageCount; p++) {
                labelUrls.push(`${process.env.NEXT_PUBLIC_SITE_URL}/api/label?awb=${awb}&piece=${p}&total=${packageCount}`);
            }
        }

        // ✅ UPDATED MASTER LINK
        const masterLabelUrl = packageCount > 1 
            ? `${process.env.NEXT_PUBLIC_SITE_URL}/api/label?awb=${awb}&all=true` 
            : labelUrls[0];

        generatedResponseData.push({
            awb_code: awb, 
            client_order_id: order.client_order_id || undefined,
            receiver_name: receiverName,
            payment_mode: mode,
            status: "PENDING PICKUP",
            remark_status_code: "99",
            total_pieces: packageCount,
            master_label_url: masterLabelUrl,
            labels: labelUrls 
        });
    }

    const { error: insertError } = await supabaseAdmin
        .from('shipments')
        .insert(insertData);

    if (insertError) throw insertError;

    await supabaseAdmin.rpc('increment_key_usage', { key_id: keyData.id });

    return NextResponse.json({
        success: true,
        message: `${insertData.length} Shipment(s) booked successfully`,
        data: generatedResponseData
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}