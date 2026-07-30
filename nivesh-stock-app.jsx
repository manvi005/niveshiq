import React, { useState, useEffect, useRef, useMemo, createContext, useContext } from "react";
import {
  AreaChart, Area, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  ReferenceLine, ComposedChart, Bar, Cell, PieChart, Pie,
} from "recharts";
import {
  Home, TrendingUp, Calculator, BookOpen, ChevronLeft, Bell, Search, Star,
  Wallet, ShieldCheck, Sparkles, Award, CheckCircle2, XCircle, Clock3, Moon, Sun,
  Newspaper, PieChart as PieIcon, History,
} from "lucide-react";

/* ================= theme ================= */
const font = "'Inter','SF Pro Display',-apple-system,'Segoe UI',system-ui,sans-serif";
const makeTheme = (d) =>
  d
    ? {
        page: "#141220", shell: "rgba(28,25,40,0.72)", card: "#1C1928", soft: "#262138",
        softer: "#211D31", line: "#2A2638", purple: "#8B6CFF", purpleDark: "#A78BFF",
        purpleTint: "#4A3E78", ink: "#ECEAF6", sub: "#9A94B8", mint: "#2DD4A0",
        mintBg: "#12352C", coral: "#FF5C7A", coralBg: "#3A1824", amber: "#F5B93E",
        amberBg: "#38300F", onAccent: "#141220",
      }
    : {
        page: "linear-gradient(160deg,#F1EEF9 0%,#E9E4F7 100%)", shell: "rgba(255,255,255,0.62)",
        card: "#FFFFFF", soft: "#F3F1FA", softer: "#F8F7FC", line: "#ECE9F5",
        purple: "#6D4AE8", purpleDark: "#4F32B8", purpleTint: "#C9BCF5", ink: "#221F33",
        sub: "#7A7590", mint: "#0FA57E", mintBg: "#E3F6EF", coral: "#E2456A",
        coralBg: "#FCE8EE", amber: "#D99A18", amberBg: "#FBF2DC", onAccent: "#FFFFFF",
      };
const ThemeCtx = createContext(null);
const useTheme = () => useContext(ThemeCtx);

const GlobalStyle = ({ C }) => (
  <style>{`
    .stock-scroll{max-height:430px;overflow-y:auto;scrollbar-width:thin;scrollbar-color:${C.purpleTint} transparent;}
    .stock-scroll::-webkit-scrollbar{width:6px}
    .stock-scroll::-webkit-scrollbar-thumb{background:${C.purpleTint};border-radius:99px}
    .stock-scroll::-webkit-scrollbar-track{background:transparent}
    .shimmer{animation:pulse 1.2s ease-in-out infinite}
    @keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
    button{transition:transform .12s ease, background .2s ease, color .2s ease}
    button:active{transform:scale(.96)}
    button:focus-visible{outline:2px solid ${C.purple};outline-offset:2px}
    input[type=range]{accent-color:${C.purple}}
  `}</style>
);

