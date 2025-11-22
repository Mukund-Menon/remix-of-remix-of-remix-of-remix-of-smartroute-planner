import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { NextRequest } from 'next/server';
import { headers } from "next/headers"
import { db } from "@/db";
 
export const auth = betterAuth({
	database: drizzleAdapter(db, {
		provider: "sqlite",
	}),
	emailAndPassword: {    
		enabled: true
	},
	baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
	advanced: {
		cookiePrefix: "travel_companion",
		crossSubDomainCookies: {
			enabled: true
		},
		useSecureCookies: true,
		generateId: () => crypto.randomUUID()
	},
	session: {
		cookieCache: {
			enabled: true,
			maxAge: 60 * 5 // 5 minutes
		}
	},
	trustedOrigins: [
		"http://localhost:3000",
		"https://3000-97416c2b-72fd-450c-88ad-d8335370d950.proxy.daytona.works",
		"https://www.orchids.app"
	]
});

// Session validation helper
export async function getCurrentUser(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  return session?.user || null;
}