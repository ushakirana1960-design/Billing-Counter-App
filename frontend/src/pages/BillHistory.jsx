import { useEffect, useState } from "react";
import { Printer, Search } from "lucide-react";
import { api, rupee, MODE_TE } from "@/lib/api";
import Receipt from "@/components/Receipt";

const today = () => new Date().toISOString().slice(0, 10);
const weekAgo = () => new Date(Date.now() - 6 * 864e5).toISOString().slice(0, 10);

export default function BillHistory() {
  const [from, setFrom] = useState(weekAgo());
  const [to, setTo] = useState(today());
  const [q, setQ] = useState("");
  const [bills, setBills] = useState([]);
  const [sel, setSel] = useState(null);

  const load = async () => setBills(await api.bills({ from_day: from, to_day: to, q: q || undefined }));
  useEffect(() => {
    load();
    // eslint-disable-next-line
  }, [from, to]);

  const reprint = (b) => {
    setSel(b);
    setTimeout(() => window.print(), 200);
  };

  const total = bills.reduce((s, b) => s + b.total, 0);

  return (
    <>
      <div className="no-print space-y-4">
        <div className="bg-white border border-slate-200 rounded-lg p-3 flex flex-wrap items-end gap-2">
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">నుండి</label>
            <input
              data-testid="history-from-input"
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="block px-3 py-2 border-2 border-slate-300 rounded-md num"
            />
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">వరకు</label>
            <input
              data-testid="history-to-input"
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="block px-3 py-2 border-2 border-slate-300 rounded-md num"
            />
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
              బిల్లు నంబర్ / కస్టమర్ / వస్తువు
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <input
                data-testid="history-search-input"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && load()}
                placeholder="12 · రమేష్ · b2"
                className="w-full pl-9 pr-3 py-2 border-2 border-slate-300 rounded-md focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>
          <button
            data-testid="history-search-btn"
            onClick={load}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-semibold active:scale-95 transition-colors"
          >
            వెతకండి
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 bg-white border border-slate-200 rounded-lg overflow-hidden">
            <div className="p-3 border-b flex justify-between text-sm">
              <span className="font-bold">{bills.length} బిల్లులు</span>
              <span className="num font-bold">{rupee(total)}</span>
            </div>
            <div className="max-h-[65vh] overflow-y-auto">
              <table className="w-full border-collapse text-sm" data-testid="history-table">
                <thead className="bg-slate-100 text-[11px] uppercase text-slate-500 sticky top-0">
                  <tr>
                    <th className="p-2 text-left">#</th>
                    <th className="p-2 text-left">తేదీ</th>
                    <th className="p-2 text-left">చెల్లింపు</th>
                    <th className="p-2 text-right">మొత్తం</th>
                    <th className="w-24"></th>
                  </tr>
                </thead>
                <tbody>
                  {bills.map((b) => (
                    <tr
                      key={b.id}
                      data-testid={`history-row-${b.bill_no}`}
                      onClick={() => setSel(b)}
                      className={`border-b border-slate-100 cursor-pointer hover:bg-slate-50 ${
                        sel?.id === b.id ? "bg-blue-50" : ""
                      }`}
                    >
                      <td className="p-2 num font-bold">{b.bill_no}</td>
                      <td className="p-2 num text-xs">{new Date(b.created_at).toLocaleString("en-IN")}</td>
                      <td className="p-2">
                        <span
                          className={`text-xs font-bold px-1.5 py-0.5 rounded ${
                            b.payment_mode === "khata" ? "bg-amber-100 text-amber-800" : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {MODE_TE[b.payment_mode]}
                        </span>{" "}
                        {b.customer_name}
                      </td>
                      <td className="p-2 text-right num font-bold">{rupee(b.total)}</td>
                      <td className="p-2 text-right">
                        <button
                          data-testid={`reprint-${b.bill_no}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            reprint(b);
                          }}
                          className="flex items-center gap-1 text-blue-600 font-semibold text-xs"
                        >
                          <Printer className="h-4 w-4" /> ప్రింట్
                        </button>
                      </td>
                    </tr>
                  ))}
                  {!bills.length && (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-slate-400">
                        బిల్లులు కనబడలేదు
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-lg p-4">
            {!sel ? (
              <div className="text-slate-400 text-center p-8">బిల్లు ఎంచుకోండి</div>
            ) : (
              <div data-testid="bill-detail">
                <div className="flex justify-between items-baseline mb-2">
                  <h2 className="text-xl font-bold">బిల్లు #{sel.bill_no}</h2>
                  <span className="num text-2xl font-bold text-emerald-700">{rupee(sel.total)}</span>
                </div>
                <div className="num text-xs text-slate-500 mb-3">{new Date(sel.created_at).toLocaleString("en-IN")}</div>
                <table className="w-full text-sm border-collapse">
                  <tbody>
                    {sel.lines.map((l) => (
                      <tr key={l.code} className="border-b border-slate-100">
                        <td className="py-1 font-semibold">{l.name_te}</td>
                        <td className="py-1 text-right num text-xs">
                          {l.qty} × {l.price}
                        </td>
                        <td className="py-1 text-right num font-bold">{rupee(l.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <button
                  data-testid="detail-reprint-btn"
                  onClick={() => reprint(sel)}
                  className="mt-3 w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-md font-semibold active:scale-95 transition-colors"
                >
                  <Printer className="h-4 w-4" /> మళ్ళీ ప్రింట్
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      <div id="print-area">{sel && <Receipt bill={sel} />}</div>
    </>
  );
}
