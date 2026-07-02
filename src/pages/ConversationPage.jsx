import { useEffect, useRef, useState } from "react";
import { MessageCircle, Mic, Send, Volume2, VolumeX } from "lucide-react";
import Navbar from "../components/Navbar";
import NeuralBackground from "../components/NeuralBackground";
import api from "../api/axios";

function cleanForSpeech(text) {
  return text
    .replace(/\[.*?\]/g, "")
    .replace(/\*\*/g, "")
    .replace(/#{1,6}\s/g, "")
    .replace(/[•\-]\s/g, "")
    .trim();
}

const SCENARIOS = [
  {
    key: "general",
    icon: "💬",
    label: "Суҳбати озод",
    desc: "Бо дӯсти англисзабон суҳбати оддӣ кун",
    welcome: "Hi! How are you today? What's on your mind?",
  },
  {
    key: "cafe",
    icon: "☕",
    label: "Дар кофехона",
    desc: "Дар кофехона хӯрок ва нӯшокӣ фармоиш деҳ",
    welcome: "Welcome! What can I get for you today?",
  },
  {
    key: "interview",
    icon: "💼",
    label: "Мусоҳиба",
    desc: "Мусоҳибаи корӣ ба забони англисӣ",
    welcome: "Good morning! Please have a seat. Can you tell me a bit about yourself?",
  },
  {
    key: "travel",
    icon: "✈️",
    label: "Сайёҳӣ",
    desc: "Дар Лондон бо роҳнамо суҳбат кун",
    welcome: "Hello there! Welcome to London! Where would you like to go?",
  },
];

function parseCorrectionFromReply(text) {
  const match = text.match(/\[Тасҳеҳ:([\s\S]*?)\]/);
  if (!match) return { main: text, correction: null };
  const correction = match[1].trim();
  const main = text.replace(match[0], "").trim();
  return { main, correction };
}

export default function ConversationPage() {
  const [scenario, setScenario] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [micActive, setMicActive] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(() => localStorage.getItem("tts_enabled") !== "false");
  const [speakingIndex, setSpeakingIndex] = useState(null);
  const bottomRef = useRef(null);
  const autoSendTimerRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    return () => window.speechSynthesis.cancel();
  }, []);

  function toggleTts() {
    setTtsEnabled((prev) => {
      const next = !prev;
      localStorage.setItem("tts_enabled", String(next));
      if (!next) window.speechSynthesis.cancel();
      return next;
    });
  }

  function speakResponse(text, index = null) {
    const cleanText = cleanForSpeech(text);
    if (!cleanText) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = "en-US";
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.onstart = () => setSpeakingIndex(index);
    utterance.onend = () => setSpeakingIndex(null);
    utterance.onerror = () => setSpeakingIndex(null);
    window.speechSynthesis.speak(utterance);
  }

  function selectScenario(s) {
    setScenario(s);
    setMessages([{ role: "ai", text: s.welcome }]);
    setInput("");
    if (ttsEnabled) speakResponse(s.welcome, 0);
  }

  async function sendMessage(overrideText) {
    const userText = (overrideText ?? input).trim();
    if (!userText || loading) return;
    clearTimeout(autoSendTimerRef.current);
    setInput("");
    const newMessages = [...messages, { role: "user", text: userText }];
    setMessages(newMessages);
    setLoading(true);

    try {
      const history = newMessages.slice(-7).map(m => ({
        role: m.role === "user" ? "user" : "assistant",
        content: m.text,
      }));
      const res = await api.post("/ai/conversation", {
        message: userText,
        scenario: scenario.key,
        history: history.slice(0, -1),
      });
      setMessages(prev => {
        const updated = [...prev, { role: "ai", text: res.data.reply }];
        if (ttsEnabled) speakResponse(res.data.reply, updated.length - 1);
        return updated;
      });
    } catch {
      setMessages(prev => [...prev, { role: "ai", text: "Хато рух дод. Лутфан боз кӯшиш кун." }]);
    } finally {
      setLoading(false);
    }
  }

  function handleInputChange(e) {
    clearTimeout(autoSendTimerRef.current);
    setInput(e.target.value);
  }

  function startMic() {
    const SpeechRecognitionImpl = window.webkitSpeechRecognition || window.SpeechRecognition;
    if (!SpeechRecognitionImpl) return;
    const recognition = new SpeechRecognitionImpl();
    recognition.lang = "en-US";
    recognition.continuous = false;
    recognition.interimResults = false;
    setMicActive(true);
    recognition.onresult = (e) => {
      const transcript = e.results[0][0].transcript;
      setInput(transcript);
      setMicActive(false);
      clearTimeout(autoSendTimerRef.current);
      autoSendTimerRef.current = setTimeout(() => sendMessage(transcript), 1500);
    };
    recognition.onerror = () => setMicActive(false);
    recognition.onend = () => setMicActive(false);
    recognition.start();
  }

  return (
    <div style={{ minHeight: "100vh", background: "#061A1C", color: "white", display: "flex", flexDirection: "column" }}>
      <Navbar />
      <div style={{ position: "relative", flex: 1, overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
          <NeuralBackground />
        </div>

        <div style={{ maxWidth: 760, margin: "0 auto", padding: "32px 16px 24px", position: "relative", zIndex: 1, display: "flex", flexDirection: "column", minHeight: "calc(100vh - 64px)" }}>

          {/* Header */}
          <div style={{ marginBottom: 24, display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                <MessageCircle size={24} style={{ color: "#14B8A6" }} />
                <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>Суҳбат бо AI</h1>
              </div>
              <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, margin: 0 }}>
                Ба забони англисӣ суҳбат кун — AI хатоҳои граммативиро нишон медиҳад
              </p>
            </div>
            <button
              onClick={toggleTts}
              title={ttsEnabled ? "Хомӯш кардани садо" : "Фаъол кардани садо"}
              style={{
                width: 40, height: 40, borderRadius: 8, flexShrink: 0,
                border: "1px solid rgba(45,212,191,0.25)",
                background: ttsEnabled ? "rgba(20,184,166,0.12)" : "rgba(255,255,255,0.04)",
                color: ttsEnabled ? "#2DD4BF" : "rgba(255,255,255,0.4)",
                display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
              }}
            >
              {ttsEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
            </button>
          </div>

          {/* Scenario selector */}
          <div style={{
            display: "flex",
            gap: 8,
            marginBottom: 20,
            flexWrap: "wrap",
          }}>
            {SCENARIOS.map(s => (
              <button
                key={s.key}
                onClick={() => selectScenario(s)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "8px 14px",
                  borderRadius: 8,
                  border: scenario?.key === s.key
                    ? "1.5px solid #14B8A6"
                    : "1.5px solid rgba(255,255,255,0.12)",
                  background: scenario?.key === s.key
                    ? "rgba(20,184,166,0.15)"
                    : "rgba(255,255,255,0.04)",
                  color: scenario?.key === s.key ? "#2DD4BF" : "rgba(255,255,255,0.6)",
                  fontWeight: 600,
                  fontSize: 13,
                  cursor: "pointer",
                  transition: "all 0.15s",
                }}
              >
                <span>{s.icon}</span>
                <span>{s.label}</span>
              </button>
            ))}
          </div>

          {/* Scenario description */}
          {scenario && (
            <div style={{
              background: "rgba(251,191,36,0.07)",
              border: "1px solid rgba(251,191,36,0.2)",
              borderRadius: 8,
              padding: "10px 14px",
              marginBottom: 16,
              color: "#FBBF24",
              fontSize: 13,
              fontWeight: 500,
            }}>
              {scenario.icon} {scenario.desc}
            </div>
          )}

          {/* Chat area */}
          <div style={{
            flex: 1,
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(45,212,191,0.12)",
            borderRadius: 10,
            padding: "16px",
            overflowY: "auto",
            maxHeight: "45vh",
            minHeight: 260,
            display: "flex",
            flexDirection: "column",
            gap: 12,
            marginBottom: 12,
          }}>
            {!scenario && (
              <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 10 }}>
                <MessageCircle size={36} style={{ color: "rgba(45,212,191,0.3)" }} />
                <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 14 }}>Сенарияро интихоб кун</p>
              </div>
            )}

            {messages.map((msg, i) => {
              const isUser = msg.role === "user";
              if (isUser) {
                return (
                  <div key={i} style={{ display: "flex", justifyContent: "flex-end" }}>
                    <div style={{
                      background: "rgba(20,184,166,0.2)",
                      border: "1px solid rgba(45,212,191,0.25)",
                      borderRadius: "12px 12px 2px 12px",
                      padding: "10px 14px",
                      maxWidth: "75%",
                      fontSize: 14,
                      color: "white",
                    }}>
                      {msg.text}
                    </div>
                  </div>
                );
              }
              const { main, correction } = parseCorrectionFromReply(msg.text);
              const isSpeaking = speakingIndex === i;
              return (
                <div key={i} style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "flex-start", maxWidth: "78%" }}>
                  <div style={{
                    position: "relative",
                    background: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "12px 12px 12px 2px",
                    padding: "10px 26px 16px 14px",
                    fontSize: 14,
                    color: "rgba(255,255,255,0.9)",
                    lineHeight: 1.55,
                  }}>
                    {main}
                    <button
                      onClick={() => speakResponse(msg.text, i)}
                      title="Гӯш кун"
                      style={{
                        position: "absolute", bottom: 6, right: 6,
                        background: "none", border: "none", padding: 2, cursor: "pointer",
                        color: "#2DD4BF", display: "flex",
                        animation: isSpeaking ? "speaker-pulse 1s infinite" : "none",
                      }}
                    >
                      <Volume2 size={14} />
                    </button>
                  </div>
                  {correction && (
                    <div style={{
                      background: "rgba(251,191,36,0.09)",
                      border: "1px solid rgba(251,191,36,0.25)",
                      borderRadius: 8,
                      padding: "8px 12px",
                      fontSize: 13,
                      color: "#FBBF24",
                    }}>
                      ✏️ Тасҳеҳ: {correction}
                    </div>
                  )}
                </div>
              );
            })}

            {loading && (
              <div style={{ display: "flex", gap: 5, padding: "6px 0" }}>
                {[0, 1, 2].map(i => (
                  <span key={i} style={{
                    width: 8, height: 8, borderRadius: "50%",
                    background: "rgba(45,212,191,0.5)",
                    animation: "typing 1s infinite",
                    animationDelay: `${i * 0.2}s`,
                    display: "inline-block",
                  }} />
                ))}
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Input row */}
          <div style={{
            display: "flex",
            gap: 8,
            alignItems: "center",
          }}>
            <input
              value={input}
              onChange={handleInputChange}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
              disabled={!scenario || loading}
              placeholder={scenario ? "Ба англисӣ бинависед ё гап занед..." : "Аввал сенарияро интихоб кун"}
              style={{
                flex: 1,
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(45,212,191,0.2)",
                borderRadius: 8,
                color: "white",
                fontSize: 14,
                padding: "11px 14px",
                outline: "none",
                fontFamily: "Inter, sans-serif",
              }}
            />
            <button
              onClick={startMic}
              disabled={!scenario || loading || micActive}
              title="Овоз"
              style={{
                width: 44,
                height: 44,
                borderRadius: 8,
                border: "1px solid rgba(45,212,191,0.25)",
                background: micActive ? "rgba(239,68,68,0.2)" : "rgba(255,255,255,0.05)",
                color: micActive ? "#F87171" : "#2DD4BF",
                cursor: scenario && !loading ? "pointer" : "not-allowed",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Mic size={18} />
            </button>
            <button
              onClick={() => sendMessage()}
              disabled={!input.trim() || !scenario || loading}
              style={{
                width: 44,
                height: 44,
                borderRadius: 8,
                border: "none",
                background: !input.trim() || !scenario || loading ? "rgba(20,184,166,0.25)" : "#14B8A6",
                color: "white",
                cursor: !input.trim() || !scenario || loading ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                transition: "background 0.15s",
              }}
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes typing {
          0%, 80%, 100% { opacity: 0.3; transform: scale(0.8); }
          40% { opacity: 1; transform: scale(1); }
        }
        @keyframes speaker-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.2); }
        }
      `}</style>
    </div>
  );
}
