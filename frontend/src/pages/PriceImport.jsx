import { useState } from "react";
import { toast } from "sonner";
import { FileSpreadsheet, Eye, CheckCircle2 } from "lucide-react";
import { api, rupee } from "@/lib/api";

const SAMPLE = `a1 540
b1 64
b2 172
c1 48`;

function parseCSV(text) {
  const lines = text.trim().split(/\r?\n/).filter(Boolean);
  if (!lines.length) return [];
  const header = lines[0].toLowerCase();
  const hasHeader = header.includes("code") || header.includes("కోడ్");
  const rows = [];
  (hasHeader ? lines.slice(1) : lines).forEach((ln) => {
    const parts = ln.split(/[,\t;=|]|\s{1,}/).map((s) => s.trim()).filter(Boolean);
    if (parts.length < 2) return;
    const code = parts[0];
    const priceStr = parts[parts.length - 1];
    const name = parts.length >= 3 ? parts[1] : "";
    const price = Number(String(priceStr).replace(/[^\d.]/g, ""));
    if (!code || Number.isNaN(price)) return;
    rows.push({ code, price, name_te: name || null });
  });
  return rows;
}

export default function PriceImport() {
  const [text, setText] = useState("");
  const [preview, setPreview] = useState(null);
  const [busy, setBusy] = useState(false);

  const rows = parseCSV(text);

  const doPreview = async () => {
    if (!rows.length) return toast.error("CSV డేటా చదవలేకపోయాము");
    setBusy(true);
    try {
      setPreview(await api.bulkPrice({ rows, dry_run: true }));
    } finally {
      setBusy(false);
    }
  };

  const apply = async () => {
    setBusy(true);
    try {
      const r = await api.bulkPrice({ rows, dry_run: false });
      toast.success(`${r.summary.updated} రేట్లు మార్చబడ్డాయి · ${r.summary.created} కొత్తవి`);
      setPreview(null);
      setText("");
    } catch {
      toast.error("అప్‌డేట్ విఫలమైంది");
    } finally {
      setBusy(false);
    }
  };

  const onFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = () => {
      setText(String(r.result));
      setPreview(null);
    };
    r.readAsText(f);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-3">
        <h2 className="text-xl font-bold">రేట్లు ఒకేసారి అప్‌డేట్</h2>
        <p className="text-sm text-slate-500">
          ఒక్కో లైన్‌లో <span className="num font-semibold">కోడ్ కొత్తరేటు</span> చాలు — ఉదా.{" "}
          <span className="num font-semibold">b2 172</span>. కామా, స్పేస్, టాబ్, <span className="num">=</span> ఏదైనా
          పనిచేస్తుంది. CSV ఫైల్ అప్‌లోడ్ చేయొచ్చు లేదా కింద పేస్ట్ చేయొచ్చు.
        </p>
        <label className="flex items-center gap-2 border-2 border-dashed border-slate-300 rounded-md p-3 cursor-pointer hover:border-blue-500 transition-colors">
          <FileSpreadsheet className="h-5 w-5 text-blue-600" />
          <span className="text-sm font-semibold">CSV ఫైల్ ఎంచుకోండి</span>
          <input data-testid="csv-file-input" type="file" accept=".csv,.txt" onChange={onFile} className="hidden" />
        </label>
        <textarea
          data-testid="csv-textarea"
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            setPreview(null);
          }}
          rows={12}
          placeholder={SAMPLE}
          className="w-full p-3 border-2 border-slate-300 rounded-md num text-sm focus:border-blue-500 focus:outline-none"
        />
        <div className="flex items-center gap-2">
          <button
            data-testid="csv-preview-btn"
            disabled={busy}
            onClick={doPreview}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-semibold active:scale-95 transition-colors"
          >
            <Eye className="h-4 w-4" /> ముందుగా చూడండి
          </button>
          <button
            data-testid="csv-sample-btn"
            onClick={() => setText(SAMPLE)}
            className="text-sm text-slate-500 underline"
          >
            నమూనా పెట్టు
          </button>
          <span className="num text-sm text-slate-500 ml-auto">{rows.length} వరుసలు</span>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg p-4">
        {!preview ? (
          <div className="text-slate-400 text-sm p-8 text-center">ప్రివ్యూ ఇక్కడ కనిపిస్తుంది</div>
        ) : (
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-2 text-center">
              {[
                ["మారేవి", preview.summary.updated, "text-blue-600"],
                ["కొత్తవి", preview.summary.created, "text-emerald-600"],
                ["మార్పు లేదు", preview.summary.unchanged, "text-slate-500"],
              ].map(([l, v, c]) => (
                <div key={l} className="border border-slate-200 rounded-md p-2">
                  <div className={`num text-2xl font-bold ${c}`}>{v}</div>
                  <div className="text-xs text-slate-500">{l}</div>
                </div>
              ))}
            </div>
            <div className="max-h-[50vh] overflow-y-auto border border-slate-200 rounded-md">
              <table className="w-full border-collapse text-sm" data-testid="preview-table">
                <thead className="bg-slate-100 text-[11px] uppercase text-slate-500 sticky top-0">
                  <tr>
                    <th className="p-2 text-left">కోడ్</th>
                    <th className="p-2 text-left">వస్తువు</th>
                    <th className="p-2 text-right">పాత</th>
                    <th className="p-2 text-right">కొత్త</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.updated.map((r) => (
                    <tr key={r.code} className="border-b border-slate-100">
                      <td className="p-2 num text-xs font-bold">{r.code}</td>
                      <td className="p-2 font-semibold">{r.name_te}</td>
                      <td className="p-2 text-right num text-slate-400 line-through">{rupee(r.old_price)}</td>
                      <td
                        className={`p-2 text-right num font-bold ${
                          r.price > r.old_price ? "text-rose-600" : "text-emerald-600"
                        }`}
                      >
                        {rupee(r.price)}
                      </td>
                    </tr>
                  ))}
                  {preview.created.map((r) => (
                    <tr key={r.code} className="border-b border-slate-100 bg-emerald-50">
                      <td className="p-2 num text-xs font-bold">{r.code}</td>
                      <td className="p-2 font-semibold">{r.name_te}</td>
                      <td className="p-2 text-right text-xs text-emerald-700">కొత్తది</td>
                      <td className="p-2 text-right num font-bold">{rupee(r.price)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button
              data-testid="csv-apply-btn"
              disabled={busy}
              onClick={apply}
              className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-md font-bold active:scale-95 transition-colors"
            >
              <CheckCircle2 className="h-5 w-5" /> అన్ని రేట్లు అప్‌డేట్ చెయ్యి
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
