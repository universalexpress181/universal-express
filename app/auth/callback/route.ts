import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);

  // ----------------------------------------------------------------
  // 1. ERROR HANDLING (Fixes the "otp_expired" issue)
  // ----------------------------------------------------------------
  // If Supabase sends an error (like link expired), we catch it here.
  const error = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');

  if (error) {
    return NextResponse.redirect(
      `${origin}/auth/auth-code-error?message=${encodeURIComponent(errorDescription || 'Authentication failed')}`
    );
  }

  // ----------------------------------------------------------------
  // 2. EXCHANGE CODE FOR SESSION
  // ----------------------------------------------------------------
  const code = searchParams.get('code');

  if (code) {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    
    // Exchange the auth code for a user session (Log them in)
    const { data, error: sessionError } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!sessionError && data?.user) {
      
      // ----------------------------------------------------------------
      // 3. FETCH ROLE & REDIRECT
      // ----------------------------------------------------------------
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', data.user.id)
        .single();

      const userRole = roleData?.role;
      let redirectPath = '/dashboard'; // Default fallback

      // Using your specific routes:
      switch (userRole) {
        case 'seller':
          redirectPath = '/seller';
          break;
        case 'admin':
          redirectPath = '/admin/shipments';
          break;
        case 'driver':
          redirectPath = '/driver';
          break;
        default:
          redirectPath = '/dashboard';
      }

      // Redirect to the role-specific dashboard
      return NextResponse.redirect(`${origin}${redirectPath}`);
    }
  }

  // Fallback: If no code exists or exchange failed
  return NextResponse.redirect(`${origin}/auth/auth-code-error?message=Invalid%20request`);
}