import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
    function middleware(req) {
        // Access control logic
        const token = req.nextauth.token;
        const isAdmin = token?.role === "ADMIN" || token?.role === "SUPER_ADMIN";
        const isSuperAdmin = token?.role === "SUPER_ADMIN";
        const path = req.nextUrl.pathname;

        // Protect Admin routes
        if (path.startsWith("/admin") && !isAdmin) {
            return NextResponse.redirect(new URL("/unauthorized", req.url));
        }

        // Protect Super Admin routes (example: advanced settings)
        if (path.startsWith("/settings/security") && !isSuperAdmin) {
            return NextResponse.redirect(new URL("/unauthorized", req.url));
        }

        return NextResponse.next();
    },
    {
        callbacks: {
            authorized: ({ token }) => !!token,
        },
    }
);

export const config = {
    matcher: [
        "/dashboard/:path*",
        "/onboarding/:path*",
        "/offboarding/:path*",
        "/assets/:path*",
        "/admin/:path*",
        "/settings/:path*",
        "/chat/:path*",
    ],
};
