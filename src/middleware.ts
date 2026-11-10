import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySession } from "@/lib/session";

// First line of defence (fast, edge). Route handlers re-check against the user store.
export async function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  const session = await verifySession(req.cookies.get(SESSION_COOKIE)?.value);
  const isApi = pathname.startsWith("/api/");

  if (!session) {
    if (isApi) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.search = `?next=${encodeURIComponent(pathname + search)}`;
    return NextResponse.redirect(url);
  }

  const needsAdmin = pathname === "/admin" || pathname.startsWith("/admin/") || pathname.startsWith("/api/admin/");
  if (needsAdmin && session.role !== "admin") {
    if (isApi) return NextResponse.json({ error: "Admin access required." }, { status: 403 });
    const url = req.nextUrl.clone();
    url.pathname = "/forbidden";
    url.search = "";
    return NextResponse.rewrite(url, { status: 403 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/bookshelf/:path*", "/api/admin/:path*"],
};
