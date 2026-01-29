// app/api/admin/create-partner/route.ts
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Initialize Admin Client (Bypasses RLS)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, business_name, phone, gst_number } = body;

    // 1. Create Auth User
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: business_name }
    });

    if (authError) throw authError;
    const newUserId = authData.user.id;

    // 2. ✅ FIX: Use 'upsert' instead of 'insert' to handle auto-triggers
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .upsert({ 
        id: newUserId,
        email,
        business_name,
        phone,
        gst_number,
        full_name: business_name
      });

    if (profileError) throw profileError;

    // 3. Assign 'seller' Role
    const { error: roleError } = await supabaseAdmin
      .from('user_roles')
      .upsert({ // Changed to upsert here too just to be safe
        user_id: newUserId,
        role: 'seller'
      });

    if (roleError) throw roleError;

    return NextResponse.json({ success: true, message: "Partner account created successfully" });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}