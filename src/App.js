import { useState, useEffect, useRef, useCallback } from "react";

const SUPABASE_URL = "https://zxjrdvoqthhwebmtxdey.supabase.co";
const SUPABASE_KEY = "sb_publishable_LrhzFESy0ZXCav7UVEEJoQ_gCeN7ISc";
const SUPER_ADMIN_PASSWORD = "Kenneth_SuperAdmin";

const api = async (path, opts = {}) => {
  const { headers: extraHeaders, ...restOpts } = opts;
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...restOpts,
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
      ...extraHeaders,
    },
  });
  if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.message || "Request failed"); }
  const text = await res.text();
  return text ? JSON.parse(text) : [];
};

const rNo = () => "PHC-" + Date.now().toString().slice(-7);
const EMOJIS = ["😀", "😂", "😍", "🥰", "😎", "🤩", "😊", "🙌", "👏", "🔥", "❤️", "💯", "🎉", "👍", "😭", "😅", "🤣", "😤", "💪", "🙏", "👑", "✨", "🎊", "😆", "🤔", "👀", "💬", "📢", "🫡", "🥳"];

const C = {
  purple: "#3D0066", mid: "#6A0DAD", light: "#9B59B6",
  gold: "#F0C040", goldD: "#C9A800",
  grey: "#F7F5FA", green: "#1DB954", red: "#E53935", orange: "#FB8C00",
  gMain: "linear-gradient(135deg, #3D0066 0%, #6A0DAD 100%)",
};

export default function App() {
  const [session, setSession] = useState(() => {
    try { const s = localStorage.getItem("phc_session"); return s ? JSON.parse(s) : null; } catch { return null; }
  });
  const [toast, setToast] = useState(null);
  const showToast = (msg, type = "success") => { setToast({ msg, type }); setTimeout(() => setToast(null), 3500); };
  const logout = () => { localStorage.removeItem("phc_session"); setSession(null); };
  const setSessionPersist = (s) => { localStorage.setItem("phc_session", JSON.stringify(s)); setSession(s); };

  return (
    <div style={{ fontFamily: "'Segoe UI', system-ui, sans-serif", minHeight: "100vh", background: C.grey }}>
      <style>{`
        @keyframes fadeUp{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
        @keyframes pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.06)}}
        @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
        .fu{animation:fadeUp 0.4s ease both}
        .fi{animation:fadeIn 0.3s ease both}
        .ch:hover{transform:translateY(-2px);box-shadow:0 10px 28px rgba(61,0,102,0.13)!important}
        .ch{transition:transform 0.2s,box-shadow 0.2s}
        .bp:active{transform:scale(0.97)}
        input:focus,select:focus,textarea:focus{outline:none!important;border-color:#6A0DAD!important;box-shadow:0 0 0 3px rgba(106,13,173,0.1)!important}
        ::-webkit-scrollbar{width:5px}::-webkit-scrollbar-thumb{background:#ddd;border-radius:3px}
      `}</style>
      {toast && <Toast toast={toast} />}
      {!session
        ? <AuthScreen setSession={setSessionPersist} showToast={showToast} />
        : session.role === "member"
          ? <MemberApp session={session} logout={logout} showToast={showToast} />
          : <AdminApp session={session} logout={logout} showToast={showToast} />
      }
    </div>
  );
}

// ── AUTH ──────────────────────────────────────────────────────────────────────
function AuthScreen({ setSession, showToast }) {
  const [tab, setTab] = useState("login");
  const [lf, setLf] = useState({ phone: "", password: "" });
  const [rf, setRf] = useState({ name: "", phone: "", password: "", confirmPassword: "", displayName: "" });
  const [loading, setLoading] = useState(false);

  const login = async () => {
    if (!lf.phone || !lf.password) return showToast("Please fill all fields", "error");
    setLoading(true);
    try {
      if (lf.password === SUPER_ADMIN_PASSWORD) { setSession({ role: "superadmin", name: "Super Admin", memberId: null }); return; }
      const rows = await api("members?phone=eq." + encodeURIComponent(lf.phone.trim()) + "&select=*");
      if (!rows.length) return showToast("Phone not registered. Please sign up.", "error");
      const m = rows[0];
      if (m.password !== lf.password) return showToast("Incorrect password", "error");
      if (m.status === "Pending") return showToast("Your account is awaiting admin approval. Please check back soon.", "error");
      if (m.status === "Suspended") return showToast("Your account has been suspended. Please contact an admin.", "error");
      setSession({ role: m.role === "Admin" ? "admin" : "member", memberId: m.id, name: m.name });
    } catch (e) { showToast(e.message, "error"); }
    finally { setLoading(false); }
  };

  const register = async () => {
    if (!rf.name.trim() || !rf.phone.trim() || !rf.password || !rf.confirmPassword) return showToast("Please fill all fields", "error");
    if (rf.password !== rf.confirmPassword) return showToast("Passwords do not match", "error");
    if (rf.password.length < 6) return showToast("Password must be at least 6 characters", "error");
    setLoading(true);
    try {
      const existing = await api(`members?phone=eq.${encodeURIComponent(rf.phone.trim())}&select=id`);
      if (existing.length) return showToast("Phone number already registered", "error");
      await api("members", { method: "POST", body: JSON.stringify({ name: rf.name.trim(), phone: rf.phone.trim(), display_name: rf.displayName.trim() || rf.name.trim(), role: "Member", password: rf.password }) });
      showToast("Account created! You can now log in.");
      setTab("login"); setLf(f => ({ ...f, phone: rf.phone }));
    } catch (e) { showToast(e.message.includes("unique") ? "Phone already registered" : e.message, "error"); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight: "100vh", background: C.gMain, display: "flex", alignItems: "center", justifyContent: "center", padding: 16, position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: -80, right: -80, width: 300, height: 300, background: "rgba(255,255,255,0.04)", borderRadius: "50%" }} />
      <div style={{ position: "absolute", bottom: -60, left: -60, width: 220, height: 220, background: "rgba(240,192,64,0.07)", borderRadius: "50%" }} />
      <div className="fu" style={{ background: "#fff", borderRadius: 24, padding: "36px 28px", width: "100%", maxWidth: 420, boxShadow: "0 32px 80px rgba(0,0,0,0.35)" }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ width: 76, height: 76, background: C.gMain, borderRadius: "50%", margin: "0 auto 12px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 36, boxShadow: "0 8px 24px rgba(61,0,102,0.3)" }}>👑</div>
          <h1 style={{ color: C.purple, margin: "0 0 4px", fontSize: 26, fontWeight: 900 }}>PH Connectz</h1>
          <p style={{ color: "#999", fontSize: 13, margin: 0 }}>Community Group Portal</p>
        </div>
        <div style={{ display: "flex", background: C.grey, borderRadius: 12, padding: 4, marginBottom: 24 }}>
          {["login", "register"].map(t => (
            <button key={t} onClick={() => setTab(t)} className="bp" style={{ flex: 1, padding: "9px 0", border: "none", borderRadius: 9, background: tab === t ? C.gMain : "transparent", color: tab === t ? "#fff" : "#888", fontWeight: 700, cursor: "pointer", fontSize: 13, transition: "all 0.25s" }}>
              {t === "login" ? "Log In" : "Sign Up"}
            </button>
          ))}
        </div>
        {tab === "login" ? (
          <div className="fi">
            <FIn label="📱 Phone Number" value={lf.phone} onChange={v => setLf(f => ({ ...f, phone: v }))} placeholder="08012345678" />
            <FIn label="🔒 Password" type="password" value={lf.password} onChange={v => setLf(f => ({ ...f, password: v }))} placeholder="Your password" />
            <GBtn onClick={login} loading={loading} full>Log In</GBtn>
          </div>
        ) : (
          <div className="fi">
            <FIn label="👤 Full Name" value={rf.name} onChange={v => setRf(f => ({ ...f, name: v }))} placeholder="Your full name" />
            <FIn label="💬 Display Name (shown in chat)" value={rf.displayName} onChange={v => setRf(f => ({ ...f, displayName: v }))} placeholder="e.g. Kenny" />
            <FIn label="📱 Phone Number" value={rf.phone} onChange={v => setRf(f => ({ ...f, phone: v }))} placeholder="08012345678" />
            <FIn label="🔒 Password" type="password" value={rf.password} onChange={v => setRf(f => ({ ...f, password: v }))} placeholder="Min. 6 characters" />
            <FIn label="🔒 Confirm Password" type="password" value={rf.confirmPassword} onChange={v => setRf(f => ({ ...f, confirmPassword: v }))} placeholder="Repeat password" />
            <GBtn onClick={register} loading={loading} full>Create Account</GBtn>
          </div>
        )}
      </div>
    </div>
  );
}

