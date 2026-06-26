import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import api from "../api/axios";

function SparkleIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M18.4 5.6l-2.8 2.8M8.4 15.6l-2.8 2.8" strokeLinecap="round" />
    </svg>
  );
}

export default function LessonPage() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { courseId, moduleId } = location.state || {};

  const [lesson, setLesson] = useState(null);
  const [siblings, setSiblings] = useState(null);
  const [loading, setLoading] = useState(true);

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
              {(siblings || [lesson]).map((l) => (
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
          <div className="bg-white rounded-2xl shadow-card p-6 sm:p-8">
            <h1 className="text-2xl font-extrabold text-navy mb-1">{lesson.title}</h1>
            <p className="text-sm text-slate-400 mb-6">Lesson / Урок №{lesson.order}</p>
            <div className="prose prose-slate max-w-none text-slate-700 leading-relaxed whitespace-pre-wrap">
              {lesson.content || "No content yet / Контент пока отсутствует"}
            </div>

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
