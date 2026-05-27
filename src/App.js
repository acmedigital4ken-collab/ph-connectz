import { useState, useEffect, useRef } from "react";

const MEMBER_PASSWORD = "PHConnectz";
const ADMIN_PASSWORD = "PHConnectz2024";
const SUPER_ADMIN_PASSWORD = "Kenneth_SuperAdmin";

const COLORS = {
  purple: "#3D0066", purpleMid: "#6A0DAD", purpleLight: "#9B59B6",
  gold: "#F0C040", goldDark: "#C9A800", white: "#FFFFFF",
  grey: "#F7F5FA", darkGrey: "#2C2C3E", cardBg: "#FFFFFF",
  green: "#1DB954", red: "#E53935", orange: "#FB8C00",
  gradMain: "linear-gradient(135deg, #3D0066 0%, #6A0DAD 100%)",
  gradGold: "linear-gradient(135deg, #F0C040 0%, #C9A800 100%)",
};

const initData = () => {
  try {
    const s = localStorage.getItem("phconnectz_v2");
    if (s) return JSON.parse(s);
  } catch { }
  return {
    members: [],
    events: [{
      id: "evt1",
      name: "PH Connectz 5th Anniversary & Cultural Day",
      date: "2025-08-16",
      description: "Join us for a grand celebration of 5 years of PH Connectz! A day of culture, music, food, and community.",
      capacity: 150,
      ticketPrice: 20000,
      perkLimit: 50,
      perkDesc: "🎁 First 50 who pay get FREE 3 yards of Anniversary Fabric!",
      flyer: null,
      createdAt: new Date().toISOString()
    }],
    payments: [],
    rsvps: [],
  };
};

const save = (d) => { try { localStorage.setItem("phconnectz_v2", JSON.stringify(d)); } catch { } };
const uid = () => Math.random().toString(36).substr(2, 9);
const receiptNo = () => "PHC-" + Date.now().toString().slice(-7);

