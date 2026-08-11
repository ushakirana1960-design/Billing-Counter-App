import { useEffect, useState } from "react";
import { toast } from "sonner";
import { UserPlus, IndianRupee } from "lucide-react";
import { api, rupee, MODE_TE } from "@/lib/api";
import TeluguInput from "@/components/TeluguInput";

export default function Khata() {
  const [customers, setCustomers] = useState([]);
  const [sel, setSel] = useState(null);
  const [ledger, setLedger] = useState(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [amt, setAmt] = useState("");
  const [mode, setMode] = useState("cash");

  const load = async () => setCustomers(await api.customers());
  useEffect(() => {
    load();
  }, []);

  const open = async (c) => {
    setSel(c);
    setLedger(await api.ledger(c.id));
  };

  const addCustomer = async () => {
    if (!name) return toast.error("పేరు రాయండి");
    await api.createCustomer({ name_te: name, phone });
    setName("");
    setPhone("");
    toast.success("కస్టమర్ జోడించబడ్డారు");
    load();
  };

  const settle = async () => {
    const a = Number(amt);
    if (!a || a <= 0) return toast.error("మొత్తం రాయండి");
    await api.pay(sel.id, { amount: a, mode });
    setAmt("");
    toast.success("చెల్లింపు నమోదైంది");
    await load();
    const l = await api.ledger(sel.id);
    setLedger(l);
    setSel(l.customer);
  };

  const totalDue = customers.reduce((s, c) => s + (c.balance || 0), 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <div className="space-y-4">
        <div className="border border-amber-200 bg-amber-50 p-4 rounded-lg">
          <div className="text-xs font-bold uppercase tracking-wider text-amber-700">మొత్తం బాకీ</div>
          <div className="num text-3xl font-bold text-amber-900" data-testid="total-due">
            {rupee(totalDue)}
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg divide-y max-h-[45vh] overflow-y-auto">
          {customers.map((c) => (
            <button
              key={c.id}
              data-testid={`customer-${c.id}`}
              onClick={() => open(c)}
              className={`w-full flex justify-between items-center p-3 text-left hover:bg-slate-50 transition-colors ${
                sel?.id === c.id ? "bg-blue-50" : ""
              }`}
            >
              <div>
                <div className="font-semibold">{c.name_te}</div>
                <div className="num text-xs text-slate-400">{c.phone}</div>
              </div>
              <div className={`num font-bold ${c.balance > 0 ? "text-amber-700" : "text-emerald-600"}`}>
                {rupee(c.balance)}
              </div>
            </button>
          ))}
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-2">
          <h3 className="font-bold">కొత్త కస్టమర్</h3>
          <TeluguInput testId="customer-name-input" value={name} onChange={setName} placeholder="ramesh garu…" />
          <input
            data-testid="customer-phone-input"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="ఫోన్ నంబర్"
            className="w-full px-3 py-2 border-2 border-slate-300 rounded-md num focus:border-blue-500 focus:outline-none"
          />
          <button
            data-testid="add-customer-btn"
            onClick={addCustomer}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-md font-semibold active:scale-95 transition-colors"
          >
            <UserPlus className="h-4 w-4" /> జోడించు
          </button>
        </div>
      </div>

      <div className="lg:col-span-2 bg-white border border-slate-200 rounded-lg p-4">
        {!sel ? (
          <div className="text-slate-400 text-center p-10">కస్టమర్‌ను ఎంచుకోండి</div>
        ) : (
          <div className="space-y-4">
            <div className="flex justify-between items-start flex-wrap gap-3">
              <div>
                <h2 className="text-2xl font-bold" data-testid="ledger-customer-name">{sel.name_te}</h2>
                <div className="num text-sm text-slate-500">{sel.phone}</div>
              </div>
              <div className="text-right">
                <div className="text-xs uppercase tracking-wider text-slate-500">ప్రస్తుత బాకీ</div>
                <div className="num text-3xl font-bold text-amber-700" data-testid="ledger-balance">
                  {rupee(ledger?.customer?.balance ?? sel.balance)}
                </div>
              </div>
            </div>

            <div className="flex gap-2 items-end border border-slate-200 rounded-md p-3">
              <div className="flex-1">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">చెల్లింపు మొత్తం</label>
                <input
                  data-testid="settle-amount-input"
                  value={amt}
                  onChange={(e) => setAmt(e.target.value)}
                  className="w-full px-3 py-2 border-2 border-slate-300 rounded-md num focus:border-blue-500 focus:outline-none"
                />
              </div>
              <select
                data-testid="settle-mode-select"
                value={mode}
                onChange={(e) => setMode(e.target.value)}
                className="px-3 py-2 border-2 border-slate-300 rounded-md"
              >
                {["cash", "upi", "card"].map((m) => (
                  <option key={m} value={m}>
                    {MODE_TE[m]}
                  </option>
                ))}
              </select>
              <button
                data-testid="settle-btn"
                onClick={settle}
                className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-md font-semibold active:scale-95 transition-colors"
              >
                <IndianRupee className="h-4 w-4" /> జమ చెయ్యి
              </button>
            </div>

            <table className="w-full border-collapse text-sm" data-testid="ledger-table">
              <thead className="bg-slate-100 text-[11px] uppercase text-slate-500">
                <tr>
                  <th className="p-2 text-left">తేదీ</th>
                  <th className="p-2 text-left">వివరం</th>
                  <th className="p-2 text-right">బాకీ</th>
                  <th className="p-2 text-right">జమ</th>
                </tr>
              </thead>
              <tbody>
                {(ledger?.txns || []).map((t) => (
                  <tr key={t.id} className="border-b border-slate-100">
                    <td className="p-2 num text-xs">{new Date(t.created_at).toLocaleString("en-IN")}</td>
                    <td className="p-2">{t.type === "bill" ? `బిల్లు #${t.bill_no}` : `చెల్లింపు (${MODE_TE[t.mode] || ""})`}</td>
                    <td className="p-2 text-right num text-amber-700">{t.type === "bill" ? rupee(t.amount) : ""}</td>
                    <td className="p-2 text-right num text-emerald-700">{t.type === "payment" ? rupee(t.amount) : ""}</td>
                  </tr>
                ))}
                {(ledger?.txns || []).length === 0 && (
                  <tr>
                    <td colSpan={4} className="p-6 text-center text-slate-400">
                      లావాదేవీలు లేవు
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
