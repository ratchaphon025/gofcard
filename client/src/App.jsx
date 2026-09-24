import { useEffect, useMemo, useState } from "react";
import { fallbackCards } from "./data/fallbackCards";
import AuthModal from "./components/AuthModal";
import CheckoutModal from "./components/CheckoutModal";
import AdminPanel from "./components/AdminPanel";
import { API_URL } from "./config/api";

const rarityStyles = {
  Normal: "border-slate-500 bg-slate-400/10 text-slate-200",
  Rare: "border-sky-400 bg-sky-400/10 text-sky-200",
  "Super Rare": "border-violet-400 bg-violet-400/10 text-violet-200",
  "Ultra Rare": "border-amber-300 bg-amber-300/10 text-amber-100",
  "Secret Rare": "border-fuchsia-400 bg-fuchsia-400/10 text-fuchsia-200",
};

const cardColors = { Monster: "from-orange-500/50 to-amber-950", Spell: "from-emerald-500/50 to-emerald-950", Trap: "from-pink-500/50 to-purple-950" };
const rarityEffects = {
  Normal: "card-effect-normal",
  Rare: "card-effect-rare",
  "Super Rare": "card-effect-super",
  "Ultra Rare": "card-effect-ultra",
  "Secret Rare": "card-effect-secret",
};
const money = new Intl.NumberFormat("th-TH", { style: "currency", currency: "THB", maximumFractionDigits: 0 });
const imageCache = new Map();
const heroCards = [
  { name: "Blue-Eyes White Dragon", image: "https://images.ygoprodeck.com/images/cards/89631139.jpg", label: "พลังมังกรขาว" },
  { name: "Dark Magician", image: "https://images.ygoprodeck.com/images/cards/46986414.jpg", label: "จอมเวทมนตร์ดำ" },
  { name: "Red-Eyes Black Dragon", image: "https://images.ygoprodeck.com/images/cards/74677422.jpg", label: "มังกรดำเรดอายส์" },
  { name: "Slifer the Sky Dragon", image: "https://images.ygoprodeck.com/images/cards/10000020.jpg", label: "เทพมังกรฟ้า" },
];

const getStoredUser = () => {
  try {
    return JSON.parse(localStorage.getItem("dueldeck_user") || "null");
  } catch {
    localStorage.removeItem("dueldeck_user");
    localStorage.removeItem("dueldeck_token");
    return null;
  }
};

function CardArt({ card, large = false }) {
  const [imageUrl, setImageUrl] = useState(card.imageUrl || imageCache.get(card.name) || "");

  useEffect(() => {
    let cancelled = false;
    if (card.imageUrl) {
      setImageUrl(card.imageUrl);
      return () => { cancelled = true; };
    }

    const cachedImage = imageCache.get(card.name);
    if (cachedImage) {
      setImageUrl(cachedImage);
      return () => { cancelled = true; };
    }

    fetch(`https://db.ygoprodeck.com/api/v7/cardinfo.php?name=${encodeURIComponent(card.name)}`)
      .then((response) => response.ok ? response.json() : Promise.reject(new Error("Image not found")))
      .then((data) => data.data?.[0]?.card_images?.[0]?.image_url_small || "")
      .then((url) => {
        if (!url || cancelled) return;
        imageCache.set(card.name, url);
        setImageUrl(url);
      })
      .catch(() => {});

    return () => { cancelled = true; };
  }, [card.name, card.imageUrl]);

  return <div className={`card-art relative flex ${large ? "h-72" : "h-40"} items-center justify-center overflow-hidden bg-gradient-to-br ${cardColors[card.cardType]} ${rarityEffects[card.rarity]}`}>
    <div className="absolute inset-0 opacity-40 card-shine" />
    {imageUrl ? <img src={imageUrl} alt={card.name} className="relative h-full w-full object-cover" onError={() => setImageUrl("")} /> : <div className="relative rounded-full border border-white/30 bg-black/25 px-4 py-3 text-center font-display text-xl font-black tracking-widest text-white drop-shadow-lg">
      {card.cardType === "Monster" ? "✦" : card.cardType === "Spell" ? "✧" : "◇"}
      <p className="mt-1 text-[10px] tracking-[.24em]">{card.attribute || card.cardType}</p>
    </div>}
  </div>;
}

