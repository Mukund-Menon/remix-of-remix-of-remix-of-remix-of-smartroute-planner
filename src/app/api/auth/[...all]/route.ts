import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";
import { NextRequest, NextResponse } from "next/server";

const handlers = toNextJsHandler(auth);

// Wrap handlers to fix cookie attributes for iframe compatibility
export async function POST(request: NextRequest) {
  const response = await handlers.POST(request);
  
  // Fix cookie attributes for iframe/cross-origin
  const cookies = response.headers.getSetCookie();
  if (cookies.length > 0) {
    response.headers.delete('set-cookie');
    cookies.forEach(cookie => {
      // Modify cookie to work in iframe by setting SameSite=None
      let modifiedCookie = cookie;
      if (!cookie.includes('SameSite=None')) {
        modifiedCookie = cookie.replace(/SameSite=\w+/gi, 'SameSite=None');
        if (!cookie.match(/SameSite=/i)) {
          modifiedCookie += '; SameSite=None';
        }
      }
      response.headers.append('set-cookie', modifiedCookie);
    });
  }
  
  return response;
}

export async function GET(request: NextRequest) {
  return handlers.GET(request);
}