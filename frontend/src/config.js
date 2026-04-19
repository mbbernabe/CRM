/**
 * Application configuration constants.
 * Centralizes the API base URL to facilitate deployment and environment switching.
 */
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
