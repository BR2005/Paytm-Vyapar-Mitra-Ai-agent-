const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());

const merchantId = "M001";
const today = "2026-10-31";
const day = (date, time, id, amount, status, method, customerId) => ({
  id, merchant_id: merchantId, date: `${date}T${time}:00+05:30`, amount,
  status, method, customer_id: customerId
});

// Demo transaction records are the single source for every dashboard and Sarvam response.
const transactions = [
  day(today, "09:12", "TXN-1001", 2500, "success", "UPI", "C-101"),
  day(today, "10:18", "TXN-1002", 1800, "success", "CARD", "C-102"),
  day(today, "11:42", "TXN-1003", 3200, "success", "UPI", "C-103"),
  day(today, "12:15", "TXN-1004", 4500, "success", "UPI", "C-101"),
  day(today, "12:44", "TXN-1005", 1200, "success", "WALLET", "C-104"),
  day(today, "13:20", "TXN-1006", 2800, "pending", "UPI", "C-105"),
  day(today, "19:08", "TXN-1007", 1500, "success", "UPI", "C-106"),
  day(today, "19:36", "TXN-1008", 1000, "failed", "CARD", "C-107"),
  day("2026-10-30", "09:30", "TXN-0991", 2200, "success", "UPI", "C-101"),
  day("2026-10-30", "12:05", "TXN-0992", 3800, "success", "CARD", "C-108"),
  day("2026-10-30", "15:18", "TXN-0993", 2600, "success", "UPI", "C-109"),
  day("2026-10-29", "11:11", "TXN-0981", 4100, "success", "UPI", "C-110"),
  day("2026-10-28", "14:25", "TXN-0971", 2900, "success", "WALLET", "C-111"),
  day("2026-10-27", "18:40", "TXN-0961", 3600, "success", "UPI", "C-112"),
  day("2026-10-26", "10:32", "TXN-0951", 2400, "success", "CARD", "C-113"),
  day("2026-10-25", "16:10", "TXN-0941", 3300, "success", "UPI", "C-114")
];

const merchantTransactions = req => transactions.filter(item =>
  item.merchant_id === (req.headers["x-merchant-id"] || req.query.merchant_id || merchantId)
);
const withinDays = (date, days) => {
  const end = new Date(`${today}T23:59:59+05:30`);
  const start = new Date(end);
  start.setDate(start.getDate() - days + 1);
  return date >= start && date <= end;
};
const aggregate = records => {
  const successful = records.filter(item => item.status === "success");
  const sum = status => records.filter(item => item.status === status).reduce((total, item) => total + item.amount, 0);
  const customers = new Set(successful.map(item => item.customer_id));
  return {
    receivedAmount: successful.reduce((total, item) => total + item.amount, 0),
    successfulTransactions: successful.length,
    pendingAmount: sum("pending"),
    pendingTransactions: records.filter(item => item.status === "pending").length,
    failedAmount: sum("failed"),
    failedTransactions: records.filter(item => item.status === "failed").length,
    customers: customers.size,
    averagePaymentAmount: successful.length ? Math.round(successful.reduce((total, item) => total + item.amount, 0) / successful.length) : 0
  };
};
const daily = records => Object.entries(records.reduce((result, item) => {
  const date = item.date.slice(0, 10);
  result[date] = result[date] || { date, receivedAmount: 0, successfulTransactions: 0 };
  if (item.status === "success") {
    result[date].receivedAmount += item.amount;
    result[date].successfulTransactions += 1;
  }
  return result;
}, {})).map(([, value]) => value).sort((a, b) => a.date.localeCompare(b.date));
const hourly = records => Object.entries(records.filter(item => item.status === "success").reduce((result, item) => {
  const hour = item.date.slice(11, 13);
  result[hour] = (result[hour] || 0) + 1;
  return result;
}, {})).map(([hour, count]) => ({ hour: `${hour}:00`, successfulTransactions: count })).sort((a, b) => a.hour.localeCompare(b.hour));

app.get("/", (req, res, next) => {
  if (process.env.NODE_ENV === "production") return next();
  res.json({ status: "VyaparMitra AI Merchant API is running", product: "VyaparMitra AI", tagline: "Your Business. Your Language. Your AI.", demoData: true });
});
app.get("/api/health", (req, res) => res.json({ status: "ok", demoData: true }));

