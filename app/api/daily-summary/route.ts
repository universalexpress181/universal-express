import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { createClient } from '@supabase/supabase-js';

const resend = new Resend(process.env.RESEND_API_KEY);

// We must use the SERVICE_ROLE_KEY to bypass Row Level Security when running in the background
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: Request) {
  // 1. Calculate the start and end of "Today"
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Start of today (Midnight)
  
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1); // Start of tomorrow

  try {
    // 2. Query Supabase to strictly COUNT the shipments created today
    const { count, error } = await supabase
      .from('shipments')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', today.toISOString())
      .lt('created_at', tomorrow.toISOString());

    if (error) throw error;

    // 3. Send the summary email
    await resend.emails.send({
      from: 'System Summary <alerts@universalexpress.live>', // Update with your domain
      to: 'sonukahar41@gmail.com', // 👈 Change this to your email
      subject: `📊 Daily Shipment Summary - ${today.toLocaleDateString()}`,
      html: `
        <div style="font-family: sans-serif; padding: 20px; text-align: center; color: #333;">
            <h2 style="color: #059669;">End of Day Summary</h2>
            <p style="font-size: 16px;">Total shipments successfully booked today:</p>
            <div style="font-size: 48px; font-weight: black; color: #1e293b; margin: 20px 0;">
              ${count || 0}
            </div>
            <p style="color: #64748b; font-size: 12px;">This is an automated system report.</p>
        </div>
      `
    });

    return NextResponse.json({ success: true, total_shipments_today: count });
  } catch (error) {
    return NextResponse.json({ error }, { status: 500 });
  }
}