import { withAuth } from "next-auth/middleware"

export default withAuth(
  function middleware(req) {
    // Add any custom middleware logic here
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
)

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/customers/:path*",
    "/deals/:path*",
    "/tasks/:path*",
    "/analytics/:path*",
    "/settings/:path*",
  ],
}