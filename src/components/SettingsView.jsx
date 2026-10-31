import { useState } from "react";
import {
  Sun,
  Moon,
  Globe,
  Store,
  Bell,
  Volume2,
  Shield,
  Save,
  Check,
} from "lucide-react";
import { useLanguage } from "../context/LanguageContext";
import { useTheme } from "../context/ThemeContext";
import { useToast } from "./Toast";

export function SettingsView() {
  const { lang, languages, setLanguage, t } = useLanguage();
  const { theme, setTheme, isDark } = useTheme();
  const { addToast } = useToast();

  const [profile, setProfile] = useState({
    name: "Vyapar Store",
    category: "Retail, Grocery & FMCG",
    upiId: "vyaparstore@paytm",
    phone: "+91 98765 43210",
  });

  const [voicePrefs, setVoicePrefs] = useState({
    speechRate: "0.9",
    autoSpeak: true,
  });

  const [notifs, setNotifs] = useState({
    soundAlerts: true,
    whatsappSummary: true,
    pendingReminders: true,
  });

  const handleSave = (e) => {
    e?.preventDefault();
    addToast("Merchant preferences saved successfully!", "success");
  };

  return (
    <div className="settings-page">
      <div className="settings-header-card card">
        <h2>{t("settings_title")}</h2>
        <p className="subtext">
          Customize your dashboard appearance, language, audio preferences, and merchant profile.
        </p>
      </div>

      <div className="settings-grid">
        {/* Appearance & Theme */}
        <section className="card settings-section">
          <div className="section-title-wrap">
            <Sun size={20} className="section-icon" />
            <div>
              <h3>{t("settings_appearance")}</h3>
              <p className="section-sub">{t("settings_theme_desc")}</p>
            </div>
          </div>

          <div className="theme-options-cards">
            <button
              type="button"
              className={`theme-card-option ${!isDark ? "selected" : ""}`}
              onClick={() => setTheme("light")}
            >
              <div className="theme-preview-box light-preview">
                <Sun size={24} />
              </div>
              <div className="theme-card-text">
                <strong>{t("theme_light")}</strong>
                <small>Crisp white and clean slate</small>
              </div>
              {!isDark && <Check size={16} className="selected-check" />}
            </button>

            <button
              type="button"
              className={`theme-card-option ${isDark ? "selected" : ""}`}
              onClick={() => setTheme("dark")}
            >
              <div className="theme-preview-box dark-preview">
                <Moon size={24} />
              </div>
              <div className="theme-card-text">
                <strong>{t("theme_dark")}</strong>
                <small>Deep navy with cyan & purple accents</small>
              </div>
              {isDark && <Check size={16} className="selected-check" />}
            </button>
          </div>
        </section>

        {/* Language Selection */}
        <section className="card settings-section">
          <div className="section-title-wrap">
            <Globe size={20} className="section-icon" />
            <div>
              <h3>Regional Language</h3>
              <p className="section-sub">{t("settings_language_desc")}</p>
            </div>
          </div>

          <div className="lang-settings-grid">
            {languages.map((l) => (
              <button
                key={l.code}
                type="button"
                className={`lang-setting-card ${l.code === lang ? "selected" : ""}`}
                onClick={() => {
                  setLanguage(l.code);
                  addToast(`Language updated to ${l.nativeName}`, "info");
                }}
              >
                <span className="lang-card-native">{l.nativeName}</span>
                <span className="lang-card-en">{l.name}</span>
                {l.code === lang && (
                  <span className="active-dot-pill">Active</span>
                )}
              </button>
            ))}
          </div>
        </section>

        {/* Merchant Profile */}
        <section className="card settings-section">
          <div className="section-title-wrap">
            <Store size={20} className="section-icon" />
            <div>
              <h3>{t("settings_profile")}</h3>
              <p className="section-sub">Verified store information</p>
            </div>
          </div>

          <form onSubmit={handleSave} className="settings-form">
            <div className="form-row">
              <label>
                <span>Merchant Terminal ID</span>
                <input type="text" value="M001" disabled className="input-disabled" />
              </label>
              <label>
                <span>{t("merchant_name")}</span>
                <input
                  type="text"
                  value={profile.name}
                  onChange={(e) =>
                    setProfile((p) => ({ ...p, name: e.target.value }))
                  }
                />
              </label>
            </div>

            <div className="form-row">
              <label>
                <span>{t("merchant_category")}</span>
                <input
                  type="text"
                  value={profile.category}
                  onChange={(e) =>
                    setProfile((p) => ({ ...p, category: e.target.value }))
                  }
                />
              </label>
              <label>
                <span>Settlement VPA / UPI ID</span>
                <input
                  type="text"
                  value={profile.upiId}
                  onChange={(e) =>
                    setProfile((p) => ({ ...p, upiId: e.target.value }))
                  }
                />
              </label>
            </div>

            <button type="submit" className="btn btn-primary btn-save">
              <Save size={16} /> {t("save_settings")}
            </button>
          </form>
        </section>

        {/* Voice & Notification Preferences */}
        <section className="card settings-section">
          <div className="section-title-wrap">
            <Bell size={20} className="section-icon" />
            <div>
              <h3>{t("settings_notifications")} & Voice</h3>
              <p className="section-sub">Alerts and audio feedback configuration</p>
            </div>
          </div>

          <div className="toggles-list">
            <label className="toggle-item">
              <div className="toggle-text">
                <strong>{t("notif_sound")}</strong>
                <small>Paytm Soundbox voice chime when payments succeed</small>
              </div>
              <input
                type="checkbox"
                checked={notifs.soundAlerts}
                onChange={(e) =>
                  setNotifs((n) => ({ ...n, soundAlerts: e.target.checked }))
                }
              />
            </label>

            <label className="toggle-item">
              <div className="toggle-text">
                <strong>{t("notif_whatsapp")}</strong>
                <small>Automatic dispatch of EOD summary at 9:00 PM</small>
              </div>
              <input
                type="checkbox"
                checked={notifs.whatsappSummary}
                onChange={(e) =>
                  setNotifs((n) => ({ ...n, whatsappSummary: e.target.checked }))
                }
              />
            </label>

            <label className="toggle-item">
              <div className="toggle-text">
                <strong>{t("notif_pending")}</strong>
                <small>Alert if a payment is pending for more than 15 minutes</small>
              </div>
              <input
                type="checkbox"
                checked={notifs.pendingReminders}
                onChange={(e) =>
                  setNotifs((n) => ({ ...n, pendingReminders: e.target.checked }))
                }
              />
            </label>

            <label className="toggle-item">
              <div className="toggle-text">
                <strong>Auto-speak AI Responses</strong>
                <small>Automatically narrate answers in selected language</small>
              </div>
              <input
                type="checkbox"
                checked={voicePrefs.autoSpeak}
                onChange={(e) =>
                  setVoicePrefs((v) => ({ ...v, autoSpeak: e.target.checked }))
                }
              />
            </label>
          </div>
        </section>
      </div>
    </div>
  );
}