export default function App() {
  const [data, setData] = useState(initData);
  const [session, setSession] = useState(null);
  const [toast, setToast] = useState(null);
  const [animIn, setAnimIn] = useState(false);

  useEffect(() => { save(data); }, [data]);
  useEffect(() => { setTimeout(() => setAnimIn(true), 50); }, []);

  const upd = (fn) => setData(p => { const n = fn(p); save(n); return n; });
  const showToast = (msg, type = "success") => { setToast({ msg, type }); setTimeout(() => setToast(null), 3500); };
  const logout = () => { setSession(null); };

  return (
    <div style={{ fontFamily: "'Segoe UI', system-ui, sans-serif", minHeight: "100vh", background: COLORS.grey }}>
      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
        @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
        @keyframes pulse { 0%,100% { transform:scale(1); } 50% { transform:scale(1.05); } }
        @keyframes shimmer { 0% { background-position:-200% 0; } 100% { background-position:200% 0; } }
        @keyframes spin { from { transform:rotate(0deg); } to { transform:rotate(360deg); } }
        .fade-up { animation: fadeUp 0.45s ease both; }
        .fade-in { animation: fadeIn 0.3s ease both; }
        .card-hover { transition: transform 0.2s, box-shadow 0.2s; }
        .card-hover:hover { transform: translateY(-3px); box-shadow: 0 12px 32px rgba(61,0,102,0.13) !important; }
        .btn-press:active { transform: scale(0.97); }
        input:focus, select:focus, textarea:focus { outline: none; border-color: #6A0DAD !important; box-shadow: 0 0 0 3px rgba(106,13,173,0.12); }
        ::-webkit-scrollbar { width: 6px; } ::-webkit-scrollbar-thumb { background: #ccc; border-radius: 3px; }
      `}</style>
      {toast && <Toast toast={toast} />}
      {!session
        ? <AuthScreen data={data} upd={upd} setSession={setSession} showToast={showToast} animIn={animIn} />
        : session.role === "member"
          ? <MemberApp data={data} upd={upd} session={session} logout={logout} showToast={showToast} />
          : <AdminApp data={data} upd={upd} session={session} logout={logout} showToast={showToast} />
      }
    </div>
  );
}

// ── AUTH ─────────────────────────────────────────────────────────────────────
function AuthScreen({ data, upd, setSession, showToast, animIn }) {
  const [tab, setTab] = useState("login");
  const [lf, setLf] = useState({ phone: "", password: "" });
  const [rf, setRf] = useState({ name: "", phone: "" });
  const [loading, setLoading] = useState(false);

  const login = () => {
    if (!lf.phone || !lf.password) return showToast("Please fill all fields", "error");
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      if (lf.password === SUPER_ADMIN_PASSWORD) { setSession({ role: "superadmin", name: "Super Admin" }); return; }
      if (lf.password === ADMIN_PASSWORD) { setSession({ role: "admin", name: "Admin" }); return; }
      if (lf.password === MEMBER_PASSWORD) {
        const m = data.members.find(m => m.phone === lf.phone);
        if (!m) return showToast("Phone not registered. Please sign up.", "error");
        if (m.role === "Admin" || m.role === "SuperAdmin") return showToast("Use admin password to access admin panel", "error");
        setSession({ role: "member", memberId: m.id, name: m.name });
        return;
      }
      showToast("Incorrect password", "error");
    }, 700);
  };

  const register = () => {
    if (!rf.name.trim() || !rf.phone.trim()) return showToast("Please fill all fields", "error");
    if (data.members.find(m => m.phone === rf.phone)) return showToast("Phone already registered", "error");
    const nm = { id: uid(), name: rf.name.trim(), phone: rf.phone.trim(), role: "Member", createdAt: new Date().toISOString() };
    upd(d => ({ ...d, members: [...d.members, nm] }));
    showToast("Account created! You can now log in.");
    setTab("login"); setLf(f => ({ ...f, phone: rf.phone }));
  };

  return (
    <div style={{ minHeight: "100vh", background: COLORS.gradMain, display: "flex", alignItems: "center", justifyContent: "center", padding: 16, position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: -80, right: -80, width: 300, height: 300, background: "rgba(255,255,255,0.04)", borderRadius: "50%" }} />
      <div style={{ position: "absolute", bottom: -60, left: -60, width: 200, height: 200, background: "rgba(240,192,64,0.08)", borderRadius: "50%" }} />
      <div className="fade-up" style={{ background: "#fff", borderRadius: 24, padding: "36px 28px", width: "100%", maxWidth: 420, boxShadow: "0 32px 80px rgba(0,0,0,0.35)", position: "relative" }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ width: 72, height: 72, background: COLORS.gradMain, borderRadius: "50%", margin: "0 auto 12px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 34, boxShadow: "0 8px 24px rgba(61,0,102,0.3)" }}>👑</div>
          <h1 style={{ color: COLORS.purple, margin: "0 0 4px", fontSize: 26, fontWeight: 900, letterSpacing: -0.5 }}>PH Connectz</h1>
          <p style={{ color: "#999", fontSize: 13, margin: 0 }}>Community Group Portal</p>
        </div>
        <div style={{ display: "flex", background: COLORS.grey, borderRadius: 12, padding: 4, marginBottom: 24 }}>
          {["login", "register"].map(t => (
            <button key={t} onClick={() => setTab(t)} className="btn-press" style={{ flex: 1, padding: "9px 0", border: "none", borderRadius: 9, background: tab === t ? COLORS.gradMain : "transparent", color: tab === t ? "#fff" : "#888", fontWeight: 700, cursor: "pointer", fontSize: 13, transition: "all 0.25s" }}>
              {t === "login" ? "Log In" : "Sign Up"}
            </button>
          ))}
        </div>
        {tab === "login" ? (
          <div className="fade-in">
            <FInput label="📱 Phone Number" value={lf.phone} onChange={v => setLf(f => ({ ...f, phone: v }))} placeholder="08012345678" />
            <FInput label="🔒 Password" type="password" value={lf.password} onChange={v => setLf(f => ({ ...f, password: v }))} placeholder="Enter your password" />
            <GradBtn onClick={login} loading={loading} style={{ width: "100%", marginTop: 4 }}>Log In</GradBtn>
            <div style={{ background: COLORS.grey, borderRadius: 10, padding: "10px 14px", marginTop: 16 }}>
              <p style={{ margin: 0, fontSize: 11, color: "#999", textAlign: "center", lineHeight: 1.6 }}>Member: <b>PHConnectz</b> · Admin: <b>PHConnectz2024</b></p>
            </div>
          </div>
        ) : (
          <div className="fade-in">
            <FInput label="👤 Full Name" value={rf.name} onChange={v => setRf(f => ({ ...f, name: v }))} placeholder="Your full name" />
            <FInput label="📱 Phone Number" value={rf.phone} onChange={v => setRf(f => ({ ...f, phone: v }))} placeholder="08012345678" />
            <GradBtn onClick={register} style={{ width: "100%", marginTop: 4 }}>Create Account</GradBtn>
          </div>
        )}
      </div>
    </div>
  );
}

// ── MEMBER APP ────────────────────────────────────────────────────────────────
function MemberApp({ data, upd, session, logout, showToast }) {
  const [page, setPage] = useState("home");
  const member = data.members.find(m => m.id === session.memberId);
  if (!member) { logout(); return null; }

  const tabs = [{ id: "home", icon: "🏠", label: "Home" }, { id: "events", icon: "🗓", label: "Events" }, { id: "payment", icon: "💳", label: "Payment" }, { id: "profile", icon: "👤", label: "Profile" }];


  return (
    <div style={{ minHeight: "100vh", background: COLORS.grey, paddingBottom: 80 }}>
      <header style={{ background: COLORS.gradMain, color: "#fff", padding: "14px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 100, boxShadow: "0 4px 20px rgba(61,0,102,0.3)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 36, height: 36, background: "rgba(255,255,255,0.15)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>👑</div>
          <div><div style={{ fontWeight: 800, fontSize: 16, letterSpacing: -0.3 }}>PH Connectz</div><div style={{ fontSize: 10, opacity: 0.7 }}>Member Portal</div></div>
        </div>
        <button onClick={logout} className="btn-press" style={{ background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.25)", color: "#fff", padding: "7px 14px", borderRadius: 20, cursor: "pointer", fontSize: 12, fontWeight: 600 }}>Sign Out</button>
      </header>
      <div style={{ padding: "16px 16px 0", maxWidth: 620, margin: "0 auto" }}>
        {page === "home" && <MemberHome member={member} data={data} setPage={setPage} />}
        {page === "events" && <MemberEvents member={member} data={data} upd={upd} showToast={showToast} />}
        {page === "payment" && <MemberPayment member={member} data={data} upd={upd} showToast={showToast} />}
        {page === "profile" && <MemberProfile member={member} data={data} upd={upd} showToast={showToast} />}
      </div>
      <nav style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "#fff", display: "flex", borderTop: "1px solid #eee", boxShadow: "0 -4px 20px rgba(0,0,0,0.08)", zIndex: 100 }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setPage(t.id)} style={{ flex: 1, padding: "10px 4px", border: "none", background: "transparent", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 3, transition: "all 0.2s" }}>
            <span style={{ fontSize: 20 }}>{t.icon}</span>
            <span style={{ fontSize: 10, fontWeight: page === t.id ? 700 : 400, color: page === t.id ? COLORS.purple : "#aaa" }}>{t.label}</span>
            {page === t.id && <div style={{ width: 4, height: 4, background: COLORS.purple, borderRadius: "50%" }} />}
          </button>
        ))}
      </nav>
    </div>
  );
}

function MemberHome({ member, data, setPage }) {
  const myPayment = data.payments.find(p => p.memberId === member.id);
  const myRsvps = data.rsvps.filter(r => r.memberId === member.id);
  const evt = data.events[0];
  const confirmedPayments = data.payments.filter(p => p.status === "Confirmed");
  const myConfirmedRank = myPayment?.status === "Confirmed" ? confirmedPayments.findIndex(p => p.id === myPayment.id) + 1 : null;
  const qualifiesPerk = myConfirmedRank !== null && myConfirmedRank <= (evt?.perkLimit || 50);

  return (
    <div>
      <div className="fade-up card-hover" style={{ background: COLORS.gradMain, borderRadius: 20, padding: "24px 20px", color: "#fff", marginBottom: 16, position: "relative", overflow: "hidden", boxShadow: "0 8px 32px rgba(61,0,102,0.25)" }}>
        <div style={{ position: "absolute", top: -30, right: -30, width: 140, height: 140, background: "rgba(255,255,255,0.05)", borderRadius: "50%" }} />
        <div style={{ position: "absolute", bottom: -20, left: 100, width: 80, height: 80, background: "rgba(240,192,64,0.1)", borderRadius: "50%" }} />
        <div style={{ fontSize: 32, marginBottom: 8 }}>👋</div>
        <h2 style={{ margin: "0 0 4px", fontSize: 22, fontWeight: 800 }}>Welcome, {member.name.split(" ")[0]}!</h2>
        <p style={{ margin: 0, opacity: 0.8, fontSize: 13 }}>You're part of something special ✨</p>
      </div>

      {qualifiesPerk && (
        <div className="fade-up card-hover" style={{ background: "linear-gradient(135deg, #fff9e0, #fff3b0)", border: `2px solid ${COLORS.gold}`, borderRadius: 16, padding: 16, marginBottom: 14, textAlign: "center", boxShadow: "0 4px 16px rgba(240,192,64,0.2)", animationDelay: "0.1s" }}>
          <div style={{ fontSize: 36, animation: "pulse 2s infinite" }}>🎁</div>
          <p style={{ color: COLORS.purple, fontWeight: 800, margin: "6px 0 2px", fontSize: 15 }}>Perk Unlocked!</p>
          <p style={{ fontSize: 12, color: "#666", margin: 0 }}>You qualify for FREE 3 yards of Anniversary Fabric!</p>
          <p style={{ fontSize: 11, color: COLORS.goldDark, margin: "4px 0 0", fontWeight: 600 }}>Slot #{myConfirmedRank} of {evt?.perkLimit}</p>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
        <MiniCard icon="🗓" label="RSVPs" value={myRsvps.length} color={COLORS.purpleMid} delay="0.1s" />
        <MiniCard icon="💳" label="Payment" value={myPayment?.status || "None"} color={myPayment?.status === "Confirmed" ? COLORS.green : COLORS.orange} delay="0.15s" />
      </div>

      {!myPayment && (
        <div className="fade-up card-hover" style={{ background: "#fff", borderRadius: 16, padding: 18, border: `2px dashed ${COLORS.purpleMid}`, textAlign: "center", boxShadow: "0 4px 16px rgba(0,0,0,0.05)", animationDelay: "0.2s" }}>
          <div style={{ fontSize: 28, marginBottom: 8 }}>💳</div>
          <p style={{ color: COLORS.purple, fontWeight: 700, margin: "0 0 6px", fontSize: 15 }}>Haven't paid yet?</p>
          <p style={{ fontSize: 13, color: "#777", margin: "0 0 14px" }}>Upload your bank receipt to secure your slot!</p>
          <GradBtn onClick={() => setPage("payment")}>Upload Receipt Now</GradBtn>
        </div>
      )}
    </div>
  );
}

function MemberEvents({ member, data, upd, showToast }) {
  const rsvp = (eventId, status) => {
    upd(d => ({ ...d, rsvps: [...d.rsvps.filter(r => !(r.memberId === member.id && r.eventId === eventId)), { id: uid(), memberId: member.id, eventId, status, updatedAt: new Date().toISOString() }] }));
    showToast(`RSVP updated: ${status}`);
  };

  return (
    <div>
      <SectionTitle>Upcoming Events</SectionTitle>
      {data.events.length === 0 && <Empty msg="No events yet. Check back soon!" />}
      {data.events.map((evt, i) => {
        const myRsvp = data.rsvps.find(r => r.memberId === member.id && r.eventId === evt.id);
        const confirmed = data.payments.filter(p => p.eventId === evt.id && p.status === "Confirmed").length;
        const pct = Math.min(100, Math.round((confirmed / evt.capacity) * 100));
        return (
          <div key={evt.id} className="fade-up card-hover" style={{ background: "#fff", borderRadius: 18, overflow: "hidden", marginBottom: 16, boxShadow: "0 4px 20px rgba(0,0,0,0.07)", animationDelay: `${i * 0.08}s` }}>
            {evt.flyer && <img src={evt.flyer} alt="Event flyer" style={{ width: "100%", maxHeight: 200, objectFit: "cover" }} />}
            <div style={{ padding: 16 }}>
              <h3 style={{ color: COLORS.purple, margin: "0 0 6px", fontSize: 16, fontWeight: 800 }}>{evt.name}</h3>
              <p style={{ fontSize: 12, color: "#999", margin: "0 0 6px" }}>📅 {new Date(evt.date).toDateString()}</p>
              <p style={{ fontSize: 13, color: "#555", margin: "0 0 12px", lineHeight: 1.5 }}>{evt.description}</p>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
                <Tag bg="#f0e6ff" color={COLORS.purple}>₦{(+evt.ticketPrice).toLocaleString()}</Tag>
                <Tag bg="#e6f9ef" color={COLORS.green}>{confirmed}/{evt.capacity} confirmed</Tag>
              </div>
              <ProgressBar pct={pct} />
              <p style={{ fontSize: 11, color: COLORS.orange, margin: "6px 0 12px", fontWeight: 600 }}>{evt.perkDesc}</p>
              <p style={{ fontSize: 12, fontWeight: 700, color: "#555", margin: "0 0 8px" }}>Your RSVP: <span style={{ color: myRsvp ? COLORS.purple : "#bbb" }}>{myRsvp?.status || "Not set"}</span></p>
              <div style={{ display: "flex", gap: 8 }}>
                {["Going", "Not Going", "Pending"].map(s => (
                  <button key={s} onClick={() => rsvp(evt.id, s)} className="btn-press" style={{ flex: 1, padding: "8px 4px", border: `2px solid ${myRsvp?.status === s ? COLORS.purple : "#e0e0e0"}`, borderRadius: 10, background: myRsvp?.status === s ? COLORS.gradMain : "#fff", color: myRsvp?.status === s ? "#fff" : "#666", cursor: "pointer", fontSize: 11, fontWeight: 700, transition: "all 0.2s" }}>{s}</button>
                ))}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function MemberPayment({ member, data, upd, showToast }) {
  const [imgData, setImgData] = useState(null);
  const [ref, setRef] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef();
  const receiptRef = useRef();
  const myPayment = data.payments.find(p => p.memberId === member.id);
  const evt = data.events[0];
  const confirmedPayments = data.payments.filter(p => p.status === "Confirmed");
  const myRank = myPayment?.status === "Confirmed" ? confirmedPayments.findIndex(p => p.id === myPayment.id) + 1 : null;
  const qualifiesPerk = myRank !== null && myRank <= (evt?.perkLimit || 50);

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return showToast("Please upload a JPG or PNG image", "error");
    if (file.size > 5 * 1024 * 1024) return showToast("Image must be under 5MB", "error");
    const reader = new FileReader();
    reader.onload = (ev) => setImgData(ev.target.result);
    reader.readAsDataURL(file);
  };

  const submit = () => {
    if (!imgData) return showToast("Please upload your bank receipt image", "error");
    if (!ref.trim()) return showToast("Please enter your reference number", "error");
    setUploading(true);
    setTimeout(() => {
      upd(d => ({ ...d, payments: [...d.payments, { id: uid(), memberId: member.id, memberName: member.name, phone: member.phone, eventId: evt?.id, eventName: evt?.name, amount: evt?.ticketPrice || 20000, reference: ref.trim(), receiptImage: imgData, status: "Pending", submittedAt: new Date().toISOString() }] }));
      showToast("Receipt uploaded successfully! Awaiting admin confirmation.");
      setUploading(false);
    }, 800);
  };

  const shareWhatsApp = () => {
    const msg = `👑 *PH CONNECTZ PAYMENT RECEIPT*\n\nReceipt No: ${myPayment?.receiptNo}\nName: ${member.name}\nPhone: ${member.phone}\nEvent: ${evt?.name}\nAmount: ₦${(evt?.ticketPrice || 20000).toLocaleString()}\nRef: ${myPayment?.reference}\nStatus: ✅ Confirmed\n${qualifiesPerk ? "\n🎁 You qualify for FREE 3 yards of Anniversary Fabric!" : ""}\n\nThank you for being part of PH Connectz! See you at the celebration! 🎉`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`);
  };

  const downloadReceipt = () => {
    const el = receiptRef.current;
    if (!el) return;
    // Use html2canvas-like approach via canvas
    const w = window.open("", "_blank");
    w.document.write(`<html><head><title>PHConnectz Receipt</title><style>body{margin:0;font-family:sans-serif;}</style></head><body>${el.outerHTML}<script>window.print();window.close();<\/script></body></html>`);
    w.document.close();
  };

  return (
    <div>
      <SectionTitle>My Payment</SectionTitle>
      {!myPayment ? (
        <div className="fade-up" style={{ background: "#fff", borderRadius: 18, padding: 20, boxShadow: "0 4px 20px rgba(0,0,0,0.07)" }}>
          <h3 style={{ color: COLORS.purple, margin: "0 0 4px", fontSize: 16, fontWeight: 800 }}>{evt?.name}</h3>
          <p style={{ color: COLORS.green, fontWeight: 800, fontSize: 20, margin: "0 0 16px" }}>₦{(evt?.ticketPrice || 20000).toLocaleString()}</p>
          <FInput label="Reference Number" value={ref} onChange={setRef} placeholder="e.g. TRF20240816XXXX" />
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 13, fontWeight: 700, color: "#444", display: "block", marginBottom: 6 }}>Bank Receipt Image (JPG/PNG)</label>
            <div onClick={() => fileRef.current.click()} style={{ border: `2px dashed ${imgData ? COLORS.green : COLORS.purpleLight}`, borderRadius: 14, padding: 20, textAlign: "center", cursor: "pointer", background: imgData ? "#f0faf4" : COLORS.grey, transition: "all 0.2s" }}>
              {imgData ? (
                <div><img src={imgData} alt="receipt" style={{ maxHeight: 160, maxWidth: "100%", borderRadius: 8, objectFit: "cover" }} /><p style={{ margin: "8px 0 0", fontSize: 12, color: COLORS.green, fontWeight: 700 }}>✅ Image uploaded</p></div>
              ) : (
                <div><div style={{ fontSize: 36 }}>📤</div><p style={{ margin: "8px 0 0", color: "#888", fontSize: 13 }}>Tap to upload bank receipt</p><p style={{ margin: "4px 0 0", color: "#bbb", fontSize: 11 }}>JPG or PNG, max 5MB</p></div>
              )}
            </div>
            <input ref={fileRef} type="file" accept="image/jpeg,image/png" style={{ display: "none" }} onChange={handleFile} />
          </div>
          <GradBtn onClick={submit} loading={uploading} style={{ width: "100%" }}>Submit Payment</GradBtn>
        </div>
      ) : (
        <div>
          <div className="fade-up" style={{ background: "#fff", borderRadius: 16, padding: 16, marginBottom: 12, boxShadow: "0 4px 16px rgba(0,0,0,0.07)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <span style={{ fontWeight: 700, color: "#333" }}>Payment Status</span>
              <StatusBadge status={myPayment.status} />
            </div>
            <p style={{ fontSize: 13, color: "#777", margin: 0 }}>Ref: <b>{myPayment.reference}</b></p>
            {myPayment.receiptImage && (
              <div style={{ marginTop: 12 }}>
                <p style={{ fontSize: 12, color: "#999", margin: "0 0 6px" }}>Uploaded receipt:</p>
                <img src={myPayment.receiptImage} alt="receipt" style={{ width: "100%", maxHeight: 150, objectFit: "cover", borderRadius: 10, border: "1px solid #eee" }} />
              </div>
            )}
            {myPayment.status === "Rejected" && <p style={{ fontSize: 13, color: COLORS.red, marginTop: 8, fontWeight: 600 }}>❌ Payment was rejected. Please contact an admin.</p>}
          </div>

          {myPayment.status === "Confirmed" && (
            <>
              <div ref={receiptRef} className="fade-up" style={{ background: "#fff", border: `3px solid ${COLORS.gold}`, borderRadius: 20, overflow: "hidden", marginBottom: 14, boxShadow: "0 8px 32px rgba(240,192,64,0.2)" }}>
                <div style={{ background: COLORS.gradMain, padding: "20px 24px", textAlign: "center", position: "relative" }}>
                  <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundImage: "radial-gradient(circle at 20% 50%, rgba(255,255,255,0.05) 0%, transparent 50%), radial-gradient(circle at 80% 50%, rgba(240,192,64,0.08) 0%, transparent 50%)" }} />
                  <div style={{ fontSize: 36 }}>👑</div>
                  <h2 style={{ color: "#fff", margin: "4px 0 2px", fontSize: 20, fontWeight: 900, letterSpacing: 1 }}>PH CONNECTZ</h2>
                  <div style={{ background: COLORS.gold, color: COLORS.purple, fontSize: 10, fontWeight: 800, letterSpacing: 3, padding: "3px 14px", borderRadius: 20, display: "inline-block", marginTop: 4 }}>OFFICIAL PAYMENT RECEIPT</div>
                </div>
                <div style={{ padding: "20px 24px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, paddingBottom: 14, borderBottom: `2px dashed ${COLORS.gold}` }}>
                    <span style={{ fontSize: 12, color: "#999" }}>Receipt No.</span>
                    <span style={{ fontSize: 13, fontWeight: 800, color: COLORS.purple }}>{myPayment.receiptNo}</span>
                  </div>
                  {[["Full Name", member.name], ["Phone", member.phone], ["Event", evt?.name], ["Amount Paid", `₦${(myPayment.amount || 20000).toLocaleString()}`], ["Reference", myPayment.reference], ["Confirmed On", new Date(myPayment.confirmedAt).toLocaleString()]].map(([k, v]) => (
                    <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: "1px solid #f5f5f5" }}>
                      <span style={{ fontSize: 12, color: "#999" }}>{k}</span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: "#333", textAlign: "right", maxWidth: "60%" }}>{v}</span>
                    </div>
                  ))}
                  {qualifiesPerk && (
                    <div style={{ background: "linear-gradient(135deg, #fff9e0, #fff3b0)", border: `2px solid ${COLORS.gold}`, borderRadius: 12, padding: 12, margin: "14px 0", textAlign: "center" }}>
                      <div style={{ fontSize: 24, animation: "pulse 2s infinite" }}>🎁</div>
                      <p style={{ margin: "4px 0 0", color: COLORS.purple, fontWeight: 800, fontSize: 13 }}>You qualify for FREE 3 yards of Anniversary Fabric!</p>
                      <p style={{ margin: "2px 0 0", fontSize: 11, color: COLORS.goldDark }}>Slot #{myRank} of {evt?.perkLimit}</p>
                    </div>
                  )}
                  <div style={{ textAlign: "center", marginTop: 16, paddingTop: 14, borderTop: `2px dashed ${COLORS.gold}` }}>
                    <div style={{ fontSize: 24, marginBottom: 6 }}>🎉</div>
                    <p style={{ fontSize: 12, color: COLORS.purple, fontWeight: 700, margin: 0 }}>Thank you for being part of PH Connectz!</p>
                    <p style={{ fontSize: 11, color: "#888", margin: "4px 0 0" }}>See you at the celebration!</p>
                    <div style={{ marginTop: 10, display: "inline-flex", alignItems: "center", gap: 6, background: COLORS.grey, padding: "6px 14px", borderRadius: 20 }}>
                      <span style={{ fontSize: 16 }}>🏅</span><span style={{ fontSize: 11, color: "#666", fontWeight: 600 }}>PH Connectz Verified</span>
                    </div>
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <GradBtn onClick={downloadReceipt} style={{ flex: 1, background: "linear-gradient(135deg, #1DB954, #158a3e)" }}>🖨 Print</GradBtn>
                <GradBtn onClick={shareWhatsApp} style={{ flex: 1, background: "linear-gradient(135deg, #25D366, #128C7E)" }}>📲 WhatsApp</GradBtn>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function MemberProfile({ member, data, upd, showToast }) {
  const myRsvps = data.rsvps.filter(r => r.memberId === member.id);
  const myPayment = data.payments.find(p => p.memberId === member.id);
  const fileRef = useRef();

  const handleAvatar = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return showToast("Please upload a JPG or PNG image", "error");
    if (file.size > 4 * 1024 * 1024) return showToast("Image must be under 4MB", "error");
    const reader = new FileReader();
    reader.onload = (ev) => {
      upd(d => ({ ...d, members: d.members.map(m => m.id === member.id ? { ...m, avatar: ev.target.result } : m) }));
      showToast("Profile picture updated! 🎉");
    };
    reader.readAsDataURL(file);
  };

  return (
    <div>
      <SectionTitle>My Profile</SectionTitle>
      <div className="fade-up" style={{ background: COLORS.gradMain, borderRadius: 20, padding: "28px 20px", color: "#fff", marginBottom: 16, textAlign: "center", boxShadow: "0 8px 28px rgba(61,0,102,0.25)", position: "relative" }}>
        <div style={{ position: "relative", width: 88, margin: "0 auto 14px" }}>
          <div style={{ width: 88, height: 88, borderRadius: "50%", border: `3px solid ${COLORS.gold}`, overflow: "hidden", background: COLORS.gold, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 34, fontWeight: 900, color: COLORS.purple, boxShadow: "0 4px 16px rgba(0,0,0,0.25)" }}>
            {member.avatar
              ? <img src={member.avatar} alt="avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              : member.name[0]}
          </div>
          <button onClick={() => fileRef.current.click()} style={{ position: "absolute", bottom: 0, right: 0, width: 28, height: 28, background: COLORS.gold, border: "2px solid #fff", borderRadius: "50%", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, boxShadow: "0 2px 8px rgba(0,0,0,0.2)" }}>
            📷
          </button>
          <input ref={fileRef} type="file" accept="image/jpeg,image/png" style={{ display: "none" }} onChange={handleAvatar} />
        </div>
        <h3 style={{ margin: "0 0 6px", fontSize: 20, fontWeight: 800 }}>{member.name}</h3>
        <span style={{ background: "rgba(255,255,255,0.2)", padding: "4px 14px", borderRadius: 20, fontSize: 12, fontWeight: 600 }}>{member.role}</span>
        <p style={{ margin: "10px 0 0", fontSize: 11, opacity: 0.65 }}>Tap the 📷 icon to change your photo</p>
      </div>
      <div className="fade-up" style={{ background: "#fff", borderRadius: 16, padding: 16, boxShadow: "0 4px 16px rgba(0,0,0,0.07)" }}>
        {[["📱 Phone", member.phone], ["🏷 Role", member.role], ["🗓 RSVPs", myRsvps.length], ["💳 Payment", myPayment?.status || "Not submitted"], ["📆 Member Since", new Date(member.createdAt).toLocaleDateString()]].map(([k, v]) => (
          <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid #f5f5f5" }}>
            <span style={{ fontSize: 13, color: "#888" }}>{k}</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#333" }}>{v}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── ADMIN APP ────────────────────────────────────────────────────────────────
function AdminApp({ data, upd, session, logout, showToast }) {
  const [page, setPage] = useState("home");
  const isSuperAdmin = session.role === "superadmin";
  const tabs = [{ id: "home", icon: "📊", label: "Dashboard" }, { id: "members", icon: "👥", label: "Members" }, { id: "events", icon: "🗓", label: "Events" }, { id: "payments", icon: "💳", label: "Payments" }];

  return (
    <div style={{ minHeight: "100vh", background: COLORS.grey, paddingBottom: 80 }}>
      <header style={{ background: "linear-gradient(90deg, #1a0033, #3D0066)", color: "#fff", padding: "14px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 100, boxShadow: "0 4px 20px rgba(0,0,0,0.35)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 36, height: 36, background: COLORS.gold, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>👑</div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontWeight: 800, fontSize: 16 }}>PH Connectz</span>
              <span style={{ background: isSuperAdmin ? COLORS.gold : "rgba(255,255,255,0.2)", color: isSuperAdmin ? COLORS.purple : "#fff", fontSize: 9, fontWeight: 800, padding: "2px 7px", borderRadius: 20, letterSpacing: 0.5 }}>{isSuperAdmin ? "⚡ SUPER ADMIN" : "ADMIN"}</span>
            </div>
            <div style={{ fontSize: 10, opacity: 0.65 }}>Management Portal</div>
          </div>
        </div>
        <button onClick={logout} className="btn-press" style={{ background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.2)", color: "#fff", padding: "7px 14px", borderRadius: 20, cursor: "pointer", fontSize: 12, fontWeight: 600 }}>Sign Out</button>
      </header>
      <div style={{ padding: "16px 16px 0", maxWidth: 700, margin: "0 auto" }}>
        {page === "home" && <AdminHome data={data} setPage={setPage} isSuperAdmin={isSuperAdmin} />}
        {page === "members" && <AdminMembers data={data} upd={upd} showToast={showToast} isSuperAdmin={isSuperAdmin} />}
        {page === "events" && <AdminEvents data={data} upd={upd} showToast={showToast} />}
        {page === "payments" && <AdminPayments data={data} upd={upd} showToast={showToast} />}
      </div>
      <nav style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "#1a0033", display: "flex", borderTop: "1px solid rgba(255,255,255,0.1)", zIndex: 100 }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setPage(t.id)} style={{ flex: 1, padding: "10px 4px", border: "none", background: "transparent", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
            <span style={{ fontSize: 19 }}>{t.icon}</span>
            <span style={{ fontSize: 10, fontWeight: page === t.id ? 700 : 400, color: page === t.id ? COLORS.gold : "rgba(255,255,255,0.45)" }}>{t.label}</span>
            {page === t.id && <div style={{ width: 4, height: 4, background: COLORS.gold, borderRadius: "50%" }} />}
          </button>
        ))}
      </nav>
    </div>
  );
}

function AdminHome({ data, setPage, isSuperAdmin }) {
  const confirmed = data.payments.filter(p => p.status === "Confirmed");
  const pending = data.payments.filter(p => p.status === "Pending");
  const total = confirmed.reduce((s, p) => s + (p.amount || 0), 0);
  const upcoming = data.events.filter(e => new Date(e.date) >= new Date()).length;

  return (
    <div>
      <div className="fade-up" style={{ background: "linear-gradient(135deg, #1a0033, #3D0066)", borderRadius: 20, padding: "20px", color: "#fff", marginBottom: 16, boxShadow: "0 8px 28px rgba(0,0,0,0.2)" }}>
        <div style={{ fontSize: 13, opacity: 0.65, marginBottom: 4 }}>{isSuperAdmin ? "⚡ Super Admin" : "Admin"} Dashboard</div>
        <h2 style={{ margin: "0 0 2px", fontSize: 22, fontWeight: 900 }}>Welcome back!</h2>
        <p style={{ margin: 0, opacity: 0.65, fontSize: 12 }}>{new Date().toDateString()}</p>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
        {[["👥", "Members", data.members.length, COLORS.purpleMid], ["🗓", "Upcoming", upcoming, COLORS.purpleLight], ["💰", "Collected", `₦${total.toLocaleString()}`, COLORS.green], ["⏳", "Pending", pending.length, COLORS.orange]].map(([icon, label, val, color], i) => (
          <div key={label} className={`fade-up card-hover`} style={{ background: "#fff", borderRadius: 14, padding: 14, boxShadow: "0 4px 14px rgba(0,0,0,0.06)", borderTop: `4px solid ${color}`, animationDelay: `${i * 0.07}s` }}>
            <div style={{ fontSize: 24 }}>{icon}</div>
            <div style={{ fontSize: 22, fontWeight: 900, color, margin: "4px 0 2px" }}>{val}</div>
            <div style={{ fontSize: 11, color: "#aaa" }}>{label}</div>
          </div>
        ))}
      </div>
      <h3 style={{ color: "#444", margin: "0 0 10px", fontSize: 14, fontWeight: 700 }}>Quick Actions</h3>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {[["👥 Manage Members", "members", COLORS.gradMain], ["🗓 Create / Edit Events", "events", `linear-gradient(135deg, ${COLORS.purpleLight}, ${COLORS.purpleMid})`], ["💳 Review Payments", "payments", `linear-gradient(135deg, ${COLORS.green}, #158a3e)`]].map(([label, pg, bg]) => (
          <button key={pg} onClick={() => setPage(pg)} className="btn-press card-hover" style={{ padding: "13px 18px", background: bg, color: "#fff", border: "none", borderRadius: 12, cursor: "pointer", fontWeight: 700, fontSize: 14, textAlign: "left", boxShadow: "0 4px 14px rgba(0,0,0,0.12)" }}>{label}</button>
        ))}
      </div>
    </div>
  );
}

function AdminMembers({ data, upd, showToast, isSuperAdmin }) {
  const [search, setSearch] = useState("");
  const [roleF, setRoleF] = useState("All");
  const [editM, setEditM] = useState(null);

  const filtered = data.members.filter(m =>
    (m.name.toLowerCase().includes(search.toLowerCase()) || m.phone.includes(search)) &&
    (roleF === "All" || m.role === roleF)
  );

  const remove = (id) => { upd(d => ({ ...d, members: d.members.filter(m => m.id !== id) })); showToast("Member removed"); };
  const saveEdit = () => { upd(d => ({ ...d, members: d.members.map(m => m.id === editM.id ? editM : m) })); setEditM(null); showToast("Member updated"); };

  return (
    <div>
      <SectionTitle>Members ({data.members.length})</SectionTitle>
      <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 Search name / phone…" style={{ flex: 1, padding: "10px 14px", border: "2px solid #eee", borderRadius: 10, fontSize: 13, background: "#fff" }} />
        <select value={roleF} onChange={e => setRoleF(e.target.value)} style={{ padding: "10px 8px", border: "2px solid #eee", borderRadius: 10, fontSize: 13, background: "#fff" }}>
          {["All", "Member", "Exec", "Admin"].map(r => <option key={r}>{r}</option>)}
        </select>
      </div>
      {filtered.length === 0 && <Empty msg="No members found." />}
      {filtered.map((m, i) => {
        const mp = data.payments.find(p => p.memberId === m.id);
        return (
          <div key={m.id} className="fade-up card-hover" style={{ background: "#fff", borderRadius: 14, padding: 14, marginBottom: 10, boxShadow: "0 4px 14px rgba(0,0,0,0.06)", animationDelay: `${i * 0.05}s` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <div style={{ width: 44, height: 44, background: COLORS.gradMain, borderRadius: "50%", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, fontSize: 18, flexShrink: 0, border: `2px solid ${COLORS.gold}` }}>
                  {m.avatar ? <img src={m.avatar} alt="avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : m.name[0]}
                </div>
                <div>
                  <p style={{ margin: "0 0 2px", fontWeight: 800, color: COLORS.purple, fontSize: 15 }}>{m.name}</p>
                  <p style={{ margin: "0 0 6px", fontSize: 12, color: "#999" }}>{m.phone}</p>
                  <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                    <Tag bg="#f0e6ff" color={COLORS.purple}>{m.role}</Tag>
                    {mp && <Tag bg={mp.status === "Confirmed" ? "#e6f9ef" : "#fff9e0"} color={mp.status === "Confirmed" ? COLORS.green : COLORS.orange}>{mp.status}</Tag>}
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                <button onClick={() => setEditM({ ...m })} style={{ background: "#f0e6ff", border: "none", color: COLORS.purple, padding: "7px 11px", borderRadius: 8, cursor: "pointer", fontSize: 12, fontWeight: 700 }}>Edit</button>
                <button onClick={() => remove(m.id)} style={{ background: "#fce4ec", border: "none", color: COLORS.red, padding: "7px 11px", borderRadius: 8, cursor: "pointer", fontSize: 12, fontWeight: 700 }}>Remove</button>
              </div>
            </div>
          </div>
        );
      })}
      {editM && (
        <Modal onClose={() => setEditM(null)} title="Edit Member">
          <FInput label="Full Name" value={editM.name} onChange={v => setEditM(e => ({ ...e, name: v }))} />
          <FInput label="Phone" value={editM.phone} onChange={v => setEditM(e => ({ ...e, phone: v }))} />
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 13, fontWeight: 700, color: "#444", display: "block", marginBottom: 6 }}>Role</label>
            <select value={editM.role} onChange={e => setEditM(m => ({ ...m, role: e.target.value }))} style={{ width: "100%", padding: "10px 12px", border: "2px solid #eee", borderRadius: 10, fontSize: 13, background: "#fff" }}>
              {(isSuperAdmin ? ["Member", "Exec", "Admin"] : ["Member", "Exec"]).map(r => <option key={r}>{r}</option>)}
            </select>
            {!isSuperAdmin && <p style={{ fontSize: 11, color: "#aaa", margin: "4px 0 0" }}>Only Super Admins can assign the Admin role.</p>}
          </div>
          <GradBtn onClick={saveEdit} style={{ width: "100%" }}>Save Changes</GradBtn>
        </Modal>
      )}
    </div>
  );
}

function AdminEvents({ data, upd, showToast }) {
  const blank = { name: "", date: "", description: "", capacity: "150", ticketPrice: "", perkLimit: "50", perkDesc: "🎁 First 50 who pay get FREE 3 yards of Anniversary Fabric!", flyer: null };
  const [form, setForm] = useState(blank);
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const fileRef = useRef();

  const handleFlyer = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return showToast("Flyer must be an image", "error");
    if (file.size > 5 * 1024 * 1024) return showToast("Image must be under 5MB", "error");
    const r = new FileReader();
    r.onload = ev => setForm(f => ({ ...f, flyer: ev.target.result }));
    r.readAsDataURL(file);
  };

  const save = () => {
    if (!form.name || !form.date) return showToast("Event name and date are required", "error");
    if (editing) {
      upd(d => ({ ...d, events: d.events.map(e => e.id === editing ? { ...e, ...form, capacity: +form.capacity, ticketPrice: +form.ticketPrice, perkLimit: +form.perkLimit } : e) }));
      showToast("Event updated ✅");
    } else {
      upd(d => ({ ...d, events: [...d.events, { ...form, id: uid(), capacity: +form.capacity, ticketPrice: +form.ticketPrice, perkLimit: +form.perkLimit, createdAt: new Date().toISOString() }] }));
      showToast("Event created ✅");
    }
    setForm(blank); setEditing(null); setShowForm(false);
  };

  const del = (id) => { upd(d => ({ ...d, events: d.events.filter(e => e.id !== id) })); showToast("Event deleted"); };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <SectionTitle style={{ margin: 0 }}>Events</SectionTitle>
        <GradBtn onClick={() => { setForm(blank); setEditing(null); setShowForm(true); }} style={{ fontSize: 13, padding: "9px 16px" }}>+ New Event</GradBtn>
      </div>
      {data.events.length === 0 && <Empty msg="No events yet. Create one!" />}
      {data.events.map((evt, i) => {
        const confirmed = data.payments.filter(p => p.eventId === evt.id && p.status === "Confirmed").length;
        const pct = evt.capacity ? Math.min(100, Math.round((confirmed / evt.capacity) * 100)) : 0;
        return (
          <div key={evt.id} className="fade-up card-hover" style={{ background: "#fff", borderRadius: 18, overflow: "hidden", marginBottom: 14, boxShadow: "0 4px 20px rgba(0,0,0,0.07)", animationDelay: `${i * 0.08}s` }}>
            {evt.flyer && <img src={evt.flyer} alt="flyer" style={{ width: "100%", maxHeight: 180, objectFit: "cover" }} />}
            <div style={{ padding: 16 }}>
              <h3 style={{ color: COLORS.purple, margin: "0 0 4px", fontSize: 16, fontWeight: 800 }}>{evt.name}</h3>
              <p style={{ fontSize: 12, color: "#999", margin: "0 0 4px" }}>📅 {evt.date} · ₦{(+evt.ticketPrice).toLocaleString()} · Cap: {evt.capacity}</p>
              <ProgressBar pct={pct} />
              <p style={{ fontSize: 12, color: "#777", margin: "4px 0 10px" }}>{confirmed}/{evt.capacity} confirmed ({pct}%)</p>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => { setForm({ ...evt, capacity: String(evt.capacity), ticketPrice: String(evt.ticketPrice), perkLimit: String(evt.perkLimit || 50) }); setEditing(evt.id); setShowForm(true); }} style={{ background: "#f0e6ff", border: "none", color: COLORS.purple, padding: "8px 14px", borderRadius: 10, cursor: "pointer", fontSize: 12, fontWeight: 700 }}>✏️ Edit</button>
                <button onClick={() => del(evt.id)} style={{ background: "#fce4ec", border: "none", color: COLORS.red, padding: "8px 14px", borderRadius: 10, cursor: "pointer", fontSize: 12, fontWeight: 700 }}>🗑 Delete</button>
              </div>
            </div>
          </div>
        );
      })}
      {showForm && (
        <Modal onClose={() => setShowForm(false)} title={editing ? "Edit Event" : "New Event"}>
          <FInput label="Event Name *" value={form.name} onChange={v => setForm(f => ({ ...f, name: v }))} />
          <FInput label="Date *" type="date" value={form.date} onChange={v => setForm(f => ({ ...f, date: v }))} />
          <FInput label="Description" value={form.description} onChange={v => setForm(f => ({ ...f, description: v }))} />
          <FInput label="Capacity" type="number" value={form.capacity} onChange={v => setForm(f => ({ ...f, capacity: v }))} />
          <FInput label="Ticket Price (₦)" type="number" value={form.ticketPrice} onChange={v => setForm(f => ({ ...f, ticketPrice: v }))} />
          <FInput label="Perk Description" value={form.perkDesc} onChange={v => setForm(f => ({ ...f, perkDesc: v }))} />
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 13, fontWeight: 700, color: "#444", display: "block", marginBottom: 6 }}>Event Flyer (optional)</label>
            <div onClick={() => fileRef.current.click()} style={{ border: `2px dashed ${form.flyer ? COLORS.green : "#ddd"}`, borderRadius: 12, padding: 16, textAlign: "center", cursor: "pointer", background: form.flyer ? "#f0faf4" : COLORS.grey }}>
              {form.flyer ? <><img src={form.flyer} alt="flyer" style={{ maxHeight: 120, maxWidth: "100%", borderRadius: 8 }} /><p style={{ margin: "6px 0 0", fontSize: 11, color: COLORS.green, fontWeight: 700 }}>✅ Flyer uploaded</p></> : <><div style={{ fontSize: 28 }}>🖼</div><p style={{ margin: "6px 0 0", color: "#aaa", fontSize: 13 }}>Tap to upload flyer</p></>}
            </div>
            <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleFlyer} />
          </div>
          <GradBtn onClick={save} style={{ width: "100%" }}>{editing ? "Update Event" : "Create Event"}</GradBtn>
        </Modal>
      )}
    </div>
  );
}

function AdminPayments({ data, upd, showToast }) {
  const [filter, setFilter] = useState("All");
  const [viewImg, setViewImg] = useState(null);
  const payments = data.payments.filter(p => filter === "All" || p.status === filter);
  const confirmed = data.payments.filter(p => p.status === "Confirmed");
  const pending = data.payments.filter(p => p.status === "Pending");
  const total = confirmed.reduce((s, p) => s + (p.amount || 0), 0);
  const evt = data.events[0];

  const confirm = (id) => {
    const confirmedCount = data.payments.filter(p => p.status === "Confirmed").length;
    upd(d => ({ ...d, payments: d.payments.map(p => p.id === id ? { ...p, status: "Confirmed", confirmedAt: new Date().toISOString(), receiptNo: receiptNo(), perkEligible: confirmedCount < (evt?.perkLimit || 50) } : p) }));
    showToast("Payment confirmed ✅");
  };

  const reject = (id) => { upd(d => ({ ...d, payments: d.payments.map(p => p.id === id ? { ...p, status: "Rejected" } : p) })); showToast("Payment rejected", "error"); };

  return (
    <div>
      <SectionTitle>Payments</SectionTitle>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
        {[["✅", "Confirmed", confirmed.length, COLORS.green], ["⏳", "Pending", pending.length, COLORS.orange], ["💰", "Collected", `₦${total.toLocaleString()}`, COLORS.purple], ["🎟", "Slots Left", evt ? evt.capacity - confirmed.length : "—", COLORS.purpleLight]].map(([icon, label, val, color]) => (
          <div key={label} className="fade-up card-hover" style={{ background: "#fff", borderRadius: 14, padding: 13, boxShadow: "0 4px 14px rgba(0,0,0,0.06)", borderTop: `4px solid ${color}` }}>
            <div style={{ fontSize: 22 }}>{icon}</div>
            <div style={{ fontSize: 19, fontWeight: 900, color, margin: "3px 0 2px" }}>{val}</div>
            <div style={{ fontSize: 11, color: "#aaa" }}>{label}</div>
          </div>
        ))}
      </div>
      <div style={{ display: "flex", gap: 7, marginBottom: 14, overflowX: "auto", paddingBottom: 4 }}>
        {["All", "Pending", "Confirmed", "Rejected"].map(f => (
          <button key={f} onClick={() => setFilter(f)} className="btn-press" style={{ padding: "7px 14px", border: `2px solid ${filter === f ? COLORS.purple : "#e0e0e0"}`, borderRadius: 20, background: filter === f ? COLORS.gradMain : "#fff", color: filter === f ? "#fff" : "#666", cursor: "pointer", fontSize: 12, fontWeight: 700, whiteSpace: "nowrap", flexShrink: 0 }}>{f}</button>
        ))}
      </div>
      {payments.length === 0 && <Empty msg="No payments found." />}
      {payments.map((p, i) => (
        <div key={p.id} className="fade-up card-hover" style={{ background: "#fff", borderRadius: 14, padding: 14, marginBottom: 10, boxShadow: "0 4px 14px rgba(0,0,0,0.06)", animationDelay: `${i * 0.05}s` }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
            <div>
              <p style={{ margin: "0 0 2px", fontWeight: 800, color: COLORS.purple, fontSize: 15 }}>{p.memberName}</p>
              <p style={{ margin: "0 0 2px", fontSize: 12, color: "#999" }}>{p.phone}</p>
              <p style={{ margin: "0 0 4px", fontSize: 12, color: "#555" }}>Ref: <b>{p.reference}</b></p>
              <p style={{ margin: 0, fontSize: 12, color: "#777" }}>₦{(p.amount || 0).toLocaleString()} · {new Date(p.submittedAt).toLocaleDateString()}</p>
              {p.perkEligible && <span style={{ fontSize: 11, color: COLORS.goldDark, fontWeight: 700 }}>🎁 Perk Eligible</span>}
            </div>
            <StatusBadge status={p.status} />
          </div>
          {p.receiptImage && (
            <div style={{ marginBottom: 10 }}>
              <img src={p.receiptImage} alt="receipt" onClick={() => setViewImg(p.receiptImage)} style={{ width: "100%", maxHeight: 130, objectFit: "cover", borderRadius: 10, border: "2px solid #eee", cursor: "pointer" }} />
              <p style={{ fontSize: 11, color: "#aaa", margin: "3px 0 0", textAlign: "center" }}>Tap to view full receipt</p>
            </div>
          )}
          {p.status === "Pending" && (
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => confirm(p.id)} className="btn-press" style={{ flex: 1, padding: "10px", background: "linear-gradient(135deg, #1DB954, #158a3e)", border: "none", color: "#fff", borderRadius: 10, cursor: "pointer", fontWeight: 800, fontSize: 13 }}>✅ Confirm</button>
              <button onClick={() => reject(p.id)} className="btn-press" style={{ flex: 1, padding: "10px", background: "linear-gradient(135deg, #E53935, #b71c1c)", border: "none", color: "#fff", borderRadius: 10, cursor: "pointer", fontWeight: 800, fontSize: 13 }}>❌ Reject</button>
            </div>
          )}
        </div>
      ))}
      {viewImg && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }} onClick={() => setViewImg(null)}>
          <img src={viewImg} alt="receipt" style={{ maxWidth: "100%", maxHeight: "90vh", borderRadius: 12, objectFit: "contain" }} />
        </div>
      )}
    </div>
  );
}

