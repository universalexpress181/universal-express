import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Initialize Supabase Admin Client
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  let userId = null;
  let requestBody = null;

  try {
    // ---------------------------------------------------------
    // 1. AUTHENTICATION
    // ---------------------------------------------------------
    const apiKey = request.headers.get('x-api-key');
    if (!apiKey) return NextResponse.json({ error: 'Missing x-api-key header' }, { status: 401 });

    const { data: keyData, error: keyError } = await supabaseAdmin
      .from('api_keys')
      .select('user_id, is_active')
      .eq('secret_key', apiKey)
      .single();

    if (keyError || !keyData?.is_active) return NextResponse.json({ error: 'Invalid API Key' }, { status: 401 });
    userId = keyData.user_id;

    // ---------------------------------------------------------
    // 2. PARSE REQUEST
    // ---------------------------------------------------------
    requestBody = await request.json();
    
    const shipmentsToProcess = Array.isArray(requestBody) ? requestBody : [requestBody];

    if (shipmentsToProcess.length === 0) {
        return NextResponse.json({ error: 'No shipment data provided' }, { status: 400 });
    }

    const insertData = [];
    const generatedResponseData = [];

    // ---------------------------------------------------------
    // 3. LOOP & PROCESS
    // ---------------------------------------------------------
    
    let loopCounter = 0;

    for (const item of shipmentsToProcess) {
        loopCounter++; 

        // Basic Validation
        if (!item.sender_name || !item.receiver_name || !item.receiver_address || !item.package_type) {
            throw new Error(`Missing required fields for receiver: ${item.receiver_name || 'Unknown'}`);
        }

        // --- A. GENERATE UNIQUE AWB ---
        const prefix = "UEX";
        const randomPart = Math.floor(10000 + Math.random() * 90000).toString();
        const counterPart = String(loopCounter).padStart(3, '0'); 
        const awb = `${prefix}${randomPart}${counterPart}`;

        // --- B. HANDLE PAYMENT MODE ---
        const inputMode = (item.payment_mode || 'Prepaid').toUpperCase();
        const mode = inputMode === 'COD' ? 'COD' : 'Prepaid';
        const codAmount = mode === 'COD' ? (parseFloat(item.cod_amount) || 0) : 0;
        const declaredValue = parseFloat(item.declared_value) || 0;

        // --- C. PREPARE DATABASE ROW ---
        insertData.push({
            user_id: userId,
            awb_code: awb,
            // ❌ REMOVED: reference_id is no longer read from input
            
            // Sender
            sender_name: item.sender_name,
            sender_phone: item.sender_phone,
            sender_address: item.sender_address,
            sender_city: item.sender_city,
            sender_state: item.sender_state,
            sender_pincode: item.sender_pincode,
            
            // Receiver
            receiver_name: item.receiver_name,
            receiver_phone: item.receiver_phone,
            receiver_address: item.receiver_address,
            receiver_city: item.receiver_city,
            receiver_state: item.receiver_state,
            receiver_pincode: item.receiver_pincode,
            
            // Package
            weight: parseFloat(item.weight) || 0.5,
            package_type: item.package_type,
            
            // Payment (No internal costs)
            payment_mode: mode,
            cod_amount: codAmount,
            declared_value: declaredValue,
            
            // Status
            current_status: 'created',
            payment_status: 'paid' 
        });

        // Add to response array
        generatedResponseData.push({
            awb_code: awb,
            // ❌ REMOVED: reference_id from response
            receiver_name: item.receiver_name,
            payment_mode: mode,
            cod_amount: codAmount,
            status: "created",
            label_url: `${process.env.NEXT_PUBLIC_SITE_URL}/print/${awb}`
        });
    }

    // ---------------------------------------------------------
    // 4. BULK INSERT
    // ---------------------------------------------------------
    const { error: insertError } = await supabaseAdmin
        .from('shipments')
        .insert(insertData);

    if (insertError) throw insertError;

    // ---------------------------------------------------------
    // 5. LOGGING
    // ---------------------------------------------------------
    await supabaseAdmin.rpc('increment_key_usage', { key_id: keyData.id });

    await supabaseAdmin.from('api_logs').insert({ 
        user_id: userId, 
        endpoint: '/api/v1/shipment/create', 
        method: 'POST', 
        status_code: 200, 
        request_body: { count: shipmentsToProcess.length, sample: shipmentsToProcess[0] }, 
        response_body: { success: true, count: generatedResponseData.length } 
    });

    return NextResponse.json({
        success: true,
        message: `${generatedResponseData.length} Shipment(s) booked successfully`,
        data: generatedResponseData
    });

  } catch (error: any) {
    if (userId) {
        await supabaseAdmin.from('api_logs').insert({
            user_id: userId,
            endpoint: '/api/v1/shipment/create', 
            method: 'POST', 
            status_code: 500, 
            request_body: requestBody, 
            response_body: { error: error.message }
        });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}