import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

// Guests sent to login keep their cart: it lives in a cookie and is merged on sign-in.
const protectedPrefixes = ["/account", "/admin", "/checkout", "/order-success"];
const guestOnlyPaths = ["/login", "/register", "/forgot-password"];

export async function proxy(request: NextRequest) {
  const { response, userId } = await updateSession(request);
  const { pathname, search } = request.nextUrl;

  const isProtected = protectedPrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );

  if (isProtected && !userId) {
    return redirectWithCookies(request, response, `/login?next=${encodeURIComponent(pathname + search)}`);
  }

  if (userId && guestOnlyPaths.includes(pathname)) {
    return redirectWithCookies(request, response, "/account");
  }

  return response;
}

// Carry any refreshed session cookies over, or the browser keeps a stale token.
function redirectWithCookies(request: NextRequest, response: NextResponse, path: string) {
  const redirect = NextResponse.redirect(new URL(path, request.url));
  response.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
  return redirect;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
