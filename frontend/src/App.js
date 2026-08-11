import { BrowserRouter, Routes, Route, NavLink } from "react-router-dom";
import { useEffect, useState } from "react";
import { Toaster } from "sonner";
import { api } from "@/lib/api";
import {
  ShoppingBasket,
  Tags,
  Upload,
  NotebookPen,
  BarChart3,
  CalendarRange,
  CalendarDays,
  ReceiptText,
  Store,
  LogOut,
} from "lucide-react";
import { AuthProvider, useAuth } from "@/lib/auth";
import Login from "@/pages/Login";
import Billing from "@/pages/Billing";
import Items from "@/pages/Items";
import PriceImport from "@/pages/PriceImport";
import Khata from "@/pages/Khata";
import Report from "@/pages/Report";
import MonthReport from "@/pages/MonthReport";
import WeekReport from "@/pages/WeekReport";
import BillHistory from "@/pages/BillHistory";
import Settings from "@/pages/Settings";

const NAV = [
  { to: "/", label: "బిల్లింగ్", icon: ShoppingBasket, id: "nav-billing" },
  { to: "/items", label: "వస్తువులు", icon: Tags, id: "nav-items" },
  { to: "/import", label: "రేట్లు అప్‌డేట్", icon: Upload, id: "nav-import" },
  { to: "/khata", label: "ఖాతా", icon: NotebookPen, id: "nav-khata" },
  { to: "/history", label: "పాత బిల్లులు", icon: ReceiptText, id: "nav-history" },
  { to: "/report", label: "రోజు నివేదిక", icon: BarChart3, id: "nav-report" },
  { to: "/week", label: "వారం నివేదిక", icon: CalendarDays, id: "nav-week" },
  { to: "/month", label: "నెల నివేదిక", icon: CalendarRange, id: "nav-month" },
  { to: "/settings", label: "దుకాణం వివరాలు", icon: Store, id: "nav-settings" },
];

function Shell({ children }) {
  const { user, logout } = useAuth();
  const [shop, setShop] = useState(null);

  useEffect(() => {
    api.settings().then(setShop).catch(() => {});
  }, []);

  return (
    <div className="min-h-screen">
      <header className="no-print sticky top-0 z-30 bg-white border-b border-slate-200">
        <div className="px-4 py-2.5 flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            {shop?.logo ? (
              <img src={shop.logo} alt="" className="h-9 w-9 rounded-md object-contain bg-white border border-slate-200" />
            ) : (
              <div className="h-9 w-9 rounded-md bg-blue-600 grid place-items-center text-white font-bold">ఉ</div>
            )}
            <div>
              <div className="text-base font-bold leading-tight text-slate-900">{shop?.name || "ఉష కిరాణా"}</div>
              <div className="text-[10px] uppercase tracking-[0.15em] text-slate-500">TELUGU POS · KIRANA</div>
            </div>
          </div>
          <nav className="flex items-center gap-1 overflow-x-auto">
            {NAV.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                data-testid={n.id}
                className={({ isActive }) =>
                  `flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-semibold whitespace-nowrap transition-colors ${
                    isActive ? "bg-blue-600 text-white" : "text-slate-600 hover:bg-slate-100"
                  }`
                }
              >
                <n.icon className="h-4 w-4" />
                {n.label}
              </NavLink>
            ))}
          </nav>
          <button
            data-testid="logout-btn"
            onClick={logout}
            title={user?.email}
            className="ml-auto flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-semibold text-rose-700 hover:bg-rose-50 transition-colors"
          >
            <LogOut className="h-4 w-4" /> లాగ్ అవుట్
          </button>
        </div>
      </header>
      <main className="p-3 sm:p-4">{children}</main>
    </div>
  );
}

function Gate() {
  const { user } = useAuth();
  if (user === null)
    return <div className="min-h-screen grid place-items-center text-slate-400">లోడ్ అవుతోంది…</div>;
  if (user === false) return <Login />;
  return (
    <Shell>
      <Routes>
        <Route path="/" element={<Billing />} />
        <Route path="/items" element={<Items />} />
        <Route path="/import" element={<PriceImport />} />
        <Route path="/khata" element={<Khata />} />
        <Route path="/history" element={<BillHistory />} />
        <Route path="/report" element={<Report />} />
        <Route path="/week" element={<WeekReport />} />
        <Route path="/month" element={<MonthReport />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </Shell>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-center" richColors />
      <AuthProvider>
        <Gate />
      </AuthProvider>
    </BrowserRouter>
  );
}
