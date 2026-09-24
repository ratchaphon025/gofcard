import { useEffect, useState } from "react";
import { API_URL } from "../config/api";

const emptyCard = {
  cardCode: "",
  name: "",
  cardType: "Monster",
  rarity: "Normal",
  price: 0,
  stock: 0,
  condition: "Near Mint",
  imageUrl: "",
};

export default function AdminPanel({ onClose, onSaved }) {
  const token = localStorage.getItem("dueldeck_token");
  const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
  const [cards, setCards] = useState([]);
  const [users, setUsers] = useState([]);
  const [editing, setEditing] = useState(emptyCard);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);

  const load = async () => {
    const [cardsResponse, usersResponse] = await Promise.all([
      fetch(`${API_URL}/cards/admin`, { headers }),
      fetch(`${API_URL}/users`, { headers }),
    ]);
    if (!cardsResponse.ok || !usersResponse.ok) throw new Error("Could not load admin data");
    setCards(await cardsResponse.json());
    setUsers(await usersResponse.json());
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
        rarity: card.rarity,
        price: Number(card.price),
        stock: Number(card.stock),
        condition: card.condition,
        effectTH: card.effectTH || "",
        imageUrl: card.imageUrl || "",
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

  const field = (key, label, type = "text") => <label className="text-xs text-slate-300">{label}<input type={type} required={["cardCode", "name"].includes(key)} value={editing[key] ?? ""} onChange={(event) => setEditing({ ...editing, [key]: event.target.value })} className="mt-1 w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 outline-none focus:border-amber-300" /></label>;

  return <div className="fixed inset-0 z-50 overflow-auto bg-slate-950/95 p-4 sm:p-8">
    <div className="mx-auto max-w-6xl">
      <div className="mb-6 flex items-center justify-between"><div><p className="text-sm font-bold tracking-[.18em] text-amber-300">ADMIN CONSOLE</p><h2 className="font-display text-3xl font-black">Store management</h2></div><button onClick={onClose} className="text-2xl text-slate-400">&times;</button></div>
      {error && <p className="mb-4 rounded-lg bg-rose-500/10 p-3 text-sm text-rose-200">{error}</p>}
      <div className="grid gap-6 lg:grid-cols-[1fr_1.3fr]">
        <form onSubmit={saveCard} className="rounded-2xl border border-white/10 bg-[#101729] p-5"><h3 className="mb-4 font-bold">{editing._id ? "Edit card" : "Add card"}</h3><div className="grid gap-3 sm:grid-cols-2">{field("cardCode", "Card code")}{field("name", "Name")}<label className="text-xs text-slate-300">Type<select value={editing.cardType} onChange={(event) => setEditing({ ...editing, cardType: event.target.value })} className="mt-1 w-full rounded-lg border border-white/15 bg-slate-900 px-3 py-2"><option>Monster</option><option>Spell</option><option>Trap</option></select></label><label className="text-xs text-slate-300">Rarity<select value={editing.rarity} onChange={(event) => setEditing({ ...editing, rarity: event.target.value })} className="mt-1 w-full rounded-lg border border-white/15 bg-slate-900 px-3 py-2"><option>Normal</option><option>Rare</option><option>Super Rare</option><option>Ultra Rare</option><option>Secret Rare</option></select></label>{field("price", "Price", "number")}{field("stock", "Stock", "number")}</div><label className="mt-4 block text-xs text-slate-300">Card image<input type="file" accept="image/*" onChange={uploadImage} disabled={uploading} className="mt-1 block w-full text-sm" /></label>{editing.imageUrl && <img src={editing.imageUrl} alt="Card preview" className="mt-3 h-32 w-24 rounded object-cover" />}<div className="mt-4 flex gap-2"><button disabled={uploading} className="rounded-lg bg-amber-300 px-4 py-2 font-bold text-slate-950">Save</button>{editing._id && <button type="button" onClick={() => setEditing(emptyCard)} className="rounded-lg border border-white/15 px-4 py-2">Cancel</button>}</div></form>
        <section className="rounded-2xl border border-white/10 bg-[#101729] p-5"><h3 className="mb-2 font-bold">Cards ({cards.length})</h3><div className="max-h-80 space-y-2 overflow-auto">{cards.map((card) => <button key={card._id} type="button" onClick={() => setEditing({ ...emptyCard, ...card })} className="flex w-full items-center gap-3 rounded-lg border border-white/10 p-3 text-left hover:border-amber-300/60"><img src={card.imageUrl || "https://placehold.co/48x64/111827/fbbf24?text=?"} alt="" className="h-16 w-12 rounded object-cover" /><span><strong className="block">{card.name}</strong><span className="text-xs text-slate-400">{card.cardCode} · {card.stock} in stock</span></span></button>)}</div><h3 className="mb-2 mt-6 font-bold">Users ({users.length})</h3><div className="space-y-2">{users.map((user) => <div key={user.id} className="flex items-center justify-between gap-3 rounded-lg border border-white/10 p-3 text-sm"><span>{user.email}</span><span className="flex gap-2"><select value={user.role} onChange={(event) => updateUser(user, { role: event.target.value })} className="rounded bg-slate-900 px-2 py-1"><option value="customer">customer</option><option value="admin">admin</option></select><button type="button" onClick={() => updateUser(user, { isActive: !user.isActive })} className="rounded border border-white/15 px-2 py-1">{user.isActive ? "Disable" : "Enable"}</button></span></div>)}</div></section>
      </div>
    </div>
  </div>;
}