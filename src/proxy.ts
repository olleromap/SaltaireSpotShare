export { auth as proxy } from "@/lib/auth";

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/my-spot/:path*",
    "/reserve/:path*",
    "/reservations/:path*",
    "/notifications/:path*",
    "/manager/:path*",
    "/api/availability/:path*",
    "/api/reservations/:path*",
    "/api/spots/:path*",
    "/api/users/:path*",
    "/api/import/:path*",
    "/api/activity/:path*",
    "/api/disputes/:path*",
    "/api/reports/:path*",
    "/api/notifications/:path*",
  ],
};
