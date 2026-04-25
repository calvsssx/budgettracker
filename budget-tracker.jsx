import { useState, useEffect, useRef, useCallback } from "react";

const PAYMENT_METHODS = [
  { id: "cash", label: "Cash", icon: "💵", color: "#f472b6" },
  { id: "maribank", label: "MariBank", icon: "🏦", color: "#c084fc" },
  { id: "chinabank", label: "ChinaBank", icon: "🏛️", color: "#fb7185" },
  { id: "unionbank", label: "UnionBank", icon: "🔶", color: "#f9a8d4" },
  { id: "bdo-savings", label: "BDO Savings", icon: "💰", color: "#a78bfa" },
  { id: "bdo-credit", label: "BDO Credit", icon: "💳", color: "#e879f9" },
  { id: "gcash", label: "GCash", icon: "📱", color: "#2dd4bf" },
];

const CATEGORIES = [
  { id: "food", label: "Food & Dining", emoji: "🍜" },
  { id: "transport", label: "Transport", emoji: "🚌" },
  { id: "shopping", label: "Shopping", emoji: "🛍️" },
  { id: "bills", label: "Bills & Utilities", emoji: "📄" },
  { id: "health", label: "Health", emoji: "💊" },
  { id: "beauty", label: "Beauty & Self-care", emoji: "💅" },
  { id: "entertainment", label: "Entertainment", emoji: "🎬" },
  { id: "groceries", label: "Groceries", emoji: "🛒" },
  { id: "gifts", label: "Gifts", emoji: "🎁" },
  { id: "savings", label: "Savings", emoji: "🐷" },
  { id: "other", label: "Other", emoji: "📌" },
];

const fmt = (n) => "₱" + Number(n).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtShort = (n) => n >= 1000 ? "₱" + (n / 1000).toFixed(1) + "k" : "₱" + n;
const dateStr = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const todayStr = () => dateStr(new Date());
const monthKey = (y, m) => `${y}-${String(m + 1).padStart(2, "0")}`;
const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const MONTH_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const DEFAULT_LIMITS = { cash: 5000, maribank: 3000, chinabank: 3000, unionbank: 5000, "bdo-savings": 8000, "bdo-credit": 5000, gcash: 5000 };

const SK_EXP = "jea-budget-expenses";
const SK_LIM = "jea-budget-limits";
const SK_DEF = "jea-budget-default-limits";

async function loadData(key, fallback) {
  try { const r = await window.storage.get(key); return r ? JSON.parse(r.value) : fallback; } catch { return fallback; }
}
async function saveData(key, data) {
  try { await window.storage.set(key, JSON.stringify(data)); } catch (e) { console.error("Save error", e); }
}

// ─── Components ───
function Dropdown({ value, onChange, options, renderOption, placeholder }) {
  const [open, setOpen] = useState(false);
  const ref = useRef();
  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);
  const selected = options.find((o) => o.id === value);
  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button type="button" onClick={() => setOpen(!open)} style={{
        width: "100%", padding: "11px 14px", border: "2px solid #fce4ec", borderRadius: 14,
        background: "#fff0f5", textAlign: "left", cursor: "pointer", fontSize: 14,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        fontFamily: "inherit", color: selected ? "#9c2460" : "#d4a0b9",
      }}>
        <span>{selected ? renderOption(selected) : placeholder}</span>
        <span style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "0.2s", fontSize: 11, color: "#e191b4" }}>▼</span>
      </button>
      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0,
          background: "#fff7fa", border: "2px solid #fce4ec", borderRadius: 14,
          boxShadow: "0 8px 32px rgba(200,100,150,0.15)", zIndex: 50, maxHeight: 200,
          overflowY: "auto", padding: 4,
        }}>
          {options.map((opt) => (
            <button key={opt.id} type="button" onClick={() => { onChange(opt.id); setOpen(false); }} style={{
              width: "100%", padding: "9px 12px", border: "none",
              background: value === opt.id ? "#fde4ef" : "transparent", textAlign: "left",
              cursor: "pointer", borderRadius: 10, fontSize: 14, fontFamily: "inherit",
              color: "#9c2460", display: "flex", alignItems: "center", gap: 8,
            }}
              onMouseEnter={(e) => (e.target.style.background = "#fde4ef")}
              onMouseLeave={(e) => (e.target.style.background = value === opt.id ? "#fde4ef" : "transparent")}
            >{renderOption(opt)}</button>
          ))}
        </div>
      )}
    </div>
  );
}

