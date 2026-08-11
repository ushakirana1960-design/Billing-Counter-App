import { useEffect, useState } from "react";
import { Printer, ChevronLeft, ChevronRight } from "lucide-react";
import { api, rupee, MODE_TE } from "@/lib/api";

const mondayOf = (d) => {
  const x = new Date(d);
  x.setDate(x.getDate() - ((x.getDay() + 6) % 7));
  return x.toISOString().slice(0, 10);
};

const DAY_TE = ["సోమ", "మంగళ", "బుధ", "గురు", "శుక్ర", "శని", "ఆది"];

export default function WeekReport() {
  const [start, setStart] = useState(mondayOf(new Date()));
  const [r, setR] = useState(null);
  const [q, setQ] = useState("");

  useEffect(() => {
    api.weekly(start).then(setR);
  }, [start]);

  const shift = (n) => {
    const d = new Date(start);
    d.setDate(d.getDate() + n * 7);
    setStart(d.toISOString().slice(0, 10));
  };

  if (!r) return <div className="p-8 text-slate-400">లోడ్ అవుతోంది…</div>;

  const rows = r.items.filter((i) => !q || i.code.includes(q.toLowerCase()) || i.name_te.includes(q));
  const best = Object.entries(r.day_totals).sort((a, b) => b[1] - a[1])[0];

  return (
    <div id="print-report" className="space-y-4 max-w-full overflow-x-hidden">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">వారం నివేదిక — అమ్ముడైన సరుకులు</h1>
          <div className="num text-sm text-slate-500">
            {r.week_start} → {r.week_end}
          </div>
        </div>
        <div className="flex items-center gap-2 no-print">
          <button
            data-testid="week-prev-btn"
            onClick={() => shift(-1)}
            className="p-2 border-2 border-slate-300 rounded-md hover:border-blue-500 transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <input
            data-testid="week-start-input"
            type="date"
            value={start}
            onChange={(e) => setStart(mondayOf(e.target.value))}
            className="px-3 py-2 border-2 border-slate-300 rounded-md num"
          />
          <button
            data-testid="week-next-btn"
            onClick={() => shift(1)}
            className="p-2 border-2 border-slate-300 rounded-md hover:border-blue-500 transition-colors"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          <input
            data-testid="week-item-search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="వస్తువు వెతకండి…"
            className="px-3 py-2 border-2 border-slate-300 rounded-md"
          />
          <button
            data-testid="print-week-btn"
            onClick={() => window.print()}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-semibold active:scale-95 transition-colors"
          >
            <Printer className="h-4 w-4" /> ప్రింట్
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          ["బిల్లులు", r.bill_count],
          ["వారం అమ్మకం", rupee(r.gross)],
          ["రోజు సగటు", rupee(r.avg_per_day)],
          ["ఎక్కువ అమ్మిన రోజు", best && best[1] ? `${best[0]} · ${rupee(best[1])}` : "—"],
        ].map(([l, v]) => (
          <div key={l} className="bg-white border border-slate-200 rounded-lg p-3">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-500">{l}</div>
            <div className="num text-lg font-bold" data-testid={`week-stat-${l}`}>{v}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {Object.entries(r.modes).map(([k, v]) => (
          <div key={k} className="bg-white border border-slate-200 rounded-lg p-3">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-500">{MODE_TE[k]}</div>
            <div className="num text-lg font-bold">{rupee(v)}</div>
          </div>
        ))}
      </div>

      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden min-w-0">
        <div className="p-3 border-b font-bold">వస్తువు × రోజు (సంఖ్య) — {rows.length} వస్తువులు</div>
        <div className="overflow-auto max-h-[65vh]">
          <table className="w-full border-collapse text-sm" data-testid="week-matrix">
            <thead className="bg-slate-100 sticky top-0">
              <tr>
                <th className="p-2 text-left min-w-[150px]">వస్తువు</th>
                {r.days.map((d, i) => (
                  <th key={d} className="p-2 text-center text-xs text-slate-600">
                    {DAY_TE[i]}
                    <div className="num text-[10px] text-slate-400">{d.slice(8)}</div>
                  </th>
                ))}
                <th className="p-2 text-right bg-slate-200">మొత్తం సం.</th>
                <th className="p-2 text-right bg-slate-200">విలువ</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((it) => (
                <tr key={it.code} data-testid={`week-row-${it.code}`} className="border-b border-slate-100">
                  <td className="p-2 font-semibold whitespace-nowrap">
                    <span className="num text-[10px] text-blue-600 mr-1">{it.code}</span>
                    {it.name_te}
                  </td>
                  {r.days.map((d) => (
                    <td
                      key={d}
                      className={`p-2 text-center num ${it.per_day[d] ? "font-bold" : "text-slate-200"}`}
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
                    ఈ వారం అమ్మకాలు లేవు
                  </td>
                </tr>
              )}
              <tr className="bg-slate-100 font-bold">
                <td className="p-2">రోజు మొత్తం (₹)</td>
                {r.days.map((d) => (
                  <td key={d} className="p-2 text-center num text-xs">
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
