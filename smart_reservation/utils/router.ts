/**
 * URL-based Router for Smart Reservation
 * Replaces ViewState enum with URL-based routing
 */

export interface RouteMatch {
  path: string;
  params: Record<string, string>;
}

/**
 * Parse current URL and extract route information
 */
export function getCurrentRoute(): RouteMatch {
  const pathname = window.location.pathname;
  const params: Record<string, string> = {};

  // Parse URL search params
  const searchParams = new URLSearchParams(window.location.search);
  searchParams.forEach((value, key) => {
    params[key] = value;
  });

  return {
    path: pathname,
    params
  };
}

/**
 * Navigate to a new route
 */
export function navigateTo(path: string, params?: Record<string, string>) {
  const url = new URL(path, window.location.origin);

  // Add query params if provided
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });
  }

  window.history.pushState({}, '', url.toString());
  window.dispatchEvent(new Event('navigate'));
}

/**
 * Replace current route (no history entry)
 */
export function replaceTo(path: string, params?: Record<string, string>) {
  const url = new URL(path, window.location.origin);

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });
  }

  window.history.replaceState({}, '', url.toString());
  window.dispatchEvent(new Event('navigate'));
}

/**
 * Go back in history
 */
export function goBack() {
  window.history.back();
}

/**
 * Check if current path matches a route pattern
 */
export function matchPath(pattern: string, path: string): { matched: boolean; params: Record<string, string> } {
  const params: Record<string, string> = {};

  // Convert pattern to regex (e.g., /user/:id -> /user/([^/]+))
  const regexPattern = pattern
    .replace(/:[^/]+/g, '([^/]+)')
    .replace(/\//g, '\\/');

  const regex = new RegExp(`^${regexPattern}$`);
  const match = path.match(regex);

  if (!match) {
    return { matched: false, params: {} };
  }

  // Extract param names from pattern
  const paramNames = (pattern.match(/:[^/]+/g) || []).map(p => p.slice(1));

  // Map captured groups to param names
  paramNames.forEach((name, index) => {
    params[name] = match[index + 1];
  });

  return { matched: true, params };
}

/**
 * Route definitions
 */
export const ROUTES = {
  // Public routes
  LANDING: '/',
  LOGIN: '/login',
  PRIVACY: '/privacy-policy',
  TERMS: '/terms-of-service',

  // Auth routes
  ONBOARDING: '/onboarding',
  SETUP: '/setup',

  // App routes
  DASHBOARD: '/dashboard',
  SUMMARY: '/summary',
  RESERVATIONS: '/reservations',
  STUDENTS: '/students',
  ATTENDANCE: '/attendance',
  PACKAGES: '/packages',
  PROFILE: '/profile',

  // Student-specific routes
  STUDENT_HOME: '/home',
  STUDENT_CALENDAR: '/calendar',
  STUDENT_RESERVATIONS: '/my-reservations',
  STUDENT_PROFILE: '/my-profile',

  // Dynamic routes
  BOOKING: '/:coachId/:classSlug',
  BOOKING_LEGACY: '/:classSlug',
} as const;

/**
 * Check if user is authenticated (has session)
 */
export function requireAuth(user: any | null): boolean {
  return !!user;
}

/**
 * Check if user is instructor
 */
export function requireInstructor(user: any | null): boolean {
  return user?.userType === 'instructor';
}

/**
 * Get redirect URL after login based on user type
 */
export function getPostLoginRoute(user: any): string {
  if (!user) return ROUTES.LOGIN;

  // If user hasn't selected type, go to onboarding
  if (!user.userType) {
    return ROUTES.ONBOARDING;
  }

  // If instructor without profile, go to setup
  if (user.userType === 'instructor' && !user.isProfileComplete) {
    return ROUTES.SETUP;
  }

  // Otherwise go to dashboard
  if (user.userType === 'instructor') {
    return ROUTES.SUMMARY;
  }

  return ROUTES.STUDENT_HOME;
}
