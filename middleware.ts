import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
    function middleware(req) {
        const token = req.nextauth.token;
        const isAdmin = token?.role === "ADMIN" || token?.role === "SUPER_ADMIN";
        const path = req.nextUrl.pathname;

        // Protect Admin routes — only for admins
        if (path.startsWith("/admin") && !isAdmin) {
            return NextResponse.redirect(new URL("/unauthorized", req.url));
        }

        return NextResponse.next();
    },
    {
        callbacks: {
            // Only enforce auth on API routes — pages are accessible without login
            authorized: ({ token, req }) => {
                const path = req.nextUrl.pathname;
                // API routes require authentication
                if (path.startsWith("/api/") &&
                    !path.startsWith("/api/auth") &&
                    !path.startsWith("/api/webhooks")) {
                    return !!token;
                }
                // All page routes are publicly accessible
                return true;
            },
        },
    }
);

export const config = {
    matcher: [
        // Only intercept API routes (not page routes)
        "/api/((?!auth|webhooks).*)",
        // Admin pages still protected
        "/admin/:path*",
    ],
};
