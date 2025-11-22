import { NextRequest, NextResponse } from "next/server";

export async function middleware(request: NextRequest) {
  // Check for auth cookies - using the correct cookie prefix
  const sessionCookie = request.cookies.get("travel_companion.session_token");
  
  // If no session cookie, redirect to login with return URL
  if (!sessionCookie) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/trips/:path*", "/groups/:path*", "/profile/:path*"],
};