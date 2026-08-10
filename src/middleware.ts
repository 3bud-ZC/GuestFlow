import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    // If the route starts with /admin, require ADMIN role
    if (req.nextUrl.pathname.startsWith("/admin")) {
      const role = req.nextauth.token?.role;
      if (role !== "ADMIN") {
        return Response.redirect(new URL("/", req.url));
      }
    }
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - login
     * - api/auth (NextAuth endpoints)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!login|api/auth|_next/static|_next/image|favicon.ico).*)",
  ],
};
