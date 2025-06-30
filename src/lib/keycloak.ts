
// Cookie-based authentication service (replaces Keycloak frontend adapter)

// Initialize function - no longer needed with cookie-based auth
export const initKeycloak = (): Promise<boolean> => {
  return new Promise((resolve) => {
    // Check if user is authenticated via cookies
    checkAuthStatus().then((authenticated) => {
      resolve(authenticated);
    });
  });
};

// Login function - redirects to backend login
export const login = () => {
  window.location.href = '/login';
};

// Logout function - calls backend logout endpoint
export const logout = async () => {
  try {
    await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include',
    });
    window.location.href = '/';
  } catch (error) {
    console.error('Logout failed:', error);
    // Force redirect even if logout call fails
    window.location.href = '/';
  }
};

// Register function - redirects to register page
export const register = () => {
  window.location.href = '/register';
};

// Get token - not needed with cookie-based auth
export const getToken = (): string | undefined => {
  // Tokens are now stored in httpOnly cookies, not accessible from frontend
  return undefined;
};

// Get user info from backend
export const getUserInfo = async () => {
  try {
    const response = await fetch('/api/auth/profile', {
      method: 'GET',
      credentials: 'include',
    });
    
    if (response.ok) {
      return await response.json();
    }
    return null;
  } catch (error) {
    console.error('Failed to get user info:', error);
    return null;
  }
};

// Check if user is authenticated
export const isAuthenticated = async (): Promise<boolean> => {
  return await checkAuthStatus();
};

// Check authentication status
const checkAuthStatus = async (): Promise<boolean> => {
  try {
    const response = await fetch('/api/auth/profile', {
      method: 'GET',
      credentials: 'include',
    });
    return response.ok;
  } catch (error) {
    return false;
  }
};

// Check if user has role
export const hasRole = async (role: string): Promise<boolean> => {
  try {
    const userInfo = await getUserInfo();
    return userInfo?.role === role || userInfo?.user_type === role || false;
  } catch (error) {
    return false;
  }
};

// Update token - handled automatically by backend
export const updateToken = async (minValidity = 30): Promise<boolean> => {
  try {
    const response = await fetch('/api/auth/refresh', {
      method: 'POST',
      credentials: 'include',
    });
    return response.ok;
  } catch (error) {
    return false;
  }
};

// Legacy export for compatibility
export default {
  init: initKeycloak,
  login,
  logout,
  register,
  authenticated: false, // Will be determined by checkAuthStatus
};