/* ================= synthetic market data ================= */
const mulberry32 = (s) => () => {
  s |= 0; s = (s + 0x6d2b79f5) | 0;
  let t = Math.imul(s ^ (s >>> 15), 1 | s);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const DAYS = 1825;
function genSeries(seed, start, drift, vol) {
  const r = mulberry32(seed);
  let p = start / Math.exp(drift * DAYS);
  const out = [];
  for (let i = 0; i < DAYS; i++) {
    const shock = (r() + r() + r() - 1.5) / 1.2;
    p = Math.max(p * (1 + drift + vol * shock), 1);
    out.push(p);
  }
  return out;
}
const SECTOR_HUE = {
  Energy: "#E2792F", IT: "#4F82E8", Banking: "#6D4AE8", Finance: "#8B5BD6",
  FMCG: "#B98A2F", Auto: "#2C6E9B", Pharma: "#12B58A", Telecom: "#EF476F",
  Consumer: "#9B59D0", Infra: "#5C6BC0", Cement: "#8A87A0", Metals: "#546E7A",
};
const RAW = [
  ["RELIANCE", "Reliance Industries", "Energy", 2960, 0.00045, 0.011],
  ["ONGC", "Oil & Natural Gas Corp", "Energy", 282, 0.0003, 0.014],
  ["NTPC", "NTPC Limited", "Energy", 372, 0.00035, 0.011],
  ["POWERGRID", "Power Grid Corp", "Energy", 332, 0.0003, 0.009],
  ["TCS", "Tata Consultancy Services", "IT", 4180, 0.00035, 0.009],
  ["INFY", "Infosys", "IT", 1890, 0.0003, 0.012],
  ["WIPRO", "Wipro", "IT", 545, 0.00022, 0.013],
  ["HCLTECH", "HCL Technologies", "IT", 1720, 0.00032, 0.011],
  ["TECHM", "Tech Mahindra", "IT", 1610, 0.00025, 0.013],
  ["HDFCBANK", "HDFC Bank", "Banking", 1685, 0.0004, 0.008],
  ["ICICIBANK", "ICICI Bank", "Banking", 1245, 0.00042, 0.009],
  ["SBIN", "State Bank of India", "Banking", 842, 0.00033, 0.013],
  ["KOTAKBANK", "Kotak Mahindra Bank", "Banking", 1935, 0.0003, 0.01],
  ["AXISBANK", "Axis Bank", "Banking", 1180, 0.00032, 0.012],
  ["BAJFINANCE", "Bajaj Finance", "Finance", 7450, 0.00045, 0.014],
  ["ITC", "ITC Limited", "FMCG", 452, 0.00028, 0.007],
  ["HINDUNILVR", "Hindustan Unilever", "FMCG", 2540, 0.00022, 0.008],
  ["NESTLEIND", "Nestle India", "FMCG", 2480, 0.00025, 0.008],
  ["BRITANNIA", "Britannia Industries", "FMCG", 5620, 0.00027, 0.009],
  ["TATAMOTORS", "Tata Motors", "Auto", 1015, 0.0004, 0.017],
  ["MARUTI", "Maruti Suzuki", "Auto", 12750, 0.00038, 0.012],
  ["M&M", "Mahindra & Mahindra", "Auto", 3120, 0.00042, 0.013],
  ["BAJAJ-AUTO", "Bajaj Auto", "Auto", 9350, 0.00035, 0.011],
  ["SUNPHARMA", "Sun Pharmaceutical", "Pharma", 1780, 0.00035, 0.01],
  ["CIPLA", "Cipla", "Pharma", 1560, 0.0003, 0.011],
  ["DRREDDY", "Dr Reddy's Laboratories", "Pharma", 1310, 0.00028, 0.011],
  ["BHARTIARTL", "Bharti Airtel", "Telecom", 1490, 0.0005, 0.01],
  ["ASIANPAINT", "Asian Paints", "Consumer", 2980, 0.0002, 0.01],
  ["TITAN", "Titan Company", "Consumer", 3640, 0.0004, 0.012],
  ["LT", "Larsen & Toubro", "Infra", 3860, 0.0004, 0.011],
  ["ULTRACEMCO", "UltraTech Cement", "Cement", 11900, 0.00035, 0.011],
  ["TATASTEEL", "Tata Steel", "Metals", 172, 0.0003, 0.016],
  ["JSWSTEEL", "JSW Steel", "Metals", 985, 0.00032, 0.015],
];
const INDICES = [
  { sym: "NIFTY 50", name: "NSE Nifty 50", seed: 7, start: 24900, drift: 0.00042, vol: 0.0075 },
  { sym: "SENSEX", name: "BSE Sensex", seed: 9, start: 81600, drift: 0.00041, vol: 0.0074 },
];
function stats(series) {
  const n = series.length;
  const last = series[n - 1];
  const rets = [];
  for (let i = n - 30; i < n; i++) rets.push(series[i] / series[i - 1] - 1);
  const mean = rets.reduce((a, b) => a + b, 0) / rets.length;
  const vol30 = Math.sqrt(rets.reduce((a, b) => a + (b - mean) ** 2, 0) / rets.length) * 100;
  const mom30 = (last / series[n - 31] - 1) * 100;
  let peak = 0, dd = 0;
  for (let i = n - 90; i < n; i++) {
    peak = Math.max(peak, series[i]);
    dd = Math.max(dd, (peak - series[i]) / peak);
  }
  const retsY = [];
  for (let i = n - 250; i < n; i++) retsY.push(Math.log(series[i] / series[i - 1]));
  const mu = retsY.reduce((a, b) => a + b, 0) / retsY.length;
  const sig = Math.sqrt(retsY.reduce((a, b) => a + (b - mu) ** 2, 0) / retsY.length);
  const wk = (last / series[n - 8] - 1) * 100;
  const above30 = last > series.slice(n - 30).reduce((a, b) => a + b, 0) / 30;
  const score = Math.round(Math.min(96, Math.max(8,
    92 - vol30 * 22 - dd * 100 * 0.9 + Math.max(-6, Math.min(6, mom30)) * 1.6 + (above30 ? 4 : -4)
  )));
  return { last, vol30, mom30, dd: dd * 100, mu, sig, wk, above30, score };
}
const MARKET = RAW.map(([sym, name, sector, start, drift, vol], i) => {
  const series = genSeries(11 + i * 13, start, drift, vol);
  return { sym, name, sector, hue: SECTOR_HUE[sector], series, ...stats(series) };
});
const IDX = INDICES.map((s) => {
  const series = genSeries(s.seed, s.start, s.drift, s.vol);
  return { ...s, series, ...stats(series) };
});
const SECTORS = ["All", ...Array.from(new Set(MARKET.map((m) => m.sector)))];
const NEWS_T = [
  ["Quarterly results beat street estimates", "pos"],
  ["Brokerages raise target price", "pos"],
  ["Announces capacity expansion plan", "pos"],
  ["Regulator seeks clarification on disclosures", "neg"],
  ["Margins under pressure from input costs", "neg"],
  ["Block deal sees strong institutional buying", "pos"],
  ["Management commentary stays cautious", "neg"],
  ["Wins large multi-year export order", "pos"],
];

/* ================= helpers ================= */
const inr = (n, d = 0) =>
  "₹" + n.toLocaleString("en-IN", { maximumFractionDigits: d, minimumFractionDigits: d });
const big = (n) => {
  const a = Math.abs(n), sign = n < 0 ? "-" : "";
  if (a >= 1e7) return sign + "₹" + (a / 1e7).toFixed(2) + " Cr";
  if (a >= 1e5) return sign + "₹" + (a / 1e5).toFixed(2) + " L";
  return sign + inr(a);
};
const pct = (n) => (n >= 0 ? "+" : "") + n.toFixed(2) + "%";
const RANGES = { "1W": 7, "1M": 30, "6M": 182, "1Y": 365, "5Y": DAYS };
const riskLabel = (C, s) =>
  s >= 70 ? ["Lower risk", C.mint, C.mintBg] : s >= 45 ? ["Moderate risk", C.amber, C.amberBg] : ["Higher risk", C.coral, C.coralBg];
const reasons = (s) => [
  s.vol30 < 1.0 ? `Low volatility · ${s.vol30.toFixed(1)}% daily` : s.vol30 < 1.4 ? `Moderate volatility · ${s.vol30.toFixed(1)}% daily` : `High volatility · ${s.vol30.toFixed(1)}% daily`,
  s.above30 ? "Trading above 30-day average" : "Below its 30-day average",
  `90-day drawdown ${s.dd.toFixed(1)}%`,
  s.mom30 >= 0 ? `Momentum +${s.mom30.toFixed(1)}% this month` : `Momentum ${s.mom30.toFixed(1)}% this month`,
];
function useCountUp(target, dur = 700) {
  const [v, setV] = useState(target);
  const ref = useRef(target);
  useEffect(() => {
    const from = ref.current, to = target, t0 = performance.now();
    let raf;
    const step = (t) => {
      const k = Math.min(1, (t - t0) / dur);
      setV(from + (to - from) * (1 - Math.pow(1 - k, 3)));
      if (k < 1) raf = requestAnimationFrame(step);
      else ref.current = to;
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target]);
  return v;
}
function useFakeLoad(deps, ms = 450) {
  const [l, setL] = useState(true);
  useEffect(() => {
    setL(true);
    const t = setTimeout(() => setL(false), ms);
    return () => clearTimeout(t);
  }, deps);
  return l;
}

/* ================= ui atoms ================= */
const Card = ({ children, style, onClick }) => {
  const C = useTheme();
  return (
    <div onClick={onClick} style={{ background: C.card, borderRadius: 18, padding: 16, border: `1px solid ${C.line}`, cursor: onClick ? "pointer" : "default", ...style }}>
      {children}
    </div>
  );
};
const SectionLabel = ({ children, right }) => {
  const C = useTheme();
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", margin: "18px 2px 10px" }}>
      <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: 1.2, textTransform: "uppercase", color: C.sub }}>{children}</div>
      {right}
    </div>
  );
};
const Chip = ({ children, color, bg }) => {
  const C = useTheme();
  return (
    <span style={{ background: bg || C.soft, color: color || C.purpleDark, borderRadius: 999, padding: "5px 11px", fontSize: 12, fontWeight: 600, display: "inline-block" }}>
      {children}
    </span>
  );
};
const Sk = ({ w = "100%", h = 14, r = 8, style }) => {
  const C = useTheme();
  return <div className="shimmer" style={{ width: w, height: h, borderRadius: r, background: C.soft, ...style }} />;
};
const Spark = ({ data, color, h = 42 }) => (
  <ResponsiveContainer width="100%" height={h}>
    <AreaChart data={data} margin={{ top: 4, bottom: 0, left: 0, right: 0 }}>
      <defs>
        <linearGradient id={"sg" + color.replace("#", "")} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.35} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <Area type="monotone" dataKey="v" stroke={color} strokeWidth={2} fill={`url(#sg${color.replace("#", "")})`} dot={false} isAnimationActive animationDuration={900} />
    </AreaChart>
  </ResponsiveContainer>
);
const Gauge = ({ score }) => {
  const C = useTheme();
  const len = 219.9, prog = (score / 100) * len;
  const [lab, col, bg] = riskLabel(C, score);
  return (
    <div style={{ textAlign: "center" }}>
      <svg width="180" height="104" viewBox="0 0 180 104">
        <path d="M20 96 A70 70 0 0 1 160 96" fill="none" stroke={C.soft} strokeWidth="14" strokeLinecap="round" />
        <path d="M20 96 A70 70 0 0 1 160 96" fill="none" stroke={col} strokeWidth="14" strokeLinecap="round"
          strokeDasharray={`${prog} ${len}`} style={{ transition: "stroke-dasharray 900ms cubic-bezier(.2,.8,.2,1), stroke 400ms" }} />
        <text x="90" y="78" textAnchor="middle" fontSize="30" fontWeight="700" fill={C.ink} fontFamily={font}>{score}</text>
        <text x="90" y="96" textAnchor="middle" fontSize="11" fill={C.sub} fontFamily={font}>safety score</text>
      </svg>
      <div><Chip color={col} bg={bg}>{lab}</Chip></div>
    </div>
  );
};
const Toolt = ({ active, payload }) => {
  const C = useTheme();
  return active && payload && payload.length ? (
    <div style={{ background: C.ink, color: C.card, borderRadius: 10, padding: "6px 10px", fontSize: 12, fontFamily: font }}>
      {payload.filter((p) => typeof p.value === "number").map((p, i) => (
        <div key={i}>{inr(p.value, 2)}</div>
      ))}
    </div>
  ) : null;
};
const PillBtn = ({ active, onClick, children, style }) => {
  const C = useTheme();
  return (
    <button onClick={onClick}
      style={{ border: "none", cursor: "pointer", fontFamily: font, fontWeight: 600, fontSize: 12, padding: "7px 13px", borderRadius: 999, background: active ? C.purple : C.card, color: active ? C.onAccent : C.sub, whiteSpace: "nowrap", ...style }}>
      {children}
    </button>
  );
};

