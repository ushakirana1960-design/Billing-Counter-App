import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Trash2, Save, Plus, Zap } from "lucide-react";
import { api, rupee } from "@/lib/api";
import TeluguInput from "@/components/TeluguInput";

const EMPTY = { code: "", name_te: "", name_en: "", unit: "కేజీ", price: "", category: "సాధారణ" };

export default function Items() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [q, setQ] = useState("");

  const load = async () => setItems(await api.items());
  useEffect(() => {
    load();
  }, []);

  const add = async () => {
    if (!form.code || !form.name_te) return toast.error("కోడ్ మరియు పేరు అవసరం");
    try {
      await api.createItem({ ...form, price: Number(form.price) || 0 });
      setForm(EMPTY);
      toast.success("వస్తువు జోడించబడింది");
      load();
    } catch (e) {
      toast.error(e?.response?.data?.detail || "జోడించడం విఫలమైంది");
    }
  };

  const savePrice = async (it, price) => {
    await api.updateItem(it.id, { ...it, price: Number(price) || 0 });
    toast.success(`${it.name_te} రేటు మార్చబడింది`);
    load();
  };

  const del = async (it) => {
    await api.deleteItem(it.id);
    toast.success("తొలగించబడింది");
    load();
  };

  const shown = items.filter((i) => !q || i.code.includes(q.toLowerCase()) || i.name_te.includes(q));

  return (
    <div className="space-y-4">
      <QuickRate items={items} onDone={load} />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-3 h-fit">
        <h2 className="text-xl font-bold">కొత్త వస్తువు</h2>
        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-slate-500">షార్ట్‌కట్ కోడ్</label>
          <input
            data-testid="item-code-input"
            value={form.code}
            onChange={(e) => setForm({ ...form, code: e.target.value })}
            placeholder="a1, b2, f7…"
            className="w-full px-3 py-2 border-2 border-slate-300 rounded-md num focus:border-blue-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
            పేరు (ఇంగ్లీష్‌లో టైప్ చేయండి → తెలుగు)
          </label>
          <TeluguInput
            testId="item-name-input"
            value={form.name_te}
            onChange={(v) => setForm({ ...form, name_te: v })}
            placeholder="venna, biyyam…"
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">రేటు</label>
            <input
              data-testid="item-price-input"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              className="w-full px-3 py-2 border-2 border-slate-300 rounded-md num focus:border-blue-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">యూనిట్</label>
            <select
              data-testid="item-unit-select"
              value={form.unit}
              onChange={(e) => setForm({ ...form, unit: e.target.value })}
              className="w-full px-3 py-2 border-2 border-slate-300 rounded-md"
            >
              {["కేజీ", "గ్రాము", "లీటరు", "పీస్", "ప్యాకెట్"].map((u) => (
                <option key={u}>{u}</option>
              ))}
            </select>
          </div>
        </div>
        <button
          data-testid="add-item-btn"
          onClick={add}
          className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-md font-semibold active:scale-95 transition-colors"
        >
          <Plus className="h-4 w-4" /> జోడించు
        </button>
      </div>

      <div className="lg:col-span-2 bg-white border border-slate-200 rounded-lg overflow-hidden">
        <div className="p-3 border-b">
          <input
            data-testid="item-search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="వెతకండి…"
            className="w-full px-3 py-2 border-2 border-slate-300 rounded-md focus:border-blue-500 focus:outline-none"
          />
        </div>
        <div className="max-h-[70vh] overflow-y-auto">
          <table className="w-full border-collapse">
            <thead className="sticky top-0 bg-slate-100 text-[11px] uppercase tracking-wider text-slate-500">
              <tr>
                <th className="p-2 text-left w-20">కోడ్</th>
                <th className="p-2 text-left">పేరు</th>
                <th className="p-2 text-right">రేటు</th>
                <th className="w-20"></th>
              </tr>
            </thead>
            <tbody>
              {shown.map((it) => (
                <tr key={it.id} data-testid={`item-row-${it.code}`} className="border-b border-slate-100">
                  <td className="p-1">
                    <input
                      key={`code-${it.id}-${it.code}`}
                      data-testid={`item-code-${it.code}`}
                      defaultValue={it.code}
                      onBlur={(e) => saveCode(it, e.target.value)}
                      className="w-16 px-2 py-1 border border-slate-300 rounded num text-xs font-bold"
                    />
                  </td>
                  <td className="p-2 font-semibold">
                    {it.name_te} <span className="text-xs text-slate-400">/{it.unit}</span>
                  </td>
                  <td className="p-1 text-right">
                    <input
                      key={`price-${it.id}-${it.price}`}
                      data-testid={`item-price-${it.code}`}
                      defaultValue={it.price}
                      onBlur={(e) => Number(e.target.value) !== it.price && savePrice(it, e.target.value)}
                      className="w-24 px-2 py-1 text-right border border-slate-300 rounded num"
                    />
                  </td>
                  <td className="p-2 text-right">
                    <button
                      data-testid={`item-delete-${it.code}`}
                      onClick={() => del(it)}
                      className="text-rose-600 hover:bg-rose-50 p-1 rounded transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      </div>
    </div>
  );
}

function QuickRate({ items, onDone }) {
  const [code, setCode] = useState("");
  const [price, setPrice] = useState("");
  const [log, setLog] = useState([]);
  const codeRef = useRef(null);
  const priceRef = useRef(null);

  const hit = items.find((i) => i.code === code.trim().toLowerCase());

  const apply = async () => {
    const raw = (codeRef.current?.value || code).trim().toLowerCase();
    const [c2, p2] = raw.split(/[\s,=]+/);
    const target = items.find((i) => i.code === (p2 ? c2 : raw));
    const newPrice = Number(p2 || priceRef.current?.value || price);
    if (!target) return toast.error("కోడ్ కనబడలేదు");
    if (!newPrice || newPrice <= 0) return toast.error("కొత్త రేటు రాయండి");
    await api.updateItem(target.id, { ...target, price: newPrice });
    setLog((l) => [{ ...target, old: target.price, price: newPrice }, ...l].slice(0, 6));
    toast.success(`${target.name_te}: ₹${target.price} → ₹${newPrice}`);
    setCode("");
    setPrice("");
    codeRef.current?.focus();
    onDone();
  };

  return (
    <div className="bg-white border-2 border-blue-200 rounded-lg p-3">
      <div className="flex items-center gap-2 mb-2">
        <Zap className="h-4 w-4 text-blue-600" />
        <span className="font-bold">త్వరిత రేటు మార్పు</span>
        <span className="text-xs text-slate-500">
          కోడ్ టైప్ చేసి Enter → కొత్త రేటు టైప్ చేసి Enter. లేదా ఒకేసారి <span className="num font-semibold">b2 172</span>
        </span>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <input
          ref={codeRef}
          data-testid="quick-rate-code"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          onKeyDown={(e) => {
            if (e.key !== "Enter") return;
            e.preventDefault();
            if (/[\s,=]/.test(code.trim())) apply();
            else priceRef.current?.focus();
          }}
          placeholder="కోడ్ (b2)"
          className="w-40 px-3 py-2.5 border-2 border-slate-300 rounded-md num text-lg focus:border-blue-500 focus:outline-none"
        />
        <div className="min-w-[180px] text-sm">
          {hit ? (
            <span data-testid="quick-rate-hit" className="font-semibold">
              {hit.name_te} <span className="num text-slate-500">· ఇప్పుడు {rupee(hit.price)}</span>
            </span>
          ) : (
            <span className="text-slate-400">కోడ్ ఇవ్వండి</span>
          )}
        </div>
        <input
          ref={priceRef}
          data-testid="quick-rate-price"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && apply()}
          placeholder="కొత్త రేటు"
          className="w-36 px-3 py-2.5 border-2 border-slate-300 rounded-md num text-lg focus:border-blue-500 focus:outline-none"
        />
        <button
          data-testid="quick-rate-save"
          onClick={apply}
          className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-md font-semibold active:scale-95 transition-colors"
        >
          <Save className="h-4 w-4" /> మార్చు
        </button>
        {log.length > 0 && (
          <div className="flex flex-wrap gap-2 ml-auto" data-testid="quick-rate-log">
            {log.map((l, i) => (
              <span key={i} className="text-xs bg-emerald-50 border border-emerald-200 rounded px-2 py-1 num">
                {l.code}: {l.old} → {l.price}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
