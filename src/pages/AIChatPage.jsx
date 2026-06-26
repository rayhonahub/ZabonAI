import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import api from "../api/axios";

const tabs = [
  { key: "grammar", label: "Grammar Check", sub: "Проверка грамматики" },
  { key: "ask", label: "Ask Tutor", sub: "Спросить репетитора" },
  { key: "screenshot", label: "Screenshot", sub: "Скриншот" },
];

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

function TypingDots() {
  return (
    <div className="flex gap-1.5 px-1">
      <span className="w-2 h-2 rounded-full bg-navy/40 animate-typing" style={{ animationDelay: "0s" }} />
      <span className="w-2 h-2 rounded-full bg-navy/40 animate-typing" style={{ animationDelay: "0.2s" }} />
      <span className="w-2 h-2 rounded-full bg-navy/40 animate-typing" style={{ animationDelay: "0.4s" }} />
    </div>
  );
}

function chatTypeLabel(type) {
  if (type === "grammar") return "Grammar Check";
  if (type === "screenshot") return "Screenshot";
  return "Ask Tutor";
}

export default function AIChatPage() {
  const [searchParams] = useSearchParams();
  const defaultLessonId = searchParams.get("lesson_id") || "";

  const [activeTab, setActiveTab] = useState("ask");
  const [messages, setMessages] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [text, setText] = useState("");
  const [lessonId, setLessonId] = useState(defaultLessonId);
  const [file, setFile] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [sending, setSending] = useState(false);
  const scrollRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    api
      .get("/ai/history")
      .then((res) => {
        const sorted = [...res.data].reverse();
        setMessages(
          sorted.map((h) => ({
            id: h.id,
            chat_type: h.chat_type,
            message: h.message,
            response: h.response,
            pending: false,
          }))
        );
      })
      .finally(() => setHistoryLoading(false));
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, sending]);

  function addMessage(msg) {
    setMessages((prev) => [...prev, msg]);
  }

  function updateLastMessage(id, patch) {
    setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, ...patch } : m)));
  }

  async function handleSend() {
    if (sending) return;
    const tempId = `temp-${Date.now()}`;

    if (activeTab === "grammar") {
      if (!text.trim()) return;
      addMessage({ id: tempId, chat_type: "grammar", message: text, response: null, pending: true });
      const payload = text;
      setText("");
      setSending(true);
      try {
        const res = await api.post("/ai/grammar-check", { text: payload });
        updateLastMessage(tempId, { response: res.data.response, pending: false });
      } catch (err) {
        updateLastMessage(tempId, {
          response: err.response?.data?.detail || "Error / Ошибка",
          pending: false,
          isError: true,
        });
      } finally {
        setSending(false);
      }
    }

    if (activeTab === "ask") {
      if (!text.trim()) return;
      addMessage({ id: tempId, chat_type: "ask", message: text, response: null, pending: true });
      const payload = text;
      setText("");
      setSending(true);
      try {
        const res = await api.post("/ai/ask", {
          question: payload,
          lesson_id: lessonId ? Number(lessonId) : null,
        });
        updateLastMessage(tempId, { response: res.data.response, pending: false });
      } catch (err) {
        updateLastMessage(tempId, {
          response: err.response?.data?.detail || "Error / Ошибка",
          pending: false,
          isError: true,
        });
      } finally {
        setSending(false);
      }
    }

    if (activeTab === "screenshot") {
      if (!file) return;
      addMessage({
        id: tempId,
        chat_type: "screenshot",
        message: text || "📷 Screenshot uploaded",
        previewUrl: URL.createObjectURL(file),
        response: null,
        pending: true,
      });
      const form = new FormData();
      form.append("file", file);
      if (text.trim()) form.append("question", text);
      const fileToSend = file;
      setText("");
      setFile(null);
      setSending(true);
      try {
        const res = await api.post("/ai/screenshot", form, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        updateLastMessage(tempId, { response: res.data.response, pending: false });
      } catch (err) {
        updateLastMessage(tempId, {
          response: err.response?.data?.detail || "Error / Ошибка",
          pending: false,
          isError: true,
        });
      } finally {
        setSending(false);
      }
    }
  }

  function handleDrop(e) {
    e.preventDefault();
    setDragOver(false);
    const dropped = e.dataTransfer.files?.[0];
    if (dropped && dropped.type.startsWith("image/")) {
      setFile(dropped);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      <div className="max-w-3xl w-full mx-auto px-4 sm:px-6 py-8 flex-1 flex flex-col">
        <h1 className="text-2xl font-extrabold text-navy mb-1">AI Tutor</h1>
        <p className="text-slate-500 mb-6">AI Репетитор</p>

        <div className="flex gap-1 bg-white rounded-xl shadow-card p-1.5 mb-5 w-full sm:w-fit">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                activeTab === t.key
                  ? "bg-navy text-white shadow-sm"
                  : "text-slate-500 hover:bg-slate-50"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div
          ref={scrollRef}
          className="flex-1 bg-white rounded-2xl shadow-card p-4 sm:p-6 mb-4 overflow-y-auto max-h-[55vh] min-h-[320px] flex flex-col gap-4"
        >
          {historyLoading && <p className="text-sm text-slate-400 text-center py-10">Loading history...</p>}

          {!historyLoading && messages.length === 0 && (
            <div className="flex-1 flex flex-col items-center justify-center text-center text-slate-400 py-10">
              <p className="text-3xl mb-2">💬</p>
              <p className="text-sm">
                Start the conversation / Начни разговор
              </p>
            </div>
          )}

          {messages.map((m) => (
            <div key={m.id} className="flex flex-col gap-2 animate-fade-in">
              <div className="flex justify-end">
                <div className="max-w-[80%] bg-navy text-white rounded-2xl rounded-tr-sm px-4 py-2.5 text-sm shadow-sm">
                  <p className="text-[11px] text-white/50 font-semibold mb-0.5">
                    {chatTypeLabel(m.chat_type)}
                  </p>
                  {m.previewUrl && (
                    <img src={m.previewUrl} alt="upload" className="rounded-lg mb-2 max-h-40 object-cover" />
                  )}
                  <p>{m.message}</p>
                </div>
              </div>

              <div className="flex justify-start">
                <div
                  className={`max-w-[80%] rounded-2xl rounded-tl-sm px-4 py-2.5 text-sm shadow-sm border ${
                    m.isError
                      ? "bg-red-50 border-red-100 text-red-600"
                      : "bg-slate-50 border-gold/20 text-slate-700"
                  }`}
                >
                  {m.pending ? <TypingDots /> : <p className="whitespace-pre-wrap">{m.response}</p>}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl shadow-card p-4">
          {activeTab === "ask" && (
            <input
              value={lessonId}
              onChange={(e) => setLessonId(e.target.value)}
              placeholder="Lesson ID (optional) / ID урока (необязательно)"
              className="w-full mb-3 px-3 py-2 text-sm rounded-lg border border-slate-200 focus:border-navy focus:ring-2 focus:ring-navy/10 outline-none transition-all duration-200"
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
                dragOver ? "border-gold bg-gold/5" : "border-slate-200 hover:border-navy/30"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
              <span className="text-navy/60 mb-1">
                <UploadIcon />
              </span>
              {file ? (
                <p className="text-sm font-medium text-navy">{file.name}</p>
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
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder={
                activeTab === "grammar"
                  ? "Type a sentence to check / Введите предложение..."
                  : activeTab === "ask"
                  ? "Ask your tutor a question / Задайте вопрос..."
                  : "Add a question about the image (optional) / Вопрос к изображению..."
              }
              className="flex-1 resize-none px-4 py-3 rounded-xl border border-slate-200 focus:border-navy focus:ring-2 focus:ring-navy/10 outline-none transition-all duration-200 text-sm"
            />
            <button
              onClick={handleSend}
              disabled={sending || (activeTab === "screenshot" ? !file : !text.trim())}
              className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-r from-gold-light to-gold text-navy-dark shadow-md shadow-gold/20 hover:shadow-gold/40 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 disabled:opacity-50 disabled:hover:translate-y-0 flex-shrink-0"
            >
              <SendIcon />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