/* ================= screens ================= */
function HomeScreen({ go, cash, holdings, portfolio, watch }) {
  const C = useTheme();
  const loading = useFakeLoad([], 650);
  const [q, setQ] = useState("");
  const [sector, setSector] = useState("All");
  const pv = useCountUp(portfolio.total);
  const profit = portfolio.total - 100000;
  const filtered = MARKET.filter(
    (s) =>
      (sector === "All" || s.sector === sector) &&
      (s.sym.toLowerCase().includes(q.toLowerCase()) || s.name.toLowerCase().includes(q.toLowerCase()))
  );
  const watched = MARKET.filter((m) => watch.includes(m.sym));

  return (
    <div>
      <Card style={{ marginBottom: 4, background: C.card }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ fontSize: 12, color: C.sub }}>My portfolio · paper trading</div>
            {loading ? <Sk w={140} h={32} style={{ marginTop: 4 }} /> :
              <div style={{ fontSize: 30, fontWeight: 700, letterSpacing: -0.5, fontVariantNumeric: "tabular-nums", color: C.ink }}>{big(Math.round(pv))}</div>}
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 12, color: C.sub }}>Profit</div>
            <div style={{ color: profit >= 0 ? C.mint : C.coral, fontWeight: 700 }}>{(profit >= 0 ? "+" : "") + big(Math.round(profit))}</div>
            <div style={{ fontSize: 12, color: C.sub, marginTop: 2 }}>Cash {big(cash)}</div>
          </div>
        </div>
        <div style={{ marginTop: 10, fontSize: 12, color: C.purpleDark, background: C.soft, borderRadius: 10, padding: "7px 10px", display: "inline-flex", gap: 6, alignItems: "center" }}>
          <Wallet size={14} /> Practice with a virtual ₹1,00,000 wallet, zero risk
        </div>
      </Card>

      <SectionLabel>Market indices</SectionLabel>
      <div style={{ display: "flex", gap: 12 }}>
        {IDX.map((ix) => (
          <Card key={ix.sym} style={{ flex: 1, padding: 12 }}>
            {loading ? (
              <><Sk w={70} h={12} /><Sk w={90} h={18} style={{ margin: "6px 0" }} /><Sk h={34} /></>
            ) : (
              <>
                <div style={{ fontSize: 12, color: C.sub, fontWeight: 600 }}>{ix.sym}</div>
                <div style={{ fontWeight: 700, fontSize: 15, fontVariantNumeric: "tabular-nums", color: C.ink }}>{ix.last.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</div>
                <div style={{ fontSize: 12, color: ix.wk >= 0 ? C.mint : C.coral, fontWeight: 700 }}>{pct(ix.wk)} · 1W</div>
                <Spark data={ix.series.slice(-60).map((v) => ({ v }))} color={ix.wk >= 0 ? C.mint : C.coral} h={34} />
              </>
            )}
          </Card>
        ))}
      </div>

      {watched.length > 0 && (
        <>
          <SectionLabel>Watchlist</SectionLabel>
          <div style={{ display: "flex", gap: 12, overflowX: "auto", paddingBottom: 6 }}>
            {watched.map((st) => (
              <Card key={st.sym} onClick={() => go("detail", st)} style={{ minWidth: 140, padding: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ fontWeight: 700, fontSize: 13, color: C.ink }}>{st.sym}</div>
                  <Star size={13} fill={C.amber} color={C.amber} />
                </div>
                <div style={{ fontWeight: 700, fontVariantNumeric: "tabular-nums", color: C.ink }}>{inr(st.last, st.last < 1000 ? 2 : 0)}</div>
                <div style={{ fontSize: 12, color: st.wk >= 0 ? C.mint : C.coral, fontWeight: 700 }}>{pct(st.wk)}</div>
                <Spark data={st.series.slice(-40).map((v) => ({ v }))} color={st.wk >= 0 ? C.mint : C.coral} h={28} />
              </Card>
            ))}
          </div>
        </>
      )}

      {Object.keys(holdings).length > 0 && (
        <>
          <SectionLabel>My assets</SectionLabel>
          <div style={{ display: "flex", gap: 12, overflowX: "auto", paddingBottom: 6 }}>
            {Object.entries(holdings).map(([sym, h]) => {
              const st = MARKET.find((m) => m.sym === sym);
              const pl = (st.last - h.avg) * h.qty;
              return (
                <Card key={sym} onClick={() => go("detail", st)} style={{ minWidth: 150, padding: 12 }}>
                  <div style={{ fontWeight: 700, fontSize: 13, color: C.ink }}>{sym}</div>
                  <div style={{ fontSize: 12, color: C.sub }}>{h.qty} shares</div>
                  <div style={{ fontWeight: 700, fontVariantNumeric: "tabular-nums", color: C.ink }}>{inr(st.last * h.qty)}</div>
                  <div style={{ fontSize: 12, color: pl >= 0 ? C.mint : C.coral, fontWeight: 700 }}>{(pl >= 0 ? "+" : "") + inr(pl)}</div>
                </Card>
              );
            })}
          </div>
        </>
      )}

      <SectionLabel right={<Chip>{filtered.length} stocks</Chip>}>Explore NSE</SectionLabel>
      <div style={{ display: "flex", gap: 8, alignItems: "center", background: C.card, border: `1px solid ${C.line}`, borderRadius: 12, padding: "10px 12px", marginBottom: 10 }}>
        <Search size={16} color={C.sub} />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name or symbol" aria-label="Search stocks"
          style={{ border: "none", outline: "none", flex: 1, fontFamily: font, fontSize: 14, color: C.ink, background: "transparent" }} />
        {q && <span onClick={() => setQ("")} style={{ cursor: "pointer", color: C.sub, fontWeight: 700 }}>×</span>}
      </div>
      <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 8, marginBottom: 6 }}>
        {SECTORS.map((sec) => (
          <PillBtn key={sec} active={sector === sec} onClick={() => setSector(sec)}>{sec}</PillBtn>
        ))}
      </div>
      <Card style={{ padding: 6 }}>
        {loading ? (
          <div style={{ padding: 8, display: "flex", flexDirection: "column", gap: 14 }}>
            {[...Array(6)].map((_, i) => (
              <div key={i} style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <Sk w={40} h={40} r={12} /><div style={{ flex: 1 }}><Sk w="55%" h={13} /><Sk w="80%" h={11} style={{ marginTop: 5 }} /></div><Sk w={70} h={26} />
              </div>
            ))}
          </div>
        ) : (
          <div className="stock-scroll">
            {filtered.length === 0 && (
              <div style={{ padding: 24, textAlign: "center", color: C.sub, fontSize: 13 }}>
                No stocks match "{q}". Try a symbol like TCS or a name like Tata.
              </div>
            )}
            {filtered.map((s, i) => (
              <div key={s.sym} onClick={() => go("detail", s)}
                style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 10px", borderTop: i ? `1px solid ${C.softer}` : "none", cursor: "pointer" }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: s.hue + "22", color: s.hue, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, flexShrink: 0 }}>{s.sym[0]}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 14, color: C.ink }}>{s.sym}</div>
                  <div style={{ fontSize: 12, color: C.sub, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{s.name} · {s.sector}</div>
                </div>
                <div style={{ width: 64, flexShrink: 0 }}>
                  <Spark data={s.series.slice(-30).map((v) => ({ v }))} color={s.wk >= 0 ? C.mint : C.coral} h={28} />
                </div>
                <div style={{ textAlign: "right", width: 84, flexShrink: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 13, fontVariantNumeric: "tabular-nums", color: C.ink }}>{inr(s.last, s.last < 1000 ? 2 : 0)}</div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: s.wk >= 0 ? C.mint : C.coral }}>{pct(s.wk)}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

function CandleShape(props) {
  const { x, width, y, height, payload, up, dn } = props;
  const { o, c, h, l } = payload;
  const rng = h - l || 1;
  const top = Math.max(o, c), bot = Math.min(o, c);
  const by = y + ((h - top) / rng) * height;
  const bh = Math.max(2, ((top - bot) / rng) * height);
  const col = c >= o ? up : dn;
  const cx = x + width / 2;
  return (
    <g>
      <line x1={cx} x2={cx} y1={y} y2={y + height} stroke={col} strokeWidth={1} />
      <rect x={x + 0.5} y={by} width={Math.max(2, width - 1)} height={bh} fill={col} rx={1} />
    </g>
  );
}

function DetailScreen({ stock: s, back, cash, holdings, trade, watch, toggleWatch }) {
  const C = useTheme();
  const [range, setRange] = useState("1M");
  const [ctype, setCtype] = useState("area");
  const [forecast, setForecast] = useState(false);
  const [qty, setQty] = useState(1);
  const [tmYears, setTmYears] = useState(3);
  const chartLoad = useFakeLoad([range, ctype], 350);
  const held = holdings[s.sym]?.qty || 0;
  const price = useCountUp(s.last);
  const starred = watch.includes(s.sym);

  const areaData = useMemo(() => {
    const n = RANGES[range];
    const hist = s.series.slice(-n).map((v, i) => ({ i, v }));
    if (!forecast) return hist;
    const H = 30, S = s.last;
    const out = hist.map((d) => ({ ...d, band: null, med: null }));
    for (let d = 0; d <= H; d++) {
      const med = S * Math.exp((s.mu - 0.5 * s.sig ** 2) * d);
      const w = 1.28 * s.sig * Math.sqrt(d);
      out.push({ i: hist.length + d, v: null, med, band: [med * Math.exp(-w), med * Math.exp(w)] });
    }
    return out;
  }, [range, forecast, s]);

  const candles = useMemo(() => {
    const n = Math.min(RANGES[range], 60);
    const r = mulberry32(s.sym.charCodeAt(0) * 131 + n);
    const start = s.series.length - n;
    const out = [];
    for (let i = start; i < s.series.length; i++) {
      const c = s.series[i], o = s.series[i - 1] ?? c;
      out.push({
        i, o, c,
        h: Math.max(o, c) * (1 + r() * 0.006),
        l: Math.min(o, c) * (1 - r() * 0.006),
        vol: Math.round((0.4 + r()) * 1000),
      });
    }
    return out;
  }, [s, range]);

  const news = useMemo(() => {
    const r = mulberry32(s.sym.charCodeAt(0) * 31 + s.sym.length * 7);
    const used = new Set(), picks = [];
    while (picks.length < 3) {
      const k = Math.floor(r() * NEWS_T.length);
      if (used.has(k)) continue;
      used.add(k);
      picks.push({ t: NEWS_T[k][0], sn: NEWS_T[k][1], d: Math.floor(r() * 6) + 1 });
    }
    return picks;
  }, [s]);

  const then = s.series[s.series.length - 1 - tmYears * 365] || s.series[0];
  const tmValue = useCountUp(Math.round((10000 * s.last) / then));
  const sent = s.mom30 > 2 ? ["Positive", C.mint, C.mintBg] : s.mom30 < -2 ? ["Cautious", C.coral, C.coralBg] : ["Neutral", C.amber, C.amberBg];
  const niftyDiff = s.mom30 - IDX[0].mom30;

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <div onClick={back} style={{ width: 38, height: 38, borderRadius: 999, background: C.card, border: `1px solid ${C.line}`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
          <ChevronLeft size={18} color={C.purpleDark} />
        </div>
        <div style={{ fontWeight: 700, color: C.ink }}>{s.sym}</div>
        <button onClick={() => toggleWatch(s.sym)} aria-label="Toggle watchlist"
          style={{ width: 38, height: 38, borderRadius: 999, background: C.card, border: `1px solid ${C.line}`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
          <Star size={17} fill={starred ? C.amber : "none"} color={starred ? C.amber : C.sub} />
        </button>
      </div>

      <div style={{ textAlign: "center", marginBottom: 10 }}>
        <div style={{ fontSize: 13, color: C.sub }}>{s.name} · {s.sector}</div>
        <div style={{ fontSize: 32, fontWeight: 700, letterSpacing: -0.5, fontVariantNumeric: "tabular-nums", color: C.ink }}>{inr(price, 2)}</div>
        <div style={{ display: "flex", gap: 8, justifyContent: "center", alignItems: "center", marginTop: 4 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: s.wk >= 0 ? C.mint : C.coral }}>{pct(s.wk)} 1W</span>
          <Chip color={sent[1]} bg={sent[2]}>{sent[0]}</Chip>
          <Chip color={niftyDiff >= 0 ? C.mint : C.coral} bg={niftyDiff >= 0 ? C.mintBg : C.coralBg}>
            {niftyDiff >= 0 ? "Beats" : "Lags"} Nifty 30d
          </Chip>
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <div style={{ display: "flex", gap: 6 }}>
          {Object.keys(RANGES).map((r) => (
            <PillBtn key={r} active={range === r} onClick={() => setRange(r)} style={{ padding: "7px 10px" }}>{r}</PillBtn>
          ))}
        </div>
        <div style={{ display: "flex", background: C.card, border: `1px solid ${C.line}`, borderRadius: 999, padding: 3 }}>
          {[["area", "Line"], ["candle", "Candles"]].map(([k, l]) => (
            <button key={k} onClick={() => setCtype(k)}
              style={{ border: "none", cursor: "pointer", fontFamily: font, fontWeight: 600, fontSize: 11, padding: "5px 10px", borderRadius: 999, background: ctype === k ? C.purple : "transparent", color: ctype === k ? C.onAccent : C.sub }}>
              {l}
            </button>
          ))}
        </div>
      </div>

      <Card style={{ padding: "12px 4px 4px", marginBottom: 12 }}>
        {chartLoad ? (
          <div style={{ padding: "8px 12px" }}><Sk h={200} r={12} /></div>
        ) : ctype === "area" ? (
          <ResponsiveContainer width="100%" height={210}>
            <AreaChart data={areaData} margin={{ top: 6, bottom: 0, left: 0, right: 6 }}>
              <defs>
                <linearGradient id="pg" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={C.purple} stopOpacity={0.35} />
                  <stop offset="100%" stopColor={C.purple} stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="i" hide />
              <YAxis hide domain={["auto", "auto"]} />
              <Tooltip content={<Toolt />} />
              {forecast && <Area dataKey="band" stroke="none" fill={C.purpleTint} fillOpacity={0.4} isAnimationActive animationDuration={800} />}
              {forecast && <Line dataKey="med" stroke={C.purpleDark} strokeDasharray="5 4" strokeWidth={2} dot={false} isAnimationActive animationDuration={800} />}
              <Area type="monotone" dataKey="v" stroke={C.purple} strokeWidth={2.5} fill="url(#pg)" dot={false} isAnimationActive animationDuration={900} />
              {forecast && <ReferenceLine x={areaData.findIndex((d) => d.v === null) - 1} stroke={C.sub} strokeDasharray="3 3" />}
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <>
            <ResponsiveContainer width="100%" height={180}>
              <ComposedChart data={candles} margin={{ top: 6, bottom: 0, left: 0, right: 6 }}>
                <XAxis dataKey="i" hide />
                <YAxis hide domain={["dataMin", "dataMax"]} />
                <Bar dataKey={(d) => [d.l, d.h]} shape={<CandleShape up={C.mint} dn={C.coral} />} isAnimationActive animationDuration={700} />
              </ComposedChart>
            </ResponsiveContainer>
            <ResponsiveContainer width="100%" height={44}>
              <ComposedChart data={candles} margin={{ top: 2, bottom: 0, left: 0, right: 6 }}>
                <XAxis dataKey="i" hide />
                <YAxis hide domain={[0, "dataMax"]} />
                <Bar dataKey="vol" isAnimationActive animationDuration={700} radius={[2, 2, 0, 0]}>
                  {candles.map((d, i) => (
                    <Cell key={i} fill={d.c >= d.o ? C.mint : C.coral} fillOpacity={0.45} />
                  ))}
                </Bar>
              </ComposedChart>
            </ResponsiveContainer>
            <div style={{ fontSize: 11, color: C.sub, textAlign: "center", paddingBottom: 4 }}>OHLC with volume · last {candles.length} sessions</div>
          </>
        )}
        {ctype === "area" && (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "4px 10px 8px" }}>
            <div style={{ fontSize: 11, color: C.sub }}>{forecast ? "Shaded area shows an 80% confidence band, next 30 days" : "Historical close price"}</div>
            <button onClick={() => setForecast(!forecast)}
              style={{ border: "none", cursor: "pointer", fontFamily: font, fontWeight: 600, fontSize: 12, padding: "7px 12px", borderRadius: 999, background: forecast ? C.purpleDark : C.soft, color: forecast ? C.card : C.purpleDark, display: "flex", gap: 6, alignItems: "center" }}>
              <Sparkles size={13} /> Forecast
            </button>
          </div>
        )}
      </Card>

      <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
        <Card style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Gauge score={s.score} />
        </Card>
        <Card style={{ flex: 1.15 }}>
          <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 8, display: "flex", gap: 6, alignItems: "center", color: C.ink }}>
            <ShieldCheck size={15} color={C.purple} /> Why this score
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {reasons(s).map((r, i) => (
              <div key={i} style={{ fontSize: 12, color: C.ink, background: C.softer, borderRadius: 10, padding: "6px 9px" }}>{r}</div>
            ))}
          </div>
        </Card>
      </div>

      <Card style={{ marginBottom: 12 }}>
        <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 8, display: "flex", gap: 6, alignItems: "center", color: C.ink }}>
          <Newspaper size={15} color={C.purple} /> Latest signals
        </div>
        {news.map((n, i) => (
          <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, padding: "8px 0", borderTop: i ? `1px solid ${C.softer}` : "none" }}>
            <div>
              <div style={{ fontSize: 13, color: C.ink }}>{n.t}</div>
              <div style={{ fontSize: 11, color: C.sub }}>{n.d}d ago · simulated feed</div>
            </div>
            <Chip color={n.sn === "pos" ? C.mint : C.coral} bg={n.sn === "pos" ? C.mintBg : C.coralBg}>
              {n.sn === "pos" ? "Positive" : "Negative"}
            </Chip>
          </div>
        ))}
      </Card>

      <Card style={{ marginBottom: 12 }}>
        <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 4, display: "flex", gap: 6, alignItems: "center", color: C.ink }}>
          <Clock3 size={15} color={C.purple} /> Time machine
        </div>
        <div style={{ fontSize: 12, color: C.sub, marginBottom: 10 }}>If you had invested ₹10,000 in {s.sym}…</div>
        <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
          {[1, 3, 5].map((y) => (
            <PillBtn key={y} active={tmYears === y} onClick={() => setTmYears(y)} style={{ background: tmYears === y ? C.purple : C.soft }}>{y} yr ago</PillBtn>
          ))}
        </div>
        <div style={{ fontSize: 26, fontWeight: 700, fontVariantNumeric: "tabular-nums", color: tmValue >= 10000 ? C.mint : C.coral }}>{inr(tmValue)}</div>
        <div style={{ fontSize: 12, color: C.sub }}>today · {pct(((tmValue - 10000) / 10000) * 100)} total return</div>
      </Card>

      <Card>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <div style={{ fontWeight: 700, fontSize: 13, color: C.ink }}>Paper trade</div>
          <div style={{ fontSize: 12, color: C.sub }}>You hold {held} · Cash {big(cash)}</div>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", background: C.soft, borderRadius: 999 }}>
            <button onClick={() => setQty(Math.max(1, qty - 1))} style={{ border: "none", background: "none", fontSize: 18, width: 34, height: 38, cursor: "pointer", color: C.purpleDark, fontWeight: 700 }}>−</button>
            <div style={{ fontWeight: 700, width: 28, textAlign: "center", color: C.ink }}>{qty}</div>
            <button onClick={() => setQty(qty + 1)} style={{ border: "none", background: "none", fontSize: 18, width: 34, height: 38, cursor: "pointer", color: C.purpleDark, fontWeight: 700 }}>+</button>
          </div>
          <button onClick={() => trade(s.sym, qty, s.last, "buy")} disabled={cash < qty * s.last}
            style={{ flex: 1, border: "none", cursor: "pointer", fontFamily: font, fontWeight: 700, fontSize: 14, padding: "12px 0", borderRadius: 12, background: cash < qty * s.last ? C.purpleTint : C.purple, color: C.onAccent }}>
            Buy · {inr(qty * s.last)}
          </button>
          <button onClick={() => trade(s.sym, qty, s.last, "sell")} disabled={held < qty}
            style={{ flex: 0.7, border: "none", cursor: "pointer", fontFamily: font, fontWeight: 700, fontSize: 14, padding: "12px 0", borderRadius: 12, background: held < qty ? C.softer : C.card, color: held < qty ? C.sub : C.purpleDark, boxShadow: held < qty ? "none" : "0 0 0 1.5px " + C.purpleTint }}>
            Sell
          </button>
        </div>
      </Card>
    </div>
  );
}

