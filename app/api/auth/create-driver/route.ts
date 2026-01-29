import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Initialize Supabase Admin Client
// Note: You MUST use the SERVICE_ROLE_KEY to create users programmatically
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, phone, designation, password } = body;

    // 1. Create the User in Supabase Auth (Authentication System)
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true, // Auto-confirm the email so they can login immediately
      user_metadata: { name: name }
    });

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    // 2. Insert the details into your public 'staff' table
    // ⚠️ THE FIX: Ensure 'email' is included in this object!
    const { error: dbError } = await supabaseAdmin
      .from('staff')
      .insert({
        auth_id: authData.user.id, // Link to the auth user
        name: name,
        phone: phone,
        designation: designation,
        email: email // <--- THIS WAS LIKELY MISSING OR UNDEFINED BEFORE
      });

    if (dbError) {
      // Optional: Delete the auth user if the DB insert fails to keep data clean
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      return NextResponse.json({ error: dbError.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, user: authData.user });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}