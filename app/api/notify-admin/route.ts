import { NextResponse } from 'next/server';
import { Resend } from 'resend';

// Initialize Resend
const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    // 🚀 Extracting exactly what you requested
    const { awb, sender_name, identical_package_count } = await request.json();

    const data = await resend.emails.send({
      from: 'Admin Alerts <alerts@universalexpress.live>', // Update with your domain when verified
      to: 'universalex05@gmail.com', // 👈 Change this to your email
      subject: `🚨 New Booking: ${awb}`,
      html: `
        <div style="font-family: sans-serif; padding: 20px; color: #333;">
          <h2 style="color: #2563eb;">New Shipment Booked</h2>
          <table style="text-align: left; border-collapse: collapse; width: 100%; max-width: 400px;">
            <tr style="border-bottom: 1px solid #eee;">
              <th style="padding: 10px 0;">AWB Number:</th>
              <td style="padding: 10px 0; font-family: monospace; font-weight: bold;">${awb}</td>
            </tr>
            <tr style="border-bottom: 1px solid #eee;">
              <th style="padding: 10px 0;">Sender:</th>
              <td style="padding: 10px 0;">${sender_name}</td>
            </tr>
            <tr>
              <th style="padding: 10px 0;">No. of Boxes:</th>
              <td style="padding: 10px 0;">${identical_package_count || 1}</td>
            </tr>
          </table>
        </div>
      `,
    });

    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json({ error }, { status: 500 });
  }
}