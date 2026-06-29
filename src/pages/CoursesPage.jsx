import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import api from "../api/axios";
import { useTranslation } from "../i18n/useTranslation";
import { usePageTitle } from "../hooks/usePageTitle";

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

function LessonStatusBadge({ status }) {
  if (status === "completed") {
    return (
      <span className="flex items-center justify-center w-6 h-6 rounded-full bg-emerald-500 text-white text-xs flex-shrink-0">
        ✅
      </span>
    );
  }
  if (status === "locked") {
    return (
      <span className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-300 text-slate-500 text-xs flex-shrink-0">
        🔒
      </span>
    );
  }
  return (
    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0" />
  );
}

function LessonRow({ courseId, moduleId, lesson, status }) {
  const navigate = useNavigate();
  const isLocked = status === "locked";

  const cardStyles = {
    completed: "bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100",
    current: "bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100",
    locked: "bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed",
  };

  return (
    <button
      disabled={isLocked}
      onClick={() => {
        if (isLocked) return;
        navigate(`/lessons/${lesson.id}`, {
          state: { courseId, moduleId },
        });
      }}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border text-sm font-medium transition-all duration-150 ${
        cardStyles[status]
      } ${!isLocked ? "hover:translate-x-1" : ""}`}
    >
      <LessonStatusBadge status={status} />
      <span className="flex-1 text-left">{lesson.title}</span>
      {status === "current" && <span className="text-xs font-semibold">Continue →</span>}
    </button>
  );
}

function ModuleRow({ courseId, mod, lessons, statusMap }) {
  const [open, setOpen] = useState(false);

  const total = lessons.length;
  const completedCount = lessons.filter((l) => statusMap[l.id] === "completed").length;
  const progressPct = total > 0 ? Math.round((completedCount / total) * 100) : 0;

  return (
    <div className="border border-slate-100 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100 transition-colors duration-150"
      >
        <div className="flex-1 text-left">
          <span className="text-sm font-semibold text-navy block">{mod.title}</span>
          {total > 0 && (
            <div className="mt-1.5 flex items-center gap-2">
              <div className="h-1.5 flex-1 max-w-[140px] bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gold rounded-full transition-all duration-300"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
              <span className="text-xs text-slate-400">
                {completedCount}/{total} lessons completed
              </span>
            </div>
          )}
        </div>
        <ChevronIcon open={open} />
      </button>
      {open && (
        <div className="px-4 py-3 bg-white animate-fade-in space-y-1.5">
          {lessons.length === 0 && (
            <p className="text-xs text-slate-400 py-2">No lessons yet / Уроков пока нет</p>
          )}
          {lessons.map((lesson) => (
            <LessonRow
              key={lesson.id}
              courseId={courseId}
              moduleId={mod.id}
              lesson={lesson}
              status={statusMap[lesson.id] || "locked"}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function CoursesPage() {
  usePageTitle("Courses");
  const { t } = useTranslation();
  const [user, setUser] = useState(null);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCourse, setActiveCourse] = useState(null);
  const [modules, setModules] = useState([]);
  const [lessonsByModule, setLessonsByModule] = useState({});
  const [completedIds, setCompletedIds] = useState(new Set());
  const [modulesLoading, setModulesLoading] = useState(false);

  useEffect(() => {
    api.get("/auth/me").then((res) => setUser(res.data)).catch(() => {});
    api
      .get("/courses/")
      .then((res) => setCourses(res.data))
      .finally(() => setLoading(false));
    api
      .get("/progress/lessons")
      .then((res) =>
        setCompletedIds(
          new Set(res.data.filter((p) => p.completed).map((p) => p.lesson_id))
        )
      )
      .catch(() => {});
  }, []);

  async function openCourse(course) {
    if (activeCourse?.id === course.id) {
      setActiveCourse(null);
      return;
    }
    setActiveCourse(course);
    setModulesLoading(true);
    try {
      const res = await api.get(`/courses/${course.id}/modules`);
      const sortedModules = [...res.data].sort((a, b) => a.order - b.order);
      setModules(sortedModules);

      const lessonResults = await Promise.all(
        sortedModules.map((mod) =>
          api
            .get(`/courses/${course.id}/modules/${mod.id}/lessons`)
            .then((r) => [mod.id, [...r.data].sort((a, b) => a.order - b.order)])
            .catch(() => [mod.id, []])
        )
      );
      setLessonsByModule(Object.fromEntries(lessonResults));
    } catch {
      setModules([]);
      setLessonsByModule({});
    } finally {
      setModulesLoading(false);
    }
  }

  // Flatten lessons across modules (in order) to compute lock/current/completed status
  const statusMap = {};
  const flatLessons = modules.flatMap((mod) => lessonsByModule[mod.id] || []);
  flatLessons.forEach((lesson, idx) => {
    if (completedIds.has(lesson.id)) {
      statusMap[lesson.id] = "completed";
      return;
    }
    const prevLesson = flatLessons[idx - 1];
    const isLocked = idx > 0 && !completedIds.has(prevLesson.id);
    statusMap[lesson.id] = isLocked ? "locked" : "current";
  });

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
                    {modulesLoading && (
                      <p className="text-xs text-slate-400 px-2 py-1">Loading...</p>
                    )}
                    {!modulesLoading && modules.length === 0 && (
                      <p className="text-xs text-slate-400 px-2 py-1">
                        No modules yet / Пока нет модулей
                      </p>
                    )}
                    {!modulesLoading &&
                      modules.map((mod) => (
                        <ModuleRow
                          key={mod.id}
                          courseId={course.id}
                          mod={mod}
                          lessons={lessonsByModule[mod.id] || []}
                          statusMap={statusMap}
                        />
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