function PaymentBadge({ methodId }) {
  const m = PAYMENT_METHODS.find((p) => p.id === methodId);
  if (!m) return null;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 3,
      background: m.color + "20", color: m.color, fontWeight: 600,
      fontSize: 11, padding: "2px 8px", borderRadius: 20, border: `1.5px solid ${m.color}35`,
    }}>{m.icon} {m.label}</span>
  );
}

function FloatingHearts() {
  const hearts = Array.from({ length: 10 }, (_, i) => ({
    id: i, left: Math.random() * 100, delay: Math.random() * 8,
    size: 10 + Math.random() * 14, duration: 6 + Math.random() * 6,
    opacity: 0.05 + Math.random() * 0.07,
  }));
  return (
    <div style={{ position: "fixed", inset: 0, pointerEvents: "none", overflow: "hidden", zIndex: 0 }}>
      <style>{`@keyframes floatUp { 0% { transform: translateY(100vh) rotate(0deg); opacity: 0; } 10% { opacity: 1; } 90% { opacity: 1; } 100% { transform: translateY(-80px) rotate(25deg); opacity: 0; } }`}</style>
      {hearts.map((h) => (
        <div key={h.id} style={{ position: "absolute", left: `${h.left}%`, bottom: -40, fontSize: h.size, opacity: h.opacity, animation: `floatUp ${h.duration}s ease-in-out ${h.delay}s infinite` }}>💗</div>
      ))}
    </div>
  );
}

function BudgetBar({ spent, limit, color, label, icon }) {
  const pct = limit > 0 ? Math.min((spent / limit) * 100, 100) : 0;
  const over = spent > limit && limit > 0;
  const remaining = limit - spent;
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: "#9c2460", display: "flex", alignItems: "center", gap: 4 }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: color, display: "inline-block" }} />
          {icon} {label}
        </span>
        <span style={{ fontSize: 11, fontWeight: 700, color: over ? "#ef4444" : "#e879a8" }}>{fmt(spent)} / {fmt(limit)}</span>
      </div>
      <div style={{ height: 10, background: "#fde4ef", borderRadius: 8, overflow: "hidden" }}>
        <div style={{
          height: "100%", borderRadius: 8, transition: "width 0.5s ease", width: `${pct}%`,
          background: over ? "linear-gradient(90deg, #ef4444, #f87171)" : pct > 75 ? "linear-gradient(90deg, #fbbf24, #f59e0b)" : `linear-gradient(90deg, ${color}, ${color}cc)`,
        }} />
      </div>
      <div style={{ fontSize: 10, marginTop: 3, fontWeight: 600, color: over ? "#ef4444" : "#d4a0b9", textAlign: "right" }}>
        {over ? `⚠️ Over by ${fmt(Math.abs(remaining))}!` : `${fmt(remaining)} left`}
      </div>
    </div>
  );
}

