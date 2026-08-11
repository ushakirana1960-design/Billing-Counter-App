import { useState } from "react";
import { LogIn, Store } from "lucide-react";
import { useAuth, formatApiError } from "@/lib/auth";

export default function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setErr("");
    try {
      await login(email, password);
    } catch (e2) {
      setErr(formatApiError(e2.response?.data?.detail));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen grid place-items-center bg-slate-900 p-4">
      <form
        onSubmit={submit}
        className="w-full max-w-sm bg-white rounded-lg p-6 space-y-4 border-t-4 border-blue-600"
      >
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-md bg-blue-600 grid place-items-center text-white text-xl font-bold">ఉ</div>
          <div>
            <div className="text-xl font-bold">ఉష కిరాణా</div>
            <div className="text-[10px] uppercase tracking-[0.15em] text-slate-500">TELUGU POS · యజమాని లాగిన్</div>
          </div>
        </div>

        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-slate-500">ఈమెయిల్</label>
          <input
            data-testid="login-email-input"
            type="email"
            autoFocus
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2.5 border-2 border-slate-300 rounded-md num focus:border-blue-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-slate-500">పాస్‌వర్డ్</label>
          <input
            data-testid="login-password-input"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2.5 border-2 border-slate-300 rounded-md focus:border-blue-500 focus:outline-none"
          />
        </div>

        {err && (
          <div data-testid="login-error" className="text-sm font-semibold text-rose-700 bg-rose-50 border border-rose-200 rounded-md p-2">
            {err}
          </div>
        )}

        <button
          data-testid="login-submit-btn"
          disabled={busy}
          className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white py-3 rounded-md font-bold active:scale-95 transition-colors"
        >
          <LogIn className="h-4 w-4" /> లోపలికి వెళ్ళు
        </button>
      </form>
    </div>
  );
}
