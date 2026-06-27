import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import api from "../api/axios";
import { useTranslation } from "../i18n/useTranslation";

const levelStyles = {
  beginner: "bg-emerald-100 text-emerald-700",
  elementary: "bg-blue-100 text-blue-700",
  intermediate: "bg-amber-100 text-amber-700",
  advanced: "bg-rose-100 text-rose-700",
};

function ChevronIcon({ open }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className={`transition-transform duration-200 ${open ? "rotate-90" : ""}`}
    >
      <path d="m9 6 6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ModuleRow({ courseId, mod }) {
  const [open, setOpen] = useState(false);
  const [lessons, setLessons] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function toggle() {
    if (!open && lessons === null) {
      setLoading(true);
      try {
        const res = await api.get(`/courses/${courseId}/modules/${mod.id}/lessons`);
        setLessons(res.data);
      } catch {
        setLessons([]);
      } finally {
        setLoading(false);
      }
    }
    setOpen((v) => !v);
  }

  return (
    <div className="border border-slate-100 rounded-xl overflow-hidden">
      <button
        onClick={toggle}
        className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100 transition-colors duration-150"
      >
        <span className="text-sm font-semibold text-navy">{mod.title}</span>
        <ChevronIcon open={open} />
      </button>
      {open && (
        <div className="px-4 py-2 bg-white animate-fade-in">
          {loading && <p className="text-xs text-slate-400 py-2">Loading...</p>}
          {lessons && lessons.length === 0 && (
            <p className="text-xs text-slate-400 py-2">No lessons yet / Уроков пока нет</p>
          )}
          {lessons &&
            lessons.map((lesson) => (
              <button
                key={lesson.id}
                onClick={() =>
                  navigate(`/lessons/${lesson.id}`, {
                    state: { courseId, moduleId: mod.id },
                  })
                }
                className="w-full flex items-center gap-2 py-2 text-sm text-slate-600 hover:text-navy hover:translate-x-1 transition-all duration-150"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-gold flex-shrink-0" />
                {lesson.title}
              </button>
            ))}
        </div>
      )}
    </div>
  );
}

export default function CoursesPage() {
  const { t } = useTranslation();
  const [user, setUser] = useState(null);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCourse, setActiveCourse] = useState(null);
  const [modules, setModules] = useState([]);

  useEffect(() => {
    api.get("/auth/me").then((res) => setUser(res.data)).catch(() => {});
    api
      .get("/courses/")
      .then((res) => setCourses(res.data))
      .finally(() => setLoading(false));
  }, []);

  async function openCourse(course) {
    if (activeCourse?.id === course.id) {
      setActiveCourse(null);
      return;
    }
    setActiveCourse(course);
    try {
      const res = await api.get(`/courses/${course.id}/modules`);
      setModules(res.data);
    } catch {
      setModules([]);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        <div className="mb-10 animate-fade-in">
          <h1 className="text-3xl font-extrabold text-navy">
            Welcome back{user ? `, ${user.full_name.split(" ")[0]}` : ""} 👋
          </h1>
          <p className="text-slate-500 mt-1">
            С возвращением! Keep your streak going{" "}
            {user && (
              <span className="inline-flex items-center gap-1 font-semibold text-gold-dark">
                🔥 {user.streak} {user.streak === 1 ? "day" : "days"}
              </span>
            )}
          </p>
        </div>

        <h2 className="text-lg font-bold text-navy mb-4">{t("your_courses")}</h2>

        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-44 bg-white rounded-2xl shadow-card animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {courses.map((course) => (
              <div key={course.id} className="flex flex-col gap-3">
                <button
                  onClick={() => openCourse(course)}
                  className={`text-left bg-white rounded-2xl shadow-card p-6 transition-all duration-200 hover:-translate-y-1 hover:shadow-soft border-2 ${
                    activeCourse?.id === course.id ? "border-gold" : "border-transparent"
                  }`}
                >
                  <span
                    className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-full mb-3 ${
                      levelStyles[course.level] || "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {t("level")}: {t(course.level)}
                  </span>
                  <h3 className="text-lg font-bold text-navy mb-1.5">{course.title}</h3>
                  <p className="text-sm text-slate-500 line-clamp-2">{course.description}</p>
                  <div className="mt-4 flex items-center gap-1 text-sm font-semibold text-navy">
                    {activeCourse?.id === course.id ? "Hide modules" : "View modules"}
                    <ChevronIcon open={activeCourse?.id === course.id} />
                  </div>
                </button>

                {activeCourse?.id === course.id && (
                  <div className="bg-white rounded-2xl shadow-card p-4 space-y-2 animate-slide-up">
                    {modules.length === 0 && (
                      <p className="text-xs text-slate-400 px-2 py-1">
                        No modules yet / Пока нет модулей
                      </p>
                    )}
                    {modules.map((mod) => (
                      <ModuleRow key={mod.id} courseId={course.id} mod={mod} />
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {!loading && courses.length === 0 && (
          <div className="text-center py-20 text-slate-400">
            No courses available yet / Пока нет курсов
          </div>
        )}
      </div>
    </div>
  );
}
