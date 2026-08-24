/**
 * lib/pendingAnalysis.ts
 *
 * Tiny sessionStorage helpers for the auth-gate "Analyze Now" flow.
 *
 * Flow:
 *  1. User pastes input and clicks Analyze Now while logged out.
 *  2. HomePage saves the input here, then redirects to /signup or /login.
 *  3. After successful auth, the user is redirected back to /.
 *  4. HomePage reads the saved input on mount, restores it into the input
 *     box, clears storage, and auto-triggers the analysis.
 */

const KEY = 'pikwisely_pending_input';

/** Persist the user's pasted input before redirecting to auth. */
export function savePendingInput(value: string): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(KEY, value);
  } catch {
    // Silently ignore (private-browsing quota errors, etc.)
  }
}

/** Read the saved input. Returns null if nothing is stored. */
export function getPendingInput(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return sessionStorage.getItem(KEY);
  } catch {
    return null;
  }
}

/** Remove the saved input once the analysis has been triggered. */
export function clearPendingInput(): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    // Ignore
  }
}