function InvestScreen({ go }) {
  const C = useTheme();
  const ranked = [...MARKET].sort((a, b) => b.score - a.score).slice(0, 5);
  return (
    <div>
      <div style={{ fontWeight: 700, fontSize: 20, marginBottom: 2, color: C.ink }}>Weekly picks</div>
      <div style={{ fontSize: 13, color: C.sub, marginBottom: 14 }}>Ranked by safety score from last week's NSE data. Every pick explains itself.</div>
      {ranked.map((s, i) => {
        const [lab, col, bg] = riskLabel(C, s.score);
        return (
          <Card key={s.sym} onClick={() => go("detail", s)} style={{ marginBottom: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 30, height: 30, borderRadius: 999, background: C.soft, color: C.purpleDark, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 13 }}>{i + 1}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, color: C.ink }}>{s.sym}</div>
                <div style={{ fontSize: 12, color: C.sub }}>{s.name}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontWeight: 700, color: C.ink }}>{s.score}<span style={{ fontSize: 11, color: C.sub }}>/100</span></div>
                <Chip color={col} bg={bg}>{lab}</Chip>
              </div>
            </div>
            <div style={{ height: 8, background: C.softer, borderRadius: 999, margin: "10px 0" }}>
              <div style={{ height: 8, width: `${s.score}%`, background: col, borderRadius: 999, transition: "width 900ms cubic-bezier(.2,.8,.2,1)" }} />
            </div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {reasons(s).slice(0, 3).map((r, j) => (
                <span key={j} style={{ fontSize: 11, color: C.purpleDark, background: C.soft, borderRadius: 999, padding: "4px 9px" }}>{r}</span>
              ))}
            </div>
          </Card>
        );
      })}
      <div style={{ fontSize: 11, color: C.sub, textAlign: "center", padding: "4px 16px" }}>
        Educational analysis, not investment advice. Markets carry risk. Read all scheme documents carefully.
      </div>
    </div>
  );
}

