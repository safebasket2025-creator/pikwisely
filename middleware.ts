import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

// Protect these routes using Clerk.
// Once you are fully migrated, you can uncomment this to enforce Clerk Auth.
const isProtectedRoute = createRouteMatcher(['/dashboard(.*)', '/history(.*)', '/admin(.*)']);

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
