/**
 * Safely get bearer token from localStorage
 * Returns null if not in browser environment
 */
export function getBearerToken(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }
  return localStorage.getItem("bearer_token");
}

/**
 * Safely set bearer token in localStorage
 */
export function setBearerToken(token: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem("bearer_token", token);
  }
}

/**
 * Safely remove bearer token from localStorage
 */
export function removeBearerToken(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem("bearer_token");
  }
}
