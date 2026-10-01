import { useEffect, useState } from "react";
import { API_URL } from "../config/api";

const money = new Intl.NumberFormat("th-TH", { style: "currency", currency: "THB", maximumFractionDigits: 0 });
const statusLabels = { pending: "รอตรวจสอบ", approved: "อนุมัติแล้ว", rejected: "ไม่อนุมัติ" };

export default function TopUpModal({ walletBalance = 0, onClose, onWalletUpdated }) {
  const [amount, setAmount] = useState(500);
  const [method, setMethod] = useState("promptpay");
  const [transactionReference, setTransactionReference] = useState("");
  const [config, setConfig] = useState({});
  const [topUps, setTopUps] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("dueldeck_token");
      const headers = { Authorization: `Bearer ${token}` };
      const [configResponse, accountResponse] = await Promise.all([
        fetch(`${API_URL}/topups/config`),
        fetch(`${API_URL}/topups/me`, { headers }),
      ]);
      const configData = await configResponse.json();
      const accountData = await accountResponse.json();
      if (!configResponse.ok || !accountResponse.ok) throw new Error(accountData.message || "โหลดข้อมูลกระเป๋าเงินไม่สำเร็จ");
      setConfig(configData);
      setTopUps(accountData.topUps || []);
      setTransactions((accountData.transactions || []).filter((item) => item.type === "purchase"));
      onWalletUpdated(accountData.walletBalance || 0);
    } catch (requestError) {
      setError(requestError.message === "Failed to fetch" ? "เชื่อมต่อเซิร์ฟเวอร์ไม่ได้" : requestError.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const submit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch(`${API_URL}/topups`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("dueldeck_token")}` },
        body: JSON.stringify({ amount: Number(amount), method, transactionReference: transactionReference.trim() }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "ส่งคำขอเติมเงินไม่สำเร็จ");
      setTransactionReference("");
      setNotice("ส่งคำขอแล้ว ยอดเงินจะเข้ากระเป๋าหลังแอดมินตรวจสอบ");
      await load();
    } catch (requestError) {
      setError(requestError.message === "Failed to fetch" ? "เชื่อมต่อเซิร์ฟเวอร์ไม่ได้" : requestError.message);
    } finally {
      setSubmitting(false);
    }
  };

  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 p-4 backdrop-blur-sm" onClick={onClose}>
    <section role="dialog" aria-modal="true" aria-label="เติมเงินเข้ากระเป๋า" onClick={(event) => event.stopPropagation()} className="max-h-[92vh] w-full max-w-2xl overflow-auto rounded-2xl border border-white/15 bg-[#101729] p-5 shadow-2xl sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div><p className="text-sm font-bold tracking-[.18em] text-amber-300">DUELDECK WALLET</p><h2 className="mt-1 font-display text-3xl font-black">เติมเงิน</h2></div>
        <button type="button" onClick={onClose} aria-label="ปิด" className="text-2xl text-slate-400">×</button>
      </div>
      <div className="mt-4 flex items-center justify-between rounded-xl border border-amber-300/20 bg-amber-300/5 p-4"><span className="text-sm text-slate-300">ยอดเงินคงเหลือ</span><strong className="text-xl text-amber-300">{money.format(walletBalance)}</strong></div>

      <form onSubmit={submit} className="mt-5 rounded-xl border border-white/10 bg-white/[.03] p-4">
        <h3 className="font-bold">1. โอนเงินเข้าร้าน</h3>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <label className={`cursor-pointer rounded-lg border p-3 text-sm ${method === "promptpay" ? "border-amber-300/70 bg-amber-300/10" : "border-white/10"}`}><input type="radio" name="topup-method" value="promptpay" checked={method === "promptpay"} onChange={() => setMethod("promptpay")} className="mr-2 accent-amber-300" />PromptPay</label>
          <label className={`cursor-pointer rounded-lg border p-3 text-sm ${method === "bank_transfer" ? "border-amber-300/70 bg-amber-300/10" : "border-white/10"}`}><input type="radio" name="topup-method" value="bank_transfer" checked={method === "bank_transfer"} onChange={() => setMethod("bank_transfer")} className="mr-2 accent-amber-300" />โอนผ่านธนาคาร</label>
        </div>
        <div className="mt-3 rounded-lg bg-slate-950/70 p-3 text-sm text-slate-300">
          {method === "promptpay" ? config.promptPayId ? <p>PromptPay: <strong className="text-white">{config.promptPayId}</strong></p> : <p>ยังไม่ได้ตั้งค่า PromptPay กรุณาติดต่อร้านค้าเพื่อขอข้อมูลชำระเงิน</p> : config.accountNumber ? <><p>ธนาคาร: <strong className="text-white">{config.bankName || "-"}</strong></p><p>ชื่อบัญชี: <strong className="text-white">{config.accountName || "-"}</strong></p><p>เลขบัญชี: <strong className="text-white">{config.accountNumber}</strong></p></> : <p>ยังไม่ได้ตั้งค่าบัญชีธนาคาร กรุณาติดต่อร้านค้าเพื่อขอข้อมูลชำระเงิน</p>}
        </div>
        <h3 className="mt-5 font-bold">2. แจ้งยอดและเลขอ้างอิงการโอน</h3>
        <label className="mt-3 block text-sm text-slate-300">จำนวนเงิน (50–50,000 บาท)<input type="number" min="50" max="50000" step="1" required value={amount} onChange={(event) => setAmount(event.target.value)} className="mt-1 w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2.5 text-white outline-none focus:border-amber-300" /></label>
        <label className="mt-3 block text-sm text-slate-300">เลขอ้างอิง/เลขที่รายการจากสลิป<input required maxLength="100" value={transactionReference} onChange={(event) => setTransactionReference(event.target.value)} placeholder="เช่น เลขที่รายการ หรือเวลาโอน" className="mt-1 w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2.5 text-white outline-none focus:border-amber-300" /></label>
        <p className="mt-2 text-xs leading-5 text-slate-500">คำขอจะอยู่ในสถานะรอตรวจสอบ ร้านค้าจะเพิ่มเงินเข้ากระเป๋าหลังตรวจรายการโอนแล้ว</p>
        {error && <p className="mt-3 rounded-lg bg-rose-500/10 p-3 text-sm text-rose-200">{error}</p>}
        {notice && <p className="mt-3 rounded-lg bg-emerald-500/10 p-3 text-sm text-emerald-200">{notice}</p>}
        <button disabled={submitting} className="mt-4 w-full rounded-xl bg-amber-300 py-3 font-bold text-slate-950 disabled:opacity-60">{submitting ? "กำลังส่งคำขอ..." : "ส่งคำขอเติมเงิน"}</button>
      </form>

      <section className="mt-5">
        <div className="mb-3 flex items-center justify-between"><h3 className="font-bold">ประวัติรายการ</h3><button type="button" onClick={load} disabled={loading} className="text-sm text-amber-300 disabled:opacity-50">{loading ? "กำลังโหลด..." : "รีเฟรช"}</button></div>
        {!topUps.length && !transactions.length ? <p className="rounded-lg border border-white/10 p-4 text-sm text-slate-500">ยังไม่มีรายการเติมหรือใช้เงิน</p> : <div className="max-h-52 space-y-2 overflow-auto">{topUps.map((item) => <div key={item._id} className="flex items-center justify-between gap-3 rounded-lg border border-white/10 p-3 text-sm"><span><strong className="block">เติมเงิน · {money.format(item.amount)}</strong><span className="text-xs text-slate-500">{new Date(item.createdAt).toLocaleString("th-TH")} · {item.transactionReference}</span></span><span className={item.status === "approved" ? "text-emerald-300" : item.status === "rejected" ? "text-rose-300" : "text-amber-300"}>{statusLabels[item.status] || item.status}</span></div>)}{transactions.map((item) => <div key={item._id} className="flex items-center justify-between gap-3 rounded-lg border border-white/10 p-3 text-sm"><span><strong className="block">{item.type === "topup" ? "เติมเงิน" : "ชำระคำสั่งซื้อ"}</strong><span className="text-xs text-slate-500">{new Date(item.createdAt).toLocaleString("th-TH")}</span></span><strong className={item.amount >= 0 ? "text-emerald-300" : "text-rose-300"}>{item.amount >= 0 ? "+" : ""}{money.format(item.amount)}</strong></div>)}</div>}
      </section>
    </section>
  </div>;
}