function CalendarView({ expenses, selectedDate, onSelectDate, calMonth, calYear, onChangeMonth }) {
  const firstDay = new Date(calYear, calMonth, 1).getDay();
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const today = new Date();
  const isToday = (d) => d === today.getDate() && calMonth === today.getMonth() && calYear === today.getFullYear();
  const dayTotals = {};
  expenses.forEach((e) => { const [y, m, d] = e.date.split("-").map(Number); if (y === calYear && m - 1 === calMonth) dayTotals[d] = (dayTotals[d] || 0) + Number(e.amount); });
  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(<div key={`e-${i}`} />);
  for (let d = 1; d <= daysInMonth; d++) {
    const ds = dateStr(new Date(calYear, calMonth, d));
    const isSel = ds === selectedDate; const has = dayTotals[d] > 0;
    cells.push(
      <button key={d} onClick={() => onSelectDate(ds)} style={{
        border: "none", borderRadius: 12, padding: "4px 2px", cursor: "pointer",
        background: isSel ? "linear-gradient(135deg, #ec4899, #e879f9)" : isToday(d) ? "#fde4ef" : "transparent",
        color: isSel ? "white" : isToday(d) ? "#db2777" : "#9c2460",
        fontFamily: "inherit", fontSize: 13, fontWeight: isSel || isToday(d) ? 700 : 500,
        display: "flex", flexDirection: "column", alignItems: "center", gap: 1,
        transition: "all 0.15s", minHeight: 44, justifyContent: "center",
        boxShadow: isSel ? "0 3px 12px rgba(236,72,153,0.3)" : "none",
      }}>
        <span>{d}</span>
        <span style={{ fontSize: 9, fontWeight: 700, color: isSel ? "rgba(255,255,255,0.85)" : "#e879a8", lineHeight: 1, marginTop: 1, opacity: has ? 1 : 0 }}>{has ? fmtShort(dayTotals[d]) : "-"}</span>
      </button>
    );
  }
  return (
    <div style={{ background: "rgba(255,255,255,0.8)", borderRadius: 20, boxShadow: "0 2px 16px rgba(236,72,153,0.08)", border: "1.5px solid #fce4ec", padding: "16px 14px", backdropFilter: "blur(8px)" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <button onClick={() => onChangeMonth(-1)} style={{ border: "none", background: "#fde4ef", borderRadius: 10, width: 34, height: 34, cursor: "pointer", fontSize: 16, color: "#db2777", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>‹</button>
        <div style={{ fontWeight: 800, fontSize: 16, color: "#9c2460" }}>{MONTH_NAMES[calMonth]} {calYear} 🌸</div>
        <button onClick={() => onChangeMonth(1)} style={{ border: "none", background: "#fde4ef", borderRadius: 10, width: 34, height: 34, cursor: "pointer", fontSize: 16, color: "#db2777", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>›</button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2, marginBottom: 4 }}>
        {DAY_LABELS.map((d) => (<div key={d} style={{ textAlign: "center", fontSize: 11, fontWeight: 700, color: "#e191b4", padding: "4px 0" }}>{d}</div>))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2 }}>{cells}</div>
      <div style={{ marginTop: 12, padding: "10px 14px", background: "linear-gradient(135deg, #fdf2f8, #fce7f3)", borderRadius: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: "#e879a8" }}>🌷 Month Total</span>
        <span style={{ fontSize: 15, fontWeight: 800, color: "#be185d" }}>{fmt(Object.values(dayTotals).reduce((a, b) => a + b, 0))}</span>
      </div>
    </div>
  );
}

// ─── Main App ───
function BudgetApp() {
  const [loading, setLoading] = useState(true);
  const [expenses, setExpenses] = useState([]);
  const [monthlyLimits, setMonthlyLimits] = useState({});
  const [defaultLimits, setDefaultLimits] = useState({ ...DEFAULT_LIMITS });
  const [selectedDate, setSelectedDate] = useState(todayStr());
  const now = new Date();
  const [calMonth, setCalMonth] = useState(now.getMonth());
  const [calYear, setCalYear] = useState(now.getFullYear());
  const [form, setForm] = useState({ description: "", amount: "", category: "", method: "" });
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [tab, setTab] = useState("calendar");
  const [editingLimit, setEditingLimit] = useState(null);
  const [limitInput, setLimitInput] = useState("");
  const [copyFromOpen, setCopyFromOpen] = useState(false);
  const nextId = useRef(100);

  const mk = monthKey(calYear, calMonth);

  useEffect(() => {
    (async () => {
      const [exp, lim, def] = await Promise.all([
        loadData(SK_EXP, [
          { id: 1, description: "Jollibee lunch", amount: 250, category: "food", method: "gcash", date: todayStr() },
          { id: 2, description: "Grab ride", amount: 180, category: "transport", method: "gcash", date: todayStr() },
          { id: 3, description: "Netflix", amount: 549, category: "entertainment", method: "bdo-credit", date: todayStr() },
          { id: 4, description: "Watsons skincare", amount: 890, category: "beauty", method: "cash", date: todayStr() },
        ]),
        loadData(SK_LIM, {}),
        loadData(SK_DEF, { ...DEFAULT_LIMITS }),
      ]);
      setExpenses(exp); setMonthlyLimits(lim); setDefaultLimits(def);
      if (exp.length > 0) nextId.current = Math.max(...exp.map((e) => e.id)) + 1;
      setLoading(false);
    })();
  }, []);

  const saveExpenses = useCallback((data) => { setExpenses(data); saveData(SK_EXP, data); }, []);
  const saveLimits = useCallback((data) => { setMonthlyLimits(data); saveData(SK_LIM, data); }, []);
  const saveDefaults = useCallback((data) => { setDefaultLimits(data); saveData(SK_DEF, data); }, []);

  const currentLimits = monthlyLimits[mk] || { ...defaultLimits };
  const hasCustomLimits = !!monthlyLimits[mk];

  const setCurrentMonthLimit = (methodId, val) => saveLimits({ ...monthlyLimits, [mk]: { ...currentLimits, [methodId]: val } });

  const monthlySpend = {};
  PAYMENT_METHODS.forEach((m) => { monthlySpend[m.id] = 0; });
  expenses.forEach((e) => { const [y, mo] = e.date.split("-").map(Number); if (y === calYear && mo - 1 === calMonth) monthlySpend[e.method] = (monthlySpend[e.method] || 0) + Number(e.amount); });

  const changeMonth = (dir) => { let m = calMonth + dir, y = calYear; if (m < 0) { m = 11; y--; } else if (m > 11) { m = 0; y++; } setCalMonth(m); setCalYear(y); };

  const dayExpenses = expenses.filter((e) => e.date === selectedDate);
  const dayTotal = dayExpenses.reduce((s, e) => s + Number(e.amount), 0);
  const totalSpent = expenses.reduce((s, e) => s + Number(e.amount), 0);
  const selDateObj = new Date(selectedDate + "T00:00:00");
  const friendlyDate = selDateObj.toLocaleDateString("en-PH", { weekday: "long", month: "long", day: "numeric" });

  const getWarning = (methodId, amount) => {
    if (!methodId || !amount || !currentLimits[methodId]) return null;
    const editAmt = editId ? (expenses.find(e => e.id === editId)?.method === methodId ? Number(expenses.find(e => e.id === editId)?.amount || 0) : 0) : 0;
    const newTotal = monthlySpend[methodId] - editAmt + Number(amount);
    if (newTotal > currentLimits[methodId]) return `This will exceed your ${PAYMENT_METHODS.find(m => m.id === methodId)?.label} limit by ${fmt(newTotal - currentLimits[methodId])}!`;
    return null;
  };
  const warning = getWarning(form.method, form.amount);

  const handleSubmit = () => {
    if (!form.description || !form.amount || !form.category || !form.method) return;
    if (editId !== null) { saveExpenses(expenses.map((e) => (e.id === editId ? { ...e, ...form, amount: Number(form.amount), date: selectedDate } : e))); setEditId(null); }
    else { saveExpenses([...expenses, { id: nextId.current++, ...form, amount: Number(form.amount), date: selectedDate }]); }
    setForm({ description: "", amount: "", category: "", method: "" }); setShowForm(false);
  };

  const handleEdit = (exp) => { setForm({ description: exp.description, amount: String(exp.amount), category: exp.category, method: exp.method }); setEditId(exp.id); setShowForm(true); };
  const handleDelete = (id) => saveExpenses(expenses.filter((e) => e.id !== id));
  const saveLimitEdit = (methodId) => { const val = parseFloat(limitInput); if (!isNaN(val) && val >= 0) setCurrentMonthLimit(methodId, val); setEditingLimit(null); setLimitInput(""); };

  const availableMonths = Object.keys(monthlyLimits).filter((k) => k !== mk).sort().reverse();
  const allByDate = {}; expenses.forEach((e) => { if (!allByDate[e.date]) allByDate[e.date] = []; allByDate[e.date].push(e); });
  const sortedDates = Object.keys(allByDate).sort((a, b) => b.localeCompare(a));

  const inputStyle = { width: "100%", padding: "11px 14px", border: "2px solid #fce4ec", borderRadius: 14, background: "#fff0f5", fontSize: 14, fontFamily: "inherit", color: "#9c2460", outline: "none", boxSizing: "border-box" };
  const overBudgetMethods = PAYMENT_METHODS.filter((m) => currentLimits[m.id] > 0 && monthlySpend[m.id] > currentLimits[m.id]);

  if (loading) return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(170deg, #fff0f6, #fbcfe8)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Nunito', sans-serif" }}>
      <div style={{ textAlign: "center", color: "#db2777" }}><div style={{ fontSize: 48, marginBottom: 12 }}>🌸</div><div style={{ fontSize: 16, fontWeight: 700 }}>Loading your budget...</div></div>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(170deg, #fff0f6 0%, #fdf2f8 30%, #fce7f3 60%, #fbcfe8 100%)", fontFamily: "'Nunito', 'DM Sans', sans-serif", color: "#831843", padding: "0 0 80px 0", position: "relative" }}>
      <link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700;800&family=Dancing+Script:wght@600;700&display=swap" rel="stylesheet" />
      <FloatingHearts />

      {/* Header */}
      <div style={{ background: "linear-gradient(135deg, #ec4899 0%, #f472b6 40%, #e879f9 100%)", padding: "28px 24px 24px", color: "white", position: "relative", overflow: "hidden", borderRadius: "0 0 32px 32px", boxShadow: "0 8px 32px rgba(236,72,153,0.3)" }}>
        <div style={{ position: "absolute", top: -30, right: -20, width: 140, height: 140, borderRadius: "50%", background: "rgba(255,255,255,0.1)" }} />
        <div style={{ position: "absolute", bottom: -30, left: 20, width: 100, height: 100, borderRadius: "50%", background: "rgba(255,255,255,0.07)" }} />
        <div style={{ position: "absolute", top: 18, right: 30, fontSize: 18, opacity: 0.5 }}>✨</div>
        <div style={{ position: "absolute", bottom: 16, right: 80, fontSize: 14, opacity: 0.4 }}>💖</div>
        <div style={{ position: "relative", zIndex: 1, maxWidth: 480, margin: "0 auto" }}>
          <div style={{ fontFamily: "'Dancing Script', cursive", fontSize: 16, opacity: 0.9, marginBottom: 2 }}>Jea's ✿</div>
          <div style={{ fontSize: 12, opacity: 0.8, letterSpacing: 1.5, textTransform: "uppercase", fontWeight: 700, marginBottom: 6 }}>Budget Tracker</div>
          <div style={{ fontSize: 36, fontWeight: 800, lineHeight: 1.1, textShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>{fmt(totalSpent)}</div>
          <div style={{ fontSize: 12, opacity: 0.75, marginTop: 5, fontWeight: 500 }}>total spent · {expenses.length} expense{expenses.length !== 1 ? "s" : ""} 🌸</div>
          {overBudgetMethods.length > 0 && (
            <div style={{ marginTop: 8, background: "rgba(255,255,255,0.2)", borderRadius: 10, padding: "6px 12px", fontSize: 12, fontWeight: 700 }}>⚠️ Over budget: {overBudgetMethods.map((m) => m.label).join(", ")}</div>
          )}
        </div>
      </div>

      <div style={{ maxWidth: 480, margin: "0 auto", padding: "0 16px", position: "relative", zIndex: 1 }}>
        {/* Tabs */}
        <div style={{ display: "flex", gap: 0, margin: "16px 0 14px", background: "#fde4ef", borderRadius: 16, padding: 3 }}>
          {[{ id: "calendar", label: "📅 Calendar" }, { id: "budgets", label: "💰 Budgets" }, { id: "list", label: "📋 All" }].map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              flex: 1, padding: "10px 0", border: "none", borderRadius: 13, cursor: "pointer",
              fontFamily: "inherit", fontSize: 12, fontWeight: 700, transition: "all 0.2s",
              background: tab === t.id ? "white" : "transparent", color: tab === t.id ? "#db2777" : "#e191b4",
              boxShadow: tab === t.id ? "0 2px 8px rgba(236,72,153,0.12)" : "none",
            }}>{t.label}</button>
          ))}
        </div>

        {/* BUDGETS */}
        {tab === "budgets" && (
          <div style={{ background: "rgba(255,255,255,0.8)", borderRadius: 20, boxShadow: "0 2px 16px rgba(236,72,153,0.08)", border: "1.5px solid #fce4ec", padding: "18px 16px", backdropFilter: "blur(8px)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
              <button onClick={() => changeMonth(-1)} style={{ border: "none", background: "#fde4ef", borderRadius: 10, width: 32, height: 32, cursor: "pointer", fontSize: 15, color: "#db2777", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>‹</button>
              <div style={{ fontWeight: 800, fontSize: 15, color: "#9c2460" }}>💰 {MONTH_NAMES[calMonth]} {calYear}</div>
              <button onClick={() => changeMonth(1)} style={{ border: "none", background: "#fde4ef", borderRadius: 10, width: 32, height: 32, cursor: "pointer", fontSize: 15, color: "#db2777", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>›</button>
            </div>
            <div style={{ display: "flex", gap: 6, marginBottom: 14, flexWrap: "wrap" }}>
              <span style={{ fontSize: 10, fontWeight: 700, padding: "3px 10px", borderRadius: 20, background: hasCustomLimits ? "#d1fae5" : "#fde4ef", color: hasCustomLimits ? "#065f46" : "#db2777", border: `1px solid ${hasCustomLimits ? "#a7f3d0" : "#fce4ec"}` }}>
                {hasCustomLimits ? "✨ Custom limits set" : "Using default limits"}
              </span>
            </div>
            <div style={{ display: "flex", gap: 6, marginBottom: 14, flexWrap: "wrap" }}>
              <button onClick={() => saveDefaults({ ...currentLimits })} style={{ border: "1.5px solid #fce4ec", background: "#fff0f5", borderRadius: 10, padding: "6px 12px", fontSize: 11, fontWeight: 700, color: "#db2777", cursor: "pointer", fontFamily: "inherit" }}>⭐ Save as default</button>
              {hasCustomLimits && <button onClick={() => { const u = { ...monthlyLimits }; delete u[mk]; saveLimits(u); }} style={{ border: "1.5px solid #fce4ec", background: "#fff0f5", borderRadius: 10, padding: "6px 12px", fontSize: 11, fontWeight: 700, color: "#e879a8", cursor: "pointer", fontFamily: "inherit" }}>↩ Reset to default</button>}
              <div style={{ position: "relative" }}>
                <button onClick={() => setCopyFromOpen(!copyFromOpen)} style={{ border: "1.5px solid #fce4ec", background: "#fff0f5", borderRadius: 10, padding: "6px 12px", fontSize: 11, fontWeight: 700, color: "#e879a8", cursor: "pointer", fontFamily: "inherit" }}>📋 Copy from...</button>
                {copyFromOpen && (
                  <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, minWidth: 160, background: "#fff7fa", border: "2px solid #fce4ec", borderRadius: 12, boxShadow: "0 8px 24px rgba(200,100,150,0.15)", zIndex: 50, padding: 4 }}>
                    <button onClick={() => { saveLimits({ ...monthlyLimits, [mk]: { ...defaultLimits } }); setCopyFromOpen(false); }} style={{ width: "100%", padding: "8px 12px", border: "none", background: "transparent", textAlign: "left", cursor: "pointer", borderRadius: 8, fontSize: 12, fontFamily: "inherit", color: "#9c2460", fontWeight: 600 }}
                      onMouseEnter={(e) => (e.target.style.background = "#fde4ef")} onMouseLeave={(e) => (e.target.style.background = "transparent")}>⭐ Defaults</button>
                    {availableMonths.map((k) => { const [y, m] = k.split("-"); return (
                      <button key={k} onClick={() => { saveLimits({ ...monthlyLimits, [mk]: { ...monthlyLimits[k] } }); setCopyFromOpen(false); }} style={{ width: "100%", padding: "8px 12px", border: "none", background: "transparent", textAlign: "left", cursor: "pointer", borderRadius: 8, fontSize: 12, fontFamily: "inherit", color: "#9c2460", fontWeight: 600 }}
                        onMouseEnter={(e) => (e.target.style.background = "#fde4ef")} onMouseLeave={(e) => (e.target.style.background = "transparent")}>{MONTH_SHORT[Number(m) - 1]} {y}</button>
                    ); })}
                    {availableMonths.length === 0 && <div style={{ padding: "8px 12px", fontSize: 11, color: "#d4a0b9" }}>No other months set yet</div>}
                  </div>
                )}
              </div>
            </div>
            {PAYMENT_METHODS.map((m) => {
              const spent = monthlySpend[m.id] || 0; const limit = currentLimits[m.id] || 0; const isEditing = editingLimit === m.id;
              return (
                <div key={m.id}>
                  {isEditing ? (
                    <div style={{ marginBottom: 14 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "#9c2460", marginBottom: 6, display: "flex", alignItems: "center", gap: 4 }}>
                        <span style={{ width: 8, height: 8, borderRadius: "50%", background: m.color, display: "inline-block" }} />{m.icon} {m.label} — {MONTH_SHORT[calMonth]} limit
                      </div>
                      <div style={{ display: "flex", gap: 6 }}>
                        <div style={{ position: "relative", flex: 1 }}>
                          <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", fontSize: 13, color: "#e879a8", fontWeight: 700, pointerEvents: "none" }}>₱</span>
                          <input type="number" value={limitInput} onChange={(e) => setLimitInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && saveLimitEdit(m.id)} autoFocus placeholder="0" style={{ ...inputStyle, padding: "9px 12px 9px 28px", fontSize: 13 }} />
                        </div>
                        <button onClick={() => saveLimitEdit(m.id)} style={{ border: "none", borderRadius: 12, padding: "0 16px", background: "linear-gradient(135deg, #ec4899, #e879f9)", color: "white", fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>✓</button>
                        <button onClick={() => { setEditingLimit(null); setLimitInput(""); }} style={{ border: "1px solid #fce4ec", borderRadius: 12, padding: "0 12px", background: "#fff0f5", color: "#db2777", fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>✕</button>
                      </div>
                    </div>
                  ) : (
                    <div style={{ position: "relative" }}>
                      <button onClick={() => { setEditingLimit(m.id); setLimitInput(String(limit)); }} style={{ position: "absolute", top: 0, right: 0, border: "1px solid #fce4ec", background: "#fdf2f8", borderRadius: 8, padding: "2px 8px", fontSize: 10, cursor: "pointer", color: "#db2777", fontWeight: 600, fontFamily: "inherit", zIndex: 2 }}>✏️ edit</button>
                      <BudgetBar spent={spent} limit={limit} color={m.color} label={m.label} icon={m.icon} />
                    </div>
                  )}
                </div>
              );
            })}
            <div style={{ marginTop: 8, padding: "12px 14px", background: "linear-gradient(135deg, #fdf2f8, #fce7f3)", borderRadius: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}><span style={{ fontSize: 13, fontWeight: 800, color: "#9c2460" }}>🌸 Total Budget</span><span style={{ fontSize: 13, fontWeight: 800, color: "#be185d" }}>{fmt(Object.values(currentLimits).reduce((a, b) => a + b, 0))}</span></div>
              <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ fontSize: 12, fontWeight: 600, color: "#e879a8" }}>Total Spent</span><span style={{ fontSize: 12, fontWeight: 700, color: "#db2777" }}>{fmt(Object.values(monthlySpend).reduce((a, b) => a + b, 0))}</span></div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 2 }}><span style={{ fontSize: 12, fontWeight: 600, color: "#e879a8" }}>Remaining</span>
                {(() => { const rem = Object.values(currentLimits).reduce((a, b) => a + b, 0) - Object.values(monthlySpend).reduce((a, b) => a + b, 0); return <span style={{ fontSize: 12, fontWeight: 700, color: rem < 0 ? "#ef4444" : "#2dd4bf" }}>{fmt(rem)}</span>; })()}
              </div>
            </div>
          </div>
        )}

        {/* CALENDAR */}
        {tab === "calendar" && (
          <>
            <CalendarView expenses={expenses} selectedDate={selectedDate} onSelectDate={setSelectedDate} calMonth={calMonth} calYear={calYear} onChangeMonth={changeMonth} />
            <div style={{ marginTop: 14 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: "#9c2460" }}>{friendlyDate}</div>
                  <div style={{ fontSize: 12, color: "#e191b4", fontWeight: 600 }}>{dayExpenses.length} expense{dayExpenses.length !== 1 ? "s" : ""} · {fmt(dayTotal)}</div>
                </div>
                <button onClick={() => { setShowForm(!showForm); setEditId(null); setForm({ description: "", amount: "", category: "", method: "" }); }} style={{ padding: "8px 16px", border: "2px dashed #f9a8d4", borderRadius: 14, background: showForm ? "#fdf2f8" : "rgba(255,255,255,0.6)", cursor: "pointer", fontSize: 13, fontWeight: 700, color: "#db2777", fontFamily: "inherit" }}>{showForm ? "✕" : "＋ Add ✿"}</button>
              </div>
              {showForm && (
                <div style={{ background: "rgba(255,255,255,0.85)", borderRadius: 18, padding: "16px", boxShadow: "0 4px 20px rgba(236,72,153,0.1)", border: "1.5px solid #fce4ec", marginBottom: 12, animation: "slideDown 0.25s ease", backdropFilter: "blur(8px)" }}>
                  <style>{`@keyframes slideDown { from { opacity:0; transform:translateY(-8px); } to { opacity:1; transform:translateY(0); } }`}</style>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    <input placeholder="What did you spend on? 🛒" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} style={inputStyle} />
                    <div style={{ position: "relative" }}>
                      <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", fontSize: 14, color: "#e879a8", fontWeight: 700, pointerEvents: "none" }}>₱</span>
                      <input type="number" placeholder="0.00" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} style={{ ...inputStyle, paddingLeft: 30 }} />
                    </div>
                    <Dropdown value={form.category} onChange={(v) => setForm({ ...form, category: v })} options={CATEGORIES} placeholder="Pick a category 🌷" renderOption={(o) => <span>{o.emoji} {o.label}</span>} />
                    <Dropdown value={form.method} onChange={(v) => setForm({ ...form, method: v })} options={PAYMENT_METHODS} placeholder="Payment method 💳"
                      renderOption={(o) => (
                        <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <span style={{ width: 10, height: 10, borderRadius: "50%", background: o.color, display: "inline-block", flexShrink: 0 }} />
                          {o.icon} {o.label}
                          {currentLimits[o.id] > 0 && <span style={{ fontSize: 10, color: monthlySpend[o.id] > currentLimits[o.id] ? "#ef4444" : "#d4a0b9", marginLeft: 4 }}>({fmtShort(monthlySpend[o.id])}/{fmtShort(currentLimits[o.id])})</span>}
                        </span>
                      )} />
                    {warning && <div style={{ background: "#fef2f2", border: "1.5px solid #fecaca", borderRadius: 12, padding: "10px 14px", fontSize: 12, color: "#dc2626", fontWeight: 600 }}>⚠️ {warning}</div>}
                    <button onClick={handleSubmit} disabled={!form.description || !form.amount || !form.category || !form.method} style={{
                      padding: "12px", border: "none", borderRadius: 14,
                      background: (!form.description || !form.amount || !form.category || !form.method) ? "#f3d5e4" : "linear-gradient(135deg, #ec4899, #e879f9)",
                      color: "white", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", boxShadow: "0 4px 16px rgba(236,72,153,0.3)",
                    }}>{editId !== null ? "✓ Update" : "✓ Add Expense"} 💖</button>
                  </div>
                </div>
              )}
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {dayExpenses.length === 0 && !showForm && (
                  <div style={{ textAlign: "center", padding: "30px 20px", color: "#e879a8", fontSize: 13 }}><div style={{ fontSize: 36, marginBottom: 6 }}>🌷</div>No expenses on this day!<br />Tap "＋ Add" to log something 💕</div>
                )}
                {dayExpenses.map((exp) => {
                  const cat = CATEGORIES.find((c) => c.id === exp.category);
                  return (
                    <div key={exp.id} style={{ background: "rgba(255,255,255,0.8)", borderRadius: 16, padding: "12px 14px", boxShadow: "0 2px 10px rgba(236,72,153,0.06)", border: "1.5px solid #fce4ec", display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 40, height: 40, borderRadius: 12, background: "linear-gradient(135deg, #fdf2f8, #fce7f3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0, border: "1px solid #fce4ec" }}>{cat?.emoji || "📌"}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: 13, color: "#9c2460", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{exp.description}</div>
                        <PaymentBadge methodId={exp.method} />
                      </div>
                      <div style={{ textAlign: "right", flexShrink: 0 }}>
                        <div style={{ fontWeight: 800, fontSize: 14, color: "#be185d" }}>{fmt(exp.amount)}</div>
                        <div style={{ display: "flex", gap: 4, marginTop: 3, justifyContent: "flex-end" }}>
                          <button onClick={() => handleEdit(exp)} style={{ border: "1px solid #fce4ec", background: "#fdf2f8", borderRadius: 7, padding: "2px 7px", fontSize: 11, cursor: "pointer", color: "#db2777" }}>✏️</button>
                          <button onClick={() => handleDelete(exp.id)} style={{ border: "1px solid #ffe4e9", background: "#fff0f3", borderRadius: 7, padding: "2px 7px", fontSize: 11, cursor: "pointer", color: "#f43f5e" }}>🗑️</button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}

        {/* LIST */}
        {tab === "list" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {sortedDates.length === 0 && <div style={{ textAlign: "center", padding: "40px 20px", color: "#e879a8", fontSize: 14 }}><div style={{ fontSize: 44, marginBottom: 8 }}>🌷</div>No expenses yet! 💕</div>}
            {sortedDates.map((date) => {
              const d = new Date(date + "T00:00:00");
              const dayLabel = d.toLocaleDateString("en-PH", { weekday: "short", month: "short", day: "numeric" });
              const dayItems = allByDate[date]; const daySum = dayItems.reduce((s, e) => s + Number(e.amount), 0);
              return (
                <div key={date}>
                  <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 4px", marginBottom: 6 }}>
                    <span style={{ fontSize: 13, fontWeight: 800, color: "#db2777" }}>📅 {dayLabel}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "#e879a8" }}>{fmt(daySum)}</span>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {dayItems.map((exp) => {
                      const cat = CATEGORIES.find((c) => c.id === exp.category);
                      return (
                        <div key={exp.id} style={{ background: "rgba(255,255,255,0.8)", borderRadius: 16, padding: "12px 14px", boxShadow: "0 2px 10px rgba(236,72,153,0.06)", border: "1.5px solid #fce4ec", display: "flex", alignItems: "center", gap: 10 }}>
                          <div style={{ width: 40, height: 40, borderRadius: 12, background: "linear-gradient(135deg, #fdf2f8, #fce7f3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0, border: "1px solid #fce4ec" }}>{cat?.emoji || "📌"}</div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: 700, fontSize: 13, color: "#9c2460", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{exp.description}</div>
                            <PaymentBadge methodId={exp.method} />
                          </div>
                          <div style={{ textAlign: "right", flexShrink: 0 }}>
                            <div style={{ fontWeight: 800, fontSize: 14, color: "#be185d" }}>{fmt(exp.amount)}</div>
                            <div style={{ display: "flex", gap: 4, marginTop: 3, justifyContent: "flex-end" }}>
                              <button onClick={() => handleEdit(exp)} style={{ border: "1px solid #fce4ec", background: "#fdf2f8", borderRadius: 7, padding: "2px 7px", fontSize: 11, cursor: "pointer", color: "#db2777" }}>✏️</button>
                              <button onClick={() => handleDelete(exp.id)} style={{ border: "1px solid #ffe4e9", background: "#fff0f3", borderRadius: 7, padding: "2px 7px", fontSize: 11, cursor: "pointer", color: "#f43f5e" }}>🗑️</button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default BudgetApp;
