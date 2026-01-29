import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  
  if (code) {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    
    // 1. Exchange the auth code for a user session (Log them in)
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!error && data?.user) {
      
      // 2. Fetch the User's Role from your database
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', data.user.id)
        .single();

      const userRole = roleData?.role;

      // 3. Define Redirect Paths based on Role
      let redirectPath = '/dashboard'; // Default fallback

      switch (userRole) {
        case 'seller':
          redirectPath = '/seller';
          break;
        case 'admin':
          redirectPath = '/admin/shipments'; // Example path
          break;
        case 'driver':
          redirectPath = '/driver'; // Example path
          break;
        default:
          redirectPath = '/dashboard'; // Standard user path
      }

      // 4. Redirect to the determined path
      return NextResponse.redirect(`${origin}${redirectPath}`);
    }
  }

  // If error, redirect to an error page
  return NextResponse.redirect(`${origin}/auth/auth-code-error`);
}