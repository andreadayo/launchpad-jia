import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const host = request.headers.get("host") || "";
  const pathname = request.nextUrl.pathname;
  const url = request.nextUrl.clone();

  if (pathname === "/admin" || pathname === "/admin/" || pathname === "/admin-portal") {
    const adminUrl = request.nextUrl.clone();
    adminUrl.pathname = "/admin-portal";
    return NextResponse.rewrite(adminUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/recruiter-dashboard/:path*",
    "/applicant/:path*",
    "/dashboard/:path*",
    "/job-openings/:path*",
    "/whitecloak/:path*",
    "/admin-portal/:path*",
    "/",
  ],
};
