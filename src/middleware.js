import { routing } from "./i18n/routing";
import { getToken } from "next-auth/jwt";
import createMiddleware from "next-intl/middleware";
import { NextResponse } from "next/server";

const localeMiddleware = createMiddleware(routing);

export async function middleware(req) {
  let token;
  try {
    // Use same secret as authOptions so JWT is verified correctly (e.g. on Vercel)
    token = await getToken({ req, secret: process.env.AUTH_SECRET });
  } catch (error) {
    console.error("Error retrieving token:", error);
  }

  const isAuthenticated = !!token;
  const { pathname } = req.nextUrl;
  const localeMatch = pathname.match(/^\/(ar|en)/);
  const locale = localeMatch ? localeMatch[1] : "en";

  // Define protected routes
  const protectedRoutes = /^\/(en|ar)\/instructor\/.*/;

  if (protectedRoutes.test(pathname)) {
    if (!isAuthenticated) {
      return NextResponse.redirect(new URL(`/${locale}/login`, req.url));
    }
    // Support role as array (e.g. ["instructor"]) or single string (e.g. "instructor")
    const roles = Array.isArray(token?.user?.role)
      ? token.user.role
      : token?.user?.role
        ? [token.user.role]
        : [];
    if (!roles.includes("instructor")) {
      return NextResponse.redirect(new URL(`/${locale}/`, req.url));
    }
  }

  // Prevent authenticated users from accessing login/signup
  const isLoginOrSignup = /^\/(en|ar)\/(login|signup)/.test(pathname);
  if (isAuthenticated && isLoginOrSignup) {
    return NextResponse.redirect(new URL(`/${locale}/`, req.url));
  }

  // Apply localization middleware
  return localeMiddleware(req);
}

export const config = {
  matcher: ["/", "/(ar|en)/:path*"],
};
