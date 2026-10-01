import { useState } from "react";
import { API_URL } from "../config/api";

const initialAddress = {
  recipientName: "",
  phone: "",
  addressLine: "",
  district: "",
  province: "",
  postalCode: "",
};
const money = new Intl.NumberFormat("th-TH", { style: "currency", currency: "THB", maximumFractionDigits: 0 });

export default function CheckoutModal({ cart, walletBalance = 0, onClose, onCompleted }) {
  const [address, setAddress] = useState(initialAddress);
  const [paymentMethod, setPaymentMethod] = useState("cash_on_delivery");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const token = localStorage.getItem("dueldeck_token");
      const response = await fetch(`${API_URL}/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          items: cart.map(({ card, quantity }) => (card.kind === "boosterBox" ? { boosterBox: card._id, quantity } : { card: card._id, quantity })),
          shippingAddress: address,
          paymentMethod,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "สร้างคำสั่งซื้อไม่สำเร็จ");
      onCompleted(data);
    } catch (requestError) {
      setError(requestError.message === "Failed to fetch" ? "ไม่สามารถเชื่อมต่อ server ได้" : requestError.message);
    } finally {
      setLoading(false);
    }
  };

  const update = (field) => (event) => setAddress({ ...address, [field]: event.target.value });
  const orderTotal = cart.reduce((sum, { card, quantity }) => sum + card.price * quantity, 40);
  return <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
    <form onSubmit={submit} className="relative max-h-[90vh] w-full max-w-lg overflow-auto rounded-2xl border border-white/15 bg-[#101729] p-6 shadow-2xl">
      <button type="button" onClick={onClose} className="absolute right-5 top-4 text-2xl text-slate-400">×</button>
      <p className="text-sm font-bold tracking-[.18em] text-amber-300">CHECKOUT</p>
      <h2 className="mt-2 font-display text-3xl font-black">ที่อยู่จัดส่ง</h2>
      <div className="mt-5 rounded-xl border border-white/10 bg-white/[.03] p-4">
        <p className="mb-3 text-sm font-bold">วิธีชำระเงิน · รวมค่าจัดส่ง {money.format(orderTotal)}</p>
        <label className="mb-2 flex cursor-pointer items-start gap-3 rounded-lg border border-white/10 p-3 text-sm"><input type="radio" name="payment-method" checked={paymentMethod === "cash_on_delivery"} onChange={() => setPaymentMethod("cash_on_delivery")} className="mt-1 accent-amber-300" /><span><strong className="block">เก็บเงินปลายทาง</strong><span className="text-xs text-slate-400">ชำระเมื่อได้รับสินค้า</span></span></label>
        <label className={`flex items-start gap-3 rounded-lg border p-3 text-sm ${walletBalance >= orderTotal ? "cursor-pointer border-white/10" : "cursor-not-allowed border-white/5 opacity-50"}`}><input type="radio" name="payment-method" disabled={walletBalance < orderTotal} checked={paymentMethod === "wallet"} onChange={() => setPaymentMethod("wallet")} className="mt-1 accent-amber-300" /><span><strong className="block">กระเป๋าเงิน · {money.format(walletBalance)}</strong><span className="text-xs text-slate-400">{walletBalance >= orderTotal ? "ตัดยอดทันทีเมื่อยืนยันคำสั่งซื้อ" : `ยอดไม่พอ · ต้องมีอย่างน้อย ${money.format(orderTotal)}`}</span></span></label>
      </div>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <label className="text-sm sm:col-span-2">ชื่อผู้รับ<input required value={address.recipientName} onChange={update("recipientName")} className="mt-1 w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2.5 outline-none focus:border-amber-300" /></label>
        <label className="text-sm">โทรศัพท์<input required value={address.phone} onChange={update("phone")} className="mt-1 w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2.5 outline-none focus:border-amber-300" /></label>
        <label className="text-sm">รหัสไปรษณีย์<input required value={address.postalCode} onChange={update("postalCode")} className="mt-1 w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2.5 outline-none focus:border-amber-300" /></label>
        <label className="text-sm sm:col-span-2">ที่อยู่<input required value={address.addressLine} onChange={update("addressLine")} className="mt-1 w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2.5 outline-none focus:border-amber-300" /></label>
        <label className="text-sm">เขต/อำเภอ<input required value={address.district} onChange={update("district")} className="mt-1 w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2.5 outline-none focus:border-amber-300" /></label>
        <label className="text-sm">จังหวัด<input required value={address.province} onChange={update("province")} className="mt-1 w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2.5 outline-none focus:border-amber-300" /></label>
      </div>
      {error && <p className="mt-4 rounded-lg bg-rose-500/10 p-3 text-sm text-rose-200">{error}</p>}
      <button disabled={loading} className="mt-6 w-full rounded-xl bg-amber-300 py-3 font-bold text-slate-950 disabled:opacity-60">{loading ? "กำลังสร้างคำสั่งซื้อ..." : "ยืนยันคำสั่งซื้อ"}</button>
    </form>
  </div>;
}
