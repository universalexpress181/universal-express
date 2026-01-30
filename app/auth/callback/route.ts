import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  if (error) {
    return NextResponse.redirect(`${origin}/auth/auth-code-error?message=Link%20Expired`);
  }

  if (code) {
    // 👇 FIX: Add 'await' here
    const cookieStore = await cookies();

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name) {
            return cookieStore.get(name)?.value;
          },
          set(name, value, options) {
            cookieStore.set({ name, value, ...options });
          },
          remove(name, options) {
            cookieStore.delete({ name, ...options });
          },
        },
      }
    );
    
    // Verify the Email
    const { error: sessionError } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!sessionError) {
      // Force Logout so they must login manually
      await supabase.auth.signOut();

      // Redirect to Success Page
      return NextResponse.redirect(`${origin}/auth/confirmed`);
    }
  }

  return NextResponse.redirect(`${origin}/auth/auth-code-error?message=Verification%20Failed`);
}