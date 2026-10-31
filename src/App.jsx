import { useState, useEffect, useCallback } from "react";
import { LanguageProvider } from "./context/LanguageContext";
import { ThemeProvider } from "./context/ThemeContext";
import { ToastProvider, useToast } from "./components/Toast";
import { Sidebar } from "./components/Sidebar";
import { TopNavbar } from "./components/TopNavbar";
import { OverviewView } from "./components/OverviewView";
import { AnalyticsView } from "./components/AnalyticsView";
import { TransactionsView } from "./components/TransactionsView";
import { CustomersView } from "./components/CustomersView";
import { VoiceAssistantView } from "./components/VoiceAssistantView";
import { AIInsightsView } from "./components/AIInsightsView";
import { EODReportView } from "./components/EODReportView";
import { SettingsView } from "./components/SettingsView";
import { AIAssistantDrawer } from "./components/AIAssistantDrawer";
import { merchantApi } from "./services/api";

function DashboardContent() {
  const { addToast } = useToast();

  // Navigation tab state (support URL hashes like #voice, #analytics)
  const [activeTab, setActiveTab] = useState(() => {
    const hash = window.location.hash.replace("#", "");
    const validTabs = [
      "overview",
      "analytics",
      "transactions",
      "customers",
      "voice",
      "ai-insights",
      "eod-report",
      "settings",
    ];
    return validTabs.includes(hash) ? hash : "overview";
  });

  // Layout UI state
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [aiDrawerOpen, setAiDrawerOpen] = useState(false);

  // Analytics & Data state
  const [period, setPeriod] = useState("7d");
  const [analytics, setAnalytics] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [voiceSummary, setVoiceSummary] = useState(null);
  const [eodReport, setEodReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Sync hash with activeTab
  const handleSelectTab = (tabId) => {
    setActiveTab(tabId);
    window.location.hash = tabId;
  };

  // Listen to external hash changes
  useEffect(() => {
    const onHashChange = () => {
      const hash = window.location.hash.replace("#", "");
      if (hash) setActiveTab(hash);
    };
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  // Fetch real data from backend API
  const loadDashboardData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [analyticsRes, txnsRes, voiceRes] = await Promise.all([
        merchantApi.getAnalytics(period),
        merchantApi.getTransactions(),
        merchantApi.getVoiceSummary().catch(() => null),
      ]);

      setAnalytics(analyticsRes);
      setTransactions(txnsRes.transactions || []);
      if (voiceRes) setVoiceSummary(voiceRes);
    } catch (err) {
      console.error("Error fetching merchant data:", err);
      setError(`Unable to connect to live merchant API: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Quick refresh button
  const handleRefresh = async () => {
    await loadDashboardData();
    addToast("Merchant data refreshed with latest transaction records!", "info");
  };

  return (
    <div className="app-shell">
      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        onSelectTab={handleSelectTab}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed((p) => !p)}
        mobileOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="main-wrapper">
        <TopNavbar
          onToggleSidebar={() => setMobileSidebarOpen((p) => !p)}
          onOpenAiDrawer={() => setAiDrawerOpen(true)}
          onRefresh={handleRefresh}
          loading={loading}
        />

        <main className="content-viewport">
          {activeTab === "overview" && (
            <OverviewView
              analytics={analytics}
              loading={loading}
              error={error}
              onRetry={loadDashboardData}
              onNavigateTab={handleSelectTab}
              onOpenAi={() => setAiDrawerOpen(true)}
            />
          )}

          {activeTab === "analytics" && (
            <AnalyticsView
              analytics={analytics}
              period={period}
              onPeriodChange={setPeriod}
              loading={loading}
              transactions={transactions}
            />
          )}

          {activeTab === "transactions" && (
            <TransactionsView
              transactions={transactions}
              loading={loading}
            />
          )}

          {activeTab === "customers" && (
            <CustomersView
              transactions={transactions}
              analytics={analytics}
            />
          )}

          {activeTab === "voice" && (
            <VoiceAssistantView />
          )}

          {activeTab === "ai-insights" && (
            <AIInsightsView
              analytics={analytics}
              onOpenAi={() => setAiDrawerOpen(true)}
            />
          )}

          {activeTab === "eod-report" && (
            <EODReportView
              initialReport={eodReport}
            />
          )}

          {activeTab === "settings" && (
            <SettingsView />
          )}
        </main>
      </div>

      {/* VyaparMitra AI Assistant Slide-Out Drawer */}
      <AIAssistantDrawer
        isOpen={aiDrawerOpen}
        onClose={() => setAiDrawerOpen(false)}
        analyticsData={analytics}
        transactions={transactions}
        voiceSummary={voiceSummary}
        eodReport={eodReport}
      />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <ToastProvider>
          <DashboardContent />
        </ToastProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}
