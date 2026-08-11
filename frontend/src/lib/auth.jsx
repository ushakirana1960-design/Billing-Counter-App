import { createContext, useContext, useEffect, useState } from "react";
import axios from "axios";
import { API } from "@/lib/api";

axios.defaults.withCredentials = true;
const saved = localStorage.getItem("uk_token");
if (saved) axios.defaults.headers.common.Authorization = `Bearer ${saved}`;

const AuthCtx = createContext(null);
export const useAuth = () => useContext(AuthCtx);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null); // null = checking, false = logged out

  useEffect(() => {
    const scale = localStorage.getItem("uk_ui_scale");
    if (scale) document.documentElement.style.fontSize = `${Number(scale) * 0.16}px`;
    axios
      .get(`${API}/auth/me`)
      .then((r) => setUser(r.data))
      .catch(() => setUser(false));
  }, []);

  const login = async (email, password) => {
    const { data } = await axios.post(`${API}/auth/login`, { email, password });
    localStorage.setItem("uk_token", data.access_token);
    axios.defaults.headers.common.Authorization = `Bearer ${data.access_token}`;
    setUser(data.user);
  };

  const logout = async () => {
    await axios.post(`${API}/auth/logout`).catch(() => {});
    localStorage.removeItem("uk_token");
    delete axios.defaults.headers.common.Authorization;
    setUser(false);
  };

  return <AuthCtx.Provider value={{ user, login, logout }}>{children}</AuthCtx.Provider>;
}

export function formatApiError(detail) {
  if (!detail) return "ఏదో తప్పు జరిగింది, మళ్ళీ ప్రయత్నించండి";
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) return detail.map((e) => e?.msg || JSON.stringify(e)).join(" ");
  return String(detail.msg || detail);
}
