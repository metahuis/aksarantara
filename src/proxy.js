import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';

export async function proxy(request) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  // Protect /admin routes
  if (request.nextUrl.pathname.startsWith('/admin')) {
    if (!user) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    const { data: role } = await supabase.rpc('get_my_role');
    if (!role || !['superadmin', 'moderator'].includes(role)) {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  // Protect auth-required pages — must be logged in
  // /scan and /chat are intentionally public for hackathon demo access
  const protectedRoutes = ['/contribute', '/settings', '/dashboard'];
  if (protectedRoutes.includes(request.nextUrl.pathname) && !user) {
    return NextResponse.redirect(new URL(`/login?next=${request.nextUrl.pathname}`, request.url));
  }

  // Redirect authenticated users away from /login
  if (request.nextUrl.pathname === '/login' && user) {
    const next = request.nextUrl.searchParams.get('next') ?? '/';
    return NextResponse.redirect(new URL(next, request.url));
  }

  return supabaseResponse;
}

export const config = {
  // Run on every route except static assets so getUser() refreshes the
  // Supabase session cookie for server components on all pages. The
  // protected-route redirects above only fire on their specific paths.
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|icon|font/|map/|avatars/|social/|og\\.webp|manifest\\.json|sw\\.js|robots\\.txt|sitemap\\.xml).*)',
  ],
};
