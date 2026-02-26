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
    // 1. AUTHENTICATION
    // ---------------------------------------------------------
    const apiKey = request.headers.get('x-api-key');
    if (!apiKey) return NextResponse.json({ error: 'Missing x-api-key header' }, { status: 401 });

    const { data: keyData, error: keyError } = await supabaseAdmin
      .from('api_keys')
      .select('user_id, is_active, id')
      .eq('secret_key', apiKey)
      .single();

    if (keyError || !keyData?.is_active) return NextResponse.json({ error: 'Invalid API Key' }, { status: 401 });
    userId = keyData.user_id;

    // ---------------------------------------------------------
    // 2. PARSE REQUEST
    // ---------------------------------------------------------
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

    // ---------------------------------------------------------
    // 3. LOOP & PROCESS
    // ---------------------------------------------------------
    for (const item of shipmentsToProcess) {
        // Validation
        if (!item.sender_name || !item.receiver_name || !item.receiver_address) {
            throw new Error(`Missing required fields for receiver: ${item.receiver_name || 'Unknown'}`);
        }

        // --- A. GENERATE UNIQUE INTERNAL AWB ---
        const awb = `UEX${Math.floor(10000000 + Math.random() * 90000000)}`;

        // --- B. HANDLE PAYMENT MODE & LOGIC ---
        const inputMode = (item.payment_mode || 'Prepaid').toUpperCase();
        const mode = inputMode === 'COD' ? 'COD' : 'Prepaid';
        const declaredValue = parseFloat(item.declared_value) || 0;
        const codAmount = mode === 'COD' ? (parseFloat(item.cod_amount) || declaredValue) : 0;
        const requestedService = mode === 'COD' ? 'COD' : (item.service_type || 'Prime');

        // --- C. ALLOCATE PARTNER AWB FROM BANK (BACKEND ONLY) ---
        const { data: partnerAwb, error: rpcError } = await supabaseAdmin.rpc('allocate_next_awb', { 
            requested_service: requestedService, 
            target_uex_awb: awb 
        });

        if (rpcError || !partnerAwb) {
            throw new Error(`Inventory stock empty for ${requestedService}. Please restock AWB Bank.`);
        }

        // Determine partner name based on service (for internal admin use)
        const partnerName = requestedService === 'Ground Cargo' ? 'DPWORLD' : 'DTDC';

        // --- D. PREPARE DATABASE ROW ---
        insertData.push({
            user_id: userId,
            awb_code: awb,
            
            // 🎯 INTERNAL DATA (Strictly for Backend/Admin use)
            reference_id: partnerAwb, 
            partner_name: partnerName,
            service_type: requestedService,
            
            // Client References
            client_order_id: item.client_order_id || null,
            shipment_type: item.shipment_type || 'forward',
            
            // Sender details
            ship_from_company: item.ship_from_company,
            sender_name: item.sender_name,
            sender_phone: item.sender_phone,
            sender_address: item.sender_address,
            sender_city: item.sender_city,
            sender_state: item.sender_state,
            sender_pincode: item.sender_pincode,
            sender_email: item.sender_email || null,
            
            // Receiver details
            ship_to_company: item.ship_to_company,
            receiver_name: item.receiver_name,
            receiver_phone: item.receiver_phone,
            receiver_address: item.receiver_address,
            receiver_city: item.receiver_city,
            receiver_state: item.receiver_state,
            receiver_pincode: item.receiver_pincode,
            
            // Package & Dimensions
            package_type: item.package_type || 'Standard Box',
            product_description: item.product_description || 'General Goods',
            weight: parseFloat(item.weight) || 0.5,
            length: parseFloat(item.length) || 10,
            width: parseFloat(item.width) || 10,
            height: parseFloat(item.height) || 10,
            identical_package_count: parseInt(item.identical_package_count) || 1,
            
            // Financials & Status
            payment_mode: mode,
            cod_amount: codAmount,
            declared_value: declaredValue,
            current_status: 'Order_placed'
        });

        // --- E. ADD TO RESPONSE (White-Labeled) ---
        // ❌ reference_id and partner_name are NOT included here
        generatedResponseData.push({
            awb_code: awb,
            client_order_id: item.client_order_id || undefined,
            receiver_name: item.receiver_name,
            payment_mode: mode,
            status: "order_placed",
            label_url: `${process.env.NEXT_PUBLIC_SITE_URL}/print/${awb}`
        });
    }

    // ---------------------------------------------------------
    // 4. DATABASE INSERT
    // ---------------------------------------------------------
    const { error: insertError } = await supabaseAdmin
        .from('shipments')
        .insert(insertData);

    if (insertError) throw insertError;

    // ---------------------------------------------------------
    // 5. LOGGING & USAGE
    // ---------------------------------------------------------
    await supabaseAdmin.rpc('increment_key_usage', { key_id: keyData.id });

    return NextResponse.json({
        success: true,
        message: `${generatedResponseData.length} Shipment(s) booked successfully`,
        data: generatedResponseData
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}