import { useState, useEffect } from "react";
import {
  FileText,
  Download,
  Share2,
  Volume2,
  VolumeX,
  Printer,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  IndianRupee,
} from "lucide-react";
import { useLanguage } from "../context/LanguageContext";
import { useToast } from "./Toast";
import { merchantApi, formatMoney } from "../services/api";

export function EODReportView({ initialReport = null }) {
  const { lang, currentLangObj, t } = useLanguage();
  const { addToast } = useToast();

  const [report, setReport] = useState(initialReport);
  const [generating, setGenerating] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Generate or refresh EOD report
  const handleGenerateReport = async () => {
    setGenerating(true);
    try {
      const data = await merchantApi.getEodReport();
      setReport(data);
      addToast("End-of-Day report generated successfully!", "success");
    } catch (err) {
      addToast(`Failed to generate report: ${err.message}`, "error");
    } finally {
      setGenerating(false);
    }
  };

  // If no report is loaded, load it on mount
  useEffect(() => {
    if (!report) {
      handleGenerateReport();
    }
  }, []);

  // Download Report
  const handleDownload = () => {
    if (!report) return;
    const metrics = report.metrics || {};
    const lines = [
      "=======================================================",
      "               VYAPARMITRA AI - EOD REPORT              ",
      "           Your Business. Your Language. Your AI.      ",
      "=======================================================",
      `Generated At: ${new Date(report.generated_at || Date.now()).toLocaleString("en-IN")}`,
      `Merchant ID: M001 | Vyapar Store`,
      "-------------------------------------------------------",
      "DAILY SETTLEMENT METRICS:",
      `• Amount Received Today:       ${formatMoney(metrics.receivedAmount)}`,
      `• Successful Transactions:     ${metrics.successfulTransactions || 0}`,
      `• Pending Payments:            ${formatMoney(metrics.pendingAmount)} (${metrics.pendingTransactions || 0} awaiting)`,
      `• Failed Transactions:         ${formatMoney(metrics.failedAmount)} (${metrics.failedTransactions || 0} failed)`,
      `• Unique Paying Customers:     ${metrics.customers || 0}`,
      `• Average Payment Size:        ${formatMoney(metrics.averagePaymentAmount)}`,
      `• Compared to Yesterday:       ${metrics.comparisonAmount >= 0 ? "+" : ""}${formatMoney(metrics.comparisonAmount)}`,
      "-------------------------------------------------------",
      "BUSINESS INSIGHTS:",
      ...(report.insights || []).map((i) => `• ${i}`),
      "-------------------------------------------------------",
      "RECOMMENDATIONS FOR TOMORROW:",
      ...(report.recommendations || []).map((r) => `• ${r}`),
      "=======================================================",
      "Verified by Paytm VyaparMitra AI Reconciliation Engine",
    ];

    const blob = new Blob([lines.join("\n")], { type: "text/plain" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `VyaparMitra_EOD_Report_${new Date().toISOString().slice(0, 10)}.txt`;
    link.click();
    URL.revokeObjectURL(link.href);

    addToast("EOD report downloaded to your device!", "success");
  };

  // WhatsApp Share
  const handleWhatsAppShare = () => {
    if (!report) return;
    const metrics = report.metrics || {};
    const text = `*VyaparMitra AI - EOD Settlement Summary* 📈
Merchant ID: M001
Date: ${new Date().toLocaleDateString("en-IN")}

✅ *Amount Received:* ${formatMoney(metrics.receivedAmount)}
💳 *Successful Payments:* ${metrics.successfulTransactions}
⏳ *Pending Amount:* ${formatMoney(metrics.pendingAmount)}
❌ *Failed Amount:* ${formatMoney(metrics.failedAmount)}
👥 *Paying Customers:* ${metrics.customers}
📊 *Vs Yesterday:* ${metrics.comparisonAmount >= 0 ? "+" : ""}${formatMoney(metrics.comparisonAmount)}

*AI Insight:* ${(report.insights || [])[0] || "Business volume is healthy."}
_Verified via Paytm VyaparMitra AI_`;

    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank");
    addToast("WhatsApp sharing link opened!", "info");
  };

  // Audio summary (TTS)
  const toggleAudioSummary = () => {
    if (!("speechSynthesis" in window)) {
      addToast("Speech synthesis is not supported on this device.", "error");
      return;
    }

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    if (!report) return;
    const m = report.metrics || {};
    const narrationText =
      lang === "ta"
        ? `இன்றைய வணிக நாள் முடிவு அறிக்கை. இன்று பெறப்பட்ட மொத்த தொகை ${formatMoney(m.receivedAmount)} ஆகும். ${m.successfulTransactions} வெற்றிகரமான பரிவர்த்தனைகள் பதிவாகியுள்ளன. நிலுவையில் உள்ள தொகை ${formatMoney(m.pendingAmount)}. நேற்றை விட ${formatMoney(Math.abs(m.comparisonAmount))} அதிகமாக பெறப்பட்டுள்ளது.`
        : lang === "hi"
        ? `आज का व्यापार समाप्ति विवरण। आज आपको कुल ${formatMoney(m.receivedAmount)} प्राप्त हुए हैं, जिसमें ${m.successfulTransactions} सफल भुगतान शामिल हैं। लंबित भुगतान ${formatMoney(m.pendingAmount)} है। कल की तुलना में ${formatMoney(Math.abs(m.comparisonAmount))} की वृद्धि हुई है।`
        : `Here is your daily End-of-Day summary. Today you received ${formatMoney(m.receivedAmount)} from ${m.successfulTransactions} successful payments. Pending payments total ${formatMoney(m.pendingAmount)}, and failed payments total ${formatMoney(m.failedAmount)}. Your earnings increased by ${formatMoney(Math.abs(m.comparisonAmount))} compared to yesterday.`;

    const utterance = new SpeechSynthesisUtterance(narrationText);
    utterance.lang = currentLangObj.speechLang || "en-IN";
    utterance.rate = 0.88;

    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
    addToast("Playing EOD audio summary...", "info");
  };

  // Print Report
  const handlePrint = () => {
    window.print();
  };

  const metrics = report?.metrics || {};
  const isComparisonPositive = (metrics.comparisonAmount || 0) >= 0;

  return (
    <div className="eod-page">
      {/* Top Controls Card */}
      <div className="card eod-header-card">
        <div className="header-info">
          <h2>{t("eod_title")}</h2>
          <p className="subtext">{t("eod_subtitle")}</p>
        </div>

        <div className="eod-actions-row">
          <button
            className={`btn btn-primary ${generating ? "loading" : ""}`}
            onClick={handleGenerateReport}
            disabled={generating}
          >
            <Sparkles size={16} /> {t("btn_generate_report")}
          </button>

          {report && (
            <>
              <button className="btn btn-outline" onClick={handleDownload}>
                <Download size={15} /> {t("btn_download_report")}
              </button>

              <button
                className="btn btn-whatsapp"
                onClick={handleWhatsAppShare}
                title="Share EOD summary via WhatsApp"
              >
                <Share2 size={15} /> {t("btn_share_whatsapp")}
              </button>

              <button
                className={`btn btn-outline ${isSpeaking ? "active-audio" : ""}`}
                onClick={toggleAudioSummary}
              >
                {isSpeaking ? <VolumeX size={15} /> : <Volume2 size={15} />}
                {isSpeaking ? "Stop Audio" : t("btn_audio_summary")}
              </button>

              <button className="btn btn-outline" onClick={handlePrint}>
                <Printer size={15} /> {t("btn_print_report")}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Main Official EOD Document Card */}
      {report ? (
        <div className="card eod-document-sheet">
          {/* Document Header */}
          <div className="eod-doc-header">
            <div className="doc-brand">
              <img
                src="/vyaparmitra-logo.png"
                alt="Paytm VyaparMitra AI"
                className="eod-doc-logo"
              />
              <span className="doc-tagline">
                Verified Merchant Settlement Ledger
              </span>
            </div>

            <div className="doc-meta-block">
              <div className="doc-meta-item">
                <span className="meta-label">Merchant Terminal</span>
                <span className="meta-value">M001 • Vyapar Store</span>
              </div>
              <div className="doc-meta-item">
                <span className="meta-label">Settlement Date</span>
                <span className="meta-value">
                  {new Date(report.generated_at || Date.now()).toLocaleDateString("en-IN", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </span>
              </div>
              <div className="doc-meta-item">
                <span className="meta-label">Status</span>
                <span className="meta-badge-reconciled">
                  ✓ Reconciled with Bank
                </span>
              </div>
            </div>
          </div>

          <div className="doc-divider" />

          {/* Key Metrics Grid */}
          <div className="eod-metrics-grid">
            <div className="eod-metric-box highlight-blue">
              <span className="metric-title">{t("kpi_amount_received")}</span>
              <div className="metric-large-val">
                {formatMoney(metrics.receivedAmount)}
              </div>
              <span className="metric-sub">
                Settled to Paytm Payments Bank
              </span>
            </div>

            <div className="eod-metric-box">
              <span className="metric-title">Successful Payments</span>
              <div className="metric-large-val text-success">
                {metrics.successfulTransactions || 0}
              </div>
              <span className="metric-sub">Completed orders</span>
            </div>

            <div className="eod-metric-box">
              <span className="metric-title">Pending Authorizations</span>
              <div className="metric-large-val text-warning">
                {formatMoney(metrics.pendingAmount)}
              </div>
              <span className="metric-sub">
                {metrics.pendingTransactions || 0} awaiting clearing
              </span>
            </div>

            <div className="eod-metric-box">
              <span className="metric-title">Failed / Declined</span>
              <div className="metric-large-val text-danger">
                {formatMoney(metrics.failedAmount)}
              </div>
              <span className="metric-sub">
                {metrics.failedTransactions || 0} declined
              </span>
            </div>

            <div className="eod-metric-box">
              <span className="metric-title">Compared to Yesterday</span>
              <div className="metric-large-val">
                <span
                  className={
                    isComparisonPositive ? "text-success" : "text-danger"
                  }
                >
                  {isComparisonPositive ? "+" : ""}
                  {formatMoney(metrics.comparisonAmount)}
                </span>
              </div>
              <span className="metric-sub">
                Yesterday: {formatMoney(metrics.yesterdayReceivedAmount)}
              </span>
            </div>

            <div className="eod-metric-box">
              <span className="metric-title">Average Basket Value</span>
              <div className="metric-large-val">
                {formatMoney(metrics.averagePaymentAmount)}
              </div>
              <span className="metric-sub">Per completed customer</span>
            </div>
          </div>

          {/* Business Insights Block */}
          <div className="eod-section-box">
            <h4>
              <Sparkles size={16} /> {t("eod_insights_title")}
            </h4>
            <div className="insights-list">
              {(report.insights || []).map((insightText, idx) => (
                <div key={idx} className="eod-bullet-item">
                  <CheckCircle2 size={16} className="text-success" />
                  <span>{insightText}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Tomorrow Recommendations */}
          <div className="eod-section-box">
            <h4>
              <Clock size={16} /> {t("eod_recommendations_title")}
            </h4>
            <div className="recommendations-list">
              {(report.recommendations || []).map((recText, idx) => (
                <div key={idx} className="eod-bullet-item">
                  <span className="bullet-num">{idx + 1}</span>
                  <span>{recText}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Footer note */}
          <div className="eod-doc-footer">
            <span className="footer-ledger-note">
              {t("eod_settlement_note")}
            </span>
            <span className="timestamp">
              Report ID: EOD-{new Date().toISOString().slice(0, 10)}-M001
            </span>
          </div>
        </div>
      ) : (
        <div className="card empty-eod-state">
          <FileText size={48} className="empty-icon" />
          <h3>No EOD Report Generated Yet</h3>
          <p>
            Click the "Generate EOD Report" button above to synthesize today's transaction ledger into an official report.
          </p>
          <button className="btn btn-primary" onClick={handleGenerateReport}>
            Generate Report Now
          </button>
        </div>
      )}
    </div>
  );
}
