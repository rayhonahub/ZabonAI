import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import Navbar from "../components/Navbar";
import api from "../api/axios";
import { extractVocab } from "../utils/extractVocab";

function SparkleIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M18.4 5.6l-2.8 2.8M8.4 15.6l-2.8 2.8" strokeLinecap="round" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function readingTimeMinutes(content) {
  if (!content) return 1;
  const words = content.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
}

function VocabCard({ word, translation }) {
  return (
    <div className="group [perspective:1000px] h-20">
      <div className="relative w-full h-full transition-transform duration-500 [transform-style:preserve-3d] group-hover:[transform:rotateY(180deg)] cursor-pointer">
        <div className="absolute inset-0 flex items-center justify-center text-center rounded-xl bg-navy text-white font-semibold text-sm shadow-card px-2 [backface-visibility:hidden]">
          {word}
        </div>
        <div className="absolute inset-0 flex items-center justify-center text-center rounded-xl bg-gold text-navy-dark font-semibold text-sm shadow-card px-2 [backface-visibility:hidden] [transform:rotateY(180deg)]">
          {translation}
        </div>
      </div>
    </div>
  );
}

const markdownComponents = {
  h2: (props) => <h2 className="text-xl font-bold text-blue-700 mt-6 mb-3" {...props} />,
  h3: (props) => <h3 className="text-base font-bold text-blue-600 mt-5 mb-2" {...props} />,
  strong: (props) => <strong className="bg-gold/20 text-navy px-1 rounded font-semibold" {...props} />,
  p: (props) => <p className="mb-3" {...props} />,
  ul: (props) => <ul className="space-y-1.5 my-3 pl-0" {...props} />,
  li: (props) => (
    <li className="list-none bg-slate-50 border border-slate-100 rounded-lg px-3 py-2 font-mono text-[13px] text-slate-600" {...props} />
  ),
};

export default function LessonPage() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { courseId, moduleId } = location.state || {};

  const [lesson, setLesson] = useState(null);
  const [siblings, setSiblings] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [id]);

  useEffect(() => {
    setLoading(true);
    api
      .get(`/courses/lessons/${id}`)
      .then((res) => setLesson(res.data))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (courseId && moduleId) {
      api
        .get(`/courses/${courseId}/modules/${moduleId}/lessons`)
        .then((res) => setSiblings(res.data))
        .catch(() => setSiblings(null));
    } else {
      setSiblings(null);
    }
  }, [courseId, moduleId]);

  const vocab = useMemo(() => extractVocab(lesson?.content).slice(0, 12), [lesson?.content]);
  const minutes = useMemo(() => readingTimeMinutes(lesson?.content), [lesson?.content]);

  const lessonList = siblings || (lesson ? [lesson] : []);
  const positionIndex = lessonList.findIndex((l) => String(l.id) === String(id));
  const positionLabel =
    positionIndex >= 0 && lessonList.length > 0
      ? `Lesson ${positionIndex + 1} of ${lessonList.length}`
      : lesson
      ? `Lesson №${lesson.order}`
      : "";

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <div className="max-w-5xl mx-auto px-4 py-10 animate-pulse">
          <div className="h-8 w-64 bg-white rounded mb-6" />
          <div className="h-64 bg-white rounded-2xl shadow-card" />
        </div>
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <div className="text-center py-20 text-slate-400">
          Lesson not found / Урок не найден
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 grid md:grid-cols-[260px_1fr] gap-6">
        <aside className="order-2 md:order-1">
          <div className="bg-white rounded-2xl shadow-card p-4 sticky top-24">
            <h3 className="text-xs font-bold uppercase text-slate-400 mb-3 px-1">
              Lesson list / Список уроков
            </h3>
            <div className="space-y-1">
              {lessonList.map((l) => (
                <button
                  key={l.id}
                  onClick={() =>
                    navigate(`/lessons/${l.id}`, {
                      state: courseId && moduleId ? { courseId, moduleId } : undefined,
                    })
                  }
                  className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-all duration-150 ${
                    String(l.id) === String(id)
                      ? "bg-navy text-white font-semibold shadow-sm"
                      : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {l.title}
                </button>
              ))}
            </div>
          </div>
        </aside>

        <main className="order-1 md:order-2 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-card p-6 sm:p-8 max-w-[800px] mx-auto">
            <div className="flex items-center gap-3 text-xs font-semibold text-slate-400 mb-3">
              {positionLabel && (
                <span className="bg-slate-100 text-slate-500 px-2.5 py-1 rounded-full">{positionLabel}</span>
              )}
              <span className="flex items-center gap-1 bg-slate-100 text-slate-500 px-2.5 py-1 rounded-full">
                <ClockIcon /> {minutes} min read / {minutes} мин
              </span>
            </div>

            <h1 className="text-2xl font-extrabold text-navy mb-6">{lesson.title}</h1>

            <div className="text-[18px] leading-[1.8] text-slate-700">
              {lesson.content ? (
                <ReactMarkdown components={markdownComponents}>{lesson.content}</ReactMarkdown>
              ) : (
                <p>No content yet / Контент пока отсутствует</p>
              )}
            </div>

            {vocab.length > 0 && (
              <div className="mt-10 pt-8 border-t border-slate-100">
                <h3 className="text-sm font-bold text-navy mb-1">Vocabulary / Словарь</h3>
                <p className="text-xs text-slate-400 mb-4">Hover a card to flip it / Наведи, чтобы перевернуть</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {vocab.map((v, i) => (
                    <VocabCard key={i} word={v.word} translation={v.translation} />
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={() => navigate(`/quiz/${lesson.id}`)}
              className="mt-8 w-full sm:w-auto px-8 py-3.5 rounded-xl font-semibold text-navy-dark bg-gradient-to-r from-gold-light to-gold shadow-lg shadow-gold/30 hover:shadow-gold/50 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200"
            >
              Start Quiz / Начать тест →
            </button>
          </div>
        </main>
      </div>

      <button
        onClick={() => navigate(`/ai?lesson_id=${lesson.id}`)}
        className="fixed bottom-6 right-6 flex items-center gap-2 bg-navy text-white pl-4 pr-5 py-3.5 rounded-full shadow-soft hover:bg-navy-light hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 z-30"
      >
        <SparkleIcon />
        <span className="font-semibold text-sm">Ask AI</span>
      </button>
    </div>
  );
}
