type SessionClearListener = () => void;
type TokenUpdateListener = (token: string | null) => void;

let inMemoryAccessToken: string | null = null;
let onSessionCleared: SessionClearListener | null = null;
let onTokenUpdated: TokenUpdateListener | null = null;

/**
 * Reads the short-lived Access Token from memory (RAM only, never localStorage).
 */
export function getAccessToken(): string | null {
  return inMemoryAccessToken;
}

/**
 * Updates the in-memory Access Token and notifies subscribers.
 */
export function setAccessToken(token: string | null): void {
  inMemoryAccessToken = token;
  onTokenUpdated?.(token);
}

/**
 * Registers callbacks so the Zustand auth store stays synchronized when
 * the Axios interceptor silently refreshes or clears a session.
 */
export function bindAuthTokenListeners(listeners: {
  onTokenChange: TokenUpdateListener;
  onClearSession: SessionClearListener;
}): void {
  onTokenUpdated = listeners.onTokenChange;
  onSessionCleared = listeners.onClearSession;
}

/**
 * Clears the in-memory token and notifies the auth store.
 */
export function clearAuthSession(): void {
  inMemoryAccessToken = null;
  onSessionCleared?.();
}

