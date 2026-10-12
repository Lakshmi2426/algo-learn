/**
 * AlgoLearn API Base Configuration
 * Handles seamless switching between local development and production deployment.
 * Ensures production requests reach the actual Render backend without relying on dev proxies.
 */

const DEFAULT_REMOTE_BACKEND = 'https://algolearn-1yp9.onrender.com'

export function getApiBaseUrl(): string {
  if (import.meta.env.VITE_API_URL) {
    return (import.meta.env.VITE_API_URL as string).replace(/\/+$/, '');
  }

  if (typeof window !== 'undefined') {
    const isLocal =
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1';

    if (!isLocal) {
      return DEFAULT_REMOTE_BACKEND;
    }
  }

  return '';
}

export function apiUrl(endpoint: string): string {
  const base = getApiBaseUrl();
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${base}${cleanEndpoint}`;
}
