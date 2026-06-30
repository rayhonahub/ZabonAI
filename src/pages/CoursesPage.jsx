import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle2, Lock, Flame } from "lucide-react";
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
      <span className="flex items-center justify-center w-6 h-6 rounded-full flex-shrink-0" style={{ background: '#10b981' }}>
        <CheckCircle2 size={14} color="white" />
      </span>
    );
  }
  if (status === "locked") {
    return (
      <span className="flex items-center justify-center w-6 h-6 rounded-full flex-shrink-0" style={{ background: 'rgba(109,79,240,0.1)' }}>
        <Lock size={13} style={{ color: '#8A82AD' }} />
      </span>
    );
  }
  return (
    <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: '#6D4FF0' }} />
  );
}

function LessonRow({ courseId, moduleId, lesson, status }) {
  const navigate = useNavigate();
  const isLocked = status === "locked";

  const cardStyles = {
    completed: "bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100",
    current: "bg-primary/5 border-primary/20 text-ink hover:bg-primary/10",
    locked: "bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed",
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
      {status === "current" && <span className="text-xs font-semibold" style={{ color: '#6D4FF0' }}>Continue →</span>}
    </button>
  );
}

function ModuleRow({ courseId, mod, lessons, statusMap }) {
  const [open, setOpen] = useState(false);

  const total = lessons.length;
  const completedCount = lessons.filter((l) => statusMap[l.id] === "completed").length;
  const progressPct = total > 0 ? Math.round((completedCount / total) * 100) : 0;

  return (
    <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(109,79,240,0.12)' }}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 transition-colors duration-150"
        style={{ background: 'rgba(109,79,240,0.04)' }}
        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(109,79,240,0.08)'}
        onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(109,79,240,0.04)'}
      >
        <div className="flex-1 text-left">
          <span className="text-sm font-semibold block" style={{ color: '#1A1532' }}>{mod.title}</span>
          {total > 0 && (
            <div className="mt-1.5 flex items-center gap-2">
              <div className="h-1.5 flex-1 max-w-[140px] rounded-full overflow-hidden" style={{ background: 'rgba(109,79,240,0.12)' }}>
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{ width: `${progressPct}%`, background: '#6D4FF0' }}
                />
              </div>
              <span className="text-xs" style={{ color: '#8A82AD' }}>
                {completedCount}/{total} lessons completed
              </span>
            </div>
          )}
        </div>
        <span style={{ color: '#8A82AD' }}><ChevronIcon open={open} /></span>
      </button>
      {open && (
        <div className="px-4 py-3 animate-fade-in space-y-1.5" style={{ background: 'rgba(244,241,255,0.5)' }}>
          {lessons.length === 0 && (
            <p className="text-xs py-2" style={{ color: '#8A82AD' }}>No lessons yet / Уроков пока нет</p>
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
    <div className="min-h-screen page-enter" style={{ background: '#F4F1FF' }}>
      <Navbar />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        <div className="mb-10 animate-fade-in">
          <h1 className="text-3xl font-extrabold" style={{ color: '#1A1532' }}>
            Welcome back{user ? `, ${user.full_name.split(" ")[0]}` : ""} 👋
          </h1>
          <p className="mt-1" style={{ color: '#8A82AD' }}>
            С возвращением! Keep your streak going{" "}
            {user && (
              <span className="inline-flex items-center gap-1 font-semibold" style={{ color: '#6D4FF0' }}>
                <Flame size={14} style={{ color: '#FF5C8A' }} /> {user.streak} {user.streak === 1 ? "day" : "days"}
              </span>
            )}
          </p>
        </div>

        <h2 className="text-lg font-bold mb-4" style={{ color: '#534A7A' }}>{t("your_courses")}</h2>

        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-44 rounded-2xl animate-pulse" style={{ background: 'rgba(109,79,240,0.08)' }} />
            ))}
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {courses.map((course) => (
              <div key={course.id} className="flex flex-col gap-3">
                <button
                  onClick={() => openCourse(course)}
                  className={`text-left glass-card-light p-6 transition-all duration-200 border-2 ${
                    activeCourse?.id === course.id ? "!border-primary/40" : ""
                  }`}
                  style={activeCourse?.id === course.id ? { borderColor: 'rgba(109,79,240,0.4)' } : {}}
                >
                  <span
                    className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-full mb-3 ${
                      levelStyles[course.level] || "bg-primary/10 text-primary"
                    }`}
                  >
                    {t("level")}: {t(course.level)}
                  </span>
                  <h3 className="text-lg font-bold mb-1.5" style={{ color: '#1A1532' }}>{course.title}</h3>
                  <p className="text-sm line-clamp-2" style={{ color: '#8A82AD' }}>{course.description}</p>
                  <div className="mt-4 flex items-center gap-1 text-sm font-semibold" style={{ color: '#6D4FF0' }}>
                    {activeCourse?.id === course.id ? "Hide modules" : "View modules"}
                    <ChevronIcon open={activeCourse?.id === course.id} />
                  </div>
                </button>

                {activeCourse?.id === course.id && (
                  <div className="glass-card-light p-4 space-y-2 animate-slide-up">
                    {modulesLoading && (
                      <p className="text-xs px-2 py-1" style={{ color: '#8A82AD' }}>Loading...</p>
                    )}
                    {!modulesLoading && modules.length === 0 && (
                      <p className="text-xs px-2 py-1" style={{ color: '#8A82AD' }}>
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
          <div className="text-center py-20" style={{ color: '#8A82AD' }}>
            No courses available yet / Пока нет курсов
          </div>
        )}
      </div>
    </div>
  );
}
