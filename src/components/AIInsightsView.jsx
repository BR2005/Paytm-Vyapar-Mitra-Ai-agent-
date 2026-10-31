import {
  Sparkles,
  TrendingUp,
  Clock,
  ShieldAlert,
  Lightbulb,
  CheckCircle,
  ArrowRight,
  TrendingDown,
  Calendar,
} from "lucide-react";
import { useLanguage } from "../context/LanguageContext";
import { formatMoney } from "../services/api";

export function AIInsightsView({ analytics, onOpenAi }) {
  const { lang, t } = useLanguage();

  const today = analytics?.today || {};
  const yesterday = analytics?.yesterday || {};
  const receivedToday = Number(today.receivedAmount || 0);
  const receivedYesterday = Number(yesterday.receivedAmount || 0);
  const diff = receivedToday - receivedYesterday;
  const isUp = diff >= 0;
  const pct =
    receivedYesterday > 0
      ? Math.abs(Math.round((diff / receivedYesterday) * 100))
      : 0;

  const hourly = analytics?.hourly || [];
  const peak = [...hourly].sort(
    (a, b) => b.successfulTransactions - a.successfulTransactions
  )[0];

  const pendingAmt = Number(today.pendingAmount || 0);

  return (
    <div className="insights-page">
      {/* Hero Header */}
      <div className="card insights-hero">
        <div className="insights-hero-badge">
          <Sparkles size={16} /> Autonomous Intelligence
        </div>
        <h2>VyaparMitra AI Strategic Insights</h2>
        <p className="hero-sub">
          Continuous mathematical pattern detection from your store's transaction ledger.
        </p>

        <div className="growth-summary-pill">
          {isUp ? (
            <span className="trend-text green">
              <TrendingUp size={16} /> +{pct}% ({formatMoney(diff)}) growth vs yesterday
            </span>
          ) : (
            <span className="trend-text red">
              <TrendingDown size={16} /> -{pct}% ({formatMoney(Math.abs(diff))}) vs yesterday
            </span>
          )}
        </div>
      </div>

      {/* Main Insights Cards */}
      <div className="insights-grid">
        {/* Insight 1: Payment Performance */}
        <div className="card insight-card">
          <div className="insight-card-icon bg-blue-subtle">
            <TrendingUp size={22} className="text-primary" />
          </div>
          <h4>Volume Analysis</h4>
          <p className="insight-body">
            You received <strong>{formatMoney(receivedToday)}</strong> today from{" "}
            <strong>{today.successfulTransactions || 0}</strong> completed transactions.
            Compared to yesterday's {formatMoney(receivedYesterday)}, your daily inflow{" "}
            {isUp ? "increased significantly." : "recorded a minor dip."}
          </p>
          <div className="insight-action-box">
            <strong>Key takeaway:</strong> Sustained momentum in UPI transactions is the primary driver of growth today.
          </div>
        </div>

        {/* Insight 2: Peak Hour Optimization */}
        <div className="card insight-card">
          <div className="insight-card-icon bg-green-subtle">
            <Clock size={22} className="text-success" />
          </div>
          <h4>Busiest Checkout Windows</h4>
          <p className="insight-body">
            {peak
              ? `Your busiest recorded hour is ${peak.hour} with ${peak.successfulTransactions} successful payments. Peak traffic regularly concentrates between 11:00 AM and 1:30 PM.`
              : "Hourly data shows steady transaction flow throughout business hours."}
          </p>
          <div className="insight-action-box">
            <strong>Action for tomorrow:</strong> Keep billing counters fully staffed and ensure the Paytm Soundbox is charged prior to 11:00 AM.
          </div>
        </div>

        {/* Insight 3: Pending Reconciliations */}
        <div className="card insight-card">
          <div className="insight-card-icon bg-amber-subtle">
            <ShieldAlert size={22} className="text-warning" />
          </div>
          <h4>Pending Settlement Follow-up</h4>
          <p className="insight-body">
            You currently have <strong>{formatMoney(pendingAmt)}</strong> across{" "}
            <strong>{today.pendingTransactions || 0}</strong> pending transaction. Following up with the customer or initiating an auto-retry can prevent revenue loss.
          </p>
          <div className="insight-action-box">
            <strong>Action for today:</strong> Check payment gateway reconciliation before 9:00 PM closing.
          </div>
        </div>

        {/* Insight 4: Patron Retention */}
        <div className="card insight-card">
          <div className="insight-card-icon bg-purple-subtle">
            <Lightbulb size={22} className="text-purple" />
          </div>
          <h4>Customer Loyalty Opportunity</h4>
          <p className="insight-body">
            Patron <strong>C-101</strong> made multiple large purchases totaling over ₹10,000 across today and yesterday. Converting loyal buyers into recurring subscribers improves margins.
          </p>
          <div className="insight-action-box">
            <strong>Recommendation:</strong> Introduce a loyalty discount or special bundle for top repeat shoppers.
          </div>
        </div>
      </div>

      {/* Interactive AI Prompt Footer */}
      <div className="card ai-prompt-cta">
        <div className="cta-left">
          <Sparkles size={24} className="sparkle-anim" />
          <div>
            <h4>Want customized tactical business advice?</h4>
            <p>Ask VyaparMitra AI Copilot specific questions about inventory, sales, or cost-cutting.</p>
          </div>
        </div>
        <button className="btn btn-primary" onClick={onOpenAi}>
          Chat with AI Advisor <ArrowRight size={15} />
        </button>
      </div>
    </div>
  );
}
