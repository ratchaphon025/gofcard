import { useEffect, useState } from "react";
import { API_URL } from "../config/api";

const emptyCard = {
  cardCode: "",
  name: "",
  cardType: "Monster",
  monsterType: "",
  rarity: "Normal",
  price: 0,
  stock: 0,
  condition: "Near Mint",
  imageUrl: "",
  isBoxPullOnly: false,
  boosterBoxCodes: [],
};
const money = new Intl.NumberFormat("th-TH", { style: "currency", currency: "THB", maximumFractionDigits: 0 });

export default function AdminPanel({ onClose, onSaved }) {
  const token = localStorage.getItem("dueldeck_token");
  const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
  const [cards, setCards] = useState([]);
  const [users, setUsers] = useState([]);
  const [topUps, setTopUps] = useState([]);
  const [orders, setOrders] = useState([]);
  const [feedback, setFeedback] = useState([]);
  const [editing, setEditing] = useState(emptyCard);
  const [fundingUserId, setFundingUserId] = useState("");
  const [fundAmount, setFundAmount] = useState(100);
  const [fundNote, setFundNote] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [uploading, setUploading] = useState(false);
  const [crediting, setCrediting] = useState(false);

  const load = async () => {
    const adminRequests = [
      ["การ์ด", `${API_URL}/cards/admin`],
      ["ผู้ใช้", `${API_URL}/users`],
      ["รายการเติมเงิน", `${API_URL}/topups/admin`],
      ["คำสั่งซื้อ", `${API_URL}/orders/admin`],
      ["ความคิดเห็น", `${API_URL}/feedback/admin`],
    ];
    const responses = await Promise.all(adminRequests.map(async ([label, url]) => {
      try {
        return await fetch(url, { headers });
      } catch (requestError) {
        throw new Error(`เชื่อมต่อ API ส่วน${label}ไม่ได้: ${requestError.message}`);
      }
    }));
    const failedIndex = responses.findIndex((response) => !response.ok);
    if (failedIndex !== -1) {
      const response = responses[failedIndex];
      const [label] = adminRequests[failedIndex];
      const data = await response.json().catch(() => ({}));
      const detail = data.message ? ` — ${data.message}` : "";
      if (response.status === 401) throw new Error(`เซสชันหมดอายุหรือ token ใช้ไม่ได้ กรุณาออกจากระบบแล้วเข้าสู่ระบบใหม่ (${label}: 401${detail})`);
      if (response.status === 403) throw new Error(`บัญชีนี้ไม่มีสิทธิ์ผู้ดูแล (${label}: 403${detail})`);
      throw new Error(`โหลดข้อมูล${label}ไม่สำเร็จ (HTTP ${response.status}${detail})`);
    }
    const [cardsResponse, usersResponse, topUpsResponse, ordersResponse, feedbackResponse] = responses;
    setCards(await cardsResponse.json());
    setUsers(await usersResponse.json());
    setTopUps(await topUpsResponse.json());
    setOrders(await ordersResponse.json());
    setFeedback(await feedbackResponse.json());
  };

  useEffect(() => {
    load().catch((requestError) => setError(requestError.message));
  }, []);

  const saveCardData = async (card) => {
    setError("");
    const isNew = !card._id;
    const response = await fetch(`${API_URL}/cards${isNew ? "" : `/${card._id}`}`, {
      method: isNew ? "POST" : "PATCH",
      headers,
      body: JSON.stringify({
        cardCode: card.cardCode,
        name: card.name,
        cardType: card.cardType,
        monsterType: card.monsterType || null,
        rarity: card.rarity,
        price: Number(card.price),
        stock: Number(card.stock),
        condition: card.condition,
        effectTH: card.effectTH || "",
        imageUrl: card.imageUrl || "",
        isBoxPullOnly: Boolean(card.isBoxPullOnly),
        boosterBoxCodes: Array.isArray(card.boosterBoxCodes) ? card.boosterBoxCodes : [],
      }),
    });
    const data = await response.json();
    if (!response.ok) return setError(data.message || "Could not save card");
    setCards((currentCards) => isNew ? [data, ...currentCards] : currentCards.map((currentCard) => currentCard._id === data._id ? data : currentCard));
    setEditing(emptyCard);
    onSaved(data);
  };

  const saveCard = async (event) => {
    event.preventDefault();
    await saveCardData(editing);
  };

  const uploadImage = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    setError("");
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await fetch(`${API_URL}/uploads`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Could not upload image");
      setEditing((current) => ({ ...current, imageUrl: data.url }));
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  };

  const updateUser = async (user, changes) => {
    const response = await fetch(`${API_URL}/users/${user.id}`, { method: "PATCH", headers, body: JSON.stringify(changes) });
    if (!response.ok) {
      const data = await response.json();
      return setError(data.message || "Could not update user");
    }
    await load();
  };

  const reviewTopUp = async (topUp, decision) => {
    setError("");
    const response = await fetch(`${API_URL}/topups/${topUp._id}/review`, {
      method: "PATCH",
      headers,
      body: JSON.stringify({ decision }),
    });
    const data = await response.json();
    if (!response.ok) return setError(data.message || "Could not review top-up");
    await load();
  };

  const reviewFeedback = async (item, status) => {
    setError("");
    const response = await fetch(`${API_URL}/feedback/${item._id}/review`, {
      method: "PATCH",
      headers,
      body: JSON.stringify({ status }),
    });
    const data = await response.json();
    if (!response.ok) return setError(data.message || "Could not review feedback");
    await load();
  };

  const creditWallet = async (event) => {
    event.preventDefault();
    setError("");
    setNotice("");
    setCrediting(true);
    try {
      const response = await fetch(`${API_URL}/users/${fundingUserId}/wallet`, {
        method: "POST",
        headers,
        body: JSON.stringify({ amount: Number(fundAmount), note: fundNote }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Could not credit wallet");
      setNotice(`${money.format(Number(fundAmount))} added to ${data.user.email}'s wallet`);
      setFundingUserId("");
      setFundNote("");
      await load();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setCrediting(false);
    }
  };

  const field = (key, label, type = "text") => <label className="text-xs text-slate-300">{label}<input type={type} required={["cardCode", "name"].includes(key)} value={editing[key] ?? ""} onChange={(event) => setEditing({ ...editing, [key]: event.target.value })} className="mt-1 w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 outline-none focus:border-amber-300" /></label>;

  return <div className="fixed inset-0 z-50 overflow-auto bg-slate-950/95 p-4 sm:p-8">
    <div className="mx-auto max-w-6xl">
      <div className="mb-6 flex items-center justify-between"><div><p className="text-sm font-bold tracking-[.18em] text-amber-300">ADMIN CONSOLE</p><h2 className="font-display text-3xl font-black">Store management</h2></div><button onClick={onClose} className="text-2xl text-slate-400">&times;</button></div>
      {error && <p className="mb-4 rounded-lg bg-rose-500/10 p-3 text-sm text-rose-200">{error}</p>}
      {notice && <p className="mb-4 rounded-lg bg-emerald-500/10 p-3 text-sm text-emerald-200">{notice}</p>}
      <div className="grid gap-6 lg:grid-cols-[1fr_1.3fr]">
        <form onSubmit={saveCard} className="rounded-2xl border border-white/10 bg-[#101729] p-5"><h3 className="mb-4 font-bold">{editing._id ? "Edit card" : "Add card"}</h3><div className="grid gap-3 sm:grid-cols-2">{field("cardCode", "Card code")}{field("name", "Name")}<label className="text-xs text-slate-300">Type<select value={editing.cardType} onChange={(event) => setEditing({ ...editing, cardType: event.target.value })} className="mt-1 w-full rounded-lg border border-white/15 bg-slate-900 px-3 py-2"><option>Monster</option><option>Spell</option><option>Trap</option></select></label><label className="text-xs text-slate-300">Summon type<select value={editing.monsterType || ""} onChange={(event) => setEditing({ ...editing, monsterType: event.target.value })} className="mt-1 w-full rounded-lg border border-white/15 bg-slate-900 px-3 py-2"><option value="">None</option><option>Fusion</option><option>Xyz</option><option>Synchro</option><option>Pendulum</option></select></label><label className="text-xs text-slate-300">Rarity<select value={editing.rarity} onChange={(event) => setEditing({ ...editing, rarity: event.target.value })} className="mt-1 w-full rounded-lg border border-white/15 bg-slate-900 px-3 py-2"><option>Normal</option><option>Rare</option><option>Super Rare</option><option>Ultra Rare</option><option>Secret Rare</option></select></label>{field("price", "Price", "number")}{field("stock", "Stock", "number")}</div><label className="mt-4 flex items-center gap-2 text-xs text-slate-300"><input type="checkbox" checked={Boolean(editing.isBoxPullOnly)} onChange={(event) => setEditing({ ...editing, isBoxPullOnly: event.target.checked })} />Booster Box pull-only card</label><label className="mt-3 block text-xs text-slate-300">Booster Box codes (comma-separated)<input value={(editing.boosterBoxCodes || []).join(", ")} onChange={(event) => setEditing({ ...editing, boosterBoxCodes: event.target.value.split(",").map((code) => code.trim()).filter(Boolean) })} className="mt-1 w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 outline-none focus:border-amber-300" /></label><label className="mt-4 block text-xs text-slate-300">Card image<input type="file" accept="image/*" onChange={uploadImage} disabled={uploading} className="mt-1 block w-full text-sm" /></label>{editing.imageUrl && <img src={editing.imageUrl} alt="Card preview" className="mt-3 h-32 w-24 rounded object-cover" />}<div className="mt-4 flex gap-2"><button disabled={uploading} className="rounded-lg bg-amber-300 px-4 py-2 font-bold text-slate-950">Save</button>{editing._id && <button type="button" onClick={() => setEditing(emptyCard)} className="rounded-lg border border-white/15 px-4 py-2">Cancel</button>}</div></form>
        <section className="rounded-2xl border border-white/10 bg-[#101729] p-5"><h3 className="mb-2 font-bold">Cards ({cards.length})</h3><div className="max-h-80 space-y-2 overflow-auto">{cards.map((card) => <button key={card._id} type="button" onClick={() => setEditing({ ...emptyCard, ...card })} className="flex w-full items-center gap-3 rounded-lg border border-white/10 p-3 text-left hover:border-amber-300/60"><img src={card.imageUrl || "https://placehold.co/48x64/111827/fbbf24?text=?"} alt="" className="h-16 w-12 rounded object-cover" /><span><strong className="block">{card.name}</strong><span className="text-xs text-slate-400">{card.cardCode} · {card.stock} in stock</span></span></button>)}</div><h3 className="mb-2 mt-6 font-bold">Users ({users.length})</h3><div className="max-h-64 space-y-2 overflow-auto">{users.map((user) => <div key={user.id} className="flex items-center justify-between gap-3 rounded-lg border border-white/10 p-3 text-sm"><span className="min-w-0"><strong className="block truncate">{user.email}</strong><span className="text-xs text-amber-300">Wallet {money.format(user.walletBalance || 0)}</span></span><span className="flex shrink-0 gap-2"><select value={user.role} onChange={(event) => updateUser(user, { role: event.target.value })} className="rounded bg-slate-900 px-2 py-1"><option value="customer">customer</option><option value="admin">admin</option></select><button type="button" onClick={() => updateUser(user, { isActive: !user.isActive })} className="rounded border border-white/15 px-2 py-1">{user.isActive ? "Disable" : "Enable"}</button></span></div>)}</div><h3 className="mb-2 mt-6 font-bold">Top-up requests ({topUps.filter((topUp) => topUp.status === "pending").length} pending)</h3><div className="max-h-96 space-y-2 overflow-auto">{topUps.length === 0 && <p className="text-sm text-slate-500">No top-up requests</p>}{topUps.map((topUp) => <div key={topUp._id} className="rounded-lg border border-white/10 p-3 text-sm"><div className="flex items-start justify-between gap-3"><span><strong className="block">{topUp.user?.name || "Unknown user"} · {money.format(topUp.amount)}</strong><span className="text-xs text-slate-400">{topUp.user?.email} · {topUp.method === "promptpay" ? "PromptPay" : "Bank transfer"}</span><span className="block text-xs text-slate-500">Ref: {topUp.transactionReference} · {new Date(topUp.createdAt).toLocaleString("th-TH")}</span></span><span className={topUp.status === "approved" ? "text-emerald-300" : topUp.status === "rejected" ? "text-rose-300" : "text-amber-300"}>{topUp.status}</span></div>{topUp.status === "pending" && <div className="mt-3 flex gap-2"><button type="button" onClick={() => reviewTopUp(topUp, "approved")} className="rounded bg-emerald-500/15 px-3 py-1.5 font-bold text-emerald-200">Approve</button><button type="button" onClick={() => reviewTopUp(topUp, "rejected")} className="rounded bg-rose-500/15 px-3 py-1.5 font-bold text-rose-200">Reject</button></div>}{topUp.reviewNote && <p className="mt-2 text-xs text-slate-500">{topUp.reviewNote}</p>}</div>)}</div>
          <h3 className="mb-2 mt-6 font-bold">Sales history ({orders.length})</h3>
          <div className="max-h-96 space-y-2 overflow-auto">{orders.length === 0 && <p className="text-sm text-slate-500">No orders yet</p>}{orders.map((order) => <article key={order._id} className="rounded-lg border border-white/10 p-3 text-sm"><div className="flex items-start justify-between gap-3"><span className="min-w-0"><strong className="block">{order.orderNumber} · {money.format(order.total)}</strong><span className="block truncate text-xs text-slate-400">{order.user?.name || "Unknown user"} · {order.user?.email || ""}</span><span className="block text-xs text-slate-500">{new Date(order.createdAt).toLocaleString("th-TH")} · {order.paymentMethod === "wallet" ? "Wallet" : "Cash on delivery"}</span></span><span className="shrink-0 text-amber-300">{order.status}</span></div><p className="mt-2 text-xs leading-5 text-slate-400">{order.items.map((item) => `${item.name} × ${item.quantity}`).join(", ")}</p></article>)}</div>
        </section>
        <section className="rounded-2xl border border-amber-300/20 bg-[#101729] p-5 lg:col-span-2">
          <h3 className="font-bold">Add funds to a user wallet</h3>
          <p className="mt-1 text-xs text-slate-400">This credit is recorded in the user's wallet history with the admin and note.</p>
          <form onSubmit={creditWallet} className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <label className="text-xs text-slate-300 lg:col-span-2">User<select required value={fundingUserId} onChange={(event) => setFundingUserId(event.target.value)} className="mt-1 w-full rounded-lg border border-white/15 bg-slate-900 px-3 py-2.5 text-sm text-white"><option value="">Choose a user</option>{users.map((user) => <option key={user.id} value={user.id}>{user.name} · {user.email} · {money.format(user.walletBalance || 0)}</option>)}</select></label>
            <label className="text-xs text-slate-300">Amount (1–50,000 THB)<input type="number" min="1" max="50000" step="1" required value={fundAmount} onChange={(event) => setFundAmount(event.target.value)} className="mt-1 w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2.5 text-sm text-white" /></label>
            <label className="text-xs text-slate-300">Note (optional)<input maxLength="200" value={fundNote} onChange={(event) => setFundNote(event.target.value)} placeholder="Reason for credit" className="mt-1 w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2.5 text-sm text-white" /></label>
            <button disabled={!fundingUserId || crediting} className="rounded-lg bg-amber-300 px-4 py-2.5 text-sm font-bold text-slate-950 disabled:opacity-50 sm:col-span-2 lg:col-span-1">{crediting ? "Adding funds..." : "Add funds"}</button>
          </form>
        </section>
        <section className="rounded-2xl border border-white/10 bg-[#101729] p-5 lg:col-span-2">
          <h3 className="font-bold">Customer comments and bug reports ({feedback.filter((item) => item.status === "pending").length} pending)</h3>
          <div className="mt-3 max-h-[30rem] space-y-3 overflow-auto">{feedback.length === 0 && <p className="text-sm text-slate-500">No feedback yet</p>}{feedback.map((item) => <article key={item._id} className="rounded-xl border border-white/10 p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><span className={`rounded-md px-2 py-1 text-xs font-bold ${item.type === "bug" ? "bg-rose-500/10 text-rose-200" : "bg-amber-300/10 text-amber-200"}`}>{item.type === "bug" ? "Bug report" : `Customer review${item.rating ? ` · ${item.rating}/5` : ""}`}</span><h4 className="mt-2 font-bold">{item.subject || (item.type === "bug" ? "Bug report" : item.name)}</h4><p className="text-xs text-slate-500">{item.name}{item.email ? ` · ${item.email}` : ""} · {new Date(item.createdAt).toLocaleString("th-TH")}</p></div><span className={item.status === "approved" ? "text-emerald-300" : item.status === "rejected" ? "text-rose-300" : "text-amber-300"}>{item.status}</span></div><p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-300">{item.message}</p>{item.status === "pending" && <div className="mt-3 flex gap-2"><button type="button" onClick={() => reviewFeedback(item, "approved")} className="rounded bg-emerald-500/15 px-3 py-1.5 text-sm font-bold text-emerald-200">Approve</button><button type="button" onClick={() => reviewFeedback(item, "rejected")} className="rounded bg-rose-500/15 px-3 py-1.5 text-sm font-bold text-rose-200">Reject</button></div>}</article>)}</div>
        </section>
      </div>
    </div>
  </div>;
}
