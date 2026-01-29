import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            // Session Cookie Logic (Auto-delete on browser close)
            const sessionOptions = {
              ...options,
              maxAge: undefined,
              expires: undefined, 
            };
            request.cookies.set(name, value, sessionOptions);
            response = NextResponse.next({
              request: {
                headers: request.headers,
              },
            });
            response.cookies.set(name, value, sessionOptions);
          });
        },
      },
    }
  );

  // 1. Get Authenticated User
  const { data: { user } } = await supabase.auth.getUser();
  const path = request.nextUrl.pathname;

  // --- 🔒 ZONE DEFINITIONS ---
  const adminRoutes = ['/admin'];           
  const sellerRoutes = ['/seller'];         
  const userRoutes = ['/dashboard'];        
  const driverRoutes = ['/driver']; // Keeping this definition for Role Checks
  
  const authRoutes = ['/login', '/signup'];

  // --- LOGIC 1: PROTECT ROUTES (Redirect to Login if not authenticated) ---
  // 🛑 CHANGE: We removed 'driverRoutes' from this check.
  // This allows GUESTS (not logged in) to access /driver without redirection.
  const isProtectedRoute = [
    ...adminRoutes, 
    ...sellerRoutes, 
    // ...driverRoutes,  <-- REMOVED THIS
    ...userRoutes
  ].some(route => path.startsWith(route));

  if (!user && isProtectedRoute) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // --- LOGIC 2: ROLE-BASED ACCESS CONTROL (RBAC) ---
  if (user) {
    // Fetch Role from Database
    let role = 'user'; 

    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();
    
    if (roleData) {
      role = roleData.role;
    }

    // A. Prevent Logged-in Users from seeing Login/Signup
    if (authRoutes.some(p => path.startsWith(p))) {
      if (role === 'admin') return NextResponse.redirect(new URL('/admin/shipments', request.url));
      if (role === 'seller') return NextResponse.redirect(new URL('/seller', request.url));
      if (role === 'staff' || role === 'driver') return NextResponse.redirect(new URL('/driver', request.url));
      return NextResponse.redirect(new URL('/dashboard', request.url)); 
    }

    // B. STRICT BOUNDARY CHECKS
    // If I am Role X, I cannot visit pages of Role Y (including /driver if I am not a driver)

    // 1. ADMIN LOGIC
    if (role === 'admin') {
      // Admin is BLOCKED from /driver, /seller, /dashboard
      if (sellerRoutes.some(p => path.startsWith(p)) || 
          driverRoutes.some(p => path.startsWith(p)) || // 👈 Blocks Admin from Driver Page
          userRoutes.some(p => path.startsWith(p))) {
         return NextResponse.redirect(new URL('/admin/shipments', request.url));
      }
    }

    // 2. SELLER LOGIC
    if (role === 'seller') {
      // Seller is BLOCKED from /driver, /admin, /dashboard
      if (adminRoutes.some(p => path.startsWith(p)) || 
          driverRoutes.some(p => path.startsWith(p)) || // 👈 Blocks Seller from Driver Page
          userRoutes.some(p => path.startsWith(p))) {
        return NextResponse.redirect(new URL('/seller', request.url)); 
      }
    }

    // 3. CUSTOMER (USER) LOGIC
    if (role === 'user') {
      if (adminRoutes.some(p => path.startsWith(p)) || 
          sellerRoutes.some(p => path.startsWith(p)) || 
          driverRoutes.some(p => path.startsWith(p))) { // 👈 Blocks Customer from Driver Page
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
    }

    // 4. DRIVER LOGIC
    if (role === 'staff' || role === 'driver') {
      // Driver CAN visit /driver, but BLOCKED from others
      if (adminRoutes.some(p => path.startsWith(p)) || 
          sellerRoutes.some(p => path.startsWith(p)) || 
          userRoutes.some(p => path.startsWith(p))) {
        return NextResponse.redirect(new URL('/driver', request.url));
      }
    }
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api/auth|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};