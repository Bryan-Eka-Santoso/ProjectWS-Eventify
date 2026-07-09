import { jwtDecode } from "jwt-decode";

export const getToken = () => {
  return localStorage.getItem("token");
};

export const getAuthHeaders = () => {
  const token = getToken();

  return token
    ? {
        Authorization: `Bearer ${token}`,
      }
    : {};
};
export const getCurrentUser = () => {
  const token = getToken();

  if (!token) return null;

  try {
    return jwtDecode(token);
  } catch (error) {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    return null;
  }
};

export const getCurrentRole = () => {
  return getCurrentUser()?.role || null;
};

export const isLoggedIn = () => {
  return Boolean(getCurrentUser());
};

export const logoutLocal = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
};