app.get("/api/merchant/voice-summary", (req, res) => {
  const records = merchantTransactions(req);
  const current = aggregate(records.filter(item => item.date.startsWith(today)));
  const yesterday = aggregate(records.filter(item => item.date.startsWith("2026-10-30")));
  const weekly = aggregate(records.filter(item => withinDays(new Date(item.date), 7)));
  res.json({
    merchant_id: merchantId, demo_data: true, today: {
      date: today, amount_received: current.receivedAmount, successful_transactions: current.successfulTransactions,
      pending_transactions: current.pendingTransactions, failed_transactions: current.failedTransactions,
      pending_amount: current.pendingAmount, failed_amount: current.failedAmount, customers: current.customers
    },
    yesterday: { date: "2026-10-30", amount_received: yesterday.receivedAmount, successful_transactions: yesterday.successfulTransactions },
    weekly: { amount_received: weekly.receivedAmount, successful_transactions: weekly.successfulTransactions }
  });
});

app.get("/api/merchant/analytics", (req, res) => {
  const period = req.query.period || "7d";
  const days = period === "1d" ? 1 : period === "30d" ? 30 : period === "90d" ? 90 : 7;
  const records = merchantTransactions(req).filter(item => withinDays(new Date(item.date), days));
  const summary = aggregate(records);
  const todaySummary = aggregate(records.filter(item => item.date.startsWith(today)));
  const yesterdaySummary = aggregate(records.filter(item => item.date.startsWith("2026-10-30")));
  const status = ["success", "pending", "failed"].map(name => ({ status: name, count: records.filter(item => item.status === name).length, amount: records.filter(item => item.status === name).reduce((sum, item) => sum + item.amount, 0) }));
  const customers = [...new Set(records.filter(item => item.status === "success").map(item => item.customer_id))];
  const returning = customers.filter(customer => records.filter(item => item.customer_id === customer && item.status === "success").length > 1).length;
  const methods = ["UPI", "CARD", "WALLET"].map(method => ({
    method,
    count: records.filter(item => item.method === method && item.status === "success").length,
    amount: records.filter(item => item.method === method && item.status === "success").reduce((sum, item) => sum + item.amount, 0)
  }));
  res.json({
    demo_data: true, period, summary, today: todaySummary, yesterday: yesterdaySummary, daily: daily(records), hourly: hourly(records), status, methods,
    customerAnalytics: { newCustomers: customers.filter(customer => records.filter(item => item.customer_id === customer).length === 1).length, returningCustomers: returning, repeatPercentage: customers.length ? Math.round(returning / customers.length * 100) : 0 }
  });
});

app.get("/api/merchant/transactions", (req, res) => {
  const records = merchantTransactions(req);
  const query = String(req.query.search || "").toLowerCase();
  const filtered = records.filter(item => !query || [item.id, item.status, item.method, item.customer_id].some(value => value.toLowerCase().includes(query)));
  res.json({ demo_data: true, transactions: filtered.sort((a, b) => b.date.localeCompare(a.date)) });
});

app.get("/api/merchant/eod-report", (req, res) => {
  const records = merchantTransactions(req);
  const current = aggregate(records.filter(item => item.date.startsWith(today)));
  const yesterday = aggregate(records.filter(item => item.date.startsWith("2026-10-30")));
  const comparison = current.receivedAmount - yesterday.receivedAmount;
  res.json({
    demo_data: true, generated_at: new Date().toISOString(), metrics: { ...current, yesterdayReceivedAmount: yesterday.receivedAmount, comparisonAmount: comparison },
    insights: [`Received amount ${comparison >= 0 ? "increased" : "decreased"} by ₹${Math.abs(comparison).toLocaleString("en-IN")} versus yesterday.`, "Successful payment activity is concentrated in the available transaction records."],
    recommendations: ["Follow up on pending payments.", "Review payment activity during the busiest recorded hours."]
  });
});

const PORT = process.env.PORT || 3001;
const distPath = path.resolve(__dirname, "../dist");

if (process.env.NODE_ENV === "production") {
  app.use(express.static(distPath));
  app.use((req, res, next) => {
    if (req.path.startsWith("/api/")) return next();
    res.sendFile(path.join(distPath, "index.html"));
  });
}

app.listen(PORT, () => console.log(`VyaparMitra AI Merchant API running on port ${PORT}`));