// ── MEMBER APP ────────────────────────────────────────────────────────────────
function MemberApp({ session, logout, showToast }) {
  const [page, setPage] = useState("home");
  const [member, setMember] = useState(null);

  useEffect(() => {
    api(`members?id=eq.${session.memberId}&select=*`).then(r => r[0] && setMember(r[0])).catch(() => { });
  }, [session.memberId]);

  if (!member) return <Loader />;
  const tabs = [{ id: "home", icon: "🏠", label: "Home" }, { id: "events", icon: "🗓", label: "Events" }, { id: "payment", icon: "💳", label: "Payment" }, { id: "receipts", icon: "🧾", label: "Receipts" }, { id: "chat", icon: "💬", label: "Chat" }, { id: "profile", icon: "👤", label: "Profile" }];

  return (
    <div style={{ minHeight: "100vh", background: C.grey, paddingBottom: 76 }}>
      <header style={{ background: C.gMain, color: "#fff", padding: "14px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 100, boxShadow: "0 4px 20px rgba(61,0,102,0.3)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Avi member={member} size={36} />
          <div><div style={{ fontWeight: 800, fontSize: 15 }}>PH Connectz</div><div style={{ fontSize: 10, opacity: 0.7 }}>Hi, {member.display_name || member.name.split(" ")[0]}!</div></div>
        </div>
        <button onClick={logout} className="bp" style={{ background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.25)", color: "#fff", padding: "7px 14px", borderRadius: 20, cursor: "pointer", fontSize: 12, fontWeight: 600 }}>Sign Out</button>
      </header>
      <div style={{ padding: "16px 16px 0", maxWidth: 620, margin: "0 auto" }}>
        {page === "home" && <MemberHome member={member} setPage={setPage} />}
        {page === "events" && <MemberEvents member={member} showToast={showToast} />}
        {page === "payment" && <MemberPayment member={member} showToast={showToast} />}
        {page === "receipts" && <MemberReceipts member={member} showToast={showToast} />}
        {page === "chat" && <ChatPage member={member} showToast={showToast} />}
        {page === "profile" && <MemberProfile member={member} setMember={setMember} showToast={showToast} />}
      </div>
      <BottomNav tabs={tabs} page={page} setPage={setPage} dark={false} />
    </div>
  );
}

function MemberHome({ member, setPage }) {
  const [payment, setPayment] = useState(null);
  const [rsvps, setRsvps] = useState([]);
  const [confirmedCount, setConfirmedCount] = useState(0);

  useEffect(() => {
    api(`payments?member_id=eq.${member.id}&select=*`).then(r => setPayment(r[0] || null));
    api(`rsvps?member_id=eq.${member.id}&select=*`).then(setRsvps);
    api(`payments?status=eq.Confirmed&select=id`).then(r => setConfirmedCount(r.length));
  }, [member.id]);

  const qualifiesPerk = payment?.status === "Confirmed" && confirmedCount <= 50;

  return (
    <div>
      <div className="fu ch" style={{ background: C.gMain, borderRadius: 20, padding: "24px 20px", color: "#fff", marginBottom: 16, position: "relative", overflow: "hidden", boxShadow: "0 8px 28px rgba(61,0,102,0.25)" }}>
        <div style={{ position: "absolute", top: -30, right: -30, width: 140, height: 140, background: "rgba(255,255,255,0.05)", borderRadius: "50%" }} />
        <div style={{ fontSize: 32, marginBottom: 8 }}>👋</div>
        <h2 style={{ margin: "0 0 4px", fontSize: 22, fontWeight: 800 }}>Welcome, {member.display_name || member.name.split(" ")[0]}!</h2>
        <p style={{ margin: 0, opacity: 0.8, fontSize: 13 }}>You're part of something special ✨</p>
      </div>
      {qualifiesPerk && (
        <div className="fu" style={{ background: "linear-gradient(135deg,#fff9e0,#fff3b0)", border: `2px solid ${C.gold}`, borderRadius: 16, padding: 16, marginBottom: 14, textAlign: "center" }}>
          <div style={{ fontSize: 36, animation: "pulse 2s infinite" }}>🎁</div>
          <p style={{ color: C.purple, fontWeight: 800, margin: "6px 0 2px" }}>Perk Unlocked!</p>
          <p style={{ fontSize: 13, color: "#666", margin: 0 }}>You qualify for FREE 3 yards of Anniversary Fabric!</p>
        </div>
      )}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
        <MiniCard icon="🗓" label="My RSVPs" value={rsvps.length} color={C.mid} />
        <MiniCard icon="💳" label="Payment" value={payment?.status || "None"} color={payment?.status === "Confirmed" ? C.green : C.orange} />
      </div>
      {!payment && (
        <div className="fu ch" style={{ background: "#fff", borderRadius: 16, padding: 18, border: `2px dashed ${C.mid}`, textAlign: "center", boxShadow: "0 4px 16px rgba(0,0,0,0.05)" }}>
          <div style={{ fontSize: 28, marginBottom: 8 }}>💳</div>
          <p style={{ color: C.purple, fontWeight: 700, margin: "0 0 6px", fontSize: 15 }}>Haven't paid yet?</p>
          <p style={{ fontSize: 13, color: "#777", margin: "0 0 14px" }}>Upload your bank receipt to secure your slot!</p>
          <GBtn onClick={() => setPage("payment")}>Upload Receipt Now</GBtn>
        </div>
      )}
    </div>
  );
}

function MemberEvents({ member, showToast }) {
  const [events, setEvents] = useState([]);
  const [rsvps, setRsvps] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewFlyer, setViewFlyer] = useState(null);

  useEffect(() => {
    Promise.all([
      api("events?select=*&order=created_at.desc"),
      api(`rsvps?member_id=eq.${member.id}&select=*`),
      api("payments?status=eq.Confirmed&select=event_id")
    ]).then(([e, r, p]) => { setEvents(e); setRsvps(r); setPayments(p); setLoading(false); });
  }, [member.id]);

  const rsvp = async (eventId, status) => {
    const existing = rsvps.find(r => r.event_id === eventId);
    try {
      if (existing) {
        await api(`rsvps?id=eq.${existing.id}`, { method: "PATCH", body: JSON.stringify({ status }) });
        setRsvps(r => r.map(x => x.id === existing.id ? { ...x, status } : x));
      } else {
        const rows = await api("rsvps", { method: "POST", body: JSON.stringify({ member_id: member.id, event_id: eventId, status }) });
        setRsvps(r => [...r, rows[0]]);
      }
      showToast(`RSVP updated: ${status}`);
    } catch (e) { showToast(e.message, "error"); }
  };

  if (loading) return <Loader />;

  return (
    <div>
      <SecTitle>Upcoming Events</SecTitle>
      {events.length === 0 && <Empty msg="No events yet. Check back soon!" />}
      {events.map((evt, i) => {
        const myRsvp = rsvps.find(r => r.event_id === evt.id);
        const confirmed = payments.filter(p => p.event_id === evt.id).length;
        const pct = Math.min(100, Math.round((confirmed / evt.capacity) * 100));
        return (
          <div key={evt.id} className="fu ch" style={{ background: "#fff", borderRadius: 18, overflow: "hidden", marginBottom: 16, boxShadow: "0 4px 20px rgba(0,0,0,0.07)", animationDelay: `${i * 0.07}s` }}>
            {evt.flyer && <img src={evt.flyer} alt="flyer" onClick={() => setViewFlyer(evt.flyer)} style={{ width: "100%", maxHeight: 200, objectFit: "cover", cursor: "pointer" }} title="Tap to view full flyer" />}
            <div style={{ padding: 16 }}>
              <h3 style={{ color: C.purple, margin: "0 0 6px", fontSize: 16, fontWeight: 800 }}>{evt.name}</h3>
              <p style={{ fontSize: 12, color: "#999", margin: "0 0 6px" }}>📅 {evt.date}</p>
              <p style={{ fontSize: 13, color: "#555", margin: "0 0 10px", lineHeight: 1.5 }}>{evt.description}</p>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
                <Tag bg="#f0e6ff" color={C.purple}>₦{(+evt.ticket_price).toLocaleString()}</Tag>
                <Tag bg="#e6f9ef" color={C.green}>{confirmed}/{evt.capacity} confirmed</Tag>
              </div>
              <PBar pct={pct} />
              <p style={{ fontSize: 11, color: C.orange, margin: "6px 0 12px", fontWeight: 600 }}>{evt.perk_desc}</p>
              <p style={{ fontSize: 12, fontWeight: 700, color: "#555", margin: "0 0 8px" }}>Your RSVP: <span style={{ color: myRsvp ? C.purple : "#bbb" }}>{myRsvp?.status || "Not set"}</span></p>
              <div style={{ display: "flex", gap: 8 }}>
                {["Going", "Not Going", "Pending"].map(s => (
                  <button key={s} onClick={() => rsvp(evt.id, s)} className="bp" style={{ flex: 1, padding: "8px 4px", border: `2px solid ${myRsvp?.status === s ? C.purple : "#e0e0e0"}`, borderRadius: 10, background: myRsvp?.status === s ? C.gMain : "#fff", color: myRsvp?.status === s ? "#fff" : "#666", cursor: "pointer", fontSize: 11, fontWeight: 700, transition: "all 0.2s" }}>{s}</button>
                ))}
              </div>
            </div>
          </div>
        );
      })}
      <FlyerModal flyer={viewFlyer} onClose={() => setViewFlyer(null)} />
    </div>
  );
}

function MemberPayment({ member, showToast }) {
  const [payment, setPayment] = useState(null);
  const [ref, setRef] = useState("");
  const [imgData, setImgData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [event, setEvent] = useState(null);
  const fileRef = useRef();
  const receiptRef = useRef();

  useEffect(() => {
    Promise.all([api(`payments?member_id=eq.${member.id}&select=*`), api("events?select=*&limit=1")]).then(([p, e]) => { setPayment(p[0] || null); setEvent(e[0] || null); setLoading(false); });
  }, [member.id]);

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return showToast("Please upload a JPG or PNG image", "error");
    if (file.size > 4 * 1024 * 1024) return showToast("Image must be under 4MB", "error");
    const reader = new FileReader();
    reader.onload = ev => setImgData(ev.target.result);
    reader.readAsDataURL(file);
  };

  const submit = async () => {
    if (!imgData) return showToast("Please upload your bank receipt image", "error");
    if (!ref.trim()) return showToast("Please enter your reference number", "error");
    setSubmitting(true);
    try {
      const rows = await api("payments", { method: "POST", body: JSON.stringify({ member_id: member.id, member_name: member.name, phone: member.phone, event_id: event?.id, event_name: event?.name, amount: event?.ticket_price || 20000, reference: ref.trim(), receipt_image: imgData, status: "Pending" }) });
      setPayment(rows[0]);
      showToast("Receipt submitted! Awaiting admin confirmation.");
    } catch (e) { showToast(e.message, "error"); }
    finally { setSubmitting(false); }
  };

  const shareWA = () => {
    const msg = "👑 *PH CONNECTZ PAYMENT RECEIPT*\n\nReceipt No: " + (payment && payment.receipt_no) + "\nName: " + member.name + "\nPhone: " + member.phone + "\nEvent: " + (event && event.name) + "\nAmount: ₦" + ((event && event.ticket_price) || 20000).toLocaleString() + "\nRef: " + (payment && payment.reference) + "\nStatus: ✅ Confirmed\n\nThank you for being part of PH Connectz! 🎉";
    window.open("https://wa.me/?text=" + encodeURIComponent(msg));
  };

  const print = () => {
    const el = receiptRef.current;
    if (!el) return;
    const w = window.open("", "_blank");
    const scriptTag = "<scr" + "ipt>window.print();window.close();</scr" + "ipt>";
    w.document.write("<html><head><title>PHConnectz Receipt</title></head><body>" + el.outerHTML + scriptTag + "</body></html>");
    w.document.close();
  };

  if (loading) return <Loader />;

  return (
    <div>
      <SecTitle>My Payment</SecTitle>
      {!payment ? (
        <div className="fu" style={{ background: "#fff", borderRadius: 18, padding: 20, boxShadow: "0 4px 20px rgba(0,0,0,0.07)" }}>
          <h3 style={{ color: C.purple, margin: "0 0 4px", fontSize: 16, fontWeight: 800 }}>{event?.name}</h3>
          <p style={{ color: C.green, fontWeight: 800, fontSize: 22, margin: "0 0 16px" }}>₦{(event?.ticket_price || 20000).toLocaleString()}</p>
          <FIn label="Reference Number" value={ref} onChange={setRef} placeholder="e.g. TRF20240816XXXX" />
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 13, fontWeight: 700, color: "#444", display: "block", marginBottom: 6 }}>Bank Receipt Image</label>
            <div onClick={() => fileRef.current.click()} style={{ border: `2px dashed ${imgData ? C.green : C.light}`, borderRadius: 14, padding: 20, textAlign: "center", cursor: "pointer", background: imgData ? "#f0faf4" : C.grey }}>
              {imgData ? <><img src={imgData} alt="receipt" style={{ maxHeight: 160, maxWidth: "100%", borderRadius: 8 }} /><p style={{ margin: "8px 0 0", fontSize: 12, color: C.green, fontWeight: 700 }}>✅ Image ready</p></> : <><div style={{ fontSize: 36 }}>📤</div><p style={{ margin: "8px 0 0", color: "#888", fontSize: 13 }}>Tap to upload receipt</p><p style={{ margin: "4px 0 0", color: "#bbb", fontSize: 11 }}>JPG or PNG, max 4MB</p></>}
            </div>
            <input ref={fileRef} type="file" accept="image/jpeg,image/png" style={{ display: "none" }} onChange={handleFile} />
          </div>
          <GBtn onClick={submit} loading={submitting} full>Submit Payment</GBtn>
        </div>
      ) : (
        <div>
          <div className="fu" style={{ background: "#fff", borderRadius: 16, padding: 16, marginBottom: 12, boxShadow: "0 4px 16px rgba(0,0,0,0.07)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <span style={{ fontWeight: 700 }}>Payment Status</span>
              <SBadge status={payment.status} />
            </div>
            <p style={{ fontSize: 13, color: "#777", margin: 0 }}>Ref: <b>{payment.reference}</b></p>
            {payment.receipt_image && <img src={payment.receipt_image} alt="receipt" style={{ width: "100%", maxHeight: 140, objectFit: "cover", borderRadius: 10, marginTop: 10, border: "1px solid #eee" }} />}
            {payment.status === "Rejected" && <p style={{ fontSize: 13, color: C.red, marginTop: 8, fontWeight: 600 }}>❌ Payment was rejected. Please contact an admin.</p>}
          </div>
          {payment.status === "Confirmed" && (
            <div className="fu" style={{ background: "#e6f9ef", border: "2px solid #1DB954", borderRadius: 14, padding: 16, textAlign: "center" }}>
              <div style={{ fontSize: 36 }}>🧾</div>
              <p style={{ color: "#1DB954", fontWeight: 800, margin: "6px 0 4px", fontSize: 15 }}>Payment Confirmed!</p>
              <p style={{ fontSize: 13, color: "#555", margin: 0 }}>Your official receipt is in the Receipts tab.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function MemberReceipts({ member, showToast }) {
  const [payment, setPayment] = useState(null);
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const receiptRef = useRef();

  useEffect(() => {
    Promise.all([
      api("payments?member_id=eq." + member.id + "&status=eq.Confirmed&select=*"),
      api("events?select=*&limit=1")
    ]).then(([p, e]) => { setPayment(p[0] || null); setEvent(e[0] || null); setLoading(false); });
  }, [member.id]);

  const shareWA = () => {
    const msg = "👑 *PH CONNECTZ PAYMENT RECEIPT*\n\nReceipt No: " + payment?.receipt_no + "\nName: " + member.name + "\nPhone: " + member.phone + "\nEvent: " + event?.name + "\nAmount: ₦" + (event?.ticket_price || 20000).toLocaleString() + "\nRef: " + payment?.reference + "\nStatus: ✅ Confirmed\n" + (payment?.perk_eligible ? "\n🎁 You qualify for FREE 3 yards of Anniversary Fabric!" : "") + "\n\nThank you for being part of PH Connectz! 🎉";
    window.open("https://wa.me/?text=" + encodeURIComponent(msg));
  };

  const print = () => {
    const el = receiptRef.current;
    if (!el) return;
    const w = window.open("", "_blank");
    const scriptTag = "<scr" + "ipt>window.print();window.close();</scr" + "ipt>";
    w.document.write("<html><head><title>PHConnectz Receipt</title></head><body>" + el.outerHTML + scriptTag + "</body></html>");
    w.document.close();
  };

  if (loading) return <Loader />;

  return (
    <div>
      <SecTitle>Receipt History</SecTitle>
      {!payment ? (
        <div className="fu" style={{ background: "#fff", borderRadius: 16, padding: 24, textAlign: "center", boxShadow: "0 4px 16px rgba(0,0,0,0.07)" }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🧾</div>
          <p style={{ color: "#aaa", fontSize: 14, margin: 0 }}>No confirmed receipts yet.</p>
          <p style={{ color: "#ccc", fontSize: 12, margin: "6px 0 0" }}>Your receipt will appear here once your payment is confirmed by an admin.</p>
        </div>
      ) : (
        <div>
          <div ref={receiptRef} className="fu" style={{ background: "#fff", border: "3px solid " + C.gold, borderRadius: 20, overflow: "hidden", marginBottom: 14, boxShadow: "0 8px 28px rgba(240,192,64,0.2)" }}>
            <div style={{ background: C.gMain, padding: "22px 24px", textAlign: "center", position: "relative" }}>
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundImage: "radial-gradient(circle at 20% 50%, rgba(255,255,255,0.05) 0%, transparent 50%)" }} />
              <div style={{ fontSize: 38 }}>👑</div>
              <h2 style={{ color: "#fff", margin: "4px 0 2px", fontSize: 20, fontWeight: 900, letterSpacing: 1 }}>PH CONNECTZ</h2>
              <div style={{ background: C.gold, color: C.purple, fontSize: 10, fontWeight: 800, letterSpacing: 3, padding: "3px 14px", borderRadius: 20, display: "inline-block", marginTop: 4 }}>OFFICIAL PAYMENT RECEIPT</div>
            </div>
            <div style={{ padding: "20px 24px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14, paddingBottom: 12, borderBottom: "2px dashed " + C.gold }}>
                <span style={{ fontSize: 12, color: "#999" }}>Receipt No.</span>
                <span style={{ fontSize: 13, fontWeight: 800, color: C.purple }}>{payment.receipt_no}</span>
              </div>
              {[
                ["Full Name", member.name],
                ["Phone", member.phone],
                ["Event", event?.name],
                ["Amount Paid", "₦" + (payment.amount || 20000).toLocaleString()],
                ["Reference", payment.reference],
                ["Confirmed On", new Date(payment.confirmed_at).toLocaleString()]
              ].map(([k, v]) => (
                <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: "1px solid #f5f5f5" }}>
                  <span style={{ fontSize: 12, color: "#999" }}>{k}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "#333", textAlign: "right", maxWidth: "60%" }}>{v}</span>
                </div>
              ))}
              {payment.perk_eligible && (
                <div style={{ background: "linear-gradient(135deg,#fff9e0,#fff3b0)", border: "2px solid " + C.gold, borderRadius: 12, padding: 12, margin: "14px 0", textAlign: "center" }}>
                  <div style={{ fontSize: 24, animation: "pulse 2s infinite" }}>🎁</div>
                  <p style={{ margin: "4px 0 0", color: C.purple, fontWeight: 800, fontSize: 13 }}>You qualify for FREE 3 yards of Anniversary Fabric!</p>
                </div>
              )}
              <div style={{ textAlign: "center", marginTop: 16, paddingTop: 12, borderTop: "2px dashed " + C.gold }}>
                <div style={{ width: 56, height: 56, background: C.gMain, borderRadius: "50%", margin: "0 auto 10px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>👑</div>
                <p style={{ fontSize: 12, color: C.purple, fontWeight: 700, margin: 0 }}>Thank you for being part of PH Connectz!</p>
                <p style={{ fontSize: 11, color: "#888", margin: "4px 0 8px" }}>See you at the celebration! 🎉</p>
                <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: C.grey, padding: "5px 14px", borderRadius: 20 }}>
                  <span style={{ fontSize: 14 }}>🏅</span>
                  <span style={{ fontSize: 11, color: "#666", fontWeight: 600 }}>PH Connectz Verified</span>
                </div>
              </div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <GBtn onClick={print} style={{ flex: 1, background: "linear-gradient(135deg,#1DB954,#158a3e)" }}>🖨 Print</GBtn>
            <GBtn onClick={shareWA} style={{ flex: 1, background: "linear-gradient(135deg,#25D366,#128C7E)" }}>📲 WhatsApp</GBtn>
          </div>
        </div>
      )}
    </div>
  );
}

({ member, setMember, showToast }) {
  const [rsvps, setRsvps] = useState([]);
  const [payment, setPayment] = useState(null);
  const [displayName, setDisplayName] = useState(member.display_name || "");
  const [editingName, setEditingName] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef();

  useEffect(() => {
    api(`rsvps?member_id=eq.${member.id}&select=*`).then(setRsvps);
    api(`payments?member_id=eq.${member.id}&select=*`).then(r => setPayment(r[0] || null));
  }, [member.id]);

  const handleAvatar = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return showToast("JPG or PNG only", "error");
    if (file.size > 4 * 1024 * 1024) return showToast("Image must be under 4MB", "error");
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        await api(`members?id=eq.${member.id}`, { method: "PATCH", body: JSON.stringify({ avatar: ev.target.result }) });
        setMember(m => ({ ...m, avatar: ev.target.result }));
        showToast("Profile picture updated! 🎉");
      } catch (err) { showToast(err.message, "error"); }
    };
    reader.readAsDataURL(file);
  };

  const saveDisplayName = async () => {
    if (!displayName.trim()) return showToast("Display name cannot be empty", "error");
    setSaving(true);
    try {
      await api("members?id=eq." + member.id, { method: "PATCH", body: JSON.stringify({ display_name: displayName.trim() }) });
      setMember(m => ({ ...m, display_name: displayName.trim() }));
      setEditingName(false);
      showToast("Display name updated!");
    } catch (e) { showToast(e.message, "error"); }
    finally { setSaving(false); }
  };

  return (
    <div>
      <SecTitle>My Profile</SecTitle>
      <div className="fu" style={{ background: C.gMain, borderRadius: 20, padding: "28px 20px", color: "#fff", marginBottom: 16, textAlign: "center", boxShadow: "0 8px 28px rgba(61,0,102,0.25)" }}>
        <div style={{ position: "relative", width: 88, margin: "0 auto 14px" }}>
          <div style={{ width: 88, height: 88, borderRadius: "50%", border: `3px solid ${C.gold}`, overflow: "hidden", background: C.gold, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 34, fontWeight: 900, color: C.purple }}>
            {member.avatar ? <img src={member.avatar} alt="avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : member.name[0]}
          </div>
          <button onClick={() => fileRef.current.click()} style={{ position: "absolute", bottom: 0, right: 0, width: 28, height: 28, background: C.gold, border: "2px solid #fff", borderRadius: "50%", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13 }}>📷</button>
          <input ref={fileRef} type="file" accept="image/jpeg,image/png" style={{ display: "none" }} onChange={handleAvatar} />
        </div>
        <h3 style={{ margin: "0 0 4px", fontSize: 20, fontWeight: 800 }}>{member.name}</h3>
        <p style={{ margin: "0 0 6px", fontSize: 13, opacity: 0.8 }}>💬 {member.display_name || "No display name set"}</p>
        <span style={{ background: "rgba(255,255,255,0.2)", padding: "4px 14px", borderRadius: 20, fontSize: 12, fontWeight: 600 }}>{member.role}</span>
        <p style={{ margin: "8px 0 0", fontSize: 11, opacity: 0.6 }}>Tap 📷 to change photo</p>
      </div>
      <div className="fu" style={{ background: "#fff", borderRadius: 16, padding: 16, marginBottom: 12, boxShadow: "0 4px 16px rgba(0,0,0,0.07)" }}>
        <p style={{ margin: "0 0 8px", fontWeight: 700, color: C.purple, fontSize: 14 }}>💬 Chat Display Name</p>
        {editingName ? (
          <div style={{ display: "flex", gap: 8 }}>
            <input value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="Your display name" style={{ flex: 1, padding: "9px 12px", border: "2px solid #eee", borderRadius: 10, fontSize: 13 }} />
            <GBtn onClick={saveDisplayName} loading={saving} style={{ padding: "9px 14px", fontSize: 13 }}>Save</GBtn>
            <button onClick={() => setEditingName(false)} style={{ padding: "9px 12px", border: "2px solid #eee", borderRadius: 10, background: "#fff", cursor: "pointer", fontSize: 13 }}>✕</button>
          </div>
        ) : (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 14, color: "#555" }}>{member.display_name || <span style={{ color: "#bbb" }}>Not set</span>}</span>
            <button onClick={() => setEditingName(true)} style={{ background: "#f0e6ff", border: "none", color: C.purple, padding: "6px 12px", borderRadius: 8, cursor: "pointer", fontSize: 12, fontWeight: 700 }}>Edit</button>
          </div>
        )}
        <p style={{ margin: "6px 0 0", fontSize: 11, color: "#aaa" }}>This name is shown in chat instead of your full name</p>
      </div>
      <div className="fu" style={{ background: "#fff", borderRadius: 16, padding: 16, boxShadow: "0 4px 16px rgba(0,0,0,0.07)" }}>
        {[["📱 Phone", member.phone], ["🏷 Role", member.role], ["🗓 RSVPs", rsvps.length], ["💳 Payment", payment?.status || "Not submitted"], ["📆 Member Since", new Date(member.created_at).toLocaleDateString()]].map(([k, v]) => (
          <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid #f5f5f5" }}>
            <span style={{ fontSize: 13, color: "#888" }}>{k}</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#333" }}>{v}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── CHAT ──────────────────────────────────────────────────────────────────────
function ChatPage({ member, showToast }) {
  const [channel, setChannel] = useState("general");
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const chatRef = useRef();
  const inputRef = useRef();
  const pollRef = useRef();

  const senderId = member.id === "admin" ? null : member.id;
  const isAdmin = member?.role === "Admin" || member?.role === "SuperAdmin" || member?.role === "superadmin";
  const canPost = channel === "general" || isAdmin;

  const scrollToBottom = () => {
    setTimeout(() => { if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight; }, 80);
  };

  const fetchMsgs = useCallback(async (autoScroll = false) => {
    try {
      const rows = await api(`messages?channel=eq.${channel}&select=*&order=created_at.asc&limit=100`);
      setMessages(prev => {
        if (JSON.stringify(prev) !== JSON.stringify(rows) && autoScroll) scrollToBottom();
        return rows;
      });
      setLoading(false);
      if (!initialized) { scrollToBottom(); setInitialized(true); }
    } catch { }
  }, [channel, initialized]);

  useEffect(() => {
    setLoading(true); setInitialized(false); setMessages([]);
    fetchMsgs(false);
    pollRef.current = setInterval(() => fetchMsgs(true), 4000);
    return () => clearInterval(pollRef.current);
  }, [channel]);

  const send = async () => {
    if (!text.trim()) return;
    setSending(true);
    const displayName = member.display_name || member.name;
    const avatarUrl = member.avatar || null;
    const optimistic = { id: "temp-" + Date.now(), member_id: senderId, member_name: member.name, display_name: displayName, avatar: avatarUrl, content: text.trim(), channel, created_at: new Date().toISOString() };
    setMessages(prev => [...prev, optimistic]);
    setText(""); setShowEmoji(false); scrollToBottom();
    try {
      await api("messages", { method: "POST", body: JSON.stringify({ member_id: senderId, member_name: member.name, display_name: displayName, avatar: avatarUrl, content: optimistic.content, channel }) });
      fetchMsgs(false);
    } catch (e) {
      setMessages(prev => prev.filter(m => m.id !== optimistic.id));
      showToast(e.message, "error");
    } finally { setSending(false); inputRef.current?.focus(); }
  };

  const addEmoji = (emoji) => { setText(t => t + emoji); setShowEmoji(false); inputRef.current?.focus(); };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 150px)", position: "relative" }}>
      <SecTitle>Community Chat</SecTitle>
      <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
        {[["general", "💬 General"], ["announcements", "📢 Announcements"]].map(([id, label]) => (
          <button key={id} onClick={() => setChannel(id)} className="bp" style={{ flex: 1, padding: "9px", border: `2px solid ${channel === id ? C.purple : "#e0e0e0"}`, borderRadius: 12, background: channel === id ? C.gMain : "#fff", color: channel === id ? "#fff" : "#666", cursor: "pointer", fontSize: 12, fontWeight: 700, transition: "all 0.2s" }}>{label}</button>
        ))}
      </div>
      {channel === "announcements" && !isAdmin && (
        <div style={{ background: "#fff9e0", border: `1px solid ${C.gold}`, borderRadius: 10, padding: "8px 12px", marginBottom: 8, fontSize: 12, color: "#888" }}>📢 Only admins can post here.</div>
      )}
      <div ref={chatRef} style={{ flex: 1, background: "#ECE5DD", borderRadius: 16, padding: "12px 10px", overflowY: "auto", boxShadow: "0 4px 16px rgba(0,0,0,0.07)", marginBottom: 8 }}>
        {loading && <Loader />}
        {!loading && messages.length === 0 && <Empty msg="No messages yet. Say hello! 👋" />}
        {messages.map((msg, i) => {
          const isMe = msg.member_id === senderId || (senderId === null && msg.member_name === member.name);
          const name = msg.display_name || msg.member_name || "?";
          const showName = !isMe && (i === 0 || messages[i - 1]?.member_id !== msg.member_id);
          const isConsec = i > 0 && messages[i - 1]?.member_id === msg.member_id && messages[i - 1]?.member_id !== null;
          return (
            <div key={msg.id} style={{ display: "flex", flexDirection: isMe ? "row-reverse" : "row", gap: 6, marginBottom: isConsec ? 2 : 8, alignItems: "flex-end", paddingLeft: isMe ? 40 : 0, paddingRight: isMe ? 0 : 40 }}>
              {/* Avatar — always reserve space, show on first message of a group */}
              <div style={{ width: 32, height: 32, flexShrink: 0, alignSelf: "flex-end" }}>
                {!isMe && !isConsec && (
                  <div style={{ width: 32, height: 32, borderRadius: "50%", background: C.gMain, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, fontSize: 13, border: "2px solid #fff", boxShadow: "0 1px 4px rgba(0,0,0,0.15)" }}>
                    {msg.avatar
                      ? <img src={msg.avatar} alt={name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      : name[0]?.toUpperCase()
                    }
                  </div>
                )}
              </div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: isMe ? "flex-end" : "flex-start", maxWidth: "75%" }}>
                {showName && <p style={{ margin: "0 0 3px 4px", fontSize: 11, color: C.mid, fontWeight: 700 }}>{name}</p>}
                <div style={{
                  background: isMe ? "#DCF8C6" : "#FFFFFF",
                  color: "#111",
                  padding: "7px 12px 6px",
                  borderRadius: isMe
                    ? isConsec ? "12px 12px 4px 12px" : "12px 4px 4px 12px"
                    : isConsec ? "12px 12px 12px 4px" : "4px 12px 12px 12px",
                  fontSize: 14,
                  lineHeight: 1.45,
                  wordBreak: "break-word",
                  boxShadow: "0 1px 2px rgba(0,0,0,0.15)",
                  minWidth: 60,
                }}>
                  {msg.content}
                  <span style={{ fontSize: 10, color: "#888", marginLeft: 8, float: "right", marginTop: 2, lineHeight: 1 }}>
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    {isMe && " ✓✓"}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      {showEmoji && (
        <div className="fi" style={{ background: "#fff", borderRadius: 14, padding: 10, boxShadow: "0 4px 20px rgba(0,0,0,0.15)", marginBottom: 6, display: "flex", flexWrap: "wrap", gap: 4, maxHeight: 130, overflowY: "auto" }}>
          {EMOJIS.map(e => <button key={e} onClick={() => addEmoji(e)} style={{ fontSize: 20, background: "none", border: "none", cursor: "pointer", padding: "3px", borderRadius: 6 }}>{e}</button>)}
        </div>
      )}
      {canPost ? (
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <div style={{ flex: 1, display: "flex", gap: 6, background: "#fff", borderRadius: 24, padding: "6px 6px 6px 14px", boxShadow: "0 2px 8px rgba(0,0,0,0.1)", alignItems: "center" }}>
            <button onClick={() => setShowEmoji(s => !s)} style={{ fontSize: 22, background: "none", border: "none", cursor: "pointer", padding: "2px", flexShrink: 0, opacity: 0.6 }}>😊</button>
            <input ref={inputRef} value={text} onChange={e => setText(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }} placeholder={channel === "announcements" ? "Post an announcement…" : "Type a message…"} style={{ flex: 1, border: "none", fontSize: 14, outline: "none", background: "transparent", padding: "4px 0" }} />
          </div>
          <button onClick={send} disabled={sending || !text.trim()} className="bp" style={{ width: 44, height: 44, background: text.trim() ? "#25D366" : "#aaa", border: "none", borderRadius: "50%", cursor: text.trim() ? "pointer" : "default", fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s", flexShrink: 0, boxShadow: "0 2px 8px rgba(0,0,0,0.2)" }}>
            {sending ? <span style={{ animation: "spin 0.8s linear infinite", display: "inline-block", fontSize: 12, color: "#fff" }}>⟳</span> : <span style={{ color: "#fff" }}>➤</span>}
          </button>
        </div>
      ) : (
        <div style={{ background: "#f5f5f5", borderRadius: 12, padding: 12, textAlign: "center", fontSize: 13, color: "#aaa" }}>Only admins can post in announcements</div>
      )}
    </div>
  );
}

// ── ADMIN APP ─────────────────────────────────────────────────────────────────
function AdminApp({ session, logout, showToast }) {
  const [page, setPage] = useState("home");
  const isSuperAdmin = session.role === "superadmin";
  const [adminMember, setAdminMember] = useState(null);

  useEffect(() => {
    if (session.memberId) api(`members?id=eq.${session.memberId}&select=*`).then(r => r[0] && setAdminMember(r[0]));
  }, [session.memberId]);

  const chatMember = adminMember || { id: "admin", name: isSuperAdmin ? "Super Admin" : "Admin", role: isSuperAdmin ? "SuperAdmin" : "Admin", display_name: isSuperAdmin ? "Super Admin" : "Admin", avatar: null };
  const tabs = [{ id: "home", icon: "📊", label: "Dashboard" }, { id: "members", icon: "👥", label: "Members" }, { id: "events", icon: "🗓", label: "Events" }, { id: "payments", icon: "💳", label: "Payments" }, { id: "chat", icon: "💬", label: "Chat" }];

  return (
    <div style={{ minHeight: "100vh", background: C.grey, paddingBottom: 76 }}>
      <header style={{ background: "linear-gradient(90deg,#1a0033,#3D0066)", color: "#fff", padding: "14px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 100, boxShadow: "0 4px 20px rgba(0,0,0,0.35)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 36, height: 36, background: C.gold, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>👑</div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontWeight: 800, fontSize: 16 }}>PH Connectz</span>
              <span style={{ background: isSuperAdmin ? C.gold : "rgba(255,255,255,0.2)", color: isSuperAdmin ? C.purple : "#fff", fontSize: 9, fontWeight: 800, padding: "2px 7px", borderRadius: 20 }}>{isSuperAdmin ? "⚡ SUPER ADMIN" : "ADMIN"}</span>
            </div>
            <div style={{ fontSize: 10, opacity: 0.6 }}>Management Portal</div>
          </div>
        </div>
        <button onClick={logout} className="bp" style={{ background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.2)", color: "#fff", padding: "7px 14px", borderRadius: 20, cursor: "pointer", fontSize: 12, fontWeight: 600 }}>Sign Out</button>
      </header>
      <div style={{ padding: "16px 16px 0", maxWidth: 700, margin: "0 auto" }}>
        {page === "home" && <AdminHome setPage={setPage} isSuperAdmin={isSuperAdmin} />}
        {page === "members" && <AdminMembers showToast={showToast} isSuperAdmin={isSuperAdmin} />}
        {page === "events" && <AdminEvents showToast={showToast} />}
        {page === "payments" && <AdminPayments showToast={showToast} />}
        {page === "chat" && <ChatPage member={chatMember} showToast={showToast} />}
      </div>
      <BottomNav tabs={tabs} page={page} setPage={setPage} dark={true} />
    </div>
  );
}

function AdminHome({ setPage, isSuperAdmin }) {
  const [stats, setStats] = useState({ members: 0, pending: 0, events: 0, confirmed: 0, payPending: 0, total: 0 });
  useEffect(() => {
    Promise.all([api("members?select=id"), api("members?status=eq.Pending&select=id"), api("events?select=id"), api("payments?status=eq.Confirmed&select=amount"), api("payments?status=eq.Pending&select=id")])
      .then(([m, p, e, c, pay]) => setStats({ members: m.length, pending: p.length, events: e.length, confirmed: c.length, payPending: pay.length, total: c.reduce((s, x) => s + (x.amount || 0), 0) }));
  }, []);
  return (
    <div>
      <div className="fu" style={{ background: "linear-gradient(135deg,#1a0033,#3D0066)", borderRadius: 20, padding: 20, color: "#fff", marginBottom: 16, boxShadow: "0 8px 28px rgba(0,0,0,0.2)" }}>
        <div style={{ fontSize: 12, opacity: 0.6, marginBottom: 4 }}>{isSuperAdmin ? "⚡ Super Admin" : "Admin"} Dashboard</div>
        <h2 style={{ margin: "0 0 2px", fontSize: 22, fontWeight: 900 }}>Welcome back!</h2>
        <p style={{ margin: 0, opacity: 0.55, fontSize: 12 }}>{new Date().toDateString()}</p>
      </div>
      {stats.pending > 0 && (
        <div className="fu" style={{ background: "#fff9e0", border: "2px solid " + C.orange, borderRadius: 14, padding: "12px 16px", marginBottom: 14, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <p style={{ margin: 0, fontWeight: 800, color: C.orange, fontSize: 14 }}>⏳ {stats.pending} Pending Approval</p>
            <p style={{ margin: "2px 0 0", fontSize: 12, color: "#888" }}>New members waiting to be approved</p>
          </div>
          <button onClick={() => setPage("members")} style={{ background: C.orange, border: "none", color: "#fff", padding: "8px 14px", borderRadius: 10, cursor: "pointer", fontWeight: 700, fontSize: 12 }}>Review</button>
        </div>
      )}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
        {[["👥", "Total Members", stats.members, C.mid], ["🗓", "Events", stats.events, C.light], ["💰", "Collected", "₦" + stats.total.toLocaleString(), C.green], ["⏳", "Pending Payments", stats.payPending, C.orange]].map(([icon, label, val, color], i) => (
          <div key={label} className="fu ch" style={{ background: "#fff", borderRadius: 14, padding: 14, boxShadow: "0 4px 14px rgba(0,0,0,0.06)", borderTop: `4px solid ${color}`, animationDelay: `${i * 0.07}s` }}>
            <div style={{ fontSize: 24 }}>{icon}</div>
            <div style={{ fontSize: 22, fontWeight: 900, color, margin: "4px 0 2px" }}>{val}</div>
            <div style={{ fontSize: 11, color: "#aaa" }}>{label}</div>
          </div>
        ))}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {[["👥 Manage Members", "members", C.gMain], ["🗓 Create / Edit Events", "events", `linear-gradient(135deg,${C.light},${C.mid})`], ["💳 Review Payments", "payments", `linear-gradient(135deg,${C.green},#158a3e)`]].map(([label, pg, bg]) => (
          <button key={pg} onClick={() => setPage(pg)} className="bp ch" style={{ padding: "13px 18px", background: bg, color: "#fff", border: "none", borderRadius: 12, cursor: "pointer", fontWeight: 700, fontSize: 14, textAlign: "left", boxShadow: "0 4px 14px rgba(0,0,0,0.12)" }}>{label}</button>
        ))}
      </div>
    </div>
  );
}

function AdminMembers({ showToast, isSuperAdmin }) {
  const [members, setMembers] = useState([]);
  const [search, setSearch] = useState("");
  const [roleF, setRoleF] = useState("All");
  const [editM, setEditM] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = () => api("members?select=*&order=created_at.desc").then(r => { setMembers(r); setLoading(false); });
  useEffect(() => { load(); }, []);

  const filtered = members.filter(m => (m.name.toLowerCase().includes(search.toLowerCase()) || m.phone.includes(search)) && (roleF === "All" || m.role === roleF));

  const remove = async (id) => {
    if (!window.confirm("Remove this member?")) return;
    try { await api("members?id=eq." + id, { method: "DELETE" }); setMembers(m => m.filter(x => x.id !== id)); showToast("Member removed"); }
    catch (e) { showToast(e.message, "error"); }
  };

  const saveEdit = async () => {
    try {
      await api(`members?id=eq.${editM.id}`, { method: "PATCH", body: JSON.stringify({ name: editM.name, phone: editM.phone, role: editM.role, display_name: editM.display_name }) });
      setMembers(m => m.map(x => x.id === editM.id ? { ...x, ...editM } : x));
      setEditM(null); showToast("Member updated");
    } catch (e) { showToast(e.message, "error"); }
  };

  if (loading) return <Loader />;

  return (
    <div>
      <SecTitle>Members ({members.length})</SecTitle>
      <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 Search name / phone…" style={{ flex: 1, padding: "10px 14px", border: "2px solid #eee", borderRadius: 10, fontSize: 13, background: "#fff" }} />
        <select value={roleF} onChange={e => setRoleF(e.target.value)} style={{ padding: "10px 8px", border: "2px solid #eee", borderRadius: 10, fontSize: 13, background: "#fff" }}>
          {["All", "Member", "Exec", "Admin"].map(r => <option key={r}>{r}</option>)}
        </select>
      </div>
      {filtered.length === 0 && <Empty msg="No members found." />}
      {filtered.map((m, i) => (
        <div key={m.id} className="fu ch" style={{ background: "#fff", borderRadius: 14, padding: 14, marginBottom: 10, boxShadow: "0 4px 14px rgba(0,0,0,0.06)", animationDelay: `${i * 0.04}s` }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <Avi member={m} size={44} />
              <div>
                <p style={{ margin: "0 0 1px", fontWeight: 800, color: C.purple, fontSize: 15 }}>{m.name}</p>
                {m.display_name && m.display_name !== m.name && <p style={{ margin: "0 0 2px", fontSize: 11, color: C.mid, fontWeight: 600 }}>💬 {m.display_name}</p>}
                <p style={{ margin: "0 0 5px", fontSize: 12, color: "#999" }}>{m.phone}</p>
                <Tag bg="#f0e6ff" color={C.purple}>{m.role}</Tag>
              </div>
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              <button onClick={() => setEditM({ ...m })} style={{ background: "#f0e6ff", border: "none", color: C.purple, padding: "7px 11px", borderRadius: 8, cursor: "pointer", fontSize: 12, fontWeight: 700 }}>Edit</button>
              <button onClick={() => remove(m.id)} style={{ background: "#fce4ec", border: "none", color: C.red, padding: "7px 11px", borderRadius: 8, cursor: "pointer", fontSize: 12, fontWeight: 700 }}>Remove</button>
            </div>
          </div>
        </div>
      ))}
      {editM && (
        <Modal onClose={() => setEditM(null)} title="Edit Member">
          <FIn label="Full Name" value={editM.name} onChange={v => setEditM(e => ({ ...e, name: v }))} />
          <FIn label="Phone" value={editM.phone} onChange={v => setEditM(e => ({ ...e, phone: v }))} />
          <FIn label="💬 Display Name" value={editM.display_name || ""} onChange={v => setEditM(e => ({ ...e, display_name: v }))} placeholder="Name shown in chat" />
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 13, fontWeight: 700, color: "#444", display: "block", marginBottom: 6 }}>Role</label>
            <select value={editM.role} onChange={e => setEditM(m => ({ ...m, role: e.target.value }))} style={{ width: "100%", padding: "10px 12px", border: "2px solid #eee", borderRadius: 10, fontSize: 13, background: "#fff" }}>
              {(isSuperAdmin ? ["Member", "Exec", "Admin"] : ["Member", "Exec"]).map(r => <option key={r}>{r}</option>)}
            </select>
            {!isSuperAdmin && <p style={{ fontSize: 11, color: "#aaa", margin: "4px 0 0" }}>⚡ Only Super Admin can assign Admin role.</p>}
          </div>
          <GBtn onClick={saveEdit} full>Save Changes</GBtn>
        </Modal>
      )}
    </div>
  );
}

function AdminEvents({ showToast }) {
  const [events, setEvents] = useState([]);
  const [payments, setPayments] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [viewFlyer, setViewFlyer] = useState(null);
  const blank = { name: "", date: "", description: "", capacity: "150", ticket_price: "20000", perk_limit: "50", perk_desc: "🎁 First 50 who pay get FREE 3 yards of Anniversary Fabric!", flyer: null };
  const [form, setForm] = useState(blank);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef();

  const load = () => Promise.all([api("events?select=*&order=created_at.desc"), api("payments?status=eq.Confirmed&select=event_id")]).then(([e, p]) => { setEvents(e); setPayments(p); setLoading(false); });
  useEffect(() => { load(); }, []);

  const handleFlyer = (e) => {
    const file = e.target.files[0]; if (!file) return;
    const r = new FileReader(); r.onload = ev => setForm(f => ({ ...f, flyer: ev.target.result })); r.readAsDataURL(file);
  };

  const save = async () => {
    if (!form.name || !form.date) return showToast("Name and date required", "error");
    setSaving(true);
    const payload = { name: form.name, date: form.date, description: form.description, capacity: +form.capacity, ticket_price: +form.ticket_price, perk_limit: +form.perk_limit, perk_desc: form.perk_desc, flyer: form.flyer };
    try {
      if (editing) { await api(`events?id=eq.${editing}`, { method: "PATCH", body: JSON.stringify(payload) }); showToast("Event updated ✅"); }
      else { await api("events", { method: "POST", body: JSON.stringify(payload) }); showToast("Event created ✅"); }
      load(); setForm(blank); setEditing(null); setShowForm(false);
    } catch (e) { showToast(e.message, "error"); }
    finally { setSaving(false); }
  };

  const del = async (id) => {
    if (!window.confirm("Are you sure you want to delete this event? This cannot be undone.")) return;
    try { await api("events?id=eq." + id, { method: "DELETE" }); setEvents(e => e.filter(x => x.id !== id)); showToast("Event deleted"); }
    catch (e) { showToast("Delete failed: " + e.message, "error"); }
  };

  if (loading) return <Loader />;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <SecTitle style={{ margin: 0 }}>Events</SecTitle>
        <GBtn onClick={() => { setForm(blank); setEditing(null); setShowForm(true); }} style={{ fontSize: 13, padding: "9px 16px" }}>+ New Event</GBtn>
      </div>
      {events.length === 0 && <Empty msg="No events yet. Create one!" />}
      {events.map((evt, i) => {
        const confirmed = payments.filter(p => p.event_id === evt.id).length;
        const pct = evt.capacity ? Math.min(100, Math.round((confirmed / evt.capacity) * 100)) : 0;
        return (
          <div key={evt.id} className="fu ch" style={{ background: "#fff", borderRadius: 18, overflow: "hidden", marginBottom: 14, boxShadow: "0 4px 20px rgba(0,0,0,0.07)", animationDelay: `${i * 0.07}s` }}>
            {evt.flyer && <img src={evt.flyer} alt="flyer" onClick={() => setViewFlyer(evt.flyer)} style={{ width: "100%", maxHeight: 180, objectFit: "cover", cursor: "pointer" }} title="Click to view full flyer" />}
            <div style={{ padding: 16 }}>
              <h3 style={{ color: C.purple, margin: "0 0 4px", fontSize: 16, fontWeight: 800 }}>{evt.name}</h3>
              <p style={{ fontSize: 12, color: "#999", margin: "0 0 4px" }}>📅 {evt.date} · ₦{(+evt.ticket_price).toLocaleString()} · Cap: {evt.capacity}</p>
              <PBar pct={pct} />
              <p style={{ fontSize: 12, color: "#777", margin: "4px 0 10px" }}>{confirmed}/{evt.capacity} confirmed ({pct}%)</p>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => { setForm({ ...evt, capacity: String(evt.capacity), ticket_price: String(evt.ticket_price), perk_limit: String(evt.perk_limit || 50) }); setEditing(evt.id); setShowForm(true); }} style={{ background: "#f0e6ff", border: "none", color: C.purple, padding: "8px 14px", borderRadius: 10, cursor: "pointer", fontSize: 12, fontWeight: 700 }}>✏️ Edit</button>
                <button onClick={() => del(evt.id)} style={{ background: "#fce4ec", border: "none", color: C.red, padding: "8px 14px", borderRadius: 10, cursor: "pointer", fontSize: 12, fontWeight: 700 }}>🗑 Delete</button>
              </div>
            </div>
          </div>
        );
      })}
      {showForm && (
        <Modal onClose={() => setShowForm(false)} title={editing ? "Edit Event" : "New Event"}>
          <FIn label="Event Name *" value={form.name} onChange={v => setForm(f => ({ ...f, name: v }))} />
          <FIn label="Date *" type="date" value={form.date} onChange={v => setForm(f => ({ ...f, date: v }))} />
          <FIn label="Description" value={form.description} onChange={v => setForm(f => ({ ...f, description: v }))} />
          <FIn label="Capacity" type="number" value={form.capacity} onChange={v => setForm(f => ({ ...f, capacity: v }))} />
          <FIn label="Ticket Price (₦)" type="number" value={form.ticket_price} onChange={v => setForm(f => ({ ...f, ticket_price: v }))} />
          <FIn label="Perk Description" value={form.perk_desc} onChange={v => setForm(f => ({ ...f, perk_desc: v }))} />
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 13, fontWeight: 700, color: "#444", display: "block", marginBottom: 6 }}>Event Flyer (optional)</label>
            <div onClick={() => fileRef.current.click()} style={{ border: `2px dashed ${form.flyer ? C.green : "#ddd"}`, borderRadius: 12, padding: 16, textAlign: "center", cursor: "pointer", background: form.flyer ? "#f0faf4" : C.grey }}>
              {form.flyer ? <><img src={form.flyer} alt="flyer" style={{ maxHeight: 120, maxWidth: "100%", borderRadius: 8 }} /><p style={{ margin: "6px 0 0", fontSize: 11, color: C.green, fontWeight: 700 }}>✅ Flyer uploaded</p></> : <><div style={{ fontSize: 28 }}>🖼</div><p style={{ margin: "6px 0 0", color: "#aaa", fontSize: 13 }}>Tap to upload flyer</p></>}
            </div>
            <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleFlyer} />
          </div>
          <GBtn onClick={save} loading={saving} full>{editing ? "Update Event" : "Create Event"}</GBtn>
        </Modal>
      )}
      <FlyerModal flyer={viewFlyer} onClose={() => setViewFlyer(null)} />
    </div>
  );
}

function AdminPayments({ showToast }) {
  const [payments, setPayments] = useState([]);
  const [filter, setFilter] = useState("All");
  const [viewImg, setViewImg] = useState(null);
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState([]);

  const load = () => Promise.all([api("payments?select=*&order=submitted_at.desc"), api("events?select=*")]).then(([p, e]) => { setPayments(p); setEvents(e); setLoading(false); });
  useEffect(() => { load(); }, []);

  const confirm = async (id) => {
    const confirmedCount = payments.filter(p => p.status === "Confirmed").length;
    const evt = events[0];
    try {
      await api(`payments?id=eq.${id}`, { method: "PATCH", body: JSON.stringify({ status: "Confirmed", confirmed_at: new Date().toISOString(), receipt_no: rNo(), perk_eligible: confirmedCount < (evt?.perk_limit || 50) }) });
      load(); showToast("Payment confirmed ✅");
    } catch (e) { showToast(e.message, "error"); }
  };

  const reject = async (id) => {
    try { await api(`payments?id=eq.${id}`, { method: "PATCH", body: JSON.stringify({ status: "Rejected" }) }); load(); showToast("Payment rejected", "error"); }
    catch (e) { showToast(e.message, "error"); }
  };

  const confirmed = payments.filter(p => p.status === "Confirmed");
  const pending = payments.filter(p => p.status === "Pending");
  const total = confirmed.reduce((s, p) => s + (p.amount || 0), 0);
  const evt = events[0];
  const shown = payments.filter(p => filter === "All" || p.status === filter);

  if (loading) return <Loader />;

  return (
    <div>
      <SecTitle>Payments</SecTitle>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
        {[["✅", "Confirmed", confirmed.length, C.green], ["⏳", "Pending", pending.length, C.orange], ["💰", "Collected", `₦${total.toLocaleString()}`, C.purple], ["🎟", "Slots Left", evt ? evt.capacity - confirmed.length : "—", C.light]].map(([icon, label, val, color]) => (
          <div key={label} className="fu ch" style={{ background: "#fff", borderRadius: 14, padding: 13, boxShadow: "0 4px 14px rgba(0,0,0,0.06)", borderTop: `4px solid ${color}` }}>
            <div style={{ fontSize: 22 }}>{icon}</div>
            <div style={{ fontSize: 19, fontWeight: 900, color, margin: "3px 0 2px" }}>{val}</div>
            <div style={{ fontSize: 11, color: "#aaa" }}>{label}</div>
          </div>
        ))}
      </div>
      <div style={{ display: "flex", gap: 7, marginBottom: 14, overflowX: "auto", paddingBottom: 4 }}>
        {["All", "Pending", "Confirmed", "Rejected"].map(f => (
          <button key={f} onClick={() => setFilter(f)} className="bp" style={{ padding: "7px 14px", border: `2px solid ${filter === f ? C.purple : "#e0e0e0"}`, borderRadius: 20, background: filter === f ? C.gMain : "#fff", color: filter === f ? "#fff" : "#666", cursor: "pointer", fontSize: 12, fontWeight: 700, whiteSpace: "nowrap", flexShrink: 0 }}>{f}</button>
        ))}
      </div>
      {shown.length === 0 && <Empty msg="No payments found." />}
      {shown.map((p, i) => (
        <div key={p.id} className="fu ch" style={{ background: "#fff", borderRadius: 14, padding: 14, marginBottom: 10, boxShadow: "0 4px 14px rgba(0,0,0,0.06)", animationDelay: `${i * 0.04}s` }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
            <div>
              <p style={{ margin: "0 0 2px", fontWeight: 800, color: C.purple, fontSize: 15 }}>{p.member_name}</p>
              <p style={{ margin: "0 0 2px", fontSize: 12, color: "#999" }}>{p.phone}</p>
              <p style={{ margin: "0 0 4px", fontSize: 12, color: "#555" }}>Ref: <b>{p.reference}</b></p>
              <p style={{ margin: 0, fontSize: 12, color: "#777" }}>₦{(p.amount || 0).toLocaleString()} · {new Date(p.submitted_at).toLocaleDateString()}</p>
              {p.perk_eligible && <span style={{ fontSize: 11, color: C.goldD, fontWeight: 700 }}>🎁 Perk Eligible</span>}
            </div>
            <SBadge status={p.status} />
          </div>
          {p.receipt_image && p.status === "Pending" && (
            <div style={{ marginBottom: 10 }}>
              <img src={p.receipt_image} alt="receipt" onClick={() => setViewImg(p.receipt_image)} style={{ width: "100%", maxHeight: 140, objectFit: "cover", borderRadius: 10, border: "2px solid #eee", cursor: "pointer" }} />
              <p style={{ fontSize: 11, color: "#aaa", margin: "3px 0 0", textAlign: "center" }}>Tap to view full receipt</p>
            </div>
          )}
          {p.status === "Confirmed" && (
            <div style={{ background: "#e6f9ef", borderRadius: 10, padding: "8px 12px", marginBottom: 8 }}>
              <p style={{ margin: 0, fontSize: 12, color: C.green, fontWeight: 600 }}>✅ Receipt image removed after confirmation. Member has their generated receipt.</p>
            </div>
          )}
          {p.status === "Pending" && (
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => confirm(p.id)} className="bp" style={{ flex: 1, padding: 10, background: "linear-gradient(135deg,#1DB954,#158a3e)", border: "none", color: "#fff", borderRadius: 10, cursor: "pointer", fontWeight: 800, fontSize: 13 }}>✅ Confirm</button>
              <button onClick={() => reject(p.id)} className="bp" style={{ flex: 1, padding: 10, background: "linear-gradient(135deg,#E53935,#b71c1c)", border: "none", color: "#fff", borderRadius: 10, cursor: "pointer", fontWeight: 800, fontSize: 13 }}>❌ Reject</button>
            </div>
          )}
        </div>
      ))}
      {viewImg && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.88)", zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }} onClick={() => setViewImg(null)}>
          <img src={viewImg} alt="receipt" style={{ maxWidth: "100%", maxHeight: "90vh", borderRadius: 12, objectFit: "contain" }} />
        </div>
      )}
    </div>
  );
}

// ── SHARED COMPONENTS ─────────────────────────────────────────────────────────
function FlyerModal({ flyer, onClose }) {
  if (!flyer) return null;
  return (
    <div className="fi" style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.92)", zIndex: 2000, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 20 }} onClick={onClose}>
      <img src={flyer} alt="flyer" style={{ maxWidth: "100%", maxHeight: "80vh", borderRadius: 12, objectFit: "contain" }} onClick={e => e.stopPropagation()} />
      <div style={{ display: "flex", gap: 12, marginTop: 16 }} onClick={e => e.stopPropagation()}>
        <a href={flyer} download="PHConnectz_Event_Flyer.jpg" style={{ padding: "10px 24px", background: C.gold, color: C.purple, borderRadius: 20, fontWeight: 800, fontSize: 14, textDecoration: "none" }}>⬇ Download Flyer</a>
        <button onClick={onClose} style={{ padding: "10px 24px", background: "rgba(255,255,255,0.15)", color: "#fff", border: "1px solid rgba(255,255,255,0.3)", borderRadius: 20, fontWeight: 700, fontSize: 14, cursor: "pointer" }}>✕ Close</button>
      </div>
    </div>
  );
}

function Avi({ member, size = 40 }) {
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", background: C.gMain, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, fontSize: size * 0.38, flexShrink: 0, border: `2px solid ${C.gold}` }}>
      {member?.avatar ? <img src={member.avatar} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : (member?.name || "?")[0]}
    </div>
  );
}

function BottomNav({ tabs, page, setPage, dark }) {
  return (
    <nav style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: dark ? "#1a0033" : "#fff", display: "flex", borderTop: dark ? "1px solid rgba(255,255,255,0.08)" : "1px solid #eee", boxShadow: dark ? "none" : "0 -4px 20px rgba(0,0,0,0.07)", zIndex: 100 }}>
      {tabs.map(t => (
        <button key={t.id} onClick={() => setPage(t.id)} style={{ flex: 1, padding: "9px 4px 7px", border: "none", background: "transparent", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
          <span style={{ fontSize: 19 }}>{t.icon}</span>
          <span style={{ fontSize: 9, fontWeight: page === t.id ? 800 : 400, color: page === t.id ? (dark ? C.gold : C.purple) : (dark ? "rgba(255,255,255,0.4)" : "#bbb") }}>{t.label}</span>
          {page === t.id && <div style={{ width: 4, height: 4, background: dark ? C.gold : C.purple, borderRadius: "50%" }} />}
        </button>
      ))}
    </nav>
  );
}

function FIn({ label, value, onChange, placeholder, type = "text" }) {
  return (
    <div style={{ marginBottom: 14 }}>
      {label && <label style={{ fontSize: 13, color: "#444", fontWeight: 700, display: "block", marginBottom: 5 }}>{label}</label>}
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} style={{ width: "100%", padding: "11px 14px", border: "2px solid #eee", borderRadius: 10, fontSize: 14, background: "#fff", boxSizing: "border-box", transition: "all 0.2s", color: "#333" }} />
    </div>
  );
}

function GBtn({ children, onClick, loading, full, style = {} }) {
  return (
    <button onClick={onClick} disabled={loading} className="bp" style={{ padding: "12px 22px", background: C.gMain, color: "#fff", border: "none", borderRadius: 12, fontWeight: 800, cursor: loading ? "not-allowed" : "pointer", fontSize: 14, boxShadow: "0 4px 14px rgba(61,0,102,0.25)", opacity: loading ? 0.7 : 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, width: full ? "100%" : "auto", boxSizing: "border-box", transition: "all 0.2s", ...style }}>
      {loading && <span style={{ animation: "spin 0.8s linear infinite", display: "inline-block" }}>⟳</span>}
      {children}
    </button>
  );
}

function SBadge({ status }) {
  const map = { Confirmed: ["#e6f9ef", C.green, "✅"], Pending: ["#fff9e0", C.orange, "⏳"], Rejected: ["#fce4ec", C.red, "❌"] };
  const [bg, color, icon] = map[status] || ["#f5f5f5", "#999", "—"];
  return <span style={{ background: bg, color, padding: "4px 12px", borderRadius: 20, fontSize: 11, fontWeight: 800, whiteSpace: "nowrap" }}>{icon} {status}</span>;
}

function Tag({ children, bg, color }) {
  return <span style={{ background: bg, color, padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700 }}>{children}</span>;
}

function PBar({ pct }) {
  return (
    <div style={{ background: "#eee", borderRadius: 20, height: 7, margin: "8px 0 4px", overflow: "hidden" }}>
      <div style={{ width: `${pct}%`, background: `linear-gradient(90deg,${C.purple},${C.gold})`, height: "100%", borderRadius: 20, transition: "width 0.8s ease" }} />
    </div>
  );
}

function SecTitle({ children, style = {} }) {
  return <h2 style={{ color: C.purple, marginTop: 0, marginBottom: 14, fontSize: 18, fontWeight: 900, ...style }}>{children}</h2>;
}

function MiniCard({ icon, label, value, color }) {
  return (
    <div className="fu ch" style={{ background: "#fff", borderRadius: 14, padding: 14, boxShadow: "0 4px 14px rgba(0,0,0,0.06)", borderLeft: `4px solid ${color}` }}>
      <div style={{ fontSize: 22 }}>{icon}</div>
      <div style={{ fontSize: 20, fontWeight: 900, color, margin: "4px 0 2px" }}>{value}</div>
      <div style={{ fontSize: 11, color: "#aaa" }}>{label}</div>
    </div>
  );
}

function Empty({ msg }) {
  return <div style={{ textAlign: "center", padding: "32px 0", color: "#ccc" }}><div style={{ fontSize: 36 }}>🕊</div><p style={{ margin: "8px 0 0", fontSize: 13 }}>{msg}</p></div>;
}

function Loader() {
  return <div style={{ textAlign: "center", padding: "40px 0" }}><span style={{ fontSize: 28, animation: "spin 1s linear infinite", display: "inline-block" }}>⟳</span></div>;
}

function Toast({ toast }) {
  return (
    <div className="fu" style={{ position: "fixed", top: 20, left: "50%", transform: "translateX(-50%)", background: toast.type === "error" ? C.red : C.green, color: "#fff", padding: "11px 22px", borderRadius: 30, zIndex: 9999, fontWeight: 700, fontSize: 13, boxShadow: "0 8px 24px rgba(0,0,0,0.25)", whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: 8 }}>
      {toast.type === "error" ? "❌" : "✅"} {toast.msg}
    </div>
  );
}

function Modal({ children, onClose, title }) {
  return (
    <div className="fi" style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 1000, display: "flex", alignItems: "flex-end", justifyContent: "center" }} onClick={onClose}>
      <div className="fu" style={{ background: "#fff", borderRadius: "22px 22px 0 0", padding: "24px 20px", width: "100%", maxWidth: 520, maxHeight: "92vh", overflowY: "auto" }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
          <h3 style={{ margin: 0, color: C.purple, fontSize: 18, fontWeight: 900 }}>{title}</h3>
          <button onClick={onClose} style={{ background: C.grey, border: "none", borderRadius: "50%", width: 34, height: 34, cursor: "pointer", fontSize: 16, color: "#666" }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}