import { NextResponse, type NextRequest } from "next/server";

// ==========================================================
// Middleware — proteksi route di sisi server.
//
// Token Sanctum disimpan di localStorage (client-side) sehingga tidak
// bisa dibaca di middleware. Karena itu kita pakai cookie flag ringan
// "laundryflow_authed" yang diset/dihapus oleh client saat login/logout
// (lihat AuthContext + klien login). Ini lapisan pertama proteksi;
// API backend tetap melakukan validasi token sungguhan.
//
// Route yang dilindungi: /dashboard, /orders, /status, /customers,
// /reports, /settings. Route publik: /, /login.
// ==========================================================

const PROTECTED_PREFIXES = ["/dashboard", "/orders", "/status", "/customers", "/reports", "/settings"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));

  if (!isProtected) return NextResponse.next();

  const authed = request.cookies.get("laundryflow_authed")?.value === "1";

  if (!authed) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  // Jalankan middleware pada route app (bukan aset statis).
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sw.js|manifest.json|icons|api).*)",
  ],
};
