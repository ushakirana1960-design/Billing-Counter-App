import { useEffect, useState } from "react";
import { Printer } from "lucide-react";
import { api, rupee, MODE_TE } from "@/lib/api";

export default function Report() {
  const [day, setDay] = useState(new Date().toISOString().slice(0, 10));
  const [r, setR] = useState(null);

  useEffect(() => {
    api.report(day).then(setR);
  }, [day]);

  if (!r) return <div className="p-8 text-slate-400">లోడ్ అవుతోంది…</div>;

  const cards = [
    ["నగదు", r.modes.cash, "bg-emerald-50 border-emerald-200 text-emerald-800"],
    ["UPI", r.modes.upi, "bg-blue-50 border-blue-200 text-blue-800"],
    ["కార్డు", r.modes.card, "bg-violet-50 border-violet-200 text-violet-800"],
    ["ఖాతా (అరువు)", r.modes.khata, "bg-amber-50 border-amber-200 text-amber-800"],
  ];

  return (
    <div id="print-report">
      <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
        <h1 className="text-2xl sm:text-3xl font-bold">రోజు ముగింపు నివేదిక</h1>
        <div className="flex items-center gap-2 no-print">
          <input
            data-testid="report-date-input"
            type="date"
            value={day}
            onChange={(e) => setDay(e.target.value)}
            className="px-3 py-2 border-2 border-slate-300 rounded-md num"
          />
          <button
            data-testid="print-report-btn"
            onClick={() => window.print()}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-semibold active:scale-95 transition-colors"
          >
            <Printer className="h-4 w-4" /> ప్రింట్
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        {cards.map(([l, v, cls]) => (
          <div key={l} className={`border rounded-lg p-3 ${cls}`} data-testid={`report-card-${l}`}>
            <div className="text-xs font-bold uppercase tracking-wider opacity-70">{l}</div>
            <div className="num text-2xl font-bold">{rupee(v)}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        {[
          ["బిల్లుల సంఖ్య", r.bill_count],
          ["స్థూల అమ్మకం", rupee(r.gross)],
          ["ఖాతా వసూలు", rupee(r.khata_collected.cash + r.khata_collected.upi + r.khata_collected.card)],
          ["చేతిలో నగదు", rupee(r.cash_in_hand)],
        ].map(([l, v]) => (
          <div key={l} className="bg-white border border-slate-200 rounded-lg p-3">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-500">{l}</div>
            <div className="num text-xl font-bold" data-testid={`report-stat-${l}`}>{v}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
          <div className="p-3 border-b font-bold">ఎక్కువ అమ్ముడైన వస్తువులు</div>
          <table className="w-full border-collapse text-sm">
            <thead className="bg-slate-100 text-[11px] uppercase text-slate-500">
              <tr>
                <th className="p-2 text-left">వస్తువు</th>
                <th className="p-2 text-right">సంఖ్య</th>
                <th className="p-2 text-right">మొత్తం</th>
              </tr>
            </thead>
            <tbody>
              {r.top_items.map((i) => (
                <tr key={i.code} className="border-b border-slate-100">
                  <td className="p-2 font-semibold">{i.name_te}</td>
                  <td className="p-2 text-right num">{i.qty}</td>
                  <td className="p-2 text-right num font-bold">{rupee(i.amount)}</td>
                </tr>
              ))}
              {!r.top_items.length && (
                <tr>
                  <td colSpan={3} className="p-6 text-center text-slate-400">అమ్మకాలు లేవు</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
          <div className="p-3 border-b font-bold">ఈ రోజు బిల్లులు</div>
          <table className="w-full border-collapse text-sm" data-testid="report-bills-table">
            <thead className="bg-slate-100 text-[11px] uppercase text-slate-500">
              <tr>
                <th className="p-2 text-left">#</th>
                <th className="p-2 text-left">సమయం</th>
                <th className="p-2 text-left">చెల్లింపు</th>
                <th className="p-2 text-right">మొత్తం</th>
              </tr>
            </thead>
            <tbody>
              {r.bills.map((b) => (
                <tr key={b.id} className="border-b border-slate-100">
                  <td className="p-2 num">{b.bill_no}</td>
                  <td className="p-2 num text-xs">{new Date(b.created_at).toLocaleTimeString("en-IN")}</td>
                  <td className="p-2">
                    {MODE_TE[b.payment_mode]} {b.customer_name ? `· ${b.customer_name}` : ""}
                  </td>
                  <td className="p-2 text-right num font-bold">{rupee(b.total)}</td>
                </tr>
              ))}
              {!r.bills.length && (
                <tr>
                  <td colSpan={4} className="p-6 text-center text-slate-400">బిల్లులు లేవు</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