function App() {
  const [cards, setCards] = useState(fallbackCards);
  const [boosterBoxes, setBoosterBoxes] = useState([]);
  const [search, setSearch] = useState("");
  const [rarity, setRarity] = useState("All");
  const [type, setType] = useState("All");
  const [sort, setSort] = useState("featured");
  const [cart, setCart] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [notice, setNotice] = useState("กำลังแสดงการ์ดครบ 100 แบบ");
  const [user, setUser] = useState(getStoredUser);
  const [authOpen, setAuthOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [orderNotice, setOrderNotice] = useState("");
  const [adminOpen, setAdminOpen] = useState(false);
  const [selectedCard, setSelectedCard] = useState(null);
  const [selectedEffect, setSelectedEffect] = useState("");
  const [heroCardIndex, setHeroCardIndex] = useState(0);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setHeroCardIndex((currentIndex) => (currentIndex + 1) % heroCards.length);
    }, 4500);
    return () => window.clearInterval(interval);
  }, []);

  const heroCard = heroCards[heroCardIndex];

  useEffect(() => {
    let cancelled = false;
    setSelectedEffect("");
    if (!selectedCard) return undefined;

    fetch(`https://db.ygoprodeck.com/api/v7/cardinfo.php?name=${encodeURIComponent(selectedCard.name)}`)
      .then((response) => response.ok ? response.json() : Promise.reject(new Error("ไม่พบข้อมูลเอฟเฟกต์")))
      .then(async (data) => {
        const effect = data.data?.[0]?.desc || "";
        if (!effect) {
          if (!cancelled) setSelectedEffect(selectedCard.effectTH || "การ์ดใบนี้ไม่มีเอฟเฟกต์พิเศษ");
          return;
        }

        const translationResponse = await fetch(
          `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=th&dt=t&q=${encodeURIComponent(effect)}`
        );
        if (!translationResponse.ok) throw new Error("แปลเอฟเฟกต์ไม่สำเร็จ");
        const translation = await translationResponse.json();
        const translatedEffect = Array.isArray(translation?.[0])
          ? translation[0].map((part) => part?.[0] || "").join("")
          : "";
        if (!cancelled) setSelectedEffect(translatedEffect || selectedCard.effectTH || effect);
      })
      .catch(() => {
        if (!cancelled) setSelectedEffect(selectedCard.effectTH || "ไม่สามารถโหลดคำแปลเอฟเฟกต์ได้ในขณะนี้");
      });

    return () => { cancelled = true; };
  }, [selectedCard]);

  useEffect(() => {
    fetch(`${API_URL}/cards`)
      .then((response) => response.ok ? response.json() : Promise.reject())
      .then((data) => { if (data.length) { setCards(data); setNotice(`โหลดการ์ดจากคลังสินค้า ${data.length} แบบ`); } })
      .catch(() => setNotice("โหมดตัวอย่าง: แสดงการ์ด 100 แบบ"));
  }, []);

  useEffect(() => {
    fetch(`${API_URL}/booster-boxes`)
      .then((response) => response.ok ? response.json() : Promise.reject())
      .then((data) => setBoosterBoxes(data.map((box) => ({ ...box, kind: "boosterBox", cardType: "Spell" }))))
      .catch(() => setBoosterBoxes([]));
  }, []);

  const filteredCards = useMemo(() => {
    const result = cards.filter((card) =>
      (rarity === "All" || card.rarity === rarity) &&
      (type === "All" || card.cardType === type) &&
      (card.name.toLowerCase().includes(search.toLowerCase()) || card.cardCode.toLowerCase().includes(search.toLowerCase()))
    );
    return result.sort((a, b) => sort === "low" ? a.price - b.price : sort === "high" ? b.price - a.price : Number(Boolean(b.isFeatured)) - Number(Boolean(a.isFeatured)) || a.cardCode.localeCompare(b.cardCode));
  }, [cards, search, rarity, type, sort]);

  const addToCart = (card) => {
    if (!card.stock) return;
    setCart((items) => {
      const existing = items.find((item) => item.card._id === card._id);
      return existing ? items.map((item) => item.card._id === card._id ? { ...item, quantity: Math.min(item.quantity + 1, card.stock) } : item) : [...items, { card, quantity: 1 }];
    });
    setCartOpen(true);
  };

  const count = cart.reduce((total, item) => total + item.quantity, 0);
  const total = cart.reduce((sum, item) => sum + item.card.price * item.quantity, 0);

  return <div className="min-h-screen bg-[#080b16] text-slate-100">
    <header className="sticky top-0 z-20 border-b border-white/10 bg-[#080b16]/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
        <a href="#top" className="font-display text-xl font-black tracking-wider text-amber-300">DUEL<span className="text-white">DECK</span></a>
        <nav className="hidden gap-6 text-sm text-slate-300 md:flex"><a href="#shop">ร้านค้า</a><a href="#about">เกี่ยวกับเรา</a></nav>
        {user ? <div className="hidden items-center gap-2 sm:flex">{user.role === "admin" && <button onClick={() => setAdminOpen(true)} className="rounded-xl border border-amber-300/40 px-3 py-2 text-sm font-bold text-amber-200">จัดการร้าน</button>}<button onClick={() => { localStorage.removeItem("dueldeck_token"); localStorage.removeItem("dueldeck_user"); setUser(null); }} className="rounded-xl border border-white/15 px-3 py-2 text-sm text-slate-200">{user.name} · ออกจากระบบ</button></div> : <button onClick={() => setAuthOpen(true)} className="hidden rounded-xl border border-white/15 px-3 py-2 text-sm font-bold text-slate-100 sm:block">เข้าสู่ระบบ</button>}
        <button onClick={() => setCartOpen(true)} className="rounded-xl border border-amber-300/40 bg-amber-300/10 px-4 py-2 text-sm font-bold text-amber-200">ตะกร้า ({count})</button>
      </div>
    </header>

    <main id="top">
      <section className="hero-headline relative flex min-h-[30rem] w-full items-center justify-center overflow-hidden px-4 py-16 sm:px-6 lg:min-h-[36rem] lg:py-20">
        <div className="hero-sun absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full" />
        <div className="hero-rays absolute inset-[-30%]" />
        <div className="hero-spark hero-spark-one absolute left-[18%] top-[22%]">✦</div>
        <div className="hero-spark hero-spark-two absolute right-[19%] top-[28%]">✦</div>
        <div className="hero-spark hero-spark-three absolute bottom-[22%] left-[28%]">✧</div>
        <div className="hero-monster hero-monster-left absolute bottom-[-2rem] left-[-3rem] h-[88%] w-[34%] sm:left-[2%]"><img src="https://images.ygoprodeck.com/images/cards/89631139.jpg" alt="บลูอายส์ไวท์ดราก้อน" className="h-full w-full object-contain object-bottom" /></div>
        <div className="hero-monster hero-monster-right absolute bottom-[-1rem] right-[-3rem] h-[84%] w-[32%] sm:right-[2%]"><img src="https://images.ygoprodeck.com/images/cards/46986414.jpg" alt="ดาร์คเมจิเชียน" className="h-full w-full object-contain object-bottom" /></div>
        <div className="hero-headline-shade pointer-events-none absolute inset-0" />
        <div className="relative z-10 max-w-3xl text-center"><p className="mb-4 text-sm font-black tracking-[.34em] text-cyan-100 drop-shadow-lg">YU-GI-OH! CARD MARKET</p><h1 className="hero-title font-display text-5xl font-black leading-none sm:text-7xl">พบการ์ดที่<br /><span>คู่ควรกับเด็คคุณ</span></h1><p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-white drop-shadow-lg">การ์ด Yu-Gi-Oh! 100 แบบ ไม่ซ้ำกัน ตั้งแต่ Normal ถึง Secret Rare คัดสภาพพร้อมสะสม</p><a href="#shop" className="hero-cta mt-8 inline-block rounded-xl px-7 py-3 font-bold text-slate-950">เลือกดูการ์ด</a></div>
        <div className="hero-stage relative mx-auto flex aspect-square w-full max-w-md items-center justify-center">
          <div className="hero-backdrop absolute inset-0 opacity-25" />
          <img src={heroCards[(heroCardIndex + heroCards.length - 1) % heroCards.length].image} alt="" aria-hidden="true" className="hero-background-card hero-background-card-left absolute -left-16 top-8 h-64 w-44 rotate-[-18deg] object-cover opacity-30 blur-[1px]" />
          <img src={heroCards[(heroCardIndex + 1) % heroCards.length].image} alt="" aria-hidden="true" className="hero-background-card hero-background-card-right absolute -right-16 top-12 h-64 w-44 rotate-[18deg] object-cover opacity-30 blur-[1px]" />
          <div className="hero-orbit absolute h-72 w-72 rounded-full border border-amber-300/20" />
          <div className="hero-orbit hero-orbit-delay absolute h-56 w-56 rounded-full border border-sky-300/20" />
          <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-violet-950/80 to-transparent" />
          <img key={heroCard.image} src={heroCard.image} alt={heroCard.name} className="hero-character hero-character-left absolute bottom-0 left-0 z-10 h-[88%] w-[62%] object-contain object-bottom drop-shadow-[0_0_28px_rgba(96,165,250,.8)]" />
          <img key={`${heroCard.image}-right`} src={heroCards[(heroCardIndex + 1) % heroCards.length].image} alt={heroCards[(heroCardIndex + 1) % heroCards.length].name} className="hero-character hero-character-right absolute bottom-0 right-0 z-10 h-[82%] w-[58%] object-contain object-bottom drop-shadow-[0_0_28px_rgba(192,132,252,.8)]" />
          <div className="hero-card-label absolute bottom-5 left-1/2 z-20 -translate-x-1/2 rounded-full border border-white/30 bg-slate-950/70 px-5 py-2 text-xs font-black tracking-[.22em] text-white backdrop-blur">{heroCard.label}</div>
          <div className="absolute bottom-5 z-20 rounded-full border border-amber-200/40 bg-slate-950/70 px-5 py-2 text-xs font-black tracking-[.3em] text-amber-200 backdrop-blur">DUEL LEGENDS</div>
        </div>
      </section>

      <section id="shop" className="border-y border-white/10 bg-slate-950/50"><div className="mx-auto max-w-7xl px-4 py-12 sm:px-6"><div className="mb-8 flex flex-wrap items-end justify-between gap-4"><div><p className="text-sm text-emerald-300">{notice}</p><h2 className="mt-2 font-display text-3xl font-black">คลังการ์ด</h2></div><p className="text-slate-400">พบ {filteredCards.length} รายการ</p></div>
        <div className="mb-8 grid gap-3 md:grid-cols-4"><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="ค้นหาชื่อหรือรหัสการ์ด" className="rounded-xl border border-white/15 bg-white/5 px-4 py-3 outline-none placeholder:text-slate-500 focus:border-amber-300 md:col-span-2"/><select value={rarity} onChange={(e) => setRarity(e.target.value)} className="rounded-xl border border-white/15 bg-slate-900 px-3 py-3"><option>All</option>{Object.keys(rarityStyles).map((item) => <option key={item}>{item}</option>)}</select><select value={type} onChange={(e) => setType(e.target.value)} className="rounded-xl border border-white/15 bg-slate-900 px-3 py-3"><option>All</option><option>Monster</option><option>Spell</option><option>Trap</option></select></div>
        <div className="mb-6 flex justify-end"><select value={sort} onChange={(e) => setSort(e.target.value)} className="rounded-lg border border-white/15 bg-slate-900 px-3 py-2 text-sm"><option value="featured">เรียงตามรหัส</option><option value="low">ราคาน้อยไปมาก</option><option value="high">ราคามากไปน้อย</option></select></div>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{filteredCards.map((card) => <article key={card._id} role="button" tabIndex="0" onClick={() => setSelectedCard(card)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") setSelectedCard(card); }} className={`card-tile cursor-pointer overflow-hidden rounded-2xl border border-white/10 bg-[#101729] ${rarityEffects[card.rarity]}`}><CardArt card={card}/><div className="card-details p-4"><div className="mb-3 flex items-start justify-between gap-2"><h3 className="font-display text-lg font-bold leading-5">{card.name}</h3><span className={`shrink-0 rounded-md border px-2 py-1 text-[10px] font-bold ${rarityStyles[card.rarity]}`}>{card.rarity}</span></div><p className="text-xs text-slate-400">{card.cardCode} · {card.cardType}{card.level ? ` · LV ${card.level}` : ""}</p>{card.cardType === "Monster" && <p className="mt-1 text-xs text-slate-400">ATK {card.atk} / DEF {card.def}</p>}<div className="mt-4 flex items-center justify-between"><div><p className="font-bold text-amber-300">{money.format(card.price)}</p><p className={`text-xs ${card.stock ? "text-emerald-300" : "text-rose-300"}`}>{card.stock ? `เหลือ ${card.stock} ใบ` : "สินค้าหมด"}</p></div><button disabled={!card.stock} onClick={(event) => { event.stopPropagation(); addToCart(card); }} className="rounded-lg bg-white px-3 py-2 text-sm font-bold text-slate-900 disabled:cursor-not-allowed disabled:opacity-40">เพิ่ม</button></div></div></article>)}</div>
      </div></section>
      {boosterBoxes.length > 0 && <section id="booster-boxes" className="mx-auto max-w-7xl px-4 py-14 sm:px-6"><div className="mb-8 flex items-end justify-between gap-4"><div><p className="text-sm font-bold tracking-[.18em] text-amber-300">SEALED PRODUCT</p><h2 className="mt-2 font-display text-3xl font-black">YU-GI-OH! BOOSTER BOX</h2></div><p className="text-sm text-slate-400">{boosterBoxes.length} versions</p></div><div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{boosterBoxes.map((box) => <article key={box._id} className="group overflow-hidden rounded-2xl border border-amber-300/20 bg-[#101729] transition hover:-translate-y-1 hover:border-amber-300/70"><div className="booster-box-art flex h-48 items-center justify-center bg-slate-950/40 p-3">{box.imageUrl ? <img src={box.imageUrl} alt={`${box.name} Booster Box`} className="h-full max-w-full object-contain drop-shadow-2xl transition duration-300 group-hover:scale-105 group-hover:-rotate-2" /> : <div className="rounded-lg border border-amber-200/70 bg-amber-500 px-5 py-8 text-center text-xs font-black text-slate-950">YU-GI-OH!<br />BOOSTER BOX</div>}</div><div className="p-4"><div className="flex items-start justify-between gap-2"><h3 className="font-display text-lg font-bold leading-5">{box.name}</h3><span className="rounded border border-amber-300/40 px-2 py-1 text-xs text-amber-200">{box.releaseYear}</span></div><p className="mt-2 text-xs text-slate-400">{box.boxCode} · {box.packsPerBox} packs / box</p><div className="mt-4 flex items-center justify-between"><div><p className="font-bold text-amber-300">{money.format(box.price)}</p><p className={box.stock ? "text-xs text-emerald-300" : "text-xs text-rose-300"}>{box.stock ? `In stock: ${box.stock}` : "Sold out"}</p></div><button disabled={!box.stock} onClick={() => addToCart(box)} className="rounded-lg bg-amber-300 px-3 py-2 text-sm font-bold text-slate-950 disabled:opacity-40">Add</button></div></div></article>)}</div></section>}
      <section id="about" className="mx-auto max-w-7xl px-4 py-14 text-center sm:px-6"><p className="text-amber-300">DUELDECK STORE</p><h2 className="mt-2 font-display text-3xl font-black">ทุกใบถูกจัดเก็บด้วยรหัสที่ไม่ซ้ำกัน</h2><p className="mx-auto mt-4 max-w-2xl text-slate-400">ข้อมูลการ์ดเชื่อมต่อกับ MongoDB ผ่าน API และสามารถจัดการสต็อก ราคา และระดับความแรร์ได้จากหลังบ้าน</p></section>
    </main>

    {cartOpen && <aside className="fixed inset-y-0 right-0 z-30 flex w-full max-w-md flex-col border-l border-white/10 bg-[#101729] shadow-2xl"><div className="flex items-center justify-between border-b border-white/10 p-5"><h2 className="font-display text-2xl font-black">ตะกร้าของคุณ</h2><button onClick={() => setCartOpen(false)} className="text-2xl text-slate-400">×</button></div><div className="flex-1 overflow-auto p-5">{cart.length === 0 ? <p className="py-12 text-center text-slate-400">ยังไม่มีการ์ดในตะกร้า</p> : cart.map(({ card, quantity }) => <div key={card._id} className="mb-4 flex gap-3 border-b border-white/10 pb-4"><div className={`h-14 w-10 rounded bg-gradient-to-br ${cardColors[card.cardType]}`} /><div className="flex-1"><p className="font-bold">{card.name}</p><p className="text-sm text-amber-300">{money.format(card.price)} × {quantity}</p></div><button onClick={() => setCart((items) => items.filter((item) => item.card._id !== card._id))} className="text-sm text-rose-300">ลบ</button></div>)}</div><div className="border-t border-white/10 p-5"><div className="mb-4 flex justify-between text-lg font-bold"><span>รวมทั้งหมด</span><span className="text-amber-300">{money.format(total)}</span></div><button disabled={!cart.length} onClick={() => { if (!user) { setCartOpen(false); setAuthOpen(true); return; } setCartOpen(false); setCheckoutOpen(true); }} className="w-full rounded-xl bg-amber-300 py-3 font-bold text-slate-950 disabled:opacity-40">ดำเนินการสั่งซื้อ</button></div></aside>}
    {orderNotice && <div className="fixed bottom-5 left-1/2 z-50 -translate-x-1/2 rounded-xl border border-emerald-300/30 bg-emerald-950 px-5 py-3 text-sm text-emerald-100">{orderNotice}</div>}
    {checkoutOpen && <CheckoutModal cart={cart} onClose={() => setCheckoutOpen(false)} onCompleted={(order) => { setCart([]); setCheckoutOpen(false); setOrderNotice(`สร้างคำสั่งซื้อ ${order.orderNumber} สำเร็จ`); }} />}
    {selectedCard && <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/85 p-4 backdrop-blur-sm" onClick={() => setSelectedCard(null)}><div role="dialog" aria-modal="true" aria-label={`รายละเอียด ${selectedCard.name}`} onClick={(event) => event.stopPropagation()} className="max-h-[90vh] w-full max-w-2xl overflow-auto rounded-2xl border border-white/15 bg-[#101729] shadow-2xl"><div className="flex items-center justify-between border-b border-white/10 p-4"><span className="text-sm text-slate-400">รายละเอียดการ์ด</span><button onClick={() => setSelectedCard(null)} className="text-2xl text-slate-400">×</button></div><div className="grid gap-6 p-5 md:grid-cols-[.8fr_1.2fr]"><CardArt card={selectedCard} large /><div><div className="flex items-start justify-between gap-3"><h2 className="font-display text-3xl font-black">{selectedCard.name}</h2><span className={`rounded-md border px-2 py-1 text-xs font-bold ${rarityStyles[selectedCard.rarity]}`}>{selectedCard.rarity}</span></div><p className="mt-2 text-sm text-slate-400">{selectedCard.cardCode} · {selectedCard.cardType}{selectedCard.attribute ? ` · ${selectedCard.attribute}` : ""}</p>{selectedCard.cardType === "Monster" && <div className="mt-5 grid grid-cols-3 gap-2 text-center text-sm"><div className="rounded-lg bg-white/5 p-3"><span className="block text-xs text-slate-400">LEVEL</span>{selectedCard.level || "-"}</div><div className="rounded-lg bg-white/5 p-3"><span className="block text-xs text-slate-400">ATK</span>{selectedCard.atk || 0}</div><div className="rounded-lg bg-white/5 p-3"><span className="block text-xs text-slate-400">DEF</span>{selectedCard.def || 0}</div></div>}            <div className="mt-5 rounded-xl border border-amber-300/20 bg-amber-300/5 p-4"><p className="mb-2 text-xs font-bold tracking-wider text-amber-300">เอฟเฟกต์การ์ด (ภาษาไทย)</p><p className="whitespace-pre-line leading-7 text-slate-200">{selectedEffect || "กำลังแปลเอฟเฟกต์การ์ด..."}</p><p className="mt-3 text-[11px] text-slate-500">แปลจากเอฟเฟกต์จริงของการ์ดใบนี้</p></div><p className="mt-4 leading-7 text-slate-300">{selectedCard.description || "การ์ดสะสมสภาพดี พร้อมจัดส่งจากคลัง DuelDeck"}</p><div className="mt-6 flex items-end justify-between border-t border-white/10 pt-5"><div><p className="text-2xl font-bold text-amber-300">{money.format(selectedCard.price)}</p><p className={selectedCard.stock ? "text-sm text-emerald-300" : "text-sm text-rose-300"}>{selectedCard.stock ? `มีสินค้า ${selectedCard.stock} ใบ` : "สินค้าหมด"}</p></div><button disabled={!selectedCard.stock} onClick={() => { addToCart(selectedCard); setSelectedCard(null); }} className="rounded-xl bg-amber-300 px-5 py-3 font-bold text-slate-950 disabled:opacity-40">เพิ่มลงตะกร้า</button></div></div></div></div></div>}
    {adminOpen && <AdminPanel onClose={() => setAdminOpen(false)} onSaved={(savedCard) => { setNotice("บันทึกข้อมูลการ์ดแล้ว"); setCards((currentCards) => currentCards.some((card) => card._id === savedCard._id) ? currentCards.map((card) => card._id === savedCard._id ? savedCard : card) : [savedCard, ...currentCards]); }} />}
    {authOpen && <AuthModal onClose={() => setAuthOpen(false)} onAuthenticated={(loggedInUser) => { setUser(loggedInUser); setAuthOpen(false); }} />}
  </div>;
}

export default App;
