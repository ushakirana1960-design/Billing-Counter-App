import { useEffect, useState } from "react";
import { api, rupee, MODE_TE } from "@/lib/api";

const dash = { borderTop: "1px dashed #000", margin: "4px 0" };

export const Receipt = ({ bill }) => {
  const [shop, setShop] = useState({ name: "ఉష కిరాణా", phone: "", address: "", footer: "", receipt_font: 11 });

  useEffect(() => {
    api.settings().then(setShop).catch(() => {});
  }, []);

  const f = Number(shop.receipt_font) || 11;
  const sm = f - 1;

  return (
    <div style={{ fontFamily: "'Noto Sans Telugu', sans-serif", fontSize: f }}>
      <div style={{ textAlign: "center", fontWeight: 700, fontSize: f + 4 }}>{shop.name}</div>
      {shop.address && <div style={{ textAlign: "center", fontSize: sm }}>{shop.address}</div>}
      {shop.phone && <div style={{ textAlign: "center", fontSize: sm }}>ఫోన్: {shop.phone}</div>}
      <div style={dash} />
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: sm }}>
        <span>బిల్లు #{bill.bill_no}</span>
        <span>{new Date(bill.created_at).toLocaleString("en-IN")}</span>
      </div>
      {bill.customer_name && <div style={{ fontSize: sm }}>కస్టమర్: {bill.customer_name}</div>}
      <div style={dash} />
      <table style={{ width: "100%", fontSize: sm }}>
        <thead>
          <tr>
            <th style={{ textAlign: "left" }}>వస్తువు</th>
            <th style={{ textAlign: "right" }}>సం.</th>
            <th style={{ textAlign: "right" }}>రేటు</th>
            <th style={{ textAlign: "right" }}>మొత్తం</th>
          </tr>
        </thead>
        <tbody>
          {bill.lines.map((l) => (
            <tr key={l.code}>
              <td>{l.name_te}</td>
              <td style={{ textAlign: "right" }}>{l.qty}</td>
              <td style={{ textAlign: "right" }}>{l.price}</td>
              <td style={{ textAlign: "right" }}>{l.total.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div style={dash} />
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <span>ఉప మొత్తం</span>
        <span>{rupee(bill.subtotal)}</span>
      </div>
      {bill.discount > 0 && (
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span>తగ్గింపు</span>
          <span>-{rupee(bill.discount)}</span>
        </div>
      )}
      <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, fontSize: f + 2 }}>
        <span>మొత్తం</span>
        <span>{rupee(bill.total)}</span>
      </div>
      <div style={{ fontSize: sm }}>చెల్లింపు: {MODE_TE[bill.payment_mode]}</div>
      <div style={dash} />
      <div style={{ textAlign: "center", fontWeight: 700 }}>ఇది అంచనా బిల్లు మాత్రమే</div>
      <div style={{ textAlign: "center", fontSize: sm - 1 }}>THIS IS AN ESTIMATE BILL</div>
      <div style={{ textAlign: "center", fontSize: sm }}>{shop.footer || "ధన్యవాదాలు! మళ్ళీ రండి"}</div>
    </div>
  );
};

export default Receipt;
