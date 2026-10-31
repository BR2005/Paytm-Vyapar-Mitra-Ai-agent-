import {
  LayoutDashboard,
  TrendingUp,
  Receipt,
  Users,
  Mic,
  Sparkles,
  FileText,
  Settings,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  X,
} from "lucide-react";
import { useLanguage } from "../context/LanguageContext";
import { useTheme } from "../context/ThemeContext";

export function Sidebar({
  activeTab,
  onSelectTab,
  collapsed,
  onToggleCollapse,
  mobileOpen,
  onCloseMobile,
}) {
  const { t } = useLanguage();
  const { logoSrc, isDark } = useTheme();

  const navItems = [
    { id: "overview", label: t("nav_overview"), icon: LayoutDashboard },
    { id: "analytics", label: t("nav_analytics"), icon: TrendingUp },
    { id: "transactions", label: t("nav_transactions"), icon: Receipt },
    { id: "customers", label: t("nav_customers"), icon: Users },
    { id: "voice", label: t("nav_voice"), icon: Mic, highlight: true },
    { id: "ai-insights", label: t("nav_insights"), icon: Sparkles },
    { id: "eod-report", label: t("nav_reports"), icon: FileText },
    { id: "settings", label: t("nav_settings"), icon: Settings },
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="sidebar-backdrop"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      <aside
        className={`sidebar ${collapsed ? "collapsed" : ""} ${
          mobileOpen ? "mobile-open" : ""
        }`}
      >
        {/* Brand header */}
        <div className="sidebar-brand-wrapper">
          <div className="brand-logo-container">
            <img
              key={logoSrc}
              src={logoSrc}
              alt="Paytm VyaparMitra AI"
              className={`sidebar-logo-img logo-${isDark ? "dark" : "light"} animate-fade-in`}
            />
          </div>

          {/* Close button for mobile */}
          <button
            className="mobile-close-btn"
            onClick={onCloseMobile}
            aria-label="Close sidebar"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation list */}
        <nav className="sidebar-nav">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                className={`nav-item ${isActive ? "active" : ""} ${
                  item.highlight ? "nav-highlight" : ""
                }`}
                onClick={() => {
                  onSelectTab(item.id);
                  if (mobileOpen) onCloseMobile();
                }}
                title={collapsed ? item.label : undefined}
              >
                <div className="nav-icon-wrap">
                  <Icon size={19} />
                </div>
                {!collapsed && (
                  <span className="nav-label">{item.label}</span>
                )}
                {item.highlight && !collapsed && (
                  <span className="voice-live-badge">Voice</span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Bottom merchant card & collapse toggle */}
        <div className="sidebar-footer">
          {!collapsed ? (
            <div className="merchant-info-card">
              <div className="merchant-avatar">
                <span>M1</span>
              </div>
              <div className="merchant-details">
                <div className="merchant-name-row">
                  <span className="merchant-name">Vyapar Store</span>
                  <ShieldCheck size={14} className="verified-shield" />
                </div>
                <span className="merchant-id">ID: M001 • Retail</span>
              </div>
            </div>
          ) : (
            <div className="merchant-avatar-mini" title="Merchant ID: M001">
              <span>M1</span>
            </div>
          )}

          <button
            className="collapse-toggle-btn"
            onClick={onToggleCollapse}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>
      </aside>
    </>
  );
}