// ── SHARED COMPONENTS ─────────────────────────────────────────────────────────
function FInput({ label, value, onChange, placeholder, type = "text" }) {
  return (
    <div style={{ marginBottom: 14 }}>
      {label && <label style={{ fontSize: 13, color: "#444", fontWeight: 700, display: "block", marginBottom: 5 }}>{label}</label>}
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} style={{ width: "100%", padding: "11px 14px", border: "2px solid #eee", borderRadius: 10, fontSize: 14, background: "#fff", boxSizing: "border-box", transition: "all 0.2s", color: "#333" }} />
    </div>
  );
}

function GradBtn({ children, onClick, loading, style = {} }) {
  return (
    <button onClick={onClick} disabled={loading} className="btn-press" style={{ padding: "12px 22px", background: COLORS.gradMain, color: "#fff", border: "none", borderRadius: 12, fontWeight: 800, cursor: loading ? "not-allowed" : "pointer", fontSize: 14, boxShadow: "0 4px 14px rgba(61,0,102,0.25)", transition: "all 0.2s", opacity: loading ? 0.7 : 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, ...style }}>
      {loading ? <span style={{ animation: "spin 0.8s linear infinite", display: "inline-block" }}>⟳</span> : null}
      {children}
    </button>
  );
}

function StatusBadge({ status }) {
  const map = { Confirmed: ["#e6f9ef", COLORS.green, "✅"], Pending: ["#fff9e0", COLORS.orange, "⏳"], Rejected: ["#fce4ec", COLORS.red, "❌"] };
  const [bg, color, icon] = map[status] || ["#f5f5f5", "#999", "—"];
  return <span style={{ background: bg, color, padding: "4px 12px", borderRadius: 20, fontSize: 11, fontWeight: 800 }}>{icon} {status}</span>;
}

