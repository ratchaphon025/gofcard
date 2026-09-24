import { useState } from "react";
import { API_URL } from "../config/api";

const USER_API_URL = `${API_URL}/users`;

export default function AuthModal({ onClose, onAuthenticated }) {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const response = await fetch(`${USER_API_URL}/${mode === "login" ? "login" : "register"}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Unable to continue");
      localStorage.setItem("dueldeck_token", data.token);
      localStorage.setItem("dueldeck_user", JSON.stringify(data.user));
      onAuthenticated(data.user);
    } catch (requestError) {
      setError(requestError.message === "Failed to fetch" ? "ไม่สามารถเชื่อมต่อ server ได้" : requestError.message);
    } finally {
      setLoading(false);
    }
  };

  return <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
    <form onSubmit={submit} className="relative w-full max-w-md rounded-2xl border border-white/15 bg-[#101729] p-6 shadow-2xl">
      <button type="button" onClick={onClose} className="absolute right-5 top-4 text-2xl text-slate-400">×</button>
      <p className="text-sm font-bold tracking-[.18em] text-amber-300">DUELDECK ACCOUNT</p>
      <h2 className="mt-2 font-display text-3xl font-black">{mode === "login" ? "เข้าสู่ระบบ" : "สร้างบัญชีผู้ใช้"}</h2>
      <p className="mt-2 text-sm text-slate-400">{mode === "login" ? "ยินดีต้อนรับกลับมานักดูเอล" : "สมัครเพื่อบันทึกคำสั่งซื้อและที่อยู่จัดส่ง"}</p>
      <div className="mt-6 space-y-4">
        {mode === "register" && <label className="block text-sm">ชื่อที่แสดง<input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mt-1 w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2.5 outline-none focus:border-amber-300" /></label>}
        <label className="block text-sm">อีเมล<input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="mt-1 w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2.5 outline-none focus:border-amber-300" /></label>
        <label className="block text-sm">รหัสผ่าน<input required minLength="8" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="mt-1 w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2.5 outline-none focus:border-amber-300" /><span className="mt-1 block text-xs text-slate-500">อย่างน้อย 8 ตัวอักษร</span></label>
      </div>
      {error && <p className="mt-4 rounded-lg bg-rose-500/10 p-3 text-sm text-rose-200">{error}</p>}
      <button disabled={loading} className="mt-6 w-full rounded-xl bg-amber-300 py-3 font-bold text-slate-950 disabled:opacity-60">{loading ? "กำลังดำเนินการ..." : mode === "login" ? "เข้าสู่ระบบ" : "สมัครสมาชิก"}</button>
      <p className="mt-5 text-center text-sm text-slate-400">{mode === "login" ? "ยังไม่มีบัญชี?" : "มีบัญชีอยู่แล้ว?"} <button type="button" onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(""); }} className="font-bold text-amber-300">{mode === "login" ? "สมัครสมาชิก" : "เข้าสู่ระบบ"}</button></p>
    </form>
  </div>;
}