function PortfolioScreen({ cash, holdings, txns, realized, go }) {
  const C = useTheme();
  const rows = Object.entries(holdings).map(([sym, h]) => {
    const st = MARKET.find((m) => m.sym === sym);
    return { st, h, value: st.last * h.qty, pl: (st.last - h.avg) * h.qty };
  });
  const invested = rows.reduce((a, r) => a + r.value, 0);
  const unreal = rows.reduce((a, r) => a + r.pl, 0);
  const total = cash + invested;
  const bySector = {};
  rows.forEach((r) => { bySector[r.st.sector] = (bySector[r.st.sector] || 0) + r.value; });
  const pie = Object.entries(bySector).map(([name, value]) => ({ name, value }));

  return (
    <div>
      <div style={{ fontWeight: 700, fontSize: 20, marginBottom: 2, color: C.ink }}>Portfolio</div>
      <div style={{ fontSize: 13, color: C.sub, marginBottom: 14 }}>Paper wallet performance, risk and history.</div>

      <Card style={{ marginBottom: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
          <div>
            <div style={{ fontSize: 12, color: C.sub }}>Total value</div>
            <div style={{ fontSize: 26, fontWeight: 700, fontVariantNumeric: "tabular-nums", color: C.ink }}>{big(Math.round(total))}</div>
          </div>
          <div style={{ textAlign: "right", fontSize: 12, color: C.sub, lineHeight: 1.8 }}>
            Cash <b style={{ color: C.ink }}>{big(cash)}</b><br />
            Invested <b style={{ color: C.ink }}>{big(Math.round(invested))}</b>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Chip color={unreal >= 0 ? C.mint : C.coral} bg={unreal >= 0 ? C.mintBg : C.coralBg}>Unrealized {(unreal >= 0 ? "+" : "") + inr(Math.round(unreal))}</Chip>
          <Chip color={realized >= 0 ? C.mint : C.coral} bg={realized >= 0 ? C.mintBg : C.coralBg}>Realized {(realized >= 0 ? "+" : "") + inr(Math.round(realized))}</Chip>
        </div>
      </Card>

      {rows.length > 0 ? (
        <>
          <Card style={{ marginBottom: 12 }}>
            <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 4, display: "flex", gap: 6, alignItems: "center", color: C.ink }}>
              <PieIcon size={15} color={C.purple} /> Sector concentration
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <PieChart width={140} height={140}>
                <Pie data={pie} dataKey="value" nameKey="name" innerRadius={38} outerRadius={62} paddingAngle={3} isAnimationActive animationDuration={800}>
                  {pie.map((p, i) => <Cell key={i} fill={SECTOR_HUE[p.name] || C.purple} />)}
                </Pie>
              </PieChart>
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
                {pie.map((p, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                    <span style={{ color: C.sub, display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ width: 8, height: 8, borderRadius: 99, background: SECTOR_HUE[p.name] || C.purple, display: "inline-block" }} />{p.name}
                    </span>
                    <b style={{ color: C.ink }}>{((p.value / invested) * 100).toFixed(0)}%</b>
                  </div>
                ))}
                {pie.length === 1 && <div style={{ fontSize: 11, color: C.amber }}>All eggs in one sector. Consider diversifying.</div>}
              </div>
            </div>
          </Card>

          <SectionLabel>Holdings</SectionLabel>
          <Card style={{ padding: 6, marginBottom: 12 }}>
            {rows.map((r, i) => {
              const beats = r.st.mom30 - IDX[0].mom30 >= 0;
              return (
                <div key={r.st.sym} onClick={() => go("detail", r.st)}
                  style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 10px", borderTop: i ? `1px solid ${C.softer}` : "none", cursor: "pointer" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 14, color: C.ink }}>{r.st.sym}</div>
                    <div style={{ fontSize: 12, color: C.sub }}>{r.h.qty} @ avg {inr(r.h.avg, 2)}</div>
                  </div>
                  <Chip color={beats ? C.mint : C.coral} bg={beats ? C.mintBg : C.coralBg}>{beats ? "Beats" : "Lags"} Nifty</Chip>
                  <div style={{ textAlign: "right", width: 90 }}>
                    <div style={{ fontWeight: 700, fontSize: 13, fontVariantNumeric: "tabular-nums", color: C.ink }}>{inr(r.value)}</div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: r.pl >= 0 ? C.mint : C.coral }}>{(r.pl >= 0 ? "+" : "") + inr(Math.round(r.pl))}</div>
                  </div>
                </div>
              );
            })}
          </Card>
        </>
      ) : (
        <Card style={{ textAlign: "center", padding: 26, marginBottom: 12 }}>
          <div style={{ fontSize: 13, color: C.sub }}>No holdings yet. Find a stock on Home and place your first paper trade.</div>
        </Card>
      )}

      <SectionLabel>Transactions</SectionLabel>
      <Card style={{ padding: 6 }}>
        {txns.length === 0 && <div style={{ padding: 20, textAlign: "center", fontSize: 13, color: C.sub }}>Your buys and sells will appear here.</div>}
        {txns.slice(0, 8).map((t, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 10px", borderTop: i ? `1px solid ${C.softer}` : "none" }}>
            <History size={15} color={C.sub} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: C.ink }}>
                <span style={{ color: t.side === "buy" ? C.mint : C.coral }}>{t.side === "buy" ? "Bought" : "Sold"}</span> {t.qty} × {t.sym}
              </div>
              <div style={{ fontSize: 11, color: C.sub }}>{t.time}</div>
            </div>
            <div style={{ fontWeight: 700, fontSize: 13, fontVariantNumeric: "tabular-nums", color: C.ink }}>{inr(t.qty * t.price)}</div>
          </div>
        ))}
      </Card>
    </div>
  );
}