function Tag({ children, bg, color }) {
  return <span style={{ background: bg, color, padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700 }}>{children}</span>;
}

function ProgressBar({ pct }) {
  return (
    <div style={{ background: "#eee", borderRadius: 20, height: 7, margin: "8px 0 4px", overflow: "hidden" }}>
      <div style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${COLORS.purple}, ${COLORS.gold})`, height: "100%", borderRadius: 20, transition: "width 0.8s ease" }} />
    </div>
  );
}

function SectionTitle({ children, style = {} }) {
  return <h2 style={{ color: COLORS.purple, marginTop: 0, marginBottom: 14, fontSize: 18, fontWeight: 900, ...style }}>{children}</h2>;
}

function MiniCard({ icon, label, value, color, delay }) {
  return (
    <div className="fade-up card-hover" style={{ background: "#fff", borderRadius: 14, padding: 14, boxShadow: "0 4px 14px rgba(0,0,0,0.06)", borderLeft: `4px solid ${color}`, animationDelay: delay }}>
      <div style={{ fontSize: 22 }}>{icon}</div>
      <div style={{ fontSize: 20, fontWeight: 900, color, margin: "4px 0 2px" }}>{value}</div>
      <div style={{ fontSize: 11, color: "#aaa" }}>{label}</div>
    </div>
  );
}

function Empty({ msg }) {
  return <div style={{ textAlign: "center", padding: "32px 0", color: "#ccc" }}><div style={{ fontSize: 36 }}>🕊</div><p style={{ margin: "8px 0 0", fontSize: 13 }}>{msg}</p></div>;
}

function Toast({ toast }) {
  return (
    <div className="fade-up" style={{ position: "fixed", top: 20, left: "50%", transform: "translateX(-50%)", background: toast.type === "error" ? COLORS.red : COLORS.green, color: "#fff", padding: "11px 22px", borderRadius: 30, zIndex: 9999, fontWeight: 700, fontSize: 13, boxShadow: "0 8px 24px rgba(0,0,0,0.25)", whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: 8 }}>
      {toast.type === "error" ? "❌" : "✅"} {toast.msg}
    </div>
  );
}

function Modal({ children, onClose, title }) {
  return (
    <div className="fade-in" style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 1000, display: "flex", alignItems: "flex-end", justifyContent: "center" }} onClick={onClose}>
      <div className="fade-up" style={{ background: "#fff", borderRadius: "22px 22px 0 0", padding: "24px 20px", width: "100%", maxWidth: 520, maxHeight: "90vh", overflowY: "auto" }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
          <h3 style={{ margin: 0, color: COLORS.purple, fontSize: 18, fontWeight: 900 }}>{title}</h3>
          <button onClick={onClose} style={{ background: COLORS.grey, border: "none", borderRadius: "50%", width: 34, height: 34, cursor: "pointer", fontSize: 16, color: "#666" }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}