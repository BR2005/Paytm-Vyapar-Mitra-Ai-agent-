import {
  IndianRupee,
  CheckCircle2,
  Clock,
  AlertCircle,
  Users,
  TrendingUp,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Calendar,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { KPICard } from "./KPICard";
import { useLanguage } from "../context/LanguageContext";
import { useTheme } from "../context/ThemeContext";
import { formatMoney } from "../services/api";

export function OverviewView({
  analytics,
  loading = false,
  error = "",
  onRetry,
  onNavigateTab,
  onOpenAi,
}) {
  const { t } = useLanguage();
  const { isDark } = useTheme();

  const today = analytics?.today || {};
  const yesterday = analytics?.yesterday || {};

  // Percentage calculations strictly from real backend values
  const todayReceived = Number(today.receivedAmount || 0);
  const yesterdayReceived = Number(yesterday.receivedAmount || 0);
  const receivedPct =
    yesterdayReceived > 0
      ? Math.round(((todayReceived - yesterdayReceived) / yesterdayReceived) * 100)
      : null;

  const todaySuccessCount = Number(today.successfulTransactions || 0);
  const yesterdaySuccessCount = Number(yesterday.successfulTransactions || 0);
  const successPct =
    yesterdaySuccessCount > 0
      ? Math.round(
          ((todaySuccessCount - yesterdaySuccessCount) / yesterdaySuccessCount) * 100
        )
      : null;

  const dailyTrend = (analytics?.daily || []).map((item) => ({
    ...item,
    formattedDate: item.date.slice(5),
  }));

  const statusColors = {
    success: "#10b981",
    pending: "#f59e0b",
    failed: "#ef4444",
  };

  const statusData = analytics?.status || [];

  return (
    <div className="overview-page">
      {/* Welcome & Merchant Banner */}
      <section className="welcome-banner card">
        <div className="welcome-left">
          <div className="merchant-badge-pill">
            <ShieldCheck size={14} /> Verified Paytm Merchant • M001
          </div>
          <h1 className="welcome-title">{t("app_name")}</h1>
          <p className="welcome-tagline">{t("tagline")}</p>
        </div>

        <div className="welcome-actions">
          <button className="btn btn-outline" onClick={() => onNavigateTab("eod-report")}>
            <Calendar size={15} /> EOD Settlement
          </button>
          <button className="btn btn-primary" onClick={onOpenAi}>
            <Sparkles size={15} /> Ask AI Copilot
          </button>
        </div>
      </section>

      {/* Error state */}
      {error && (
        <div className="error-alert-banner">
          <AlertCircle size={18} />
          <span>{error}</span>
          <button className="retry-btn" onClick={onRetry}>
            {t("retry")}
          </button>
        </div>
      )}

      {/* KPI Section */}
      <section className="kpis-grid">
        {/* 1. Amount Received Today */}
        <KPICard
          label={t("kpi_amount_received")}
          value={todayReceived}
          isCurrency={true}
          note={t("kpi_amount_received_desc")}
          changePercent={receivedPct}
          icon={IndianRupee}
          variant="primary"
          tooltipText="Total verifiable payments received in Paytm merchant account today."
          loading={loading}
        />

        {/* 2. Successful Transactions */}
        <KPICard
          label={t("kpi_successful_txns")}
          value={todaySuccessCount}
          note={t("kpi_successful_txns_desc")}
          changePercent={successPct}
          icon={CheckCircle2}
          variant="success"
          tooltipText="Transactions completed and settled successfully without disputes."
          loading={loading}
        />

        {/* 3. Pending Payments */}
        <KPICard
          label={t("kpi_pending_payments")}
          value={Number(today.pendingAmount || 0)}
          isCurrency={true}
          note={`${today.pendingTransactions || 0} ${t("kpi_pending_payments_desc")}`}
          icon={Clock}
          variant="warning"
          tooltipText="Payments currently in authorization or awaiting bank clearing."
          loading={loading}
        />

        {/* 4. Failed Transactions */}
        <KPICard
          label={t("kpi_failed_txns")}
          value={Number(today.failedAmount || 0)}
          isCurrency={true}
          note={`${today.failedTransactions || 0} ${t("kpi_failed_txns_desc")}`}
          icon={AlertCircle}
          variant="danger"
          tooltipText="Payments declined by customer's issuing bank or network timeout."
          loading={loading}
        />

        {/* 5. Total Customers */}
        <KPICard
          label={t("kpi_total_customers")}
          value={Number(today.customers || 0)}
          note={t("kpi_total_customers_desc")}
          icon={Users}
          variant="info"
          tooltipText="Unique patrons who made at least one successful payment today."
          loading={loading}
        />

        {/* 6. Average Payment Amount */}
        <KPICard
          label={t("kpi_avg_payment")}
          value={Number(today.averagePaymentAmount || 0)}
          isCurrency={true}
          note={t("kpi_avg_payment_desc")}
          icon={TrendingUp}
          variant="purple"
          tooltipText="Average basket size calculated as received amount divided by successful transactions."
          loading={loading}
        />
      </section>

      {/* Quick Visuals Grid */}
      <section className="overview-visuals-grid">
        {/* Trend Area Chart */}
        <article className="card visual-panel">
          <div className="panel-header">
            <div>
              <h3>{t("chart_amount_received")}</h3>
              <span className="panel-sub">7 Days Performance Trend</span>
            </div>
            <button
              className="panel-link-btn"
              onClick={() => onNavigateTab("analytics")}
            >
              Full Analytics <ArrowRight size={14} />
            </button>
          </div>

          <div className="chart-wrapper" style={{ height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailyTrend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="receivedGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00baf2" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#002e6e" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="formattedDate"
                  stroke={isDark ? "#64748b" : "#94a3b8"}
                  fontSize={11}
                  tickLine={false}
                />
                <YAxis
                  tickFormatter={(val) => `₹${val / 1000}k`}
                  stroke={isDark ? "#64748b" : "#94a3b8"}
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  formatter={(val) => [formatMoney(val), "Received Amount"]}
                  contentStyle={{
                    backgroundColor: isDark ? "#0f172a" : "#ffffff",
                    borderColor: isDark ? "#334155" : "#e2e8f0",
                    borderRadius: 8,
                    color: isDark ? "#f8fafc" : "#0f172a",
                    boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="receivedAmount"
                  stroke="#00baf2"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#receivedGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </article>

        {/* Status Donut & Customer Retention summary */}
        <article className="card visual-panel">
          <div className="panel-header">
            <div>
              <h3>{t("chart_status_distribution")}</h3>
              <span className="panel-sub">Transaction Quality</span>
            </div>
          </div>

          <div className="status-donut-wrap">
            <div style={{ height: 180, position: "relative" }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    dataKey="count"
                    nameKey="status"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={4}
                  >
                    {statusData.map((item) => (
                      <Cell
                        key={item.status}
                        fill={statusColors[item.status] || "#94a3b8"}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val, name, entry) => [
                      `${val} payments (${formatMoney(entry.payload.amount)})`,
                      name.toUpperCase(),
                    ]}
                    contentStyle={{
                      backgroundColor: isDark ? "#0f172a" : "#ffffff",
                      borderColor: isDark ? "#334155" : "#e2e8f0",
                      borderRadius: 8,
                      color: isDark ? "#f8fafc" : "#0f172a",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="donut-center-stat">
                <span className="center-num">
                  {statusData.reduce((acc, curr) => acc + curr.count, 0)}
                </span>
                <span className="center-label">Total</span>
              </div>
            </div>

            <div className="status-legend-grid">
              {statusData.map((item) => (
                <div key={item.status} className="legend-chip">
                  <span
                    className="legend-color-dot"
                    style={{ background: statusColors[item.status] }}
                  />
                  <span className="legend-name">{item.status}</span>
                  <span className="legend-count">{item.count}</span>
                  <span className="legend-amt">({formatMoney(item.amount)})</span>
                </div>
              ))}
            </div>
          </div>
        </article>
      </section>

      {/* Snapshot Insights Banner */}
      <section className="card ai-snapshot-banner">
        <div className="ai-snapshot-icon-wrap">
          <Sparkles size={24} className="sparkle-anim" />
        </div>
        <div className="ai-snapshot-content">
          <h4>VyaparMitra AI Intelligence Snapshot</h4>
          <p>
            {receivedPct !== null && receivedPct >= 0
              ? `Your received payments grew by ${receivedPct}% (+${formatMoney(
                  todayReceived - yesterdayReceived
                )}) versus yesterday.`
              : `Received amount changed by ${formatMoney(
                  Math.abs(todayReceived - yesterdayReceived)
                )} versus yesterday.`}{" "}
            Peak customer activity is concentrated around 12:00 PM. Follow up on 1 pending transaction ({formatMoney(today.pendingAmount)}) to finalize daily settlement.
          </p>
        </div>
        <button
          className="btn btn-outline-white"
          onClick={() => onNavigateTab("ai-insights")}
        >
          View Growth Recommendations
        </button>
      </section>
    </div>
  );
}
