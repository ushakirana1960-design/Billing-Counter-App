import { rupee, MODE_TE } from "@/lib/api";

export const Receipt = ({ bill }) => (
  <div style={{ fontFamily: "'Noto Sans Telugu', sans-serif" }}>
    <div style={{ textAlign: "center", fontWeight: 700, fontSize: 14 }}>శ్రీ కిరాణా స్టోర్స్</div>
    <div style={{ textAlign: "center", fontSize: 10 }}>ఫోన్: 98480 00000</div>
    <div style={{ borderTop: "1px dashed #000", margin: "4px 0" }} />
    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10 }}>
      <span>బిల్లు #{bill.bill_no}</span>
      <span>{new Date(bill.created_at).toLocaleString("en-IN")}</span>
    </div>
    {bill.customer_name && <div style={{ fontSize: 10 }}>కస్టమర్: {bill.customer_name}</div>}
    <div style={{ borderTop: "1px dashed #000", margin: "4px 0" }} />
    <table style={{ width: "100%", fontSize: 10 }}>
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
    <div style={{ borderTop: "1px dashed #000", margin: "4px 0" }} />
    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11 }}>
      <span>ఉప మొత్తం</span>
      <span>{rupee(bill.subtotal)}</span>
    </div>
    {bill.discount > 0 && (
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11 }}>
        <span>తగ్గింపు</span>
        <span>-{rupee(bill.discount)}</span>
      </div>
    )}
    <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, fontSize: 13 }}>
      <span>మొత్తం</span>
      <span>{rupee(bill.total)}</span>
    </div>
    <div style={{ fontSize: 10 }}>చెల్లింపు: {MODE_TE[bill.payment_mode]}</div>
    <div style={{ borderTop: "1px dashed #000", margin: "4px 0" }} />
    <div style={{ textAlign: "center", fontSize: 10 }}>ధన్యవాదాలు! మళ్ళీ రండి 🙏</div>
  </div>
);

export default Receipt;
