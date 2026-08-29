import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Save, Store, Printer, Plus, X, ImagePlus } from "lucide-react";
import { api } from "@/lib/api";
import TeluguInput from "@/components/TeluguInput";

export default function Settings() {
  const [shop, setShop] = useState(null);
  const [newStaff, setNewStaff] = useState("");

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

      <div className="border border-slate-200 rounded-md p-3 space-y-2">
        <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
          దుకాణం గుర్తు / లోగో (బిల్లు పైన ప్రింట్ అవుతుంది)
        </label>
        <div className="flex items-center gap-3">
          {shop.logo ? (
            <img
              data-testid="logo-preview"
              src={shop.logo}
              alt="logo"
              className="h-16 w-16 object-contain border border-slate-200 rounded-md bg-white"
            />
          ) : (
            <div className="h-16 w-16 grid place-items-center border border-dashed border-slate-300 rounded-md text-slate-400 text-xs">
              లోగో లేదు
            </div>
          )}
          <label className="flex items-center gap-2 border-2 border-dashed border-slate-300 rounded-md px-3 py-2 cursor-pointer hover:border-blue-500 transition-colors">
            <ImagePlus className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-semibold">బొమ్మ ఎంచుకోండి</span>
            <input
              data-testid="logo-file-input"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const img = new Image();
                const reader = new FileReader();
                reader.onload = () => {
                  img.onload = () => {
                    const max = 320;
                    const scale = Math.min(1, max / Math.max(img.width, img.height));
                    const c = document.createElement("canvas");
                    c.width = Math.round(img.width * scale);
                    c.height = Math.round(img.height * scale);
                    c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
                    set("logo")(c.toDataURL("image/png"));
                    toast.success("లోగో ఎంచుకున్నారు — సేవ్ చెయ్యండి");
                  };
                  img.src = String(reader.result);
                };
                reader.readAsDataURL(file);
              }}
            />
          </label>
          {shop.logo && (
            <button
              data-testid="logo-remove-btn"
              onClick={() => set("logo")("")}
              className="text-rose-600 text-sm font-semibold hover:underline"
            >
              తీసేయ్
            </button>
          )}
        </div>
        <p className="text-xs text-slate-500">
          PNG / JPG బొమ్మ ఇవ్వండి (చిన్నదిగా మార్చి నిల్వ చేస్తాము). థర్మల్ ప్రింటర్ నలుపు-తెలుపులో ప్రింట్ చేస్తుంది —
          సన్నని గీతలు లేని, స్పష్టమైన లోగో బాగా వస్తుంది.
        </p>
      </div>

      <div className="border border-slate-200 rounded-md p-3 space-y-2">
        <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
          బిల్లు వేసేవారి పేర్లు (గరిష్టం 7)
        </label>
        <div className="flex flex-wrap gap-2">
          {(shop.staff || []).map((s, i) => (
            <span
              key={s}
              data-testid={`staff-chip-${i}`}
              className="flex items-center gap-1 bg-slate-100 border border-slate-200 rounded-full pl-3 pr-1 py-1 text-sm font-semibold"
            >
              {s}
              <button
                data-testid={`staff-remove-${i}`}
                onClick={() => set("staff")((shop.staff || []).filter((_, j) => j !== i))}
                className="text-rose-600 hover:bg-rose-100 rounded-full p-0.5"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </span>
          ))}
          {!(shop.staff || []).length && <span className="text-sm text-slate-400">ఇంకా ఎవరూ లేరు</span>}
        </div>
        <div className="flex items-start gap-2">
          <div className="flex-1">
            <TeluguInput
              testId="staff-name-input"
              value={newStaff}
              onChange={setNewStaff}
              placeholder="ravi, srinu akka…"
            />
          </div>
          <button
            data-testid="staff-add-btn"
            onClick={() => {
              const list = shop.staff || [];
              if (!newStaff.trim()) return toast.error("పేరు రాయండి");
              if (list.length >= 7) return toast.error("గరిష్టం 7 మందే");
              if (list.includes(newStaff.trim())) return toast.error("ఈ పేరు ఇప్పటికే ఉంది");
              set("staff")([...list, newStaff.trim()]);
              setNewStaff("");
            }}
            className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-semibold active:scale-95 transition-colors"
          >
            <Plus className="h-4 w-4" /> చేర్చు
          </button>
        </div>
        <p className="text-xs text-slate-500">
          బిల్లింగ్ స్క్రీన్‌లో ఎవరు బిల్లు వేస్తున్నారో ఎంచుకుంటారు; ఆ పేరు బిల్లుపై “బిల్లు వేసినవారు” గా ప్రింట్
          అవుతుంది. బిల్లు కింద <span className="font-semibold">పరిశీలించినవారు</span> కోసం సంతకం స్థలం కూడా వస్తుంది.
        </p>
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
        {shop.logo && <img src={shop.logo} alt="" className="h-10 mx-auto mb-1 object-contain" />}
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

      <div className="border-2 border-blue-200 bg-blue-50 rounded-lg p-4 space-y-2" data-testid="printer-help">
        <div className="flex items-center gap-2">
          <Printer className="h-5 w-5 text-blue-700" />
          <h3 className="font-bold text-blue-900">ప్రింటర్ ఎలా కలపాలి?</h3>
        </div>
        <ol className="text-sm space-y-1.5 list-decimal pl-5 text-slate-700">
          <li>
            థర్మల్ ప్రింటర్ (58mm / 80mm) ను USB తో కంప్యూటర్‌కు కలిపి, దాని డ్రైవర్ ఇన్‌స్టాల్ చేయండి. Windows లో{" "}
            <span className="font-semibold">Settings → Bluetooth &amp; devices → Printers &amp; scanners → Add device</span>.
          </li>
          <li>
            బిల్లు సేవ్ చేసిన వెంటనే బ్రౌజర్ ప్రింట్ విండో వస్తుంది. అందులో మీ థర్మల్ ప్రింటర్‌ను ఎంచుకోండి.
          </li>
          <li>
            <span className="font-semibold">Paper size</span> లో <span className="num">80mm × 297mm</span> (లేదా Roll
            Paper 80 / 58) ఎంచుకోండి; <span className="font-semibold">Margins = None</span>,{" "}
            <span className="font-semibold">Scale = 100%</span>, <span className="font-semibold">Headers and footers</span>{" "}
            ఆఫ్ చేయండి.
          </li>
          <li>
            Chrome లో <span className="font-semibold">“Use system dialog”</span> కి వెళ్లి ఒకసారి సెట్ చేస్తే, ఆ తర్వాత
            ప్రతిసారీ అదే సెట్టింగ్ గుర్తుంచుకుంటుంది — Enter కొట్టడమే.
          </li>
          <li>
            అక్షరాలు చిన్నగా/పెద్దగా ఉంటే పైన ఉన్న{" "}
            <span className="font-semibold">బిల్లు ప్రింట్ అక్షరాల పరిమాణం</span> స్లైడర్‌తో సరిచేయండి.
          </li>
          <li>
            సాధారణ A4 ప్రింటర్ కూడా పనిచేస్తుంది — బిల్లు పేజీ మధ్యలో సన్నని రసీదుగా ప్రింట్ అవుతుంది.
          </li>
          <li>
            బ్లూటూత్ మొబైల్ ప్రింటర్ వాడితే: ఫోన్‌లో ప్రింటర్ జతచేసి, Chrome → Share → Print → ఆ ప్రింటర్ ఎంచుకోండి.
          </li>
        </ol>
        <p className="text-xs text-slate-500">
          చిట్కా: మొదటిసారి ఒక టెస్ట్ బిల్లు వేసి ప్రింట్ చేసి చూడండి — సైజు సరిపోకపోతే స్లైడర్ మార్చి మళ్ళీ ప్రింట్ చేయండి.
        </p>
      </div>
    </div>
  );
}
