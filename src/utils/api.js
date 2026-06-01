const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

/**
 * Centralized API fetch utility with automatic JWT token refresh.
 * 
 * Flow:
 * 1. Attach stored auth_token to every request
 * 2. If 401/403 response → attempt token refresh via /api/token/refresh
 * 3. If refresh succeeds → retry original request with new token
 * 4. If refresh fails → clear ALL session data and redirect to /login
 */

/**
 * Clear all session data on logout/token expiry
 */
function clearSessionData() {
  const keysToRemove = [
    'auth_token', 'refresh_token', 'user_id', 'user_role', 
    'user_name', 'user_email', 'room_id', 'current_room'
  ];
  keysToRemove.forEach(key => localStorage.removeItem(key));
}

export async function apiFetch(endpoint, options = {}) {
  const token = localStorage.getItem('auth_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  let response = await fetch(`${API_URL}${endpoint}`, { ...options, headers });

  // Auto-refresh jika token expired
  if (response.status === 401 || response.status === 403) {
    const refreshToken = localStorage.getItem('refresh_token');
    if (refreshToken) {
      const refreshRes = await fetch(`${API_URL}/api/token/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });
      if (refreshRes.ok) {
        const { token: newToken } = await refreshRes.json();
        localStorage.setItem('auth_token', newToken);
        // Retry request dengan token baru
        headers.Authorization = `Bearer ${newToken}`;
        response = await fetch(`${API_URL}${endpoint}`, { ...options, headers });
      } else {
        // Refresh gagal — logout & clear ALL session data
        localStorage.setItem('logout_reason', 'Sesi Anda berakhir. Silakan login kembali.');
        clearSessionData();
        window.location.href = '/login';
        return;
      }
    } else {
      localStorage.setItem('logout_reason', 'Sesi Anda berakhir. Silakan login kembali.');
      clearSessionData();
      window.location.href = '/login';
      return;
    }
  }

  return response;
}
