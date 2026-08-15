/**
 * TaskNova authentication & session utilities.
 *
 * Prototype note: Admin credentials are checked client-side (student project).
 * Participant auth is currently "Guest" only — swap `guestSession` logic for
 * Firebase participant authentication later (see Login.tsx TODO).
 */

// ---------------------------------------------------------------------------
// Admin credentials (prototype — replace with server-side auth for production)
// ---------------------------------------------------------------------------
export const ADMIN_EMAIL = "admin@tasknova.in";
export const ADMIN_PASSWORD = "12345";

export function checkAdminCredentials(email: string, password: string): boolean {
  return (
    email.trim().toLowerCase() === ADMIN_EMAIL &&
    password === ADMIN_PASSWORD
  );
}

// ---------------------------------------------------------------------------
// Session flags (localStorage-backed so refreshes keep the session alive)
// ---------------------------------------------------------------------------
const ADMIN_SESSION_KEY = "tasknova_admin_session";
const GUEST_SESSION_KEY = "tasknova_guest_session";
const TRIAL_EXPIRED_KEY = "tasknova_trial_expired";
const TRIAL_STARTED_KEY = "tasknova_trial_started_at";

export function getAdminSession(): boolean {
  return localStorage.getItem(ADMIN_SESSION_KEY) === "1";
}

export function setAdminSession(): void {
  localStorage.setItem(ADMIN_SESSION_KEY, "1");
}

export function clearAdminSession(): void {
  localStorage.removeItem(ADMIN_SESSION_KEY);
}

export function getGuestSession(): boolean {
  return localStorage.getItem(GUEST_SESSION_KEY) === "1";
}

export function setGuestSession(): void {
  localStorage.setItem(GUEST_SESSION_KEY, "1");
}

export function clearGuestSession(): void {
  localStorage.removeItem(GUEST_SESSION_KEY);
}

/** Reset trial bookkeeping so guest mode stays reusable between visits. */
export function resetGuestTrial(): void {
  localStorage.removeItem(TRIAL_EXPIRED_KEY);
  localStorage.removeItem(TRIAL_STARTED_KEY);
}

export function clearAllSessions(): void {
  clearAdminSession();
  clearGuestSession();
  resetGuestTrial();
}

// ---------------------------------------------------------------------------
// Tiny hash router: '#/admin', '#/participant', '#/login' (no dependency)
// ---------------------------------------------------------------------------
export type AppRoute = "landing" | "login" | "admin" | "participant";

export function getRoute(): AppRoute {
  const hash = window.location.hash.replace(/^#\/?/, "");
  if (hash === "admin") return "admin";
  if (hash === "participant") return "participant";
  if (hash === "login") return "login";
  return "landing";
}

export function navigateTo(route: AppRoute): void {
  const target = route === "landing" ? "#/" : `#/${route}`;
  if (window.location.hash !== target) {
    window.location.hash = target;
  }
}

export function onRouteChange(cb: (route: AppRoute) => void): () => void {
  const handler = () => cb(getRoute());
  window.addEventListener("hashchange", handler);
  return () => window.removeEventListener("hashchange", handler);
}
