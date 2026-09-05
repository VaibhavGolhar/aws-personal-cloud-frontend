import { useState, useEffect, useCallback } from "react";
import { apiFetch } from "../api";

const LS_TOKEN = "payg_accessToken";

/**
 * Custom hook that encapsulates all authentication state and logic.
 *
 * Manages JWT token persistence in localStorage, login/register API calls,
 * and automatic user profile fetching when the token changes.
 *
 * @returns {{ token: string, user: object|null, loading: boolean, error: string, login: Function, register: Function, logout: Function }}
 */
export default function useAuth() {
  const [token, setToken] = useState(localStorage.getItem(LS_TOKEN) || "");
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const logout = useCallback(() => {
    localStorage.removeItem(LS_TOKEN);
    setToken("");
    setUser(null);
  }, []);

  // Fetch user profile whenever token changes
  useEffect(() => {
    if (!token) return;
    (async () => {
      try {
        const me = await apiFetch("/auth/me", {}, token);
        setUser(me);
      } catch (err) {
        console.error("Failed to fetch user profile:", err);
        logout();
      }
    })();
  }, [token, logout]);

  async function login(email, password) {
    setLoading(true);
    setError("");
    try {
      const data = await apiFetch("/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      localStorage.setItem(LS_TOKEN, data.accessToken);
      setToken(data.accessToken);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function register(email, password) {
    setLoading(true);
    setError("");
    try {
      const data = await apiFetch("/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      localStorage.setItem(LS_TOKEN, data.accessToken);
      setToken(data.accessToken);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return { token, user, loading, error, login, register, logout };
}
