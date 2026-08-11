import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Save, Store } from "lucide-react";
import { api } from "@/lib/api";
import TeluguInput from "@/components/TeluguInput";

export default function Settings() {
  const [shop, setShop] = useState(null);

  useEffect(() => {
    api.settings().then(setShop);
  }, []);

  if (!shop) return <div className="p-8 text-slate-400">లోడ్ అవుతోంది…</div>;

  const set = (k) => (v) => setShop({ ...shop, [k]: v });

  const save = async () => {
    await api.saveSettings(shop);
    localStorage.setItem("uk_ui_scale", String(shop.ui_scale));
    document.documentElement.style.fontSize = `${shop.ui_scale * 0.16}px`;
    toast.success("దుకాణం వివరాలు సేవ్ అయ్యాయి — ఇకపై బిల్లుపై ఇవే వస్తాయి");
  };

  return (
    <div className="max-w-xl bg-white border border-slate-200 rounded-lg p-4 space-y-4">
      <div className="flex items-center gap-2">
        <Store className="h-5 w-5 text-blue-600" />
        <h2 className="text-xl font-bold">దుకాణం వివరాలు (బిల్లుపై ప్రింట్ అవుతాయి)</h2>
      </div>

      <div>
        <label className="text-xs font-bold uppercase tracking-wider text-slate-500">దుకాణం పేరు</label>
        <input
          data-testid="shop-name-input"
          value={shop.name}
          onChange={(e) => set("name")(e.target.value)}
          className="w-full px-3 py-2 border-2 border-slate-300 rounded-md focus:border-blue-500 focus:outline-none"
        />
      </div>

      <div>
        <label className="text-xs font-bold uppercase tracking-wider text-slate-500">ఫోన్ నంబర్</label>
        <input
          data-testid="shop-phone-input"
          value={shop.phone}
          onChange={(e) => set("phone")(e.target.value)}
          placeholder="98480 00000"
          className="w-full px-3 py-2 border-2 border-slate-300 rounded-md num focus:border-blue-500 focus:outline-none"
        />
      </div>

      <div>
        <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
          చిరునామా (ఇంగ్లీష్‌లో టైప్ చేస్తే తెలుగు అవుతుంది)
        </label>
        <TeluguInput
          testId="shop-address-input"
          value={shop.address}
          onChange={set("address")}
          placeholder="main road, kothapeta…"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-slate-500">బిల్లు కింద సందేశం</label>
          <input
            data-testid="shop-footer-input"
            value={shop.footer}
            onChange={(e) => set("footer")(e.target.value)}
            className="w-full px-3 py-2 border-2 border-slate-300 rounded-md focus:border-blue-500 focus:outline-none"
          />
        </div>
        <div className="text-xs text-slate-500 self-end pb-2">
          ప్రతి బిల్లు కింద <span className="font-bold">“ఇది అంచనా బిల్లు మాత్రమే”</span> అని ప్రింట్ అవుతుంది.
        </div>
      </div>

      <div className="border border-dashed border-slate-300 rounded-md p-3 space-y-3">
        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
            తెర అక్షరాల పరిమాణం — {shop.ui_scale}%
          </label>
          <input
            data-testid="ui-scale-slider"
            type="range"
            min="85"
            max="140"
            step="5"
            value={shop.ui_scale}
            onChange={(e) => {
              const v = Number(e.target.value);
              set("ui_scale")(v);
              document.documentElement.style.fontSize = `${v * 0.16}px`;
            }}
            className="w-full accent-blue-600"
          />
          <div className="flex gap-2 mt-1">
            {[
              ["చిన్నది", 90],
              ["సాధారణం", 100],
              ["పెద్దది", 115],
              ["చాలా పెద్దది", 130],
            ].map(([l, v]) => (
              <button
                key={v}
                data-testid={`ui-scale-${v}`}
                onClick={() => {
                  set("ui_scale")(v);
                  document.documentElement.style.fontSize = `${v * 0.16}px`;
                }}
                className={`px-2.5 py-1 rounded-full text-xs font-bold border transition-colors ${
                  shop.ui_scale === v ? "bg-slate-900 text-white border-slate-900" : "border-slate-200 text-slate-600"
                }`}
              >
                {l}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
            బిల్లు ప్రింట్ అక్షరాల పరిమాణం — {shop.receipt_font}px
          </label>
          <input
            data-testid="receipt-font-slider"
            type="range"
            min="8"
            max="16"
            step="1"
            value={shop.receipt_font}
            onChange={(e) => set("receipt_font")(Number(e.target.value))}
            className="w-full accent-blue-600"
          />
          <div style={{ fontSize: Number(shop.receipt_font) }} className="text-center border-t border-dashed pt-1">
            కందిపప్పు · 2 × 172 · ₹344.00
          </div>
        </div>
      </div>

      <div className="border border-dashed border-slate-300 rounded-md p-3 text-center">
        <div className="text-[10px] uppercase tracking-wider text-slate-400 mb-1">బిల్లు పైభాగం ప్రివ్యూ</div>
        <div className="font-bold" data-testid="shop-preview-name">{shop.name}</div>
        {shop.address && <div className="text-xs">{shop.address}</div>}
        {shop.phone && <div className="text-xs num">ఫోన్: {shop.phone}</div>}
      </div>

      <button
        data-testid="save-settings-btn"
        onClick={save}
        className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-md font-bold active:scale-95 transition-colors"
      >
        <Save className="h-4 w-4" /> సేవ్ చెయ్యి
      </button>
    </div>
  );
}
