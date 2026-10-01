import { useEffect, useState } from "react";
import { API_URL } from "../config/api";

const money = new Intl.NumberFormat("th-TH", { style: "currency", currency: "THB", maximumFractionDigits: 0 });
const topUpStatusLabels = { pending: "รอตรวจสอบ", approved: "อนุมัติแล้ว", rejected: "ไม่อนุมัติ" };
const orderStatusLabels = { pending_payment: "รอชำระเงิน", paid: "ชำระแล้ว", processing: "กำลังจัดเตรียม", shipped: "จัดส่งแล้ว", completed: "สำเร็จ", cancelled: "ยกเลิก" };

export default function WalletHistoryModal({ walletBalance = 0, onClose, onWalletUpdated }) {
  const [topUps, setTopUps] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [orders, setOrders] = useState([]);
  const [historyError, setHistoryError] = useState("");
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    setHistoryError("");
    const headers = { Authorization: `Bearer ${localStorage.getItem("dueldeck_token")}` };
    const [accountResult, ordersResult] = await Promise.allSettled([
      fetch(`${API_URL}/topups/me`, { headers }),
      fetch(`${API_URL}/orders`, { headers }),
    ]);
    const errors = [];

    if (accountResult.status === "fulfilled") {
      try {
        const response = accountResult.value;
        const data = await response.json();
        if (response.ok) {
          setTopUps(data.topUps || []);
          setTransactions(data.transactions || []);
          onWalletUpdated?.(data.walletBalance || 0);
        } else {
          errors.push(data.message || "โหลดประวัติเงินเข้าออกไม่สำเร็จ");
        }
      } catch {
        errors.push("โหลดประวัติเงินเข้าออกไม่สำเร็จ");
      }
    } else {
      errors.push("เชื่อมต่อประวัติเงินเข้าออกไม่ได้");
    }

    if (ordersResult.status === "fulfilled") {
      try {
        const response = ordersResult.value;
        const data = await response.json();
        if (response.ok) setOrders(Array.isArray(data) ? data : []);
        else errors.push(data.message || "โหลดประวัติซื้อขายไม่สำเร็จ");
      } catch {
        errors.push("โหลดประวัติซื้อขายไม่สำเร็จ");
      }
    } else {
      errors.push("เชื่อมต่อประวัติซื้อขายไม่ได้");
    }

    setHistoryError(errors.join(" · "));
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 p-4 backdrop-blur-sm" onClick={onClose}>
    <section role="dialog" aria-modal="true" aria-label="ประวัติเงินเข้าออกและซื้อขาย" onClick={(event) => event.stopPropagation()} className="max-h-[92vh] w-full max-w-3xl overflow-auto rounded-2xl border border-white/15 bg-[#101729] p-5 shadow-2xl sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div><p className="text-sm font-bold tracking-[.18em] text-amber-300">DUELDECK WALLET</p><h2 className="mt-1 font-display text-3xl font-black">ประวัติ</h2></div>
        <button type="button" onClick={onClose} aria-label="ปิด" className="text-2xl text-slate-400">×</button>
      </div>
      <div className="mt-4 flex items-center justify-between rounded-xl border border-amber-300/20 bg-amber-300/5 p-4"><span className="text-sm text-slate-300">ยอดเงินคงเหลือ</span><strong className="text-xl text-amber-300">{money.format(walletBalance)}</strong></div>
      <div className="mt-5 flex items-center justify-between gap-3"><h3 className="font-bold">รายการเงินเข้า / เงินออก</h3><button type="button" onClick={load} disabled={loading} className="text-sm text-amber-300 disabled:opacity-50">{loading ? "กำลังโหลด..." : "รีเฟรช"}</button></div>
      {historyError && <p role="alert" className="mt-3 rounded-lg bg-rose-500/10 p-3 text-sm text-rose-200">{historyError}</p>}
      {transactions.length === 0 ? <p className="mt-3 rounded-lg border border-white/10 p-4 text-sm text-slate-500">{loading ? "กำลังโหลดประวัติ..." : historyError ? "โหลดรายการเงินไม่สำเร็จ ลองกดรีเฟรช" : "ยังไม่มีรายการเงินเข้าออก รายการจะแสดงเมื่อเติมเงินได้รับอนุมัติหรือใช้กระเป๋าชำระคำสั่งซื้อ"}</p> : <div className="mt-3 max-h-60 space-y-2 overflow-auto">{transactions.map((item) => <div key={item._id} className="flex items-center justify-between gap-3 rounded-lg border border-white/10 p-3 text-sm"><span className="min-w-0"><strong className="block">{item.type === "topup" ? "เงินเข้า · เติมเงิน" : item.type === "admin_credit" ? "เงินเข้า · แอดมินเติมให้" : "เงินออก · ชำระคำสั่งซื้อ"}</strong><span className="block text-xs text-slate-500">{new Date(item.createdAt).toLocaleString("th-TH")} · ยอดคงเหลือ {money.format(item.balanceAfter)}</span><span className="block truncate text-xs text-slate-500">{item.description}</span></span><strong className={item.amount >= 0 ? "shrink-0 text-emerald-300" : "shrink-0 text-rose-300"}>{item.amount >= 0 ? "+" : "−"}{money.format(Math.abs(item.amount))}</strong></div>)}</div>}

      <div className="mt-6"><h3 className="mb-3 font-bold">คำขอเติมเงินที่ยังไม่อนุมัติ</h3>{topUps.filter((item) => item.status !== "approved").length === 0 ? <p className="rounded-lg border border-white/10 p-4 text-sm text-slate-500">ไม่มีคำขอที่รอตรวจสอบหรือถูกปฏิเสธ</p> : <div className="max-h-48 space-y-2 overflow-auto">{topUps.filter((item) => item.status !== "approved").map((item) => <div key={item._id} className="flex items-center justify-between gap-3 rounded-lg border border-white/10 p-3 text-sm"><span><strong className="block">{money.format(item.amount)} · {item.method === "promptpay" ? "PromptPay" : "โอนธนาคาร"}</strong><span className="text-xs text-slate-500">{new Date(item.createdAt).toLocaleString("th-TH")} · {item.transactionReference}</span></span><span className={item.status === "rejected" ? "text-rose-300" : "text-amber-300"}>{topUpStatusLabels[item.status] || item.status}</span></div>)}</div>}</div>

      <div className="mt-6"><h3 className="mb-3 font-bold">ประวัติซื้อขาย / คำสั่งซื้อ</h3>{orders.length === 0 ? <p className="rounded-lg border border-white/10 p-4 text-sm text-slate-500">{loading ? "กำลังโหลดประวัติ..." : historyError ? "โหลดประวัติซื้อขายไม่สำเร็จ ลองกดรีเฟรช" : "ยังไม่มีประวัติคำสั่งซื้อ"}</p> : <div className="max-h-72 space-y-2 overflow-auto">{orders.map((order) => <article key={order._id} className="rounded-lg border border-white/10 p-3 text-sm"><div className="flex items-start justify-between gap-3"><span><strong className="block">{order.orderNumber} · {money.format(order.total)}</strong><span className="block text-xs text-slate-500">{new Date(order.createdAt).toLocaleString("th-TH")} · {order.paymentMethod === "wallet" ? "ชำระด้วยกระเป๋าเงิน" : "เก็บเงินปลายทาง"}</span></span><span className="shrink-0 text-amber-300">{orderStatusLabels[order.status] || order.status}</span></div><p className="mt-2 text-xs leading-5 text-slate-400">{order.items.map((item) => `${item.name} × ${item.quantity}`).join(", ")}</p></article>)}</div>}</div>
    </section>
  </div>;
}