function SimulateScreen() {
  const C = useTheme();
  const [mode, setMode] = useState("pl");
  const [sym, setSym] = useState("RELIANCE");
  const s = MARKET.find((m) => m.sym === sym);
  const [qty, setQty] = useState(10);
  const [buyAt, setBuyAt] = useState(Math.round(s.last * 0.97));
  const [months, setMonths] = useState(6);
  useEffect(() => setBuyAt(Math.round(s.last * 0.97)), [sym]);

  const scen = useMemo(() => {
    const pts = [];
    for (let m = 0; m <= months; m++) {
      const d = m * 30;
      const base = s.last * Math.exp((s.mu - 0.5 * s.sig ** 2) * d);
      const w = s.sig * Math.sqrt(d);
      pts.push({ m, bull: base * Math.exp(0.9 * w) * qty, base: base * qty, bear: base * Math.exp(-0.9 * w) * qty });
    }
    return pts;
  }, [sym, qty, months, s]);
  const cost = qty * buyAt;
  const end = scen[scen.length - 1];
  const plBase = end.base - cost, plBull = end.bull - cost, plBear = end.bear - cost;
  const animPL = useCountUp(Math.round(plBase));
  const action =
    plBear > 0 ? ["Comfortable hold", "Even the bear case stays profitable at this horizon.", C.mint, C.mintBg]
    : plBase > cost * 0.08 ? ["Hold with a stop-loss", "Base case looks healthy, but protect the downside near your buy price.", C.amber, C.amberBg]
    : plBase < -cost * 0.05 ? ["Review this position", "Base case projects a loss. Consider trimming, or average down only with conviction.", C.coral, C.coralBg]
    : ["Watch and wait", "Projections are near breakeven. Let the trend confirm before adding.", C.amber, C.amberBg];

  const [sip, setSip] = useState(5000);
  const [sipYears, setSipYears] = useState(10);
  const [idx, setIdxSel] = useState("NIFTY 50");
  const ix = IDX.find((x) => x.sym === idx);
  const sipData = useMemo(() => {
    const cagr = Math.pow(ix.series[ix.series.length - 1] / ix.series[0], 1 / 5) - 1;
    const r = Math.pow(1 + cagr, 1 / 12) - 1;
    let v = 0; const pts = [];
    for (let m = 0; m <= sipYears * 12; m++) {
      if (m) v = v * (1 + r) + sip;
      if (m % 12 === 0) pts.push({ y: m / 12, invested: sip * m, value: Math.round(v) });
    }
    return { pts, cagr };
  }, [sip, sipYears, idx]);
  const sipEnd = sipData.pts[sipData.pts.length - 1];
  const sipVal = useCountUp(sipEnd.value);

  const Slider = ({ v, set, min, max, step = 1 }) => (
    <input type="range" min={min} max={max} step={step} value={v} onChange={(e) => set(+e.target.value)} style={{ width: "100%" }} />
  );

  return (
    <div>
      <div style={{ display: "flex", background: C.card, borderRadius: 999, padding: 4, marginBottom: 14, border: `1px solid ${C.line}` }}>
        {[["pl", "Position P/L"], ["sip", "SIP simulator"]].map(([k, l]) => (
          <button key={k} onClick={() => setMode(k)}
            style={{ flex: 1, border: "none", cursor: "pointer", fontFamily: font, fontWeight: 600, fontSize: 13, padding: "10px 0", borderRadius: 999, background: mode === k ? C.purple : "transparent", color: mode === k ? C.onAccent : C.sub }}>
            {l}
          </button>
        ))}
      </div>

      {mode === "pl" ? (
        <>
          <Card style={{ marginBottom: 12 }}>
            <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 8, color: C.ink }}>Your position</div>
            <select value={sym} onChange={(e) => setSym(e.target.value)} aria-label="Choose stock"
              style={{ width: "100%", fontFamily: font, fontSize: 14, fontWeight: 600, color: C.ink, background: C.softer, border: `1px solid ${C.line}`, borderRadius: 12, padding: "10px 12px", marginBottom: 12 }}>
              {MARKET.map((m) => (
                <option key={m.sym} value={m.sym}>{m.sym} · {m.name}</option>
              ))}
            </select>
            <div style={{ display: "flex", gap: 14 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, color: C.sub }}>Quantity · <b style={{ color: C.ink }}>{qty}</b></div>
                <Slider v={qty} set={setQty} min={1} max={100} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, color: C.sub }}>Bought at · <b style={{ color: C.ink }}>{inr(buyAt)}</b></div>
                <Slider v={buyAt} set={setBuyAt} min={Math.round(s.last * 0.6)} max={Math.round(s.last * 1.3)} />
              </div>
            </div>
            <div style={{ fontSize: 12, color: C.sub, marginTop: 6 }}>Horizon · <b style={{ color: C.ink }}>{months} months</b></div>
            <Slider v={months} set={setMonths} min={1} max={24} />
          </Card>

          <Card style={{ marginBottom: 12, padding: "12px 4px 6px" }}>
            <ResponsiveContainer width="100%" height={190}>
              <LineChart data={scen} margin={{ top: 6, bottom: 0, left: 0, right: 8 }}>
                <XAxis dataKey="m" hide />
                <YAxis hide domain={["auto", "auto"]} />
                <Tooltip content={<Toolt />} />
                <ReferenceLine y={cost} stroke={C.sub} strokeDasharray="4 4" />
                <Line type="monotone" dataKey="bull" stroke={C.mint} strokeWidth={2} dot={false} isAnimationActive animationDuration={800} />
                <Line type="monotone" dataKey="base" stroke={C.purple} strokeWidth={2.5} dot={false} isAnimationActive animationDuration={800} />
                <Line type="monotone" dataKey="bear" stroke={C.coral} strokeWidth={2} dot={false} isAnimationActive animationDuration={800} />
              </LineChart>
            </ResponsiveContainer>
            <div style={{ display: "flex", gap: 12, justifyContent: "center", fontSize: 11, color: C.sub, paddingBottom: 6 }}>
              <span style={{ color: C.mint, fontWeight: 700 }}>bull</span>
              <span style={{ color: C.purple, fontWeight: 700 }}>base</span>
              <span style={{ color: C.coral, fontWeight: 700 }}>bear</span>
              <span>┄ your cost {inr(cost)}</span>
            </div>
          </Card>

          <Card style={{ background: action[3], marginBottom: 12, border: "none" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontWeight: 700, color: action[2] }}>{action[0]}</div>
                <div style={{ fontSize: 12, color: C.ink, maxWidth: 230 }}>{action[1]}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 12, color: C.sub }}>Base-case P/L</div>
                <div style={{ fontSize: 22, fontWeight: 700, fontVariantNumeric: "tabular-nums", color: animPL >= 0 ? C.mint : C.coral }}>{(animPL >= 0 ? "+" : "") + inr(animPL)}</div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
              <Chip color={C.mint} bg={C.card}>Bull {(plBull >= 0 ? "+" : "") + inr(plBull)}</Chip>
              <Chip color={C.coral} bg={C.card}>Bear {(plBear >= 0 ? "+" : "") + inr(plBear)}</Chip>
            </div>
          </Card>
        </>
      ) : (
        <>
          <Card style={{ marginBottom: 12 }}>
            <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
              {IDX.map((x) => (
                <PillBtn key={x.sym} active={idx === x.sym} onClick={() => setIdxSel(x.sym)} style={{ background: idx === x.sym ? C.purple : C.soft }}>{x.sym}</PillBtn>
              ))}
            </div>
            <div style={{ fontSize: 12, color: C.sub }}>Monthly SIP · <b style={{ color: C.ink }}>{inr(sip)}</b></div>
            <Slider v={sip} set={setSip} min={500} max={50000} step={500} />
            <div style={{ fontSize: 12, color: C.sub, marginTop: 6 }}>Duration · <b style={{ color: C.ink }}>{sipYears} years</b></div>
            <Slider v={sipYears} set={setSipYears} min={1} max={30} />
          </Card>
          <Card style={{ marginBottom: 12, padding: "12px 4px 6px" }}>
            <ResponsiveContainer width="100%" height={190}>
              <AreaChart data={sipData.pts} margin={{ top: 6, bottom: 0, left: 0, right: 8 }}>
                <defs>
                  <linearGradient id="sipg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={C.purple} stopOpacity={0.35} />
                    <stop offset="100%" stopColor={C.purple} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="y" hide />
                <YAxis hide domain={[0, "auto"]} />
                <Tooltip content={<Toolt />} />
                <Area type="monotone" dataKey="invested" stroke={C.sub} strokeDasharray="4 4" strokeWidth={1.5} fill="none" dot={false} isAnimationActive animationDuration={800} />
                <Area type="monotone" dataKey="value" stroke={C.purple} strokeWidth={2.5} fill="url(#sipg)" dot={false} isAnimationActive animationDuration={900} />
              </AreaChart>
            </ResponsiveContainer>
            <div style={{ textAlign: "center", paddingBottom: 8 }}>
              <div style={{ fontSize: 12, color: C.sub }}>Projected value at {(sipData.cagr * 100).toFixed(1)}% historical CAGR</div>
              <div style={{ fontSize: 26, fontWeight: 700, fontVariantNumeric: "tabular-nums", color: C.purpleDark }}>{big(sipVal)}</div>
              <div style={{ fontSize: 12, color: C.sub }}>vs {big(sipEnd.invested)} invested · gain <b style={{ color: C.mint }}>{big(sipEnd.value - sipEnd.invested)}</b></div>
            </div>
          </Card>
        </>
      )}
      <div style={{ fontSize: 11, color: C.sub, textAlign: "center", padding: "0 16px" }}>
        Projections use simplified statistical models for learning purposes, not advice.
      </div>
    </div>
  );
}

function LearnScreen() {
  const C = useTheme();
  const [open, setOpen] = useState(0);
  const [ans, setAns] = useState({});
  const modules = [
    { t: "How this app works", b: "Prices refresh daily after NSE close. The safety score blends volatility (how much a price swings), drawdown (worst recent dip), and momentum (recent trend). The forecast cone shows a range of likely paths, not a guarantee. A wider cone means more uncertainty." },
    { t: "Stocks vs mutual funds vs index", b: "A stock is one company. A mutual fund pools money across many. Nifty 50 and Sensex are indices: baskets of top companies used as a market thermometer. Beginners often start with index SIPs because a single company can fail, but the whole market rarely does." },
    { t: "What is volatility?", b: "Volatility measures how wildly a price moves day to day. A stock swinging 2% daily can gain fast but also fall fast. Lower volatility usually means a steadier ride, and that is why it is the biggest input in our safety score." },
    { t: "Reading candlesticks", b: "Each candle shows one session: the thick body spans open to close, the thin wick spans low to high. Green means the price closed higher than it opened, red means lower. The volume bars underneath show how much trading backed the move." },
    { t: "SIP and compounding", b: "A SIP invests a fixed amount every month, buying more units when prices dip and fewer when they rise. Over years, returns earn returns. That snowball effect is compounding. Try the SIP simulator to see how ₹5,000 a month behaves over a decade." },
  ];
  const quiz = [
    { q: "A wider forecast cone means…", opts: ["Higher guaranteed returns", "More uncertainty ahead", "The stock will fall"], a: 1 },
    { q: "A green candlestick means…", opts: ["Close was above open", "Volume was high", "The stock pays dividends"], a: 0 },
    { q: "A high safety score mainly reflects…", opts: ["Low volatility and shallow drawdowns", "A famous brand name", "A cheap share price"], a: 0 },
  ];
  const correct = quiz.filter((x, i) => ans[i] === x.a).length;
  const done = Object.keys(ans).length === quiz.length;
  return (
    <div>
      <div style={{ fontWeight: 700, fontSize: 20, marginBottom: 2, color: C.ink }}>Learn</div>
      <div style={{ fontSize: 13, color: C.sub, marginBottom: 14 }}>Five minutes here makes every chart make sense.</div>
      {modules.map((m, i) => (
        <Card key={i} onClick={() => setOpen(open === i ? -1 : i)} style={{ marginBottom: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: C.ink }}>{m.t}</div>
            <div style={{ color: C.purple, fontWeight: 700 }}>{open === i ? "−" : "+"}</div>
          </div>
          {open === i && <div style={{ fontSize: 13, color: C.sub, marginTop: 8, lineHeight: 1.55 }}>{m.b}</div>}
        </Card>
      ))}

      <div style={{ fontWeight: 700, margin: "16px 0 10px", display: "flex", gap: 8, alignItems: "center", color: C.ink }}>
        <Award size={17} color={C.purple} /> Quick quiz
      </div>
      {quiz.map((x, i) => (
        <Card key={i} style={{ marginBottom: 10 }}>
          <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 8, color: C.ink }}>{i + 1}. {x.q}</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {x.opts.map((o, j) => {
              const picked = ans[i] === j;
              const isRight = j === x.a;
              const show = ans[i] !== undefined;
              return (
                <button key={j} onClick={() => setAns({ ...ans, [i]: j })}
                  style={{ textAlign: "left", border: "none", cursor: "pointer", fontFamily: font, fontSize: 13, padding: "9px 12px", borderRadius: 12, display: "flex", justifyContent: "space-between", alignItems: "center",
                    background: show && picked ? (isRight ? C.mintBg : C.coralBg) : C.softer,
                    color: show && picked ? (isRight ? C.mint : C.coral) : C.ink, fontWeight: picked ? 700 : 500 }}>
                  {o}
                  {show && picked && (isRight ? <CheckCircle2 size={16} /> : <XCircle size={16} />)}
                </button>
              );
            })}
          </div>
        </Card>
      ))}
      {done && (
        <Card style={{ background: correct === 3 ? C.mintBg : C.soft, textAlign: "center", border: "none" }}>
          <div style={{ fontSize: 26 }}>{correct === 3 ? "🏅" : "📚"}</div>
          <div style={{ fontWeight: 700, color: correct === 3 ? C.mint : C.purpleDark }}>
            {correct === 3 ? "Smart Investor badge unlocked!" : `${correct}/3 correct. Tap answers to retry.`}
          </div>
        </Card>
      )}
    </div>
  );
}

