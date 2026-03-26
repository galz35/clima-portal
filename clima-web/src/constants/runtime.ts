/**
 * Centralizador de Rutas y Configuración de Entorno (Clima)
 */

export const APP_BASE = import.meta.env.VITE_BASE_PATH || "/";

// URL base de la API de Clima
export const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3004/api";

// URL del portal central (para redirecciones de salida)
export const PORTAL_URL = import.meta.env.VITE_PORTAL_URL || "http://localhost:5173";

export const AUTH_STORAGE_KEYS = {
    token: 'clima_clarity_token',
    refreshToken: 'clima_clarity_refresh_token',
    user: 'clima_clarity_user',
} as const;

export function appPath(path: string): string {
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${APP_BASE}${cleanPath}`.replace(/\/+/g, '/');
}
