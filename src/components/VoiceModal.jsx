import { useState } from "react";
import api from "../api/axios";
import { getLang } from "../utils/lang";

function MicIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3Z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" strokeLinecap="round" />
      <path d="M12 19v4M8 23h8" strokeLinecap="round" />
    </svg>
  );
}

export default function VoiceModal({ lessonId }) {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState("idle"); // idle | recording | processing | done | error
  const [recognizedText, setRecognizedText] = useState("");
  const [aiResponse, setAiResponse] = useState("");

  function close() {
    setOpen(false);
    setStatus("idle");
    setRecognizedText("");
    setAiResponse("");
  }

  function startRecording() {
    const SpeechRecognitionImpl = window.webkitSpeechRecognition || window.SpeechRecognition;
    if (!SpeechRecognitionImpl) {
      setStatus("error");
      return;
    }

    setRecognizedText("");
    setAiResponse("");

    const recognition = new SpeechRecognitionImpl();
    recognition.lang = "en-US";
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => setStatus("recording");

    recognition.onresult = async (event) => {
      const text = event.results[0][0].transcript;
      setRecognizedText(text);
      setStatus("processing");
      try {
        const res = await api.post("/ai/ask", {
          question: text,
          lesson_id: lessonId ? Number(lessonId) : null,
          lang: getLang(),
        });
        setAiResponse(res.data.response);
        setStatus("done");
      } catch {
        setStatus("error");
      }
    };

    recognition.onerror = () => setStatus("error");
    recognition.start();
  }

  return (
    <>
      <button
        onClick={() => {
          setOpen(true);
          setStatus("idle");
        }}
        title="Ask by voice / Спросить голосом"
        className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/30 flex items-center justify-center hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200"
      >
        <MicIcon />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" onClick={close}>
          <div
            className="bg-white rounded-2xl shadow-card p-6 w-full max-w-sm text-center animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-sm font-bold text-navy mb-4">Ask about this lesson / Спросить об уроке</p>

            <button
              onClick={startRecording}
              disabled={status === "recording" || status === "processing"}
              className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center text-white shadow-lg transition-all duration-200 mb-4 disabled:opacity-70 ${
                status === "recording" ? "bg-red-500 animate-pulse" : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              <MicIcon />
            </button>

            <p className="text-sm text-slate-500 mb-4">
              {status === "idle" && "Нажми кнопку и говори по-английски"}
              {status === "recording" && "🔴 Запись... говори сейчас!"}
              {status === "processing" && "⏳ Обрабатываем..."}
              {status === "error" && "❌ Не удалось распознать речь / Voice not supported"}
              {status === "done" && "✅ Готово"}
            </p>

            {status === "done" && (
              <div className="text-left space-y-2 mb-4">
                <p className="text-sm bg-slate-50 border border-slate-100 rounded-lg px-3 py-2">
                  📝 You said: {recognizedText}
                </p>
                <p className="text-sm bg-blue-50 border border-blue-100 rounded-lg px-3 py-2 whitespace-pre-wrap">
                  🤖 AI Feedback: {aiResponse}
                </p>
              </div>
            )}

            {(status === "done" || status === "error") && (
              <button onClick={startRecording} className="text-sm font-semibold text-blue-600 hover:underline mb-2 block w-full">
                Try Again / Попробовать снова
              </button>
            )}

            <button onClick={close} className="block w-full mt-2 text-xs text-slate-400 hover:text-slate-600">
              Close / Закрыть
            </button>
          </div>
        </div>
      )}
    </>
  );
}
