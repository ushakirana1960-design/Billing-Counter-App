import { useEffect, useState } from "react";
import { Printer } from "lucide-react";
import { api, rupee, MODE_TE } from "@/lib/api";

const thisMonth = () => new Date().toISOString().slice(0, 7);

export default function MonthReport() {
  const [month, setMonth] = useState(thisMonth());
  const [r, setR] = useState(null);
  const [q, setQ] = useState("");

  useEffect(() => {
    api.monthly(month).then(setR);
  }, [month]);

  if (!r) return <div className="p-8 text-slate-400">లోడ్ అవుతోంది…</div>;

  const rows = r.items.filter((i) => !q || i.code.includes(q.toLowerCase()) || i.name_te.includes(q));

  return (
    <div id="print-report" className="space-y-4 max-w-full overflow-x-hidden">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl sm:text-3xl font-bold">నెల నివేదిక — వస్తువుల రోజువారీ అమ్మకాలు</h1>
        <div className="flex items-center gap-2 no-print">
          <input
            data-testid="month-input"
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="px-3 py-2 border-2 border-slate-300 rounded-md num"
          />
          <input
            data-testid="month-item-search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="వస్తువు వెతకండి…"
            className="px-3 py-2 border-2 border-slate-300 rounded-md"
          />
          <button
            data-testid="print-month-btn"
            onClick={() => window.print()}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-semibold active:scale-95 transition-colors"
          >
            <Printer className="h-4 w-4" /> ప్రింట్
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
        {[
          ["బిల్లులు", r.bill_count],
          ["మొత్తం అమ్మకం", rupee(r.gross)],
          ...Object.entries(r.modes).map(([k, v]) => [MODE_TE[k], rupee(v)]),
        ].map(([l, v]) => (
          <div key={l} className="bg-white border border-slate-200 rounded-lg p-3">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-500">{l}</div>
            <div className="num text-lg font-bold">{v}</div>
          </div>
        ))}
      </div>

      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden min-w-0">
        <div className="p-3 border-b font-bold">
          వస్తువు × రోజు (సంఖ్య) — {rows.length} వస్తువులు
        </div>
        <div className="overflow-auto max-h-[70vh]">
          <table className="border-collapse text-xs" data-testid="month-matrix">
            <thead className="bg-slate-100 sticky top-0">
              <tr>
                <th className="p-2 text-left sticky left-0 bg-slate-100 min-w-[150px]">వస్తువు</th>
                {r.days.map((d) => (
                  <th key={d} className="p-1 num text-slate-500 w-8">
                    {Number(d)}
                  </th>
                ))}
                <th className="p-2 num text-right bg-slate-200">మొత్తం సం.</th>
                <th className="p-2 num text-right bg-slate-200">విలువ</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((it) => (
                <tr key={it.code} data-testid={`month-row-${it.code}`} className="border-b border-slate-100">
                  <td className="p-2 font-semibold sticky left-0 bg-white whitespace-nowrap">
                    <span className="num text-[10px] text-blue-600 mr-1">{it.code}</span>
                    {it.name_te}
                  </td>
                  {r.days.map((d) => (
                    <td
                      key={d}
                      className={`p-1 text-center num ${it.per_day[d] ? "font-bold text-slate-900" : "text-slate-200"}`}
                    >
                      {it.per_day[d] ?? "·"}
                    </td>
                  ))}
                  <td className="p-2 text-right num font-bold bg-slate-50">
                    {it.qty} {it.unit}
                  </td>
                  <td className="p-2 text-right num font-bold bg-slate-50">{rupee(it.amount)}</td>
                </tr>
              ))}
              {!rows.length && (
                <tr>
                  <td colSpan={r.days.length + 3} className="p-8 text-center text-slate-400">
                    ఈ నెల అమ్మకాలు లేవు
                  </td>
                </tr>
              )}
              <tr className="bg-slate-100 font-bold">
                <td className="p-2 sticky left-0 bg-slate-100">రోజు మొత్తం (₹)</td>
                {r.days.map((d) => (
                  <td key={d} className="p-1 text-center num text-[10px]">
                    {r.day_totals[d] ? Math.round(r.day_totals[d]) : "·"}
                  </td>
                ))}
                <td className="p-2"></td>
                <td className="p-2 text-right num">{rupee(r.gross)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
