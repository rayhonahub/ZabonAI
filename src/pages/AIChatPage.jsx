import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import Skeleton from "../components/Skeleton";
import api from "../api/axios";
import { getLang } from "../utils/lang";
import { usePageTitle } from "../hooks/usePageTitle";

const TAB_CONFIG = {
  grammar: {
    label: "Grammar Check",
    sub: "Санҷиши грамматика",
    storageKey: "grammar_chat",
    backendType: "grammar",
    placeholder: "Ҷумларо барои санҷиш нависед...",
    tabActive: "bg-emerald-600 text-white shadow-sm",
    userBubble: "bg-emerald-600 text-white rounded-2xl rounded-tr-sm px-4 py-2.5 text-sm shadow-sm",
    aiBubble: "bg-emerald-500/10 border-emerald-500/30 text-white/90",
    badge: "bg-emerald-100 text-emerald-700",
    sendBtn: "bg-gradient-to-r from-emerald-500 to-emerald-600 shadow-emerald-500/30 hover:shadow-emerald-500/50",
    focusRing: "focus:border-emerald-500 focus:ring-emerald-500/10",
    dot: "bg-emerald-600/40",
  },
  tutor: {
    label: "Ask Tutor",
    sub: "Аз омӯзгор пурсидан",
    storageKey: "tutor_chat",
    backendType: "tutor",
    placeholder: "Ба омӯзгор савол диҳед...",
    tabActive: "bg-blue-600 text-white shadow-sm",
    userBubble: "bg-blue-600 text-white rounded-2xl rounded-tr-sm px-4 py-2.5 text-sm shadow-sm",
    aiBubble: "bg-blue-500/10 border-blue-500/30 text-white/90",
    badge: "bg-blue-100 text-blue-700",
    sendBtn: "bg-gradient-to-r from-blue-500 to-blue-600 shadow-blue-500/30 hover:shadow-blue-500/50",
    focusRing: "focus:border-blue-500 focus:ring-blue-500/10",
    dot: "bg-blue-600/40",
  },
  screenshot: {
    label: "Screenshot",
    sub: "Скриншот",
    storageKey: "screenshot_chat",
    backendType: "screenshot",
    placeholder: "Дар бораи расм савол диҳед (ихтиёрӣ)...",
    tabActive: "bg-purple-600 text-white shadow-sm",
    userBubble: "bg-purple-600 text-white rounded-2xl rounded-tr-sm px-4 py-2.5 text-sm shadow-sm",
    aiBubble: "bg-purple-500/10 border-purple-500/30 text-white/90",
    badge: "bg-purple-100 text-purple-700",
    sendBtn: "bg-gradient-to-r from-purple-500 to-purple-600 shadow-purple-500/30 hover:shadow-purple-500/50",
    focusRing: "focus:border-purple-500 focus:ring-purple-500/10",
    dot: "bg-purple-600/40",
  },
  voice: {
    label: "🎤 Voice",
    sub: "Машқи овозӣ",
    storageKey: "voice_chat",
    backendType: "voice",
    placeholder: "",
    tabActive: "bg-rose-600 text-white shadow-sm",
    userBubble: "bg-rose-600 text-white rounded-2xl rounded-tr-sm px-4 py-2.5 text-sm shadow-sm",
    aiBubble: "bg-rose-500/10 border-rose-500/30 text-white/90",
    badge: "bg-rose-100 text-rose-700",
    sendBtn: "bg-gradient-to-r from-rose-500 to-rose-600 shadow-rose-500/30 hover:shadow-rose-500/50",
    focusRing: "focus:border-rose-500 focus:ring-rose-500/10",
    dot: "bg-rose-600/40",
  },
};

const TAB_ORDER = ["grammar", "tutor", "screenshot", "voice"];

function UploadIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 16V4M12 4l-4 4M12 4l4 4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SendIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="m3 12 18-8-8 18-2-8-8-2Z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function MicIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3Z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" strokeLinecap="round" />
      <path d="M12 19v4M8 23h8" strokeLinecap="round" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function TypingDots({ dotClass }) {
  return (
    <div className="flex gap-1.5 px-1">
      <span className={`w-2 h-2 rounded-full ${dotClass} animate-typing`} style={{ animationDelay: "0s" }} />
      <span className={`w-2 h-2 rounded-full ${dotClass} animate-typing`} style={{ animationDelay: "0.2s" }} />
      <span className={`w-2 h-2 rounded-full ${dotClass} animate-typing`} style={{ animationDelay: "0.4s" }} />
    </div>
  );
}

function loadFromStorage(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export default function AIChatPage() {
  usePageTitle("AI Chat");
  const [searchParams] = useSearchParams();
  const defaultLessonId = searchParams.get("lesson_id") || "";

  const [activeTab, setActiveTab] = useState("tutor");
  const [historyLoading, setHistoryLoading] = useState(true);

  const [grammarMessages, setGrammarMessages] = useState(() => loadFromStorage(TAB_CONFIG.grammar.storageKey));
  const [tutorMessages, setTutorMessages] = useState(() => loadFromStorage(TAB_CONFIG.tutor.storageKey));
  const [screenshotMessages, setScreenshotMessages] = useState(() => loadFromStorage(TAB_CONFIG.screenshot.storageKey));
  const [voiceMessages, setVoiceMessages] = useState(() => loadFromStorage(TAB_CONFIG.voice.storageKey));

  const [grammarText, setGrammarText] = useState("");
  const [tutorText, setTutorText] = useState("");
  const [tutorLessonId, setTutorLessonId] = useState(defaultLessonId);
  const [screenshotText, setScreenshotText] = useState("");
  const [screenshotFile, setScreenshotFile] = useState(null);
  const [dragOver, setDragOver] = useState(false);

  const [voiceStatus, setVoiceStatus] = useState("idle"); // idle | recording | processing | done | error
  const [voiceRecognizedText, setVoiceRecognizedText] = useState("");
  const [voiceAiResponse, setVoiceAiResponse] = useState("");

  const scrollRef = useRef(null);
  const fileInputRef = useRef(null);

  const stateByTab = {
    grammar: [grammarMessages, setGrammarMessages],
    tutor: [tutorMessages, setTutorMessages],
    screenshot: [screenshotMessages, setScreenshotMessages],
    voice: [voiceMessages, setVoiceMessages],
  };
  const [messages, setMessages] = stateByTab[activeTab];
  const cfg = TAB_CONFIG[activeTab];
  const sending = messages.some((m) => m.pending);

  // Seed all three tabs from backend history once, but only if localStorage was empty for that tab
  useEffect(() => {
    api
      .get("/ai/history")
      .then((res) => {
        const sorted = [...res.data].reverse();
        const byType = { grammar: [], tutor: [], screenshot: [], voice: [] };
        sorted.forEach((h) => {
          const key = byType[h.chat_type] ? h.chat_type : "tutor";
          byType[key].push({
            id: h.id,
            message: h.message,
            response: h.response,
            pending: false,
          });
        });
        if (grammarMessages.length === 0 && byType.grammar.length) setGrammarMessages(byType.grammar);
        if (tutorMessages.length === 0 && byType.tutor.length) setTutorMessages(byType.tutor);
        if (screenshotMessages.length === 0 && byType.screenshot.length) setScreenshotMessages(byType.screenshot);
        if (voiceMessages.length === 0 && byType.voice.length) setVoiceMessages(byType.voice);
      })
      .finally(() => setHistoryLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    localStorage.setItem(TAB_CONFIG.grammar.storageKey, JSON.stringify(grammarMessages));
  }, [grammarMessages]);
  useEffect(() => {
    localStorage.setItem(TAB_CONFIG.tutor.storageKey, JSON.stringify(tutorMessages));
  }, [tutorMessages]);
  useEffect(() => {
    localStorage.setItem(TAB_CONFIG.screenshot.storageKey, JSON.stringify(screenshotMessages));
  }, [screenshotMessages]);
  useEffect(() => {
    localStorage.setItem(TAB_CONFIG.voice.storageKey, JSON.stringify(voiceMessages));
  }, [voiceMessages]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, activeTab]);

  function addMessage(setFn, msg) {
    setFn((prev) => [...prev, msg]);
  }

  function updateMessage(setFn, id, patch) {
    setFn((prev) => prev.map((m) => (m.id === id ? { ...m, ...patch } : m)));
  }

  function clearChat() {
    setMessages([]);
  }

  async function handleSend() {
    if (sending) return;
    const tempId = `temp-${Date.now()}`;
    const setFn = stateByTab[activeTab][1];

    if (activeTab === "grammar") {
      if (!grammarText.trim()) return;
      addMessage(setFn, { id: tempId, message: grammarText, response: null, pending: true });
      const payload = grammarText;
      setGrammarText("");
      try {
        const res = await api.post("/ai/grammar-check", { text: payload, lang: getLang() });
        updateMessage(setFn, tempId, { response: res.data.response, pending: false });
      } catch (err) {
        updateMessage(setFn, tempId, {
          response: err.response?.data?.detail || "Хато",
          pending: false,
          isError: true,
        });
      }
    }

    if (activeTab === "tutor") {
      if (!tutorText.trim()) return;
      addMessage(setFn, { id: tempId, message: tutorText, response: null, pending: true });
      const payload = tutorText;
      setTutorText("");
      try {
        const res = await api.post("/ai/ask", {
          question: payload,
          lesson_id: tutorLessonId ? Number(tutorLessonId) : null,
          lang: getLang(),
        });
        updateMessage(setFn, tempId, { response: res.data.response, pending: false });
      } catch (err) {
        updateMessage(setFn, tempId, {
          response: err.response?.data?.detail || "Хато",
          pending: false,
          isError: true,
        });
      }
    }

    if (activeTab === "screenshot") {
      if (!screenshotFile) return;
      addMessage(setFn, {
        id: tempId,
        message: screenshotText || "📷 Screenshot uploaded",
        previewUrl: URL.createObjectURL(screenshotFile),
        response: null,
        pending: true,
      });
      const form = new FormData();
      form.append("file", screenshotFile);
      if (screenshotText.trim()) form.append("question", screenshotText);
      form.append("lang", getLang());
      setScreenshotText("");
      setScreenshotFile(null);
      try {
        const res = await api.post("/ai/screenshot", form, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        updateMessage(setFn, tempId, { response: res.data.response, pending: false });
      } catch (err) {
        updateMessage(setFn, tempId, {
          response: err.response?.data?.detail || "Хато",
          pending: false,
          isError: true,
        });
      }
    }
  }

  function startVoiceRecording() {
    const SpeechRecognitionImpl = window.webkitSpeechRecognition || window.SpeechRecognition;
    if (!SpeechRecognitionImpl) {
      setVoiceStatus("error");
      return;
    }

    setVoiceRecognizedText("");
    setVoiceAiResponse("");

    const recognition = new SpeechRecognitionImpl();
    recognition.lang = "en-US";
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => setVoiceStatus("recording");

    recognition.onresult = async (event) => {
      const text = event.results[0][0].transcript;
      setVoiceRecognizedText(text);
      setVoiceStatus("processing");
      try {
        const res = await api.post("/ai/grammar-check", { text, lang: getLang() });
        setVoiceAiResponse(res.data.response);
        setVoiceStatus("done");
        addMessage(setVoiceMessages, {
          id: `voice-${Date.now()}`,
          message: `[VOICE] ${text}`,
          response: res.data.response,
          pending: false,
        });
      } catch {
        setVoiceStatus("error");
      }
    };

    recognition.onerror = () => setVoiceStatus("error");
    recognition.start();
  }

  function handleDrop(e) {
    e.preventDefault();
    setDragOver(false);
    const dropped = e.dataTransfer.files?.[0];
    if (dropped && dropped.type.startsWith("image/")) {
      setScreenshotFile(dropped);
    }
  }

  const currentText = activeTab === "grammar" ? grammarText : activeTab === "tutor" ? tutorText : screenshotText;
  const setCurrentText =
    activeTab === "grammar" ? setGrammarText : activeTab === "tutor" ? setTutorText : setScreenshotText;
  const canSend = activeTab === "screenshot" ? !!screenshotFile : !!currentText.trim();

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'linear-gradient(160deg, #061A1C 0%, #0A2A2E 45%, #0E3A3F 100%)' }}>
      <Navbar />

      <div className="max-w-3xl w-full mx-auto px-4 sm:px-6 py-8 flex-1 flex flex-col">
        <h1 className="text-2xl font-extrabold mb-1" style={{ color: 'white' }}>AI Tutor</h1>
        <p className="mb-6" style={{ color: 'rgba(255,255,255,0.5)' }}>AI Омӯзгор</p>

        <div className="flex items-center justify-between gap-2 mb-5 flex-wrap">
          <div className="glass-card flex gap-1 rounded-xl p-1.5 w-full sm:w-fit">
            {TAB_ORDER.map((key) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                  activeTab === key ? TAB_CONFIG[key].tabActive : "hover:bg-white/5"
                }`}
                style={activeTab === key ? undefined : { color: 'rgba(255,255,255,0.6)' }}
              >
                {TAB_CONFIG[key].label}
              </button>
            ))}
          </div>

          <button
            onClick={clearChat}
            disabled={messages.length === 0}
            className="flex items-center gap-1.5 text-xs font-semibold hover:text-red-400 disabled:opacity-40 transition-colors duration-150 px-2"
            style={{ color: 'rgba(255,255,255,0.4)' }}
          >
            <TrashIcon />
            Пок кардан
          </button>
        </div>

        <div
          ref={scrollRef}
          className="glass-card flex-1 rounded-2xl p-4 sm:p-6 mb-4 overflow-y-auto max-h-[55vh] min-h-[320px] flex flex-col gap-4"
        >
          {historyLoading && (
            <div className="space-y-3">
              <div className="flex justify-end">
                <Skeleton className="h-10 w-48 rounded-2xl" />
              </div>
              <div className="flex justify-start">
                <Skeleton className="h-16 w-64 rounded-2xl" />
              </div>
              <div className="flex justify-end">
                <Skeleton className="h-10 w-40 rounded-2xl" />
              </div>
            </div>
          )}

          {!historyLoading && messages.length === 0 && (
            <div className="flex-1 flex flex-col items-center justify-center text-center py-10" style={{ color: 'rgba(255,255,255,0.4)' }}>
              <p className="text-3xl mb-2">💬</p>
              <p className="text-sm">Сӯҳбатро оғоз кун</p>
              <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.3)' }}>{cfg.sub}</p>
            </div>
          )}

          {messages.map((m) => (
            <div key={m.id} className="flex flex-col gap-2 animate-fade-in">
              <div className="flex justify-end">
                <div className={`max-w-[80%] ${cfg.userBubble}`}>
                  <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full mb-1.5 ${cfg.badge}`}>
                    {cfg.label}
                  </span>
                  {m.previewUrl && (
                    <img src={m.previewUrl} alt="upload" className="block rounded-lg mb-2 max-h-40 object-cover" />
                  )}
                  <p>{m.message}</p>
                </div>
              </div>

              <div className="flex justify-start">
                <div
                  className={`max-w-[80%] rounded-2xl rounded-tl-sm px-4 py-2.5 text-sm shadow-sm border ${
                    m.isError ? "bg-red-500/10 border-red-500/30 text-red-400" : cfg.aiBubble
                  }`}
                >
                  {m.pending ? <TypingDots dotClass={cfg.dot} /> : <p className="whitespace-pre-wrap">{m.response}</p>}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="glass-card rounded-2xl p-4">
          {activeTab === "voice" ? (
            <div className="flex flex-col items-center text-center py-2">
              <button
                onClick={startVoiceRecording}
                disabled={voiceStatus === "recording" || voiceStatus === "processing"}
                className={`w-24 h-24 rounded-full flex items-center justify-center text-white shadow-lg transition-all duration-200 mb-4 disabled:opacity-70 ${
                  voiceStatus === "recording" ? "bg-red-500 animate-pulse" : "bg-rose-600 hover:bg-rose-700"
                }`}
              >
                <MicIcon />
              </button>

              <p className="text-sm mb-4" style={{ color: 'rgba(255,255,255,0.5)' }}>
                {voiceStatus === "idle" && "Тугмаро пахш кун ва бо забони англисӣ гап зан"}
                {voiceStatus === "recording" && "🔴 Сабт... ҳозир гап зан!"}
                {voiceStatus === "processing" && "⏳ Коркард шуда истодааст..."}
                {voiceStatus === "error" && "❌ Овоз шинохта нашуд"}
                {voiceStatus === "done" && "✅ Тайёр"}
              </p>

              {voiceStatus === "done" && (
                <div className="text-left w-full space-y-2 mb-4">
                  <p className="text-sm rounded-lg px-3 py-2" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.8)' }}>
                    📝 Ту гуфтӣ: {voiceRecognizedText}
                  </p>
                  <p className="text-sm rounded-lg px-3 py-2 whitespace-pre-wrap" style={{ background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.3)', color: 'rgba(255,255,255,0.85)' }}>
                    🤖 Ҷавоби AI: {voiceAiResponse}
                  </p>
                </div>
              )}

              {(voiceStatus === "done" || voiceStatus === "error") && (
                <button onClick={startVoiceRecording} className="text-sm font-semibold text-rose-400 hover:underline">
                  Аз нав кӯшиш кун
                </button>
              )}
            </div>
          ) : (
            <>
          {activeTab === "tutor" && (
            <input
              value={tutorLessonId}
              onChange={(e) => setTutorLessonId(e.target.value)}
              placeholder="ID-и дарс (ихтиёрӣ)"
              className={`w-full mb-3 px-3 py-2 text-sm rounded-lg outline-none transition-all duration-200 ${cfg.focusRing} focus:ring-2`}
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.15)', color: 'white' }}
            />
          )}

          {activeTab === "screenshot" && (
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className="mb-3 border-2 border-dashed rounded-xl px-4 py-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-200"
              style={dragOver
                ? { borderColor: '#C084FC', background: 'rgba(192,132,252,0.08)' }
                : { borderColor: 'rgba(255,255,255,0.15)' }
              }
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => setScreenshotFile(e.target.files?.[0] || null)}
              />
              <span className="text-purple-400 mb-1">
                <UploadIcon />
              </span>
              {screenshotFile ? (
                <p className="text-sm font-medium text-purple-300">{screenshotFile.name}</p>
              ) : (
                <p className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>
                  Расмро кашед ё барои интихоб клик кунед
                </p>
              )}
            </div>
          )}

          <div className="flex items-end gap-2">
            <textarea
              rows={1}
              value={currentText}
              onChange={(e) => setCurrentText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder={cfg.placeholder}
              className={`flex-1 resize-none px-4 py-3 rounded-xl outline-none transition-all duration-200 text-sm ${cfg.focusRing} focus:ring-2`}
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.15)', color: 'white' }}
            />
            <button
              onClick={handleSend}
              disabled={sending || !canSend}
              className={`flex items-center justify-center w-12 h-12 rounded-xl text-white shadow-md transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:hover:translate-y-0 flex-shrink-0 ${cfg.sendBtn}`}
            >
              <SendIcon />
            </button>
          </div>
            </>
          )}
        </div>

        {activeTab === "voice" && (
          <div className="rounded-2xl p-4 mt-4 text-sm" style={{ background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.25)', color: 'rgba(255,255,255,0.7)' }}>
            <p className="font-semibold mb-2" style={{ color: '#FBBF24' }}>💡 Маслиҳатҳо барои машқи талаффуз:</p>
            <ul className="space-y-1 list-disc pl-5">
              <li>Speak slowly and clearly</li>
              <li>Use complete sentences</li>
              <li>Practice: "I am a student. I study English every day."</li>
              <li>Try: "Yesterday I went to school"</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
