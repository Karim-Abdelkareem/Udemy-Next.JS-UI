import { routing } from "./i18n/routing";
import { getToken } from "next-auth/jwt";
import createMiddleware from "next-intl/middleware";
import { NextResponse } from "next/server";

const localeMiddleware = createMiddleware(routing);

export async function middleware(req) {
  let token;
  try {
    const token = await getToken({ req });
    console.log("Token:", token);
  } catch (error) {
    console.error("Error retrieving token:", error);
  }

  const isAuthenticated = !!token;
  const { pathname } = req.nextUrl;
  const localeMatch = pathname.match(/^\/(ar|en)/);
  const locale = localeMatch ? localeMatch[1] : "en";

  console.log("Pathname:", pathname);
  console.log("Is Authenticated:", isAuthenticated);
  console.log("Token:", token);

  // Define protected routes
  const protectedRoutes = /^\/(en|ar)\/instructor\/.*/;

  if (protectedRoutes.test(pathname)) {
    if (!isAuthenticated) {
      console.log("Redirecting to login...");
      return NextResponse.redirect(new URL(`/${locale}/login`, req.url));
    }
    if (
      !Array.isArray(token?.user?.role) ||
      !token.user.role.includes("instructor")
    ) {
      console.log("Redirecting to home...");
      return NextResponse.redirect(new URL(`/${locale}/`, req.url));
    }
  }

  // Prevent authenticated users from accessing login/signup
  const isLoginOrSignup = /^\/(en|ar)\/(login|signup)/.test(pathname);
  if (isAuthenticated && isLoginOrSignup) {
    console.log("Redirecting authenticated user to home...");
    return NextResponse.redirect(new URL(`/${locale}/`, req.url));
  }

  // Apply localization middleware
  return localeMiddleware(req);
}

export const config = {
  matcher: ["/", "/(ar|en)/:path*"],
};
