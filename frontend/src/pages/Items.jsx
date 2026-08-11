import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Trash2, Save, Plus } from "lucide-react";
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
                <th className="p-2 text-left">కోడ్</th>
                <th className="p-2 text-left">పేరు</th>
                <th className="p-2 text-right">రేటు</th>
                <th className="w-20"></th>
              </tr>
            </thead>
            <tbody>
              {shown.map((it) => (
                <tr key={it.id} data-testid={`item-row-${it.code}`} className="border-b border-slate-100">
                  <td className="p-2 num text-xs font-bold">{it.code}</td>
                  <td className="p-2 font-semibold">
                    {it.name_te} <span className="text-xs text-slate-400">/{it.unit}</span>
                  </td>
                  <td className="p-1 text-right">
                    <input
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
  );
}
