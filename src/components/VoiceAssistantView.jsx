import { useState, useRef, useEffect } from "react";
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  RotateCw,
  Globe,
  Radio,
  PhoneCall,
  Sparkles,
  Bot,
  HelpCircle,
} from "lucide-react";
import { useLanguage } from "../context/LanguageContext";
import { merchantApi, formatMoney } from "../services/api";

export function VoiceAssistantView() {
  const { lang, languages, currentLangObj, setLanguage, t } = useLanguage();
  const [listening, setListening] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [statusMessage, setStatusMessage] = useState(t("voice_status_ready"));
  const [transcript, setTranscript] = useState("");
  const [history, setHistory] = useState([
    {
      query: "How much did I receive today?",
      answer: "You received ₹14,700 today from 6 successful payments.",
      time: "12:15 PM",
    },
  ]);

  const recognitionRef = useRef(null);

  useEffect(() => {
    setStatusMessage(t("voice_status_ready"));
  }, [lang, t]);

  // Clean up speech synthesis on leave
  useEffect(() => {
    return () => {
      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const askVoiceAgent = async (userQuestion) => {
    setProcessing(true);
    setStatusMessage(t("voice_status_processing"));

    try {
      const summary = await merchantApi.getVoiceSummary();
      const q = userQuestion.toLowerCase();
      const data = {
        receivedToday: summary.today.amount_received,
        successfulTransactions: summary.today.successful_transactions,
        pendingAmount: summary.today.pending_amount,
        failedAmount: summary.today.failed_amount,
        customers: summary.today.customers,
        yesterdayReceived: summary.yesterday.amount_received,
      };

      let reply = "";
      if (q.includes("pending") || q.includes("बाकी") || q.includes("நிலுவை")) {
        reply = lang === "ta"
          ? `நிலுவையில் உள்ள கொடுப்பனவுகள் மொத்தம் ${formatMoney(data.pendingAmount)} ஆகும்.`
          : lang === "hi"
          ? `लंबित भुगतान कुल ${formatMoney(data.pendingAmount)} हैं।`
          : `Pending payments currently total ${formatMoney(data.pendingAmount)}.`;
      } else if (q.includes("yesterday") || q.includes("कल") || q.includes("நேற்று")) {
        reply = lang === "ta"
          ? `நேற்று நீங்கள் ${formatMoney(data.yesterdayReceived)} பெற்றீர்கள்.`
          : lang === "hi"
          ? `कल आपको कुल ${formatMoney(data.yesterdayReceived)} प्राप्त हुए थे।`
          : `Yesterday you received ${formatMoney(data.yesterdayReceived)} in verified payments.`;
      } else if (q.includes("customer") || q.includes("ग्राहक") || q.includes("வாடிக்கையாளர்")) {
        reply = lang === "ta"
          ? `இன்று ${data.customers} வாடிக்கையாளர்கள் உங்களுக்கு பணம் செலுத்தியுள்ளனர்.`
          : lang === "hi"
          ? `आज ${data.customers} ग्राहकों ने आपको सफलतापूर्वक भुगतान किया।`
          : `${data.customers} unique customers made payments to your store today.`;
      } else if (q.includes("report") || q.includes("summary") || q.includes("रिपोर्ट") || q.includes("அறிக்கை")) {
        reply = lang === "ta"
          ? `இன்று நீங்கள் ${data.successfulTransactions} வெற்றிகரமான கொடுப்பனவுகள் மூலம் ${formatMoney(data.receivedToday)} பெற்றுள்ளீர்கள். நிலுவை: ${formatMoney(data.pendingAmount)}.`
          : lang === "hi"
          ? `आज आपको ${data.successfulTransactions} भुगतानों से ${formatMoney(data.receivedToday)} प्राप्त हुए। लंबित भुगतान: ${formatMoney(data.pendingAmount)}.`
          : `Today you received ${formatMoney(data.receivedToday)} from ${data.successfulTransactions} successful payments. Pending payments are ${formatMoney(data.pendingAmount)}.`;
      } else {
        reply = lang === "ta"
          ? `இன்று நீங்கள் ${data.successfulTransactions} வெற்றிகரமான கொடுப்பனவுகள் மூலம் ${formatMoney(data.receivedToday)} பெற்றுள்ளீர்கள்.`
          : lang === "hi"
          ? `आज आपको ${data.successfulTransactions} भुगतानों से ${formatMoney(data.receivedToday)} प्राप्त हुए हैं।`
          : `You received ${formatMoney(data.receivedToday)} today from ${data.successfulTransactions} successful payments.`;
      }

      setProcessing(false);
      setStatusMessage(t("voice_status_speaking"));
      setHistory((prev) => [
        {
          query: userQuestion,
          answer: reply,
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
        ...prev,
      ]);

      // Speak reply using Web Speech
      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
        setSpeaking(true);
        const speech = new SpeechSynthesisUtterance(reply);
        speech.lang = currentLangObj.speechLang || "en-IN";
        speech.rate = 0.88;
        speech.onend = () => {
          setSpeaking(false);
          setStatusMessage(t("voice_status_ready"));
        };
        speech.onerror = () => {
          setSpeaking(false);
          setStatusMessage(t("voice_status_ready"));
        };
        window.speechSynthesis.speak(speech);
      } else {
        setStatusMessage(t("voice_status_ready"));
      }
    } catch (err) {
      setProcessing(false);
      setStatusMessage(`Voice summary error: ${err.message}`);
    }
  };

  const startListening = () => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setStatusMessage("Web speech recognition is not supported in this browser. Please use Google Chrome or Edge.");
      return;
    }

    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
    }

    const recognition = new SpeechRecognition();
    recognition.lang = currentLangObj.speechLang || "en-IN";
    recognition.interimResults = false;

    recognition.onstart = () => {
      setListening(true);
      setStatusMessage(t("voice_status_listening"));
    };

    recognition.onresult = (event) => {
      const text = event.results[0][0].transcript;
      setTranscript(text);
      askVoiceAgent(text);
    };

    recognition.onerror = () => {
      setListening(false);
      setStatusMessage("Could not hear properly. Please tap to speak again.");
    };

    recognition.onend = () => {
      setListening(false);
      recognitionRef.current = null;
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setListening(false);
      setStatusMessage(t("voice_status_ready"));
    }
  };

  const stopSpeaking = () => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      setStatusMessage(t("voice_status_ready"));
    }
  };

  return (
    <div className="voice-page-wrapper">
      {/* Top Banner Card */}
      <div className="voice-hero-card">
        <div className="voice-hero-content">
          <div className="voice-badge-row">
            <span className="voice-pill">
              <Radio size={14} className="pulse-icon" /> VyaparMitra Voice
            </span>
            <span className="sarvam-pill">Sarvam AI Powered</span>
          </div>
          <h1 className="voice-hero-title">{t("voice_title")}</h1>
          <p className="voice-hero-subtitle">{t("voice_tagline")}</p>

          <div className="voice-lang-bar">
            <span className="voice-lang-label">
              <Globe size={15} /> Speaking Language:
            </span>
            <div className="voice-lang-chips">
              {languages.map((l) => (
                <button
                  key={l.code}
                  className={`voice-lang-chip ${l.code === lang ? "active" : ""}`}
                  onClick={() => setLanguage(l.code)}
                >
                  {l.nativeName}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="sarvam-info-banner">
          <PhoneCall size={20} className="phone-icon" />
          <div className="sarvam-info-text">
            <strong>Phone Voice Agent Integration</strong>
            <p>
              Merchants can also dial VyaparMitra directly on phone via Sarvam AI voicebot for hands-free audio reports.
            </p>
          </div>
        </div>
      </div>

      {/* Main Interactive Stage */}
      <div className="voice-stage-grid">
        <div className="voice-mic-stage card">
          <div className="mic-visualizer-container">
            {/* Visualizer audio bars */}
            <div
              className={`audio-visualizer ${
                listening ? "listening" : speaking ? "speaking" : "idle"
              }`}
            >
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((bar) => (
                <span key={bar} className={`bar bar-${bar}`} />
              ))}
            </div>

            {/* Giant Pulsing Mic Button */}
            <button
              className={`giant-mic-button ${
                listening ? "mic-active" : speaking ? "mic-speaking" : ""
              }`}
              onClick={listening ? stopListening : speaking ? stopSpeaking : startListening}
              aria-label="Microphone Button"
            >
              {listening ? (
                <MicOff size={42} />
              ) : speaking ? (
                <VolumeX size={42} />
              ) : (
                <Mic size={42} />
              )}
              <span className="mic-ripple ripple-1" />
              <span className="mic-ripple ripple-2" />
            </button>
          </div>

          <div className="voice-status-block">
            <div className="status-badge-live">
              <span
                className={`status-light ${
                  listening ? "light-listening" : speaking ? "light-speaking" : "light-ready"
                }`}
              />
              <span className="status-badge-text">{statusMessage}</span>
            </div>

            {transcript && (
              <div className="current-transcript">
                <small>Heard question:</small>
                <p>"{transcript}"</p>
              </div>
            )}

            <div className="stage-controls">
              {listening ? (
                <button className="btn btn-danger" onClick={stopListening}>
                  <MicOff size={16} /> {t("btn_stop_voice")}
                </button>
              ) : (
                <button className="btn btn-primary" onClick={startListening}>
                  <Mic size={16} /> {t("btn_start_voice")}
                </button>
              )}

              {speaking && (
                <button className="btn btn-outline" onClick={stopSpeaking}>
                  <VolumeX size={16} /> Stop Speaking
                </button>
              )}
            </div>
          </div>

          {/* Quick query starters */}
          <div className="quick-starter-queries">
            <span className="queries-label">{t("voice_try_questions")}</span>
            <div className="query-buttons-wrap">
              {[
                "How much did I receive today?",
                "What were my yesterday payments?",
                "How many customers paid today?",
                "Give me my full business report",
              ].map((queryText) => (
                <button
                  key={queryText}
                  className="quick-query-btn"
                  onClick={() => {
                    setTranscript(queryText);
                    askVoiceAgent(queryText);
                  }}
                >
                  <Sparkles size={13} /> {queryText}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Conversation Logs & Transcript */}
        <div className="voice-history-panel card">
          <div className="panel-header">
            <h3>Recent Voice Conversations</h3>
            <span className="badge">{history.length} records</span>
          </div>

          <div className="history-scroll-list">
            {history.map((item, idx) => (
              <div key={idx} className="voice-history-item">
                <div className="history-query-row">
                  <div className="history-q-bubble">
                    <span className="q-label">You:</span> "{item.query}"
                  </div>
                  <span className="history-time">{item.time}</span>
                </div>
                <div className="history-answer-row">
                  <div className="ai-icon-mini">
                    <Bot size={14} />
                  </div>
                  <div className="history-a-text">{item.answer}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="history-panel-footer">
            <span className="data-verified-tag">
              ✓ Verified against live merchant ledger (ID: M001)
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
