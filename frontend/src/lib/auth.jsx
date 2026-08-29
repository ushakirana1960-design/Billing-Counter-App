import { createContext, useContext, useEffect, useState, useMemo } from "react";
import axios from "axios";
import { API } from "@/lib/api";

axios.defaults.withCredentials = true;
// rely on httpOnly cookie set by backend; do not store auth tokens in localStorage

const AuthCtx = createContext(null);
export const useAuth = () => useContext(AuthCtx);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null); // null = checking, false = logged out

  useEffect(() => {
    let mounted = true;
    const scale = localStorage.getItem("uk_ui_scale");
    if (scale) document.documentElement.style.fontSize = `${Number(scale) * 0.16}px`;
    axios
      .get(`${API}/auth/me`)
      .then((r) => {
        if (mounted) setUser(r.data);
      })
      .catch(() => {
        if (mounted) setUser(false);
      });
    return () => {
      mounted = false;
    };
  }, [API, axios, localStorage, document, setUser]);

  const login = async (email, password) => {
    // backend sets httpOnly cookie; after successful login, fetch current user
    await axios.post(`${API}/auth/login`, { email, password });
    const { data } = await axios.get(`${API}/auth/me`);
    setUser(data);
  };

  const logout = async () => {
    await axios.post(`${API}/auth/logout`).catch(() => {});
    setUser(false);
  };

  const authValue = useMemo(() => ({ user, login, logout }), [user]);
  return <AuthCtx.Provider value={authValue}>{children}</AuthCtx.Provider>;
}

export function formatApiError(detail) {
  if (!detail) return "ఏదో తప్పు జరిగింది, మళ్ళీ ప్రయత్నించండి";
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) return detail.map((e) => e?.msg || JSON.stringify(e)).join(" ");
  return String(detail.msg || detail);
}
