// app/api/shipment/create/route.ts
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function POST(request: Request) {
  try {
    // 1. Parse the incoming form data (Files + Text)
    const formData = await request.formData();
    
    const awb = formData.get('awb') as string;
    const senderName = formData.get('sender_name') as string;
    const senderAddress = formData.get('sender_address') as string;
    const receiverName = formData.get('receiver_name') as string;
    const receiverAddress = formData.get('receiver_address') as string;
    const file = formData.get('pod_file') as File;

    if (!awb || !file) {
      return NextResponse.json({ error: "Missing AWB or File" }, { status: 400 });
    }

    // 2. Upload POD File to Supabase Storage
    // We name the file: "awb_timestamp.pdf" to keep it unique
    const fileName = `${awb}_${Date.now()}.${file.name.split('.').pop()}`;
    
    const { data: fileData, error: fileError } = await supabaseAdmin
      .storage
      .from('pod-receipts')
      .upload(fileName, file, {
        contentType: file.type,
        upsert: false
      });

    if (fileError) {
      console.error('Upload Error:', fileError);
      return NextResponse.json({ error: "File upload failed" }, { status: 500 });
    }

    // 3. Get the Public URL of the uploaded file
    const { data: publicUrlData } = supabaseAdmin
      .storage
      .from('pod-receipts')
      .getPublicUrl(fileName);

    const fileUrl = publicUrlData.publicUrl;

    // 4. Insert Shipment Record into Database
    const { data: shipment, error: dbError } = await supabaseAdmin
      .from('shipments')
      .insert({
        awb_code: awb,
        sender_name: senderName,
        sender_address: senderAddress,
        receiver_name: receiverName,
        receiver_address: receiverAddress,
        pod_image_url: fileUrl,
        current_status: 'created'
      })
      .select()
      .single();

    if (dbError) {
      console.error('DB Error:', dbError);
      return NextResponse.json({ error: dbError.message }, { status: 500 });
    }

    // 5. Success!
    return NextResponse.json({ 
      success: true, 
      message: "Shipment created successfully", 
      data: shipment 
    });

  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}