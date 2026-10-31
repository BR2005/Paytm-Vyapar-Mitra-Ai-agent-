import { useEffect, useMemo, useState } from "react";
import {
  Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis
} from "recharts";

const money = value => `₹${Number(value || 0).toLocaleString("en-IN")}`;
const initialSummary = { receivedAmount: 0, successfulTransactions: 0, pendingAmount: 0, failedAmount: 0, customers: 0, averagePaymentAmount: 0 };
const fetchJson = async path => {
  const response = await fetch(path, { headers: { Accept: "application/json" } });
  if (!response.ok) throw new Error(`Request failed: ${response.status}`);
  return response.json();
};

function Card({ label, value, note, className = "" }) {
  return <article className={`card kpi ${className}`}><div className="kpi-label">{label}</div><div className="kpi-value">{value}</div><div className="kpi-note">{note}</div></article>;
}

function VoiceAssistant() {
  const [language, setLanguage] = useState("en-IN");
  const [listening, setListening] = useState(false);
  const [status, setStatus] = useState("Ready for a natural-language business question.");
  const [answer, setAnswer] = useState("");
  const [recognition, setRecognition] = useState(null);
  const ask = async question => {
    try {
      const summary = await fetchJson("/api/merchant/voice-summary");
      const data = {
        receivedToday: summary.today.amount_received,
        successfulTransactions: summary.today.successful_transactions,
        pendingAmount: summary.today.pending_amount,
        failedAmount: summary.today.failed_amount,
        customers: summary.today.customers,
        yesterdayReceived: summary.yesterday.amount_received
      };
      const q = question.toLowerCase();
      const reply = q.includes("pending") ? `Pending payments total ${money(data.pendingAmount)}.` :
        q.includes("yesterday") ? `Yesterday you received ${money(data.yesterdayReceived)}.` :
        q.includes("customer") ? `${data.customers} customers paid you today.` :
        q.includes("report") ? `Today you received ${money(data.receivedToday)} from ${data.successfulTransactions} successful payments. Pending payments are ${money(data.pendingAmount)} and failed payments are ${money(data.failedAmount)}.` :
        `You received ${money(data.receivedToday)} today from ${data.successfulTransactions} successful payments.`;
      setAnswer(reply);
      if ("speechSynthesis" in window) {
        const speech = new SpeechSynthesisUtterance(reply);
        speech.lang = language; speech.rate = 0.82; window.speechSynthesis.cancel(); window.speechSynthesis.speak(speech);
      }
    } catch (requestError) { setStatus(`Voice summary unavailable: ${requestError.message}`); }
  };
  const start = () => {
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognition) { setStatus("Use the configured Sarvam Voice Agent for phone-based voice support."); return; }
    const current = new Recognition();
    current.lang = language; current.interimResults = false;
    current.onstart = () => { setListening(true); setStatus("Listening… ask about your business."); };
    current.onresult = event => ask(event.results[0][0].transcript);
    current.onerror = () => setStatus("I could not hear that. Please try again.");
    current.onend = () => { setListening(false); setStatus("Ready for your next question."); setRecognition(null); };
    setRecognition(current); current.start();
  };
  return <section className="voice-assistant"><div className="voice-copy"><h2>VyaparMitra Voice</h2><p>Vanakkam! Welcome to VyaparMitra AI. I am your business companion. You can ask me anything about your business in your own language.</p><div className="voice-actions"><button className={`call-button ${listening ? "active" : ""}`} onClick={() => listening ? recognition?.stop() : start()}>{listening ? "■ Stop listening" : "☎ Call VyaparMitra Voice"}</button><select className="language-select" value={language} onChange={event => setLanguage(event.target.value)}><option value="en-IN">English</option><option value="hi-IN">हिन्दी</option><option value="ta-IN">தமிழ்</option><option value="te-IN">తెలుగు</option><option value="kn-IN">ಕನ್ನಡ</option><option value="ml-IN">മലയാളം</option></select></div><div className="voice-status">{status}</div></div><div className="voice-transcript"><small>VyaparMitra Voice</small><p>{answer || "Try: How much money did I receive today?"}</p><div className="data-source">Merchant-specific backend data</div></div></section>;
}

function App() {
  const [period, setPeriod] = useState("7d");
  const [analytics, setAnalytics] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [sortAsc, setSortAsc] = useState(false);

  const load = async () => {
    setLoading(true); setError("");
    try {
      const [nextAnalytics, nextTransactions] = await Promise.all([
        fetchJson(`/api/merchant/analytics?period=${period}`),
        fetchJson(`/api/merchant/transactions`)
      ]);
      setAnalytics(nextAnalytics); setTransactions(nextTransactions.transactions);
    } catch (requestError) { setError(`Unable to load merchant data: ${requestError.message}`); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, [period]);
  const generateReport = async () => {
    try { setReport(await fetchJson("/api/merchant/eod-report")); }
    catch (requestError) { setError(`Unable to generate report: ${requestError.message}`); }
  };
  const downloadReport = () => {
    if (!report) return;
    const text = ["VyaparMitra EOD Report", "Your Business. Your Language. Your AI.", "", ...Object.entries(report.metrics).map(([key, value]) => `${key}: ${typeof value === "number" ? money(value) : value}`), "", ...report.insights, ...report.recommendations].join("\n");
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([text], { type: "text/plain" }));
    link.download = "merchant-end-of-day-report.txt"; link.click(); URL.revokeObjectURL(link.href);
  };
  const data = analytics?.summary || initialSummary;
  const filteredTransactions = useMemo(() => transactions.filter(item => [item.id, item.status, item.method, item.customer_id].some(value => String(value).toLowerCase().includes(search.toLowerCase()))).sort((a, b) => sortAsc ? a.date.localeCompare(b.date) : b.date.localeCompare(a.date)), [transactions, search, sortAsc]);
  const receivedTrend = (analytics?.daily || []).map(item => ({ ...item, label: item.date.slice(5) }));
  const statusColors = { success: "#159570", pending: "#d97706", failed: "#d14343" };
  const peak = [...(analytics?.hourly || [])].sort((a, b) => b.successfulTransactions - a.successfulTransactions)[0];
  if (loading && !analytics) return <div className="loading-screen">Loading merchant intelligence…</div>;
  return <div className="shell">
    <aside className="sidebar"><div className="brand"><div className="brand-mark">V</div><span>VyaparMitra AI</span></div><div className="tagline">Your Business. Your Language. Your AI.</div><nav><a className="active" href="#overview">▦ <span>VyaparMitra Insights</span></a><a href="#analytics">⌁ <span>VyaparMitra Payments</span></a><a href="#customers">◉ <span>VyaparMitra Growth</span></a><a href="#transactions">◷ <span>Transactions</span></a></nav></aside>
    <main className="main">
      <header className="topbar"><div><div className="eyebrow">Saturday, 31 October 2026</div><h1>VyaparMitra Insights</h1><p className="product-description">AI-powered merchant intelligence for payments, performance and growth.</p></div><div className="header-actions"><span className="demo-badge">Demo data</span><button className="refresh" onClick={load}>↻ Refresh</button></div></header>
      {error && <div className="error-banner">{error}</div>}
      <VoiceAssistant />
      <section id="overview"><div className="section-heading"><h2>Business overview</h2><span>Successful payments are the only received-amount source</span></div><div className="kpis">
        <Card className="received" label="Amount Received Today" value={money(analytics?.today?.receivedAmount)} note="Successfully completed payments" /><Card className="success" label="Successful Transactions" value={analytics?.today?.successfulTransactions || 0} note="Completed payments" /><Card className="pending" label="Pending Payments" value={money(analytics?.today?.pendingAmount)} note={`${analytics?.today?.pendingTransactions || 0} awaiting payment`} /><Card className="failed" label="Failed Payments" value={money(analytics?.today?.failedAmount)} note={`${analytics?.today?.failedTransactions || 0} declined`} /><Card label="Total Customers" value={analytics?.today?.customers || 0} note="Customers with successful payments" /><Card label="Average Payment Amount" value={money(analytics?.today?.averagePaymentAmount)} note="Successful payments only" />
      </div></section>
      <section id="analytics" className="analytics-toolbar"><div className="tabs">{[["1d", "Today"], ["7d", "7 Days"], ["30d", "30 Days"]].map(([value, label]) => <button className={`tab ${period === value ? "active" : ""}`} onClick={() => setPeriod(value)} key={value}>{label}</button>)}<button className="tab" disabled>Custom Range</button></div><span>{loading ? "Refreshing…" : "Updated from backend transaction records"}</span></section>
      <section className="dashboard-grid">
        <article className="card panel chart-panel wide"><div className="section-heading"><h2>Amount received by day</h2><span>{period}</span></div><ResponsiveContainer width="100%" height={250}><LineChart data={receivedTrend}><CartesianGrid strokeDasharray="3 3" stroke="#edf0f5" /><XAxis dataKey="label" /><YAxis tickFormatter={value => `₹${value / 1000}k`} /><Tooltip formatter={value => money(value)} /><Line type="monotone" dataKey="receivedAmount" stroke="#2864dc" strokeWidth={3} dot={{ r: 4 }} /></LineChart></ResponsiveContainer></article>
        <article className="card panel chart-panel"><div className="section-heading"><h2>Status distribution</h2><span>Count</span></div><ResponsiveContainer width="100%" height={250}><PieChart><Pie data={analytics?.status || []} dataKey="count" nameKey="status" innerRadius={55} outerRadius={85}>{(analytics?.status || []).map(item => <Cell key={item.status} fill={statusColors[item.status]} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer><div className="chart-legend">{(analytics?.status || []).map(item => <span key={item.status}><i style={{ background: statusColors[item.status] }} />{item.status}: {item.count}</span>)}</div></article>
        <article className="card panel chart-panel"><div className="section-heading"><h2>Peak payment hours</h2><span>Successful payments</span></div><ResponsiveContainer width="100%" height={250}><BarChart data={analytics?.hourly || []}><CartesianGrid strokeDasharray="3 3" stroke="#edf0f5" /><XAxis dataKey="hour" /><YAxis allowDecimals={false} /><Tooltip /><Bar dataKey="successfulTransactions" fill="#159570" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer><p className="chart-note">{peak ? `Peak recorded hour: ${peak.hour} with ${peak.successfulTransactions} successful payments.` : "No hourly data available."}</p></article>
        <article className="card panel"><div className="section-heading"><h2>Today vs yesterday</h2><span>Received amount</span></div><div className="comparison"><div><small>Today</small><strong>{money(analytics?.today?.receivedAmount)}</strong></div><div><small>Yesterday</small><strong>{money(analytics?.yesterday?.receivedAmount)}</strong></div><div className="change">{analytics?.today?.receivedAmount >= analytics?.yesterday?.receivedAmount ? "↑" : "↓"} {Math.abs(Math.round((analytics?.today?.receivedAmount / (analytics?.yesterday?.receivedAmount || 1) - 1) * 100))}%</div></div><div className="section-heading report-subheading"><h2>Customer analytics</h2><span>Available from transaction records</span></div><div className="customer-stats"><b>New customers <strong>{analytics?.customerAnalytics?.newCustomers || 0}</strong></b><b>Returning <strong>{analytics?.customerAnalytics?.returningCustomers || 0}</strong></b><b>Repeat rate <strong>{analytics?.customerAnalytics?.repeatPercentage || 0}%</strong></b></div></article>
      </section>
      <section id="customers" className="card report insight-report"><div className="section-heading"><h2>AI Business Insights</h2><span>Evidence-based backend analysis</span></div><p>{analytics?.today?.receivedAmount >= analytics?.yesterday?.receivedAmount ? `Received amount increased by ${money(analytics.today.receivedAmount - analytics.yesterday.receivedAmount)} compared with yesterday.` : `Received amount decreased by ${money(analytics.yesterday.receivedAmount - analytics.today.receivedAmount)} compared with yesterday.`} {peak ? `The busiest recorded hour is ${peak.hour}.` : "There is not enough hourly data for a peak-hour conclusion."}</p><div className="insights"><div className="insight"><b>Observed behaviour</b>{analytics?.customerAnalytics?.returningCustomers ? `${analytics.customerAnalytics.returningCustomers} customers have repeat successful payments in this period.` : "No repeat-customer pattern is available in this period."}</div><div className="insight"><b>Recommendation for tomorrow</b>Follow up on pending payments and review activity during the busiest recorded hour.</div></div></section>
      <section className="card report eod"><div className="section-heading"><h2>VyaparMitra EOD</h2><div><button className="report-button" onClick={generateReport}>Generate report</button>{report && <button className="download-button" onClick={downloadReport}>Download</button>}</div></div>{report ? <><div className="report-summary">{[["Amount received", money(report.metrics.receivedAmount)], ["Successful payments", report.metrics.successfulTransactions], ["Pending / failed", `${money(report.metrics.pendingAmount)} / ${money(report.metrics.failedAmount)}`], ["Compared with yesterday", money(report.metrics.comparisonAmount)]].map(([label, value]) => <div className="report-stat" key={label}><small>{label}</small><strong>{value}</strong></div>)}</div><p>{report.insights.join(" ")}</p><div className="insights">{report.recommendations.map(item => <div className="insight" key={item}><b>Tomorrow</b>{item}</div>)}</div></> : <p>Generate a report from the same transaction data used by VyaparMitra Voice and the Sarvam business stats tool.</p>}</section>
      <section id="transactions" className="card panel transactions"><div className="section-heading"><h2>Recent transactions</h2><span>{filteredTransactions.length} records</span></div><div className="table-tools"><input value={search} onChange={event => setSearch(event.target.value)} placeholder="Search transaction, status or method" /><button className="tab" onClick={() => setSortAsc(value => !value)}>Sort {sortAsc ? "oldest" : "newest"}</button></div><div className="table-wrap"><table><thead><tr><th>Transaction ID</th><th>Date and time</th><th>Amount</th><th>Status</th><th>Method</th></tr></thead><tbody>{filteredTransactions.map(item => <tr key={item.id}><td>{item.id}</td><td>{new Date(item.date).toLocaleString("en-IN")}</td><td>{money(item.amount)}</td><td><span className={`status ${item.status}`}>{item.status}</span></td><td>{item.method || "—"}</td></tr>)}</tbody></table>{!filteredTransactions.length && <div className="empty-state">No transactions match your search.</div>}</div></section>
    </main>
  </div>;
}

export default App;
