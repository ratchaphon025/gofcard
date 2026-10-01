import { useEffect, useState } from "react";
import { API_URL } from "../config/api";

const initialForm = { name: "", email: "", subject: "", message: "", rating: 5 };

export default function CustomerFeedback() {
  const [type, setType] = useState("review");
  const [form, setForm] = useState(initialForm);
  const [reviews, setReviews] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    fetch(`${API_URL}/feedback`)
      .then((response) => response.ok ? response.json() : Promise.reject(new Error("โหลดความคิดเห็นไม่สำเร็จ")))
      .then(setReviews)
      .catch(() => setReviews([]))
      .finally(() => setLoadingReviews(false));
  }, []);

  const submit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch(`${API_URL}/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, type }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "ส่งข้อมูลไม่สำเร็จ");
      setNotice(type === "bug" ? "รับรายงานบั๊กแล้ว ขอบคุณที่ช่วยแจ้งให้เราทราบ" : "ส่งความคิดเห็นแล้ว ความคิดเห็นจะแสดงหลังแอดมินตรวจสอบ");
      setForm((current) => ({ ...initialForm, name: current.name, email: current.email }));
    } catch (requestError) {
      setError(requestError.message === "Failed to fetch" ? "เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ กรุณาลองอีกครั้ง" : requestError.message);
    } finally {
      setSubmitting(false);
    }
  };

  const update = (field) => (event) => setForm((current) => ({ ...current, [field]: event.target.value }));

  return <section id="customer-feedback" className="border-t border-white/10 bg-gradient-to-b from-slate-950/80 to-[#080b16]">
    <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[.8fr_1.2fr] lg:py-20">
      <div>
        <p className="text-sm font-black tracking-[.2em] text-amber-300">CUSTOMER VOICE</p>
        <h2 className="mt-2 font-display text-3xl font-black sm:text-4xl">ความคิดเห็นและแจ้งปัญหา</h2>
        <p className="mt-3 max-w-xl leading-7 text-slate-400">แบ่งปันประสบการณ์การใช้งาน หรือบอกเราเมื่อพบข้อผิดพลาด ทีมงานจะตรวจสอบทุกข้อความ</p>
        <div className="mt-8">
          <div className="mb-4 flex items-center justify-between gap-3"><h3 className="font-display text-xl font-bold">ความคิดเห็นจากลูกค้า</h3><span className="text-xs text-slate-500">แสดงเฉพาะรายการที่ตรวจสอบแล้ว</span></div>
          {loadingReviews ? <p className="text-sm text-slate-500">กำลังโหลดความคิดเห็น...</p> : reviews.length === 0 ? <div className="rounded-xl border border-white/10 bg-white/[.03] p-5 text-sm text-slate-500">ยังไม่มีความคิดเห็นที่เผยแพร่ เป็นคนแรกที่แบ่งปันได้นะ</div> : <div className="space-y-3">{reviews.slice(0, 4).map((review) => <article key={review._id} className="rounded-xl border border-white/10 bg-white/[.03] p-4"><div className="flex items-start justify-between gap-3"><div><h4 className="font-bold text-slate-100">{review.subject || review.name}</h4><p className="mt-1 text-xs text-slate-500">โดย {review.name} · {new Date(review.createdAt).toLocaleDateString("th-TH")}</p></div><span className="shrink-0 tracking-wider text-amber-300" aria-label={`${review.rating} จาก 5 ดาว`}>{"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}</span></div><p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-300">{review.message}</p></article>)}</div>}
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-[#101729] p-5 shadow-xl sm:p-7">
        <div className="grid grid-cols-2 gap-2 rounded-xl bg-slate-950/70 p-1">
          <button type="button" onClick={() => { setType("review"); setError(""); setNotice(""); }} className={`rounded-lg px-3 py-2.5 text-sm font-bold ${type === "review" ? "bg-amber-300 text-slate-950" : "text-slate-300"}`}>แสดงความคิดเห็น</button>
          <button type="button" onClick={() => { setType("bug"); setError(""); setNotice(""); }} className={`rounded-lg px-3 py-2.5 text-sm font-bold ${type === "bug" ? "bg-amber-300 text-slate-950" : "text-slate-300"}`}>แจ้งบั๊ก</button>
        </div>
        <form onSubmit={submit} className="mt-5 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-sm text-slate-300">ชื่อที่แสดง (ไม่บังคับ)<input maxLength="80" value={form.name} onChange={update("name")} placeholder="ลูกค้า" className="mt-1 w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2.5 text-white outline-none focus:border-amber-300" /></label>
            <label className="text-sm text-slate-300">อีเมลสำหรับติดต่อกลับ (ไม่บังคับ)<input type="email" maxLength="254" value={form.email} onChange={update("email")} placeholder="you@example.com" className="mt-1 w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2.5 text-white outline-none focus:border-amber-300" /></label>
          </div>
          {type === "review" && <fieldset><legend className="text-sm text-slate-300">ให้คะแนนประสบการณ์</legend><div className="mt-1 flex gap-1">{[1, 2, 3, 4, 5].map((rating) => <button key={rating} type="button" onClick={() => setForm((current) => ({ ...current, rating }))} aria-label={`${rating} ดาว`} aria-pressed={form.rating === rating} className={`text-3xl ${rating <= form.rating ? "text-amber-300" : "text-slate-600"}`}>★</button>)}</div></fieldset>}
          <label className="block text-sm text-slate-300">หัวข้อ (ไม่บังคับ)<input maxLength="120" value={form.subject} onChange={update("subject")} placeholder={type === "bug" ? "เช่น กดปุ่มสั่งซื้อแล้วไม่มีอะไรเกิดขึ้น" : "สรุปความคิดเห็นของคุณ"} className="mt-1 w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2.5 text-white outline-none focus:border-amber-300" /></label>
          <label className="block text-sm text-slate-300">{type === "bug" ? "รายละเอียดบั๊กและวิธีที่ทำให้พบ" : "ความคิดเห็น"}<textarea required minLength="10" maxLength="1500" rows="5" value={form.message} onChange={update("message")} placeholder={type === "bug" ? "บอกขั้นตอนที่ทำก่อนพบปัญหา และสิ่งที่เกิดขึ้น" : "เล่าประสบการณ์หรือข้อเสนอแนะของคุณ"} className="mt-1 w-full resize-y rounded-lg border border-white/15 bg-white/5 px-3 py-2.5 text-white outline-none placeholder:text-slate-500 focus:border-amber-300" /></label>
          {type === "bug" && <p className="-mt-2 text-xs leading-5 text-slate-500">รายงานบั๊กจะส่งให้แอดมินตรวจสอบและจะไม่แสดงต่อสาธารณะ</p>}
          {error && <p role="alert" className="rounded-lg bg-rose-500/10 p-3 text-sm text-rose-200">{error}</p>}
          {notice && <p role="status" className="rounded-lg bg-emerald-500/10 p-3 text-sm text-emerald-200">{notice}</p>}
          <button disabled={submitting} className="w-full rounded-xl bg-amber-300 px-5 py-3 font-bold text-slate-950 transition hover:bg-amber-200 disabled:cursor-wait disabled:opacity-60">{submitting ? "กำลังส่ง..." : type === "bug" ? "ส่งรายงานบั๊ก" : "ส่งความคิดเห็น"}</button>
          <p className="text-center text-xs text-slate-500">ความคิดเห็นจะแสดงเมื่อผ่านการตรวจสอบจากทีมงาน</p>
        </form>
      </div>
    </div>
  </section>;
}