/* ================= app shell ================= */
export default function App() {
  const [dark, setDark] = useState(false);
  const C = useMemo(() => makeTheme(dark), [dark]);
  const [tab, setTab] = useState("home");
  const [detail, setDetail] = useState(null);
  const [cash, setCash] = useState(100000);
  const [holdings, setHoldings] = useState({});
  const [watch, setWatch] = useState(["TCS", "HDFCBANK"]);
  const [txns, setTxns] = useState([]);
  const [realized, setRealized] = useState(0);

  const toggleWatch = (sym) =>
    setWatch((w) => (w.includes(sym) ? w.filter((x) => x !== sym) : [...w, sym]));

  const trade = (sym, qty, price, side) => {
    const time = new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) + " today";
    if (side === "buy") {
      if (cash < qty * price) return;
      setCash(cash - qty * price);
      setHoldings((h) => {
        const cur = h[sym] || { qty: 0, avg: 0 };
        const nq = cur.qty + qty;
        return { ...h, [sym]: { qty: nq, avg: (cur.avg * cur.qty + price * qty) / nq } };
      });
      setTxns((t) => [{ sym, qty, price, side, time }, ...t]);
    } else {
      const cur = holdings[sym];
      if (!cur || cur.qty < qty) return;
      setCash(cash + qty * price);
      setRealized((r) => r + (price - cur.avg) * qty);
      setHoldings((h) => {
        const nq = cur.qty - qty;
        const nh = { ...h };
        if (nq === 0) delete nh[sym]; else nh[sym] = { ...cur, qty: nq };
        return nh;
      });
      setTxns((t) => [{ sym, qty, price, side, time }, ...t]);
    }
  };
  const portfolio = useMemo(() => {
    let inv = 0;
    for (const [sym, h] of Object.entries(holdings)) inv += MARKET.find((m) => m.sym === sym).last * h.qty;
    return { invested: inv, total: cash + inv };
  }, [cash, holdings]);

  const go = (screen, stock) => { setDetail(stock); setTab(screen); };
  const tabs = [
    ["home", Home, "Home"],
    ["invest", TrendingUp, "Picks"],
    ["simulate", Calculator, "Simulate"],
    ["portfolio", Wallet, "Portfolio"],
    ["learn", BookOpen, "Learn"],
  ];

  return (
    <ThemeCtx.Provider value={C}>
      <GlobalStyle C={C} />
      <div style={{ minHeight: "100vh", background: C.page, fontFamily: font, color: C.ink, display: "flex", justifyContent: "center", padding: "18px 10px" }}>
        <div style={{ width: "100%", maxWidth: 430 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 6px 12px" }}>
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <div style={{ width: 38, height: 38, borderRadius: 12, background: C.purple, color: C.onAccent, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 16 }}>N</div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 16, letterSpacing: -0.2 }}>NiveshIQ</div>
                <div style={{ fontSize: 11, color: C.sub }}>NSE · BSE markets</div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => setDark(!dark)} aria-label="Toggle dark mode"
                style={{ width: 38, height: 38, borderRadius: 999, background: C.card, border: `1px solid ${C.line}`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                {dark ? <Sun size={16} color={C.amber} /> : <Moon size={16} color={C.purpleDark} />}
              </button>
              <div style={{ width: 38, height: 38, borderRadius: 999, background: C.card, border: `1px solid ${C.line}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Bell size={16} color={C.purpleDark} />
              </div>
            </div>
          </div>

          <div style={{ background: C.shell, borderRadius: 28, padding: "18px 16px 92px", position: "relative", minHeight: "88vh", backdropFilter: "blur(6px)" }}>
            {tab === "home" && <HomeScreen go={go} cash={cash} holdings={holdings} portfolio={portfolio} watch={watch} />}
            {tab === "detail" && detail && <DetailScreen stock={MARKET.find((m) => m.sym === detail.sym)} back={() => setTab("home")} cash={cash} holdings={holdings} trade={trade} watch={watch} toggleWatch={toggleWatch} />}
            {tab === "invest" && <InvestScreen go={go} />}
            {tab === "simulate" && <SimulateScreen />}
            {tab === "portfolio" && <PortfolioScreen cash={cash} holdings={holdings} txns={txns} realized={realized} go={go} />}
            {tab === "learn" && <LearnScreen />}

            <div style={{ position: "absolute", left: 16, right: 16, bottom: 14, background: C.card, borderRadius: 20, display: "flex", justifyContent: "space-around", padding: "9px 4px", border: `1px solid ${C.line}`, boxShadow: dark ? "0 10px 30px rgba(0,0,0,0.4)" : "0 10px 30px rgba(79,50,184,0.14)" }}>
              {tabs.map(([k, Icon, label]) => {
                const active = tab === k || (k === "home" && tab === "detail");
                return (
                  <button key={k} onClick={() => setTab(k)}
                    style={{ border: "none", background: active ? C.purple : "transparent", cursor: "pointer", borderRadius: 14, padding: "8px 12px", display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
                    <Icon size={18} color={active ? C.onAccent : C.sub} />
                    <span style={{ fontSize: 10, fontWeight: 600, color: active ? C.onAccent : C.sub, fontFamily: font }}>{label}</span>
                  </button>
                );
              })}
            </div>
          </div>
          <div style={{ textAlign: "center", fontSize: 11, color: C.sub, marginTop: 10 }}>
            Demo runs on simulated NSE style data. Connect the FastAPI backend for live prices.
          </div>
        </div>
      </div>
    </ThemeCtx.Provider>
  );
}
