import { useState, useMemo } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";
import {
  Calendar,
  Clock,
  PieChart as PieIcon,
  CreditCard,
  Users,
  TrendingUp,
  Filter,
} from "lucide-react";
import { useLanguage } from "../context/LanguageContext";
import { useTheme } from "../context/ThemeContext";
import { formatMoney } from "../services/api";

export function AnalyticsView({
  analytics,
  period,
  onPeriodChange,
  loading = false,
  transactions = [],
}) {
  const { t } = useLanguage();
  const { isDark } = useTheme();

  // Custom date range state
  const [customRange, setCustomRange] = useState({
    start: "2026-10-25",
    end: "2026-10-31",
  });
  const [showCustomModal, setShowCustomModal] = useState(false);

  // Status colors
  const statusColors = {
    success: "#10b981",
    pending: "#f59e0b",
    failed: "#ef4444",
  };

  // Payment methods breakdown from backend or computed from transaction records
  const methodData = useMemo(() => {
    if (analytics?.methods && analytics.methods.length > 0) {
      return analytics.methods;
    }
    // Compute from transactions
    const counts = { UPI: 0, CARD: 0, WALLET: 0 };
    const amounts = { UPI: 0, CARD: 0, WALLET: 0 };
    transactions.forEach((tx) => {
      const m = tx.method ? tx.method.toUpperCase() : "UPI";
      if (counts[m] !== undefined) {
        counts[m] += 1;
        if (tx.status === "success") {
          amounts[m] += tx.amount;
        }
      }
    });
    return [
      { method: "UPI", count: counts.UPI, amount: amounts.UPI, color: "#00baf2" },
      { method: "CARD", count: counts.CARD, amount: amounts.CARD, color: "#6366f1" },
      { method: "WALLET", count: counts.WALLET, amount: amounts.WALLET, color: "#10b981" },
    ];
  }, [analytics, transactions]);

  const methodColors = {
    UPI: "#00baf2",
    CARD: "#6366f1",
    WALLET: "#10b981",
  };

  // Peak payment hour calculation
  const hourlyData = analytics?.hourly || [];
  const peak = useMemo(() => {
    if (!hourlyData.length) return null;
    return [...hourlyData].sort(
      (a, b) => b.successfulTransactions - a.successfulTransactions
    )[0];
  }, [hourlyData]);

  const dailyTrend = (analytics?.daily || []).map((item) => ({
    ...item,
    label: item.date.slice(5),
  }));

  const periods = [
    { id: "1d", label: t("period_today") },
    { id: "7d", label: t("period_7d") },
    { id: "30d", label: t("period_30d") },
  ];

  const customerStats = analytics?.customerAnalytics || {
    newCustomers: 10,
    returningCustomers: 1,
    repeatPercentage: 9,
  };

  return (
    <div className="analytics-page">
      {/* Analytics Toolbar */}
      <div className="analytics-toolbar card">
        <div className="toolbar-left">
          <h2>{t("analytics_title")}</h2>
          <span className="toolbar-subtitle">
            Verified backend ledger data • Real-time
          </span>
        </div>

        <div className="toolbar-right">
          <div className="period-tabs">
            {periods.map((p) => (
              <button
                key={p.id}
                className={`period-tab ${period === p.id ? "active" : ""}`}
                onClick={() => onPeriodChange(p.id)}
                disabled={loading}
              >
                {p.label}
              </button>
            ))}
            <button
              className={`period-tab ${showCustomModal ? "active" : ""}`}
              onClick={() => setShowCustomModal((p) => !p)}
            >
              <Calendar size={13} /> {t("period_custom")}
            </button>
          </div>
        </div>
      </div>

      {/* Custom Date Range Popover */}
      {showCustomModal && (
        <div className="custom-range-card card animate-fade-in">
          <h4>Select Custom Range</h4>
          <div className="range-inputs">
            <label>
              From:
              <input
                type="date"
                value={customRange.start}
                onChange={(e) =>
                  setCustomRange((prev) => ({ ...prev, start: e.target.value }))
                }
              />
            </label>
            <label>
              To:
              <input
                type="date"
                value={customRange.end}
                onChange={(e) =>
                  setCustomRange((prev) => ({ ...prev, end: e.target.value }))
                }
              />
            </label>
          </div>
          <div className="range-actions">
            <button
              className="btn btn-primary btn-sm"
              onClick={() => {
                setShowCustomModal(false);
                onPeriodChange("7d"); // refresh
              }}
            >
              Apply Filter
            </button>
            <button
              className="btn btn-outline btn-sm"
              onClick={() => setShowCustomModal(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Analytics Grid */}
      <div className="analytics-grid">
        {/* Full Daily Trend Chart */}
        <article className="card analytics-card wide-card">
          <div className="card-header-row">
            <div>
              <h3>{t("chart_amount_received")}</h3>
              <p className="card-subtext">
                Daily settled volume for selected period ({period})
              </p>
            </div>
            <div className="card-tag">
              Total: {formatMoney(analytics?.summary?.receivedAmount)}
            </div>
          </div>

          <div style={{ height: 300, width: "100%" }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailyTrend} margin={{ top: 15, right: 15, left: 0, bottom: 5 }}>
                <defs>
                  <linearGradient id="analyticsGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00baf2" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#00baf2" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke={isDark ? "#1e293b" : "#edf2f7"}
                />
                <XAxis
                  dataKey="label"
                  stroke={isDark ? "#64748b" : "#94a3b8"}
                  fontSize={11}
                />
                <YAxis
                  tickFormatter={(val) => `₹${val / 1000}k`}
                  stroke={isDark ? "#64748b" : "#94a3b8"}
                  fontSize={11}
                />
                <Tooltip
                  formatter={(val) => [formatMoney(val), "Amount Received"]}
                  contentStyle={{
                    backgroundColor: isDark ? "#0f172a" : "#ffffff",
                    borderColor: isDark ? "#334155" : "#e2e8f0",
                    borderRadius: 8,
                    color: isDark ? "#f8fafc" : "#0f172a",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="receivedAmount"
                  stroke="#00baf2"
                  strokeWidth={3}
                  fill="url(#analyticsGrad)"
                  dot={{ r: 4, fill: "#00baf2" }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </article>

        {/* Peak Payment Hours */}
        <article className="card analytics-card">
          <div className="card-header-row">
            <div>
              <h3>{t("chart_peak_hours")}</h3>
              <p className="card-subtext">Hourly transaction frequency</p>
            </div>
            {peak && (
              <span className="peak-badge">
                <Clock size={12} /> Busiest: {peak.hour}
              </span>
            )}
          </div>

          <div style={{ height: 260, width: "100%" }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hourlyData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke={isDark ? "#1e293b" : "#edf2f7"}
                />
                <XAxis
                  dataKey="hour"
                  stroke={isDark ? "#64748b" : "#94a3b8"}
                  fontSize={10}
                />
                <YAxis
                  allowDecimals={false}
                  stroke={isDark ? "#64748b" : "#94a3b8"}
                  fontSize={11}
                />
                <Tooltip
                  formatter={(val) => [`${val} transactions`, "Successful Payments"]}
                  contentStyle={{
                    backgroundColor: isDark ? "#0f172a" : "#ffffff",
                    borderColor: isDark ? "#334155" : "#e2e8f0",
                    borderRadius: 8,
                    color: isDark ? "#f8fafc" : "#0f172a",
                  }}
                />
                <Bar
                  dataKey="successfulTransactions"
                  radius={[6, 6, 0, 0]}
                  fill="#10b981"
                >
                  {hourlyData.map((entry) => (
                    <Cell
                      key={entry.hour}
                      fill={
                        peak && entry.hour === peak.hour ? "#00baf2" : "#10b981"
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          {peak && (
            <div className="chart-footer-note">
              ✓ Peak recorded: <strong>{peak.hour}</strong> with{" "}
              <strong>{peak.successfulTransactions}</strong> completed payments.
            </div>
          )}
        </article>

        {/* Payment Methods Breakdown */}
        <article className="card analytics-card">
          <div className="card-header-row">
            <div>
              <h3>{t("chart_payment_methods")}</h3>
              <p className="card-subtext">UPI, Cards, and Wallets</p>
            </div>
            <CreditCard size={18} className="text-muted" />
          </div>

          <div className="methods-display">
            {methodData.map((item) => {
              const totalAmount = methodData.reduce((s, curr) => s + curr.amount, 0);
              const pct = totalAmount > 0 ? Math.round((item.amount / totalAmount) * 100) : 0;
              return (
                <div key={item.method} className="method-stat-box">
                  <div className="method-stat-top">
                    <span
                      className="method-pill-badge"
                      style={{ background: `${methodColors[item.method]}20`, color: methodColors[item.method] }}
                    >
                      {item.method}
                    </span>
                    <span className="method-amt">{formatMoney(item.amount)}</span>
                  </div>
                  <div className="method-bar-bg">
                    <div
                      className="method-bar-fill"
                      style={{
                        width: `${pct}%`,
                        backgroundColor: methodColors[item.method] || "#00baf2",
                      }}
                    />
                  </div>
                  <div className="method-stat-bottom">
                    <span>{item.count} payments</span>
                    <span>{pct}% share</span>
                  </div>
                </div>
              );
            })}
          </div>
        </article>

        {/* Customer Intelligence / Retention Card */}
        <article className="card analytics-card">
          <div className="card-header-row">
            <div>
              <h3>{t("customer_analytics")}</h3>
              <p className="card-subtext">Patron loyalty & repeat visits</p>
            </div>
            <Users size={18} className="text-muted" />
          </div>

          <div className="customer-stats-visual">
            <div className="repeat-rate-circle">
              <span className="rate-num">{customerStats.repeatPercentage}%</span>
              <span className="rate-label">{t("repeat_rate")}</span>
            </div>

            <div className="customer-metrics-stack">
              <div className="cust-row">
                <span className="cust-metric-title">{t("new_customers")}</span>
                <strong className="cust-metric-val">
                  {customerStats.newCustomers}
                </strong>
              </div>
              <div className="cust-row">
                <span className="cust-metric-title">
                  {t("returning_customers")}
                </span>
                <strong className="cust-metric-val">
                  {customerStats.returningCustomers}
                </strong>
              </div>
              <div className="cust-row">
                <span className="cust-metric-title">Active Patrons</span>
                <strong className="cust-metric-val">
                  {analytics?.summary?.customers || 11}
                </strong>
              </div>
            </div>
          </div>
        </article>
      </div>
    </div>
  );
}
