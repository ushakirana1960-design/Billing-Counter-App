import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Trash2, Printer, Plus, Search } from "lucide-react";
import { api, rupee, MODE_TE } from "@/lib/api";
import { toTelugu } from "@/lib/telugu";
import Receipt from "@/components/Receipt";

export default function Billing() {
  const [items, setItems] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [query, setQuery] = useState("");
  const [qty, setQty] = useState("1");
  const [lines, setLines] = useState([]);
  const [discount, setDiscount] = useState("0");
  const [mode, setMode] = useState("cash");
  const [customerId, setCustomerId] = useState("");
  const [lastBill, setLastBill] = useState(null);
  const [cat, setCat] = useState("అన్నీ");
  const [codeEdit, setCodeEdit] = useState(false);
  const searchRef = useRef(null);

  const saveCode = async (it, code) => {
    const c = code.trim().toLowerCase();
    if (!c || c === it.code) return;
    try {
      await api.updateItem(it.id, { ...it, code: c });
      toast.success(`${it.name_te} కోడ్ ఇప్పుడు ${c}`);
    } catch (e) {
      toast.error(e?.response?.data?.detail || "కోడ్ మార్చడం విఫలమైంది");
    }
    setItems(await api.items());
  };

  useEffect(() => {
    const onSlash = (e) => {
      if (e.key === "/" && document.activeElement?.tagName !== "INPUT") {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onSlash);
    return () => window.removeEventListener("keydown", onSlash);
  }, []);

  const load = async () => {
    await api.seed().catch(() => {});
    setItems(await api.items());
    setCustomers(await api.customers());
  };
  useEffect(() => {
    load();
  }, []);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    const te = toTelugu(q);
    return items
      .filter(
        (it) =>
          it.code.startsWith(q) ||
          it.name_te.includes(q) ||
          it.name_te.includes(te) ||
          (it.name_en || "").toLowerCase().includes(q)
      )
      .slice(0, 8);
  }, [query, items]);

  const addItem = (it, q = Number(qty) || 1) => {
    setLines((prev) => {
      const idx = prev.findIndex((l) => l.code === it.code);
      if (idx >= 0) {
        const copy = [...prev];
        const nq = copy[idx].qty + q;
        copy[idx] = { ...copy[idx], qty: nq, total: +(nq * copy[idx].price).toFixed(2) };
        return copy;
      }
      return [
        ...prev,
        {
          item_id: it.id,
          code: it.code,
          name_te: it.name_te,
          unit: it.unit,
          qty: q,
          price: it.price,
          total: +(q * it.price).toFixed(2),
        },
      ];
    });
    setQuery("");
    setQty("1");
    searchRef.current?.focus();
  };

  const onKey = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const q = query.trim().toLowerCase();
      // supports "b2*3" or "b2 3"
      const m = q.match(/^([a-z0-9]+)\s*[*x ]\s*([\d.]+)$/);
      let code = q;
      let n = Number(qty) || 1;
      if (m) {
        code = m[1];
        n = Number(m[2]);
      }
      const exact = items.find((it) => it.code === code);
      if (exact) return addItem(exact, n);
      if (matches.length) return addItem(matches[0], n);
      toast.error("వస్తువు కనబడలేదు");
    }
  };

  const setQtyAt = (i, v) =>
    setLines((prev) => {
      const copy = [...prev];
      const q = Number(v);
      copy[i] = { ...copy[i], qty: q, total: +(q * copy[i].price).toFixed(2) };
      return copy;
    });

  const setPriceAt = (i, v) =>
    setLines((prev) => {
      const copy = [...prev];
      const p = Number(v);
      copy[i] = { ...copy[i], price: p, total: +(copy[i].qty * p).toFixed(2) };
      return copy;
    });

  const subtotal = lines.reduce((s, l) => s + l.total, 0);
  const total = Math.max(0, subtotal - (Number(discount) || 0));

  const save = async () => {
    if (!lines.length) return toast.error("బిల్లులో వస్తువులు లేవు");
    if (mode === "khata" && !customerId) return toast.error("ఖాతా బిల్లుకు కస్టమర్ ఎంచుకోండి");
    try {
      const bill = await api.createBill({
        lines,
        discount: Number(discount) || 0,
        payment_mode: mode,
        customer_id: customerId || null,
      });
      setLastBill(bill);
      setLines([]);
      setDiscount("0");
      setCustomerId("");
      setMode("cash");
      setCustomers(await api.customers());
      toast.success(`బిల్లు #${bill.bill_no} సేవ్ అయింది · ${rupee(bill.total)}`);
      setTimeout(() => window.print(), 250);
    } catch (e) {
      toast.error(e?.response?.data?.detail || "బిల్లు సేవ్ కాలేదు");
    }
  };

  const grouped = useMemo(() => {
    const g = {};
    items.forEach((i) => (g[i.category] = [...(g[i.category] || []), i]));
    return g;
  }, [items]);

  const categories = ["అన్నీ", ...Object.keys(grouped)];
  const visibleCats = cat === "అన్నీ" ? Object.entries(grouped) : [[cat, grouped[cat] || []]];

  return (
    <>
      <div className="no-print grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-7 xl:col-span-8 space-y-3">
          <div className="bg-white border border-slate-200 rounded-lg p-3">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3.5 h-5 w-5 text-slate-400" />
                <input
                  ref={searchRef}
                  data-testid="pos-search-input"
                  autoFocus
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={onKey}
                  placeholder="షార్ట్‌కట్ కోడ్ (a1, b2) లేదా పేరు టైప్ చేయండి → Enter"
                  className="w-full pl-10 pr-3 py-3 text-lg border-2 border-slate-300 rounded-md focus:border-blue-500 focus:ring-4 focus:ring-blue-100 focus:outline-none num"
                />
              </div>
              <input
                data-testid="pos-qty-input"
                value={qty}
                onChange={(e) => setQty(e.target.value)}
                className="w-24 px-3 py-3 text-lg text-center border-2 border-slate-300 rounded-md num focus:border-blue-500 focus:outline-none"
              />
            </div>
            {matches.length > 0 && (
              <div data-testid="pos-suggestions" className="mt-2 border border-slate-200 rounded-md divide-y">
                {matches.map((it, idx) => (
                  <button
                    key={it.id}
                    data-testid={`suggestion-${it.code}`}
                    onClick={() => addItem(it)}
                    className="w-full flex items-center justify-between px-3 py-2 hover:bg-blue-50 text-left transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <span className="num text-xs font-bold bg-slate-900 text-white px-1.5 py-0.5 rounded">{it.code}</span>
                      <span className="font-semibold">{it.name_te}</span>
                      {idx === 0 && <span className="text-[10px] text-blue-600 font-bold">ENTER</span>}
                    </span>
                    <span className="num font-semibold">
                      {rupee(it.price)}/{it.unit}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
            <table className="w-full border-collapse" data-testid="bill-table">
              <thead>
                <tr className="bg-slate-100 text-[11px] uppercase tracking-wider text-slate-500">
                  <th className="p-2 text-left">కోడ్</th>
                  <th className="p-2 text-left">వస్తువు</th>
                  <th className="p-2 text-right w-24">సంఖ్య</th>
                  <th className="p-2 text-right w-28">రేటు</th>
                  <th className="p-2 text-right w-28">మొత్తం</th>
                  <th className="w-10"></th>
                </tr>
              </thead>
              <tbody>
                {lines.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-400">
                      కోడ్ టైప్ చేసి వస్తువులు జోడించండి
                    </td>
                  </tr>
                )}
                {lines.map((l, i) => (
                  <tr key={l.code} data-testid={`bill-line-${l.code}`} className="border-b border-slate-100">
                    <td className="p-2 num text-xs font-bold text-slate-500">{l.code}</td>
                    <td className="p-2 font-semibold">
                      {l.name_te} <span className="text-xs text-slate-400">/{l.unit}</span>
                    </td>
                    <td className="p-1 text-right">
                      <input
                        data-testid={`qty-${l.code}`}
                        value={l.qty}
                        onChange={(e) => setQtyAt(i, e.target.value)}
                        className="w-20 px-2 py-1 text-right border border-slate-300 rounded num"
                      />
                    </td>
                    <td className="p-1 text-right">
                      <input
                        data-testid={`price-${l.code}`}
                        value={l.price}
                        onChange={(e) => setPriceAt(i, e.target.value)}
                        className="w-24 px-2 py-1 text-right border border-slate-300 rounded num"
                      />
                    </td>
                    <td className="p-2 text-right num font-bold">{rupee(l.total)}</td>
                    <td className="p-2">
                      <button
                        data-testid={`remove-${l.code}`}
                        onClick={() => setLines(lines.filter((x) => x.code !== l.code))}
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

          <div className="bg-white border border-slate-200 rounded-lg p-3">
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="text-[11px] uppercase tracking-wider text-slate-500">
                త్వరిత వస్తువులు · <span className="num">/</span> నొక్కితే సెర్చ్ బాక్స్‌కు వెళ్తుంది
              </div>
              <button
                data-testid="toggle-code-edit"
                onClick={() => setCodeEdit(!codeEdit)}
                className={`text-xs font-bold px-2.5 py-1 rounded-full border transition-colors ${
                  codeEdit ? "bg-blue-600 text-white border-blue-600" : "border-slate-300 text-slate-600"
                }`}
              >
                {codeEdit ? "కోడ్‌ల మార్పు ఆఫ్" : "కోడ్‌లు మార్చు"}
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {categories.map((c) => (
                <button
                  key={c}
                  data-testid={`cat-${c}`}
                  onClick={() => setCat(c)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-colors ${
                    cat === c ? "bg-slate-900 text-white border-slate-900" : "border-slate-200 text-slate-600 hover:border-slate-400"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
            <div className="space-y-3 max-h-72 overflow-y-auto">
              {visibleCats.map(([cname, list]) => (
                <div key={cname}>
                  <div className="text-xs font-bold text-slate-400 mb-1">{cname}</div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-2">
                    {list.map((it) => (
                      <div
                        key={it.id}
                        className="border border-slate-200 rounded-md p-2 hover:border-blue-500 transition-colors"
                      >
                        {codeEdit ? (
                          <input
                            key={`c-${it.id}-${it.code}`}
                            data-testid={`edit-code-${it.code}`}
                            defaultValue={it.code}
                            onBlur={(e) => saveCode(it, e.target.value)}
                            className="w-full mb-1 px-1.5 py-0.5 border border-blue-300 rounded num text-xs font-bold"
                          />
                        ) : (
                          <div className="num text-[10px] font-bold text-blue-600">{it.code}</div>
                        )}
                        <button
                          data-testid={`quick-${it.code}`}
                          onClick={() => !codeEdit && addItem(it)}
                          className="w-full text-left active:scale-95 transition-transform"
                        >
                          <div className="text-sm font-semibold leading-tight truncate">{it.name_te}</div>
                          <div className="num text-xs text-slate-500">
                            {rupee(it.price)}
                            {it.min_stock > 0 && it.stock <= it.min_stock && (
                              <span className="text-rose-600 font-bold"> · నిల్వ {it.stock}</span>
                            )}
                          </div>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-5 xl:col-span-4">
          <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-3 lg:sticky lg:top-20">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">ఉప మొత్తం</span>
              <span className="num font-semibold" data-testid="subtotal">{rupee(subtotal)}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-500">తగ్గింపు</span>
              <input
                data-testid="discount-input"
                value={discount}
                onChange={(e) => setDiscount(e.target.value)}
                className="w-24 px-2 py-1 text-right border border-slate-300 rounded num"
              />
            </div>
            <div className="flex justify-between items-baseline border-t pt-3">
              <span className="font-bold">చెల్లించాల్సినది</span>
              <span className="num text-3xl font-bold text-emerald-700" data-testid="grand-total">
                {rupee(total)}
              </span>
            </div>

            <div className="grid grid-cols-4 gap-2">
              {["cash", "upi", "card", "khata"].map((m) => (
                <button
                  key={m}
                  data-testid={`mode-${m}`}
                  onClick={() => setMode(m)}
                  className={`py-2 rounded-md text-sm font-bold border-2 transition-colors ${
                    mode === m
                      ? m === "khata"
                        ? "bg-amber-500 border-amber-500 text-white"
                        : "bg-blue-600 border-blue-600 text-white"
                      : "border-slate-200 text-slate-600 hover:border-slate-400"
                  }`}
                >
                  {MODE_TE[m]}
                </button>
              ))}
            </div>

            {mode === "khata" && (
              <select
                data-testid="khata-customer-select"
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                className="w-full px-3 py-2 border-2 border-amber-300 bg-amber-50 rounded-md"
              >
                <option value="">కస్టమర్ ఎంచుకోండి…</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name_te} — బాకీ {rupee(c.balance)}
                  </option>
                ))}
              </select>
            )}

            <button
              data-testid="checkout-btn"
              onClick={save}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-4 rounded-md text-xl font-bold active:scale-95 transition-colors"
            >
              బిల్లు సేవ్ + ప్రింట్
            </button>

            {lastBill && (
              <div className="border-t pt-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">చివరి బిల్లు #{lastBill.bill_no}</span>
                  <button
                    data-testid="reprint-btn"
                    onClick={() => window.print()}
                    className="flex items-center gap-1 text-blue-600 font-semibold"
                  >
                    <Printer className="h-4 w-4" /> మళ్ళీ ప్రింట్
                  </button>
                </div>
                <div className="num font-bold text-lg">{rupee(lastBill.total)}</div>
              </div>
            )}
          </div>
        </div>
      </div>
      <div id="print-area">{lastBill && <Receipt bill={lastBill} />}</div>
    </>
  );
}
