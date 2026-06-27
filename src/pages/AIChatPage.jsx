import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import api from "../api/axios";
import { getLang } from "../utils/lang";

const TAB_CONFIG = {
  grammar: {
    label: "Grammar Check",
    sub: "Проверка грамматики",
    storageKey: "grammar_chat",
    backendType: "grammar",
    placeholder: "Type a sentence to check / Введите предложение...",
    tabActive: "bg-emerald-600 text-white shadow-sm",
    userBubble: "bg-emerald-600 text-white rounded-2xl rounded-tr-sm px-4 py-2.5 text-sm shadow-sm",
    aiBubble: "bg-emerald-50 border-emerald-200 text-slate-700",
    badge: "bg-emerald-100 text-emerald-700",
    sendBtn: "bg-gradient-to-r from-emerald-500 to-emerald-600 shadow-emerald-500/30 hover:shadow-emerald-500/50",
    focusRing: "focus:border-emerald-500 focus:ring-emerald-500/10",
    dot: "bg-emerald-600/40",
  },
  tutor: {
    label: "Ask Tutor",
    sub: "Спросить репетитора",
    storageKey: "tutor_chat",
    backendType: "tutor",
    placeholder: "Ask your tutor a question / Задайте вопрос...",
    tabActive: "bg-blue-600 text-white shadow-sm",
    userBubble: "bg-blue-600 text-white rounded-2xl rounded-tr-sm px-4 py-2.5 text-sm shadow-sm",
    aiBubble: "bg-blue-50 border-blue-200 text-slate-700",
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
    placeholder: "Add a question about the image (optional) / Вопрос к изображению...",
    tabActive: "bg-purple-600 text-white shadow-sm",
    userBubble: "bg-purple-600 text-white rounded-2xl rounded-tr-sm px-4 py-2.5 text-sm shadow-sm",
    aiBubble: "bg-purple-50 border-purple-200 text-slate-700",
    badge: "bg-purple-100 text-purple-700",
    sendBtn: "bg-gradient-to-r from-purple-500 to-purple-600 shadow-purple-500/30 hover:shadow-purple-500/50",
    focusRing: "focus:border-purple-500 focus:ring-purple-500/10",
    dot: "bg-purple-600/40",
  },
};

const TAB_ORDER = ["grammar", "tutor", "screenshot"];

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
  const [searchParams] = useSearchParams();
  const defaultLessonId = searchParams.get("lesson_id") || "";

  const [activeTab, setActiveTab] = useState("tutor");
  const [historyLoading, setHistoryLoading] = useState(true);

  const [grammarMessages, setGrammarMessages] = useState(() => loadFromStorage(TAB_CONFIG.grammar.storageKey));
  const [tutorMessages, setTutorMessages] = useState(() => loadFromStorage(TAB_CONFIG.tutor.storageKey));
  const [screenshotMessages, setScreenshotMessages] = useState(() => loadFromStorage(TAB_CONFIG.screenshot.storageKey));

  const [grammarText, setGrammarText] = useState("");
  const [tutorText, setTutorText] = useState("");
  const [tutorLessonId, setTutorLessonId] = useState(defaultLessonId);
  const [screenshotText, setScreenshotText] = useState("");
  const [screenshotFile, setScreenshotFile] = useState(null);
  const [dragOver, setDragOver] = useState(false);

  const scrollRef = useRef(null);
  const fileInputRef = useRef(null);

  const stateByTab = {
    grammar: [grammarMessages, setGrammarMessages],
    tutor: [tutorMessages, setTutorMessages],
    screenshot: [screenshotMessages, setScreenshotMessages],
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
        const byType = { grammar: [], tutor: [], screenshot: [] };
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
          response: err.response?.data?.detail || "Error / Ошибка",
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
          response: err.response?.data?.detail || "Error / Ошибка",
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
          response: err.response?.data?.detail || "Error / Ошибка",
          pending: false,
          isError: true,
        });
      }
    }
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
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      <div className="max-w-3xl w-full mx-auto px-4 sm:px-6 py-8 flex-1 flex flex-col">
        <h1 className="text-2xl font-extrabold text-navy mb-1">AI Tutor</h1>
        <p className="text-slate-500 mb-6">AI Репетитор</p>

        <div className="flex items-center justify-between gap-2 mb-5 flex-wrap">
          <div className="flex gap-1 bg-white rounded-xl shadow-card p-1.5 w-full sm:w-fit">
            {TAB_ORDER.map((key) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                  activeTab === key ? TAB_CONFIG[key].tabActive : "text-slate-500 hover:bg-slate-50"
                }`}
              >
                {TAB_CONFIG[key].label}
              </button>
            ))}
          </div>

          <button
            onClick={clearChat}
            disabled={messages.length === 0}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-red-500 disabled:opacity-40 disabled:hover:text-slate-400 transition-colors duration-150 px-2"
          >
            <TrashIcon />
            Clear chat / Очистить
          </button>
        </div>

        <div
          ref={scrollRef}
          className="flex-1 bg-white rounded-2xl shadow-card p-4 sm:p-6 mb-4 overflow-y-auto max-h-[55vh] min-h-[320px] flex flex-col gap-4"
        >
          {historyLoading && <p className="text-sm text-slate-400 text-center py-10">Loading history...</p>}

          {!historyLoading && messages.length === 0 && (
            <div className="flex-1 flex flex-col items-center justify-center text-center text-slate-400 py-10">
              <p className="text-3xl mb-2">💬</p>
              <p className="text-sm">Start the conversation / Начни разговор</p>
              <p className="text-xs text-slate-300 mt-1">{cfg.sub}</p>
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
                    m.isError ? "bg-red-50 border-red-100 text-red-600" : cfg.aiBubble
                  }`}
                >
                  {m.pending ? <TypingDots dotClass={cfg.dot} /> : <p className="whitespace-pre-wrap">{m.response}</p>}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl shadow-card p-4">
          {activeTab === "tutor" && (
            <input
              value={tutorLessonId}
              onChange={(e) => setTutorLessonId(e.target.value)}
              placeholder="Lesson ID (optional) / ID урока (необязательно)"
              className={`w-full mb-3 px-3 py-2 text-sm rounded-lg border border-slate-200 outline-none transition-all duration-200 ${cfg.focusRing} focus:ring-2`}
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
              className={`mb-3 border-2 border-dashed rounded-xl px-4 py-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-200 ${
                dragOver ? "border-purple-400 bg-purple-50" : "border-slate-200 hover:border-purple-300"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => setScreenshotFile(e.target.files?.[0] || null)}
              />
              <span className="text-purple-500 mb-1">
                <UploadIcon />
              </span>
              {screenshotFile ? (
                <p className="text-sm font-medium text-purple-700">{screenshotFile.name}</p>
              ) : (
                <p className="text-sm text-slate-400">
                  Drag & drop an image, or click to browse
                  <br />
                  Перетащите изображение или нажмите
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
              className={`flex-1 resize-none px-4 py-3 rounded-xl border border-slate-200 outline-none transition-all duration-200 text-sm ${cfg.focusRing} focus:ring-2`}
            />
            <button
              onClick={handleSend}
              disabled={sending || !canSend}
              className={`flex items-center justify-center w-12 h-12 rounded-xl text-white shadow-md transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:hover:translate-y-0 flex-shrink-0 ${cfg.sendBtn}`}
            >
              <SendIcon />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
