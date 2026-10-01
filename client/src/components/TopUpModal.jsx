import { useEffect, useState } from "react";
import { API_URL } from "../config/api";

const money = new Intl.NumberFormat("th-TH", { style: "currency", currency: "THB", maximumFractionDigits: 0 });
const statusLabels = { pending: "รอตรวจสอบ", approved: "อนุมัติแล้ว", rejected: "ไม่อนุมัติ" };
const orderStatusLabels = { pending_payment: "รอชำระเงิน", paid: "ชำระแล้ว", processing: "กำลังจัดเตรียม", shipped: "จัดส่งแล้ว", completed: "สำเร็จ", cancelled: "ยกเลิก" };

export default function TopUpModal({ walletBalance = 0, onClose, onWalletUpdated }) {
  const [amount, setAmount] = useState(500);
  const [method, setMethod] = useState("promptpay");
  const [transactionReference, setTransactionReference] = useState("");
  const [config, setConfig] = useState({});
  const [topUps, setTopUps] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [orders, setOrders] = useState([]);
  const [tab, setTab] = useState("topup");
  const [error, setError] = useState("");
  const [historyError, setHistoryError] = useState("");
  const [configError, setConfigError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    setLoading(true);
    setHistoryError("");
    try {
      const token = localStorage.getItem("dueldeck_token");
      const headers = { Authorization: `Bearer ${token}` };
      const [accountResult, ordersResult] = await Promise.allSettled([
        fetch(`${API_URL}/topups/me`, { headers }),
        fetch(`${API_URL}/orders`, { headers }),
      ]);
      const errors = [];

      if (accountResult.status === "fulfilled") {
        try {
          const accountResponse = accountResult.value;
          const accountData = await accountResponse.json();
          if (accountResponse.ok) {
            setTopUps(accountData.topUps || []);
            setTransactions(accountData.transactions || []);
            onWalletUpdated(accountData.walletBalance || 0);
          } else {
            errors.push(accountData.message || "โหลดประวัติเงินเข้าออกไม่สำเร็จ");
          }
        } catch {
          errors.push("โหลดประวัติเงินเข้าออกไม่สำเร็จ");
        }
      } else {
        errors.push("โหลดประวัติเงินเข้าออกไม่สำเร็จ");
      }

      if (ordersResult.status === "fulfilled") {
        try {
          const ordersResponse = ordersResult.value;
          const ordersData = await ordersResponse.json();
          if (ordersResponse.ok) setOrders(Array.isArray(ordersData) ? ordersData : []);
          else errors.push(ordersData.message || "โหลดประวัติคำสั่งซื้อไม่สำเร็จ");
        } catch {
          errors.push("โหลดประวัติคำสั่งซื้อไม่สำเร็จ");
        }
      } else {
        errors.push("โหลดประวัติคำสั่งซื้อไม่สำเร็จ");
      }

      setHistoryError(errors.join(" · "));
    } catch (requestError) {
      setHistoryError(requestError.message === "Failed to fetch" ? "เชื่อมต่อเซิร์ฟเวอร์ไม่ได้" : requestError.message);
    } finally {
      setLoading(false);
    }
  };

  const loadConfig = async () => {
    setConfigError("");
    try {
      const response = await fetch(`${API_URL}/topups/config`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "โหลดข้อมูลบัญชีรับเงินไม่สำเร็จ");
      setConfig(data);
    } catch (requestError) {
      setConfigError(requestError.message === "Failed to fetch" ? "โหลดข้อมูลบัญชีรับเงินไม่สำเร็จ" : requestError.message);
    }
  };

  useEffect(() => { load(); loadConfig(); }, []);

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
      <div className="mt-4 grid grid-cols-2 gap-2 rounded-xl bg-slate-950/70 p-1">
        <button type="button" onClick={() => setTab("topup")} className={`rounded-lg px-3 py-2 text-sm font-bold ${tab === "topup" ? "bg-amber-300 text-slate-950" : "text-slate-300"}`}>เติมเงิน</button>
        <button type="button" onClick={() => setTab("history")} className={`rounded-lg px-3 py-2 text-sm font-bold ${tab === "history" ? "bg-amber-300 text-slate-950" : "text-slate-300"}`}>ประวัติเงินเข้าออก / ซื้อขาย</button>
      </div>

      {tab === "topup" && <form onSubmit={submit} className="mt-5 rounded-xl border border-white/10 bg-white/[.03] p-4">
        <h3 className="font-bold">1. โอนเงินเข้าร้าน</h3>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <label className={`cursor-pointer rounded-lg border p-3 text-sm ${method === "promptpay" ? "border-amber-300/70 bg-amber-300/10" : "border-white/10"}`}><input type="radio" name="topup-method" value="promptpay" checked={method === "promptpay"} onChange={() => setMethod("promptpay")} className="mr-2 accent-amber-300" />PromptPay</label>
          <label className={`cursor-pointer rounded-lg border p-3 text-sm ${method === "bank_transfer" ? "border-amber-300/70 bg-amber-300/10" : "border-white/10"}`}><input type="radio" name="topup-method" value="bank_transfer" checked={method === "bank_transfer"} onChange={() => setMethod("bank_transfer")} className="mr-2 accent-amber-300" />โอนผ่านธนาคาร</label>
        </div>
        <div className="mt-3 rounded-lg bg-slate-950/70 p-3 text-sm text-slate-300">
          {method === "promptpay" ? config.promptPayId ? <p>PromptPay: <strong className="text-white">{config.promptPayId}</strong></p> : <p>ยังไม่ได้ตั้งค่า PromptPay กรุณาติดต่อร้านค้าเพื่อขอข้อมูลชำระเงิน</p> : config.accountNumber ? <><p>ธนาคาร: <strong className="text-white">{config.bankName || "-"}</strong></p><p>ชื่อบัญชี: <strong className="text-white">{config.accountName || "-"}</strong></p><p>เลขบัญชี: <strong className="text-white">{config.accountNumber}</strong></p></> : <p>ยังไม่ได้ตั้งค่าบัญชีธนาคาร กรุณาติดต่อร้านค้าเพื่อขอข้อมูลชำระเงิน</p>}
        </div>
        {configError && <p role="alert" className="mt-3 rounded-lg bg-rose-500/10 p-3 text-sm text-rose-200">{configError}</p>}
        <h3 className="mt-5 font-bold">2. แจ้งยอดและเลขอ้างอิงการโอน</h3>
        <label className="mt-3 block text-sm text-slate-300">จำนวนเงิน (50–50,000 บาท)<input type="number" min="50" max="50000" step="1" required value={amount} onChange={(event) => setAmount(event.target.value)} className="mt-1 w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2.5 text-white outline-none focus:border-amber-300" /></label>
        <label className="mt-3 block text-sm text-slate-300">เลขอ้างอิง/เลขที่รายการจากสลิป<input required maxLength="100" value={transactionReference} onChange={(event) => setTransactionReference(event.target.value)} placeholder="เช่น เลขที่รายการ หรือเวลาโอน" className="mt-1 w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2.5 text-white outline-none focus:border-amber-300" /></label>
        <p className="mt-2 text-xs leading-5 text-slate-500">คำขอจะอยู่ในสถานะรอตรวจสอบ ร้านค้าจะเพิ่มเงินเข้ากระเป๋าหลังตรวจรายการโอนแล้ว</p>
        {error && <p className="mt-3 rounded-lg bg-rose-500/10 p-3 text-sm text-rose-200">{error}</p>}
        {notice && <p className="mt-3 rounded-lg bg-emerald-500/10 p-3 text-sm text-emerald-200">{notice}</p>}
        <button disabled={submitting} className="mt-4 w-full rounded-xl bg-amber-300 py-3 font-bold text-slate-950 disabled:opacity-60">{submitting ? "กำลังส่งคำขอ..." : "ส่งคำขอเติมเงิน"}</button>
      </form>}

      {tab === "history" && <section className="mt-5 space-y-6">
        {historyError && <p role="alert" className="rounded-lg bg-rose-500/10 p-3 text-sm text-rose-200">{historyError}</p>}
        <div>
          <div className="mb-3 flex items-center justify-between"><h3 className="font-bold">เงินเข้า / เงินออก</h3><button type="button" onClick={load} disabled={loading} className="text-sm text-amber-300 disabled:opacity-50">{loading ? "กำลังโหลด..." : "รีเฟรช"}</button></div>
          {transactions.length === 0 ? <p className="rounded-lg border border-white/10 p-4 text-sm text-slate-500">{loading ? "กำลังโหลดประวัติ..." : historyError ? "โหลดรายการเงินไม่สำเร็จ ลองกดรีเฟรช" : "ยังไม่มีรายการเงินเข้าออก รายการจะเริ่มแสดงเมื่อเติมเงินได้รับอนุมัติหรือใช้กระเป๋าชำระคำสั่งซื้อ"}</p> : <div className="max-h-60 space-y-2 overflow-auto">{transactions.map((item) => <div key={item._id} className="flex items-center justify-between gap-3 rounded-lg border border-white/10 p-3 text-sm"><span className="min-w-0"><strong className="block">{item.type === "topup" ? "เงินเข้า · เติมเงิน" : item.type === "admin_credit" ? "เงินเข้า · แอดมินเติมให้" : "เงินออก · ชำระคำสั่งซื้อ"}</strong><span className="block text-xs text-slate-500">{new Date(item.createdAt).toLocaleString("th-TH")} · ยอดคงเหลือ {money.format(item.balanceAfter)}</span><span className="block truncate text-xs text-slate-500">{item.description}</span></span><strong className={item.amount >= 0 ? "shrink-0 text-emerald-300" : "shrink-0 text-rose-300"}>{item.amount >= 0 ? "+" : "−"}{money.format(Math.abs(item.amount))}</strong></div>)}</div>}
        </div>
        <div>
          <h3 className="mb-3 font-bold">คำขอเติมเงิน</h3>
          {topUps.filter((item) => item.status !== "approved").length === 0 ? <p className="rounded-lg border border-white/10 p-4 text-sm text-slate-500">ไม่มีคำขอที่รอตรวจสอบหรือถูกปฏิเสธ</p> : <div className="max-h-48 space-y-2 overflow-auto">{topUps.filter((item) => item.status !== "approved").map((item) => <div key={item._id} className="flex items-center justify-between gap-3 rounded-lg border border-white/10 p-3 text-sm"><span><strong className="block">{money.format(item.amount)} · {item.method === "promptpay" ? "PromptPay" : "โอนธนาคาร"}</strong><span className="text-xs text-slate-500">{new Date(item.createdAt).toLocaleString("th-TH")} · {item.transactionReference}</span></span><span className={item.status === "rejected" ? "text-rose-300" : "text-amber-300"}>{statusLabels[item.status] || item.status}</span></div>)}</div>}
        </div>
        <div>
          <h3 className="mb-3 font-bold">ประวัติซื้อขาย / คำสั่งซื้อ</h3>
          {orders.length === 0 ? <p className="rounded-lg border border-white/10 p-4 text-sm text-slate-500">{loading ? "กำลังโหลดประวัติ..." : historyError ? "โหลดคำสั่งซื้อไม่สำเร็จ ลองกดรีเฟรช" : "ยังไม่มีประวัติคำสั่งซื้อ"}</p> : <div className="max-h-72 space-y-2 overflow-auto">{orders.map((order) => <article key={order._id} className="rounded-lg border border-white/10 p-3 text-sm"><div className="flex items-start justify-between gap-3"><span><strong className="block">{order.orderNumber} · {money.format(order.total)}</strong><span className="block text-xs text-slate-500">{new Date(order.createdAt).toLocaleString("th-TH")} · {order.paymentMethod === "wallet" ? "ชำระด้วยกระเป๋าเงิน" : "เก็บเงินปลายทาง"}</span></span><span className="shrink-0 text-amber-300">{orderStatusLabels[order.status] || order.status}</span></div><p className="mt-2 text-xs leading-5 text-slate-400">{order.items.map((item) => `${item.name} × ${item.quantity}`).join(", ")}</p></article>)}</div>}
        </div>
      </section>}
    </section>
  </div>;
}
