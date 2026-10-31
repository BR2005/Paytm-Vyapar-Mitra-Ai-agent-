import { useState, useRef, useEffect } from "react";
import {
  Sun,
  Moon,
  Globe,
  Bot,
  RotateCw,
  Menu,
  Check,
  ChevronDown,
  Sparkles,
} from "lucide-react";
import { useLanguage } from "../context/LanguageContext";
import { useTheme } from "../context/ThemeContext";

export function TopNavbar({
  onToggleSidebar,
  onOpenAiDrawer,
  onRefresh,
  loading = false,
}) {
  const { lang, setLanguage, languages, currentLangObj, t } = useLanguage();
  const { isDark, toggleTheme } = useTheme();
  const [langOpen, setLangOpen] = useState(false);
  const langRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (langRef.current && !langRef.current.contains(e.target)) {
        setLangOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const todayStr = new Intl.DateTimeFormat(
    lang === "en" ? "en-IN" : `${lang}-IN`,
    {
      weekday: "long",
      year: "numeric",
      month: "short",
      day: "numeric",
    }
  ).format(new Date("2026-10-31T13:25:00+05:30"));

  return (
    <header className="topbar">
      <div className="topbar-left">
        <button
          className="icon-button mobile-menu-btn"
          onClick={onToggleSidebar}
          aria-label="Toggle navigation menu"
        >
          <Menu size={20} />
        </button>

        <div className="topbar-title-wrap">
          <div className="topbar-date">{todayStr}</div>
          <div className="topbar-status-row">
            <span className="live-status-dot" />
            <span className="live-status-text">{t("connected")}</span>
            <span className="badge demo-badge">{t("demo_badge")}</span>
          </div>
        </div>
      </div>

      <div className="topbar-right">
        {/* Language selector */}
        <div className="lang-selector-container" ref={langRef}>
          <button
            className="lang-select-button"
            onClick={() => setLangOpen((p) => !p)}
            aria-expanded={langOpen}
            aria-label="Select Language"
          >
            <Globe size={16} className="lang-globe-icon" />
            <span className="lang-current-label">
              <span className="lang-native">{currentLangObj.nativeName}</span>
              <span className="lang-code-tag">{currentLangObj.code.toUpperCase()}</span>
            </span>
            <ChevronDown size={14} className={`chevron-icon ${langOpen ? "open" : ""}`} />
          </button>

          {langOpen && (
            <div className="lang-dropdown-menu">
              <div className="lang-dropdown-header">
                <span>Select Language / மொழி</span>
              </div>
              <div className="lang-options-grid">
                {languages.map((l) => (
                  <button
                    key={l.code}
                    className={`lang-option-item ${l.code === lang ? "active" : ""}`}
                    onClick={() => {
                      setLanguage(l.code);
                      setLangOpen(false);
                    }}
                  >
                    <div className="lang-names">
                      <span className="lang-native-main">{l.nativeName}</span>
                      <span className="lang-english-sub">{l.name}</span>
                    </div>
                    {l.code === lang && <Check size={16} className="lang-check" />}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Theme Switcher */}
        <button
          className="icon-button theme-toggle-btn"
          onClick={toggleTheme}
          title={isDark ? t("theme_light") : t("theme_dark")}
          aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
        >
          {isDark ? (
            <Sun size={19} className="theme-icon sun-icon" />
          ) : (
            <Moon size={19} className="theme-icon moon-icon" />
          )}
        </button>

        {/* Refresh button */}
        <button
          className={`icon-button refresh-btn ${loading ? "spinning" : ""}`}
          onClick={onRefresh}
          title={t("refresh")}
          aria-label={t("refresh")}
          disabled={loading}
        >
          <RotateCw size={18} />
        </button>

        {/* AI Assistant Quick Trigger */}
        <button
          className="ai-trigger-btn"
          onClick={onOpenAiDrawer}
          aria-label="Open VyaparMitra AI Assistant"
        >
          <div className="ai-btn-avatar-wrap">
            <Bot size={17} />
            <span className="ai-btn-pulse" />
          </div>
          <span className="ai-btn-text">{t("ai_assistant")}</span>
          <Sparkles size={14} className="sparkle-icon" />
        </button>
      </div>
    </header>
  );
}
