import { useState, useRef, useEffect } from "react";
import {
  X,
  Send,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Bot,
  User,
  Sparkles,
  Trash2,
  TrendingUp,
  Clock,
  ArrowRight,
} from "lucide-react";
import { useLanguage } from "../context/LanguageContext";
import { formatMoney } from "../services/api";

export function AIAssistantDrawer({
  isOpen,
  onClose,
  analyticsData,
  transactions = [],
  voiceSummary,
  eodReport,
}) {
  const { lang, currentLangObj, t } = useLanguage();
  const [messages, setMessages] = useState(() => [
    {
      id: "welcome",
      sender: "ai",
      text:
        lang === "ta"
          ? "வணக்கம்! நான் உங்கள் வியாபார்மித்ரா AI வணிக ஆலோசகர். இன்றைய வரவு, பரிவர்த்தனைகள் அல்லது வணிக வளர்ச்சி குறித்து எதையும் கேளுங்கள்."
          : lang === "hi"
          ? "नमस्ते! मैं आपका व्यापारमित्र AI सलाहकार हूँ। आज की कमाई, सबसे व्यस्त समय या व्यापार वृद्धि के बारे में मुझसे कुछ भी पूछें।"
          : "Hello! I am your VyaparMitra AI merchant advisor. Ask me anything about today's received payments, busiest hours, or business growth.",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);

  const [input, setInput] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [speakingId, setSpeakingId] = useState(null);
  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isThinking]);

  // Suggested prompts
  const suggestedPrompts = [
    { key: "prompt_1", label: t("ai_prompt_1") },
    { key: "prompt_2", label: t("ai_prompt_2") },
    { key: "prompt_3", label: t("ai_prompt_3") },
    { key: "prompt_4", label: t("ai_prompt_4") },
    { key: "prompt_5", label: t("ai_prompt_5") },
  ];

  // Stop any active speech on unmount or drawer close
  useEffect(() => {
    if (!isOpen && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      setSpeakingId(null);
    }
  }, [isOpen]);

  // Intelligent responder based on real backend data
  const generateResponse = (userQuery) => {
    const q = userQuery.toLowerCase();
    const today = analyticsData?.today || voiceSummary?.today || {};
    const yesterday = analyticsData?.yesterday || voiceSummary?.yesterday || {};
    const receivedToday = Number(today.receivedAmount || today.amount_received || 0);
    const receivedYesterday = Number(yesterday.receivedAmount || yesterday.amount_received || 0);
    const successfulCount = Number(today.successfulTransactions || today.successful_transactions || 0);
    const pendingAmount = Number(today.pendingAmount || today.pending_amount || 0);
    const failedAmount = Number(today.failedAmount || today.failed_amount || 0);
    const customersCount = Number(today.customers || 0);

    const hourly = analyticsData?.hourly || [];
    const peak = [...hourly].sort((a, b) => b.successfulTransactions - a.successfulTransactions)[0];
    const peakHour = peak ? peak.hour : "12:00 PM";
    const peakCount = peak ? peak.successfulTransactions : 3;

    const diff = receivedToday - receivedYesterday;
    const pct = receivedYesterday > 0 ? Math.round((diff / receivedYesterday) * 100) : 0;

    // Check query intents
    if (q.includes("how much") || q.includes("received") || q.includes("amount") || q.includes("कमाई") || q.includes("பெற்றேன்") || q.includes("தொகை")) {
      return lang === "ta"
        ? `இன்று நீங்கள் ${formatMoney(receivedToday)} பெற்றுள்ளீர்கள் (${successfulCount} வெற்றிகரமான பரிவர்த்தனைகள்). நிலுவையில் உள்ள தொகை: ${formatMoney(pendingAmount)}.`
        : lang === "hi"
        ? `आज आपको ${successfulCount} सफल भुगतानों से कुल ${formatMoney(receivedToday)} प्राप्त हुए हैं। लंबित भुगतान: ${formatMoney(pendingAmount)}.`
        : `You have received ${formatMoney(receivedToday)} today across ${successfulCount} successful payments. Pending payments stand at ${formatMoney(pendingAmount)}.`;
    }

    if (q.includes("busiest") || q.includes("hours") || q.includes("peak") || q.includes("व्यस्त") || q.includes("நேரங்கள்")) {
      return lang === "ta"
        ? `இன்றைய அதிக வர்த்தக நேரம் ${peakHour} ஆகும், அப்போது ${peakCount} வெற்றிகரமான கொடுப்பனவுகள் பதிவாகியுள்ளன. மதியம் 11:00 முதல் 1:00 வரை அதிக வாடிக்கையாளர்கள் வருகிறார்கள்.`
        : lang === "hi"
        ? `आज का सबसे व्यस्त भुगतान समय ${peakHour} था, जिसमें ${peakCount} सफल भुगतान दर्ज किए गए। पूर्वाह्न 11:00 से दोपहर 1:00 के बीच सबसे अधिक ग्राहक आते हैं।`
        : `Your busiest payment hour was ${peakHour} with ${peakCount} successful payments. The peak cluster is between 11:00 AM and 1:00 PM.`;
    }

    if (q.includes("compare") || q.includes("yesterday") || q.includes("तुलना") || q.includes("ஒப்பிடு")) {
      const dirText = diff >= 0 ? "increased" : "decreased";
      return lang === "ta"
        ? `இன்றைய வரவு ${formatMoney(receivedToday)} நேற்றைய ${formatMoney(receivedYesterday)}-ஐ விட ${Math.abs(pct)}% (${formatMoney(Math.abs(diff))}) ${diff >= 0 ? "அதிகரித்துள்ளது" : "குறைந்துள்ளது"}.`
        : lang === "hi"
        ? `आज की प्राप्त राशि ${formatMoney(receivedToday)} कल की ${formatMoney(receivedYesterday)} की तुलना में ${Math.abs(pct)}% (${formatMoney(Math.abs(diff))}) ${diff >= 0 ? "अधिक" : "कम"} है।`
        : `Today's received amount of ${formatMoney(receivedToday)} is ${dirText} by ${Math.abs(pct)}% (${formatMoney(Math.abs(diff))}) compared to yesterday's ${formatMoney(receivedYesterday)}.`;
    }

    if (q.includes("report") || q.includes("summary") || q.includes("eod") || q.includes("रिपोर्ट") || q.includes("அறிக்கை")) {
      return lang === "ta"
        ? `📊 இன்றைய வணிகச் சுருக்கம்:\n• பெறப்பட்ட தொகை: ${formatMoney(receivedToday)}\n• வெற்றிகரமான பரிவர்த்தனைகள்: ${successfulCount}\n• நிலுவையில் உள்ள தொகை: ${formatMoney(pendingAmount)}\n• தோல்வி தொகை: ${formatMoney(failedAmount)}\n• வாடிக்கையாளர்கள்: ${customersCount}\n\nபரிந்துரை: நிலுவையில் உள்ள ${formatMoney(pendingAmount)} கொடுப்பனவுகளை உடனடியாக சரிபார்க்கவும்.`
        : lang === "hi"
        ? `📊 आज का व्यवसाय सारांश:\n• प्राप्त राशि: ${formatMoney(receivedToday)}\n• सफल लेन-देन: ${successfulCount}\n• लंबित राशि: ${formatMoney(pendingAmount)}\n• विफल राशि: ${formatMoney(failedAmount)}\n• कुल ग्राहक: ${customersCount}\n\nसिफारिश: लंबित ${formatMoney(pendingAmount)} का जल्द निपटान सुनिश्चित करें।`
        : `📊 Today's Business Summary:\n• Amount Received: ${formatMoney(receivedToday)}\n• Successful Payments: ${successfulCount}\n• Pending Payments: ${formatMoney(pendingAmount)}\n• Failed Payments: ${formatMoney(failedAmount)}\n• Unique Customers: ${customersCount}\n\nAction: Follow up on pending payments (${formatMoney(pendingAmount)}) and stock up ahead of 11:00 AM peak hours.`;
    }

    if (q.includes("improve") || q.includes("grow") || q.includes("advice") || q.includes("बढ़ा") || q.includes("மேம்படுத்துவது")) {
      return lang === "ta"
        ? `💡 வணிக வளர்ச்சி பரிந்துரைகள்:\n1. நிலுவையில் உள்ள ${formatMoney(pendingAmount)} UPI கொடுப்பனவுகளைத் தொடருங்கள்.\n2. அதிக வர்த்தகம் நடக்கும் ${peakHour} நேரத்திற்கு முன் சிறப்பு சலுகைகளை அறிவிக்கவும்.\n3. வாடிக்கையாளர் C-101 போன்ற மீண்டும் வரும் வாடிக்கையாளர்களுக்கு விசுவாச தள்ளுபடிகளை வழங்குங்கள்.\n4. அனைத்து QR குறியீடுகளும் கவுண்டரில் தெளிவாக தெரியும் வகையில் வைக்கவும்.`
        : lang === "hi"
        ? `💡 व्यापार सुधार के लिए 4 मुख्य सुझाव:\n1. लंबित ${formatMoney(pendingAmount)} UPI भुगतानों का तुरंत फॉलो-अप लें।\n2. सबसे व्यस्त समय (${peakHour}) के दौरान विशेष कॉम्बो ऑफ़र चलाएं।\n3. बार-बार आने वाले ग्राहक (जैसे C-101) के लिए लॉयल्टी डिस्काउंट शुरू करें।\n4. काउंटर पर Paytm QR कोड स्पष्ट रखें।`
        : `💡 4 Strategic Recommendations for Vyapar Store:\n1. Reconcile pending payments totaling ${formatMoney(pendingAmount)} to recover potential revenue.\n2. Capitalize on peak hours (${peakHour}) by running quick-checkout bundles.\n3. Reward repeat customers (e.g. C-101 who transacted multiple times) with loyalty benefits.\n4. Encourage UPI Soundbox confirmations to reduce checkout friction.`;
    }

    // Default intelligent contextual response
    return lang === "ta"
      ? `உங்கள் வணிகத் தரவுப்படி, இன்று நீங்கள் ${formatMoney(receivedToday)} பெற்றுள்ளீர்கள் (${successfulCount} வெற்றிகரமான பரிவர்த்தனைகள்). மேலும் ஏதேனும் அறிய வேண்டுமா?`
      : lang === "hi"
      ? `आपके लाइव रिकॉर्ड के अनुसार, आज आपने ${successfulCount} भुगतानों से ${formatMoney(receivedToday)} प्राप्त किए हैं। क्या आप किसी विशिष्ट रिपोर्ट के बारे में जानना चाहते हैं?`
      : `Based on your live store transactions, you have received ${formatMoney(receivedToday)} across ${successfulCount} completed payments today. Would you like a detailed breakdown of peak hours or customer retention?`;
  };

  const handleSend = (textToSend = input) => {
    const trimmed = textToSend.trim();
    if (!trimmed) return;

    const userMessage = {
      id: Date.now().toString(),
      sender: "user",
      text: trimmed,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsThinking(true);

    // Simulate natural AI thinking delay
    setTimeout(() => {
      const responseText = generateResponse(trimmed);
      const aiMessage = {
        id: (Date.now() + 1).toString(),
        sender: "ai",
        text: responseText,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, aiMessage]);
      setIsThinking(false);

      // Auto-read response if speech is enabled
      speakMessage(responseText, aiMessage.id);
    }, 700);
  };

  const speakMessage = (text, id) => {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();

    if (speakingId === id) {
      setSpeakingId(null);
      return;
    }

    const cleanText = text.replace(/[*•#]/g, "");
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = currentLangObj.speechLang || "en-IN";
    utterance.rate = 0.9;

    utterance.onend = () => setSpeakingId(null);
    utterance.onerror = () => setSpeakingId(null);

    setSpeakingId(id);
    window.speechSynthesis.speak(utterance);
  };

  const toggleVoiceInput = () => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser. Please use Chrome or Edge.");
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = currentLangObj.speechLang || "en-IN";
    recognition.interimResults = false;

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
      handleSend(transcript);
    };

    recognition.onerror = () => {
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  const clearChat = () => {
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    setSpeakingId(null);
    setMessages([
      {
        id: "cleared",
        sender: "ai",
        text: t("ai_ask_placeholder"),
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ]);
  };

  if (!isOpen) return null;

  return (
    <div className="ai-drawer-overlay">
      <div className="ai-drawer">
        {/* Drawer Header */}
        <div className="ai-drawer-header">
          <div className="ai-header-brand">
            <div className="ai-robot-avatar">
              <Bot size={22} />
              <span className="online-indicator" />
            </div>
            <div>
              <div className="ai-header-title-row">
                <h3>{t("ai_drawer_title")}</h3>
                <span className="ai-version-pill">v2.5</span>
              </div>
              <p className="ai-header-subtitle">{t("ai_drawer_subtitle")}</p>
            </div>
          </div>

          <div className="ai-header-actions">
            <button
              className="icon-button"
              onClick={clearChat}
              title={t("ai_clear")}
              aria-label="Clear chat history"
            >
              <Trash2 size={16} />
            </button>
            <button
              className="icon-button close-drawer-btn"
              onClick={onClose}
              title={t("close")}
              aria-label="Close assistant"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Suggested Prompt Chips */}
        <div className="ai-suggested-chips-container">
          <span className="chips-label">
            <Sparkles size={13} /> {t("ai_suggested_prompts")}:
          </span>
          <div className="chips-scroll">
            {suggestedPrompts.map((p) => (
              <button
                key={p.key}
                className="prompt-chip"
                onClick={() => handleSend(p.label)}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Message Thread */}
        <div className="ai-messages-container">
          {messages.map((msg) => {
            const isUser = msg.sender === "user";
            return (
              <div
                key={msg.id}
                className={`chat-message ${isUser ? "message-user" : "message-ai"}`}
              >
                <div className="chat-avatar">
                  {isUser ? <User size={16} /> : <Bot size={16} />}
                </div>

                <div className="chat-bubble-wrap">
                  <div className="chat-bubble">
                    <p className="chat-text">{msg.text}</p>
                  </div>

                  <div className="chat-meta">
                    <span className="chat-time">{msg.timestamp}</span>
                    {!isUser && "speechSynthesis" in window && (
                      <button
                        className={`speak-btn ${speakingId === msg.id ? "speaking" : ""}`}
                        onClick={() => speakMessage(msg.text, msg.id)}
                        title={speakingId === msg.id ? "Stop voice" : t("ai_listen")}
                      >
                        {speakingId === msg.id ? (
                          <>
                            <VolumeX size={13} />
                            <span>Speaking...</span>
                          </>
                        ) : (
                          <>
                            <Volume2 size={13} />
                            <span>{t("ai_listen")}</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {isThinking && (
            <div className="chat-message message-ai">
              <div className="chat-avatar">
                <Bot size={16} />
              </div>
              <div className="chat-bubble thinking-bubble">
                <div className="typing-dots">
                  <span />
                  <span />
                  <span />
                </div>
                <span className="thinking-text">VyaparMitra AI is analyzing...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Drawer Input Bar */}
        <form
          className="ai-input-form"
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
        >
          <button
            type="button"
            className={`mic-button ${isListening ? "listening" : ""}`}
            onClick={toggleVoiceInput}
            title={isListening ? "Stop Voice Input" : "Speak to VyaparMitra"}
            aria-label="Microphone input"
          >
            {isListening ? <MicOff size={18} /> : <Mic size={18} />}
          </button>

          <input
            type="text"
            className="ai-chat-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t("ai_ask_placeholder")}
            disabled={isThinking}
          />

          <button
            type="submit"
            className="send-button"
            disabled={!input.trim() || isThinking}
            title={t("ai_send")}
            aria-label="Send message"
          >
            <Send size={16} />
          </button>
        </form>
      </div>
    </div>
  );
}
