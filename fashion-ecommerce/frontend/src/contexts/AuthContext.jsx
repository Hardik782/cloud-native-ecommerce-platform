import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { loginUser, registerUser, logoutUser, getCurrentUser } from "../api/auth";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadUser = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const res = await getCurrentUser();
      // Ensure user has a name field for display
      const userData = res.data;
      if (userData && !userData.name) {
        userData.name = `${userData.first_name || ''} ${userData.last_name || ''}`.trim() || userData.email;
      }
      setUser(userData);
    } catch (err) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const login = async (credentials) => {
    setError(null);
    try {
      const res = await loginUser(credentials);
      const { token, user: userData } = res.data;
      if (token) localStorage.setItem("token", token);
      if (userData) {
        // Ensure user has a name field
        if (!userData.name) {
          userData.name = `${userData.first_name || ''} ${userData.last_name || ''}`.trim() || userData.email;
        }
        localStorage.setItem("user", JSON.stringify(userData));
        setUser(userData);
      } else {
        await loadUser();
      }
      return { success: true };
    } catch (err) {
      const message =
        err.response?.data?.message || "Login failed. Please try again.";
      setError(message);
      return { success: false, message };
    }
  };

  const register = async (data) => {
    setError(null);
    try {
      const res = await registerUser(data);
      const { token, user: userData } = res.data;
      if (token) localStorage.setItem("token", token);
      if (userData) {
        if (!userData.name) {
          userData.name = `${userData.first_name || ''} ${userData.last_name || ''}`.trim() || userData.email;
        }
        localStorage.setItem("user", JSON.stringify(userData));
        setUser(userData);
      }
      return { success: true };
    } catch (err) {
      const message =
        err.response?.data?.message || "Registration failed. Please try again.";
      setError(message);
      return { success: false, message };
    }
  };

  const logout = async () => {
    try {
      await logoutUser();
    } catch (err) {
      // ignore network errors on logout
    } finally {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      setUser(null);
    }
  };

  const refreshUser = (updatedUser) => {
    if (updatedUser && !updatedUser.name) {
      updatedUser.name = `${updatedUser.first_name || ''} ${updatedUser.last_name || ''}`.trim() || updatedUser.email;
    }
    setUser(updatedUser);
    localStorage.setItem("user", JSON.stringify(updatedUser));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};