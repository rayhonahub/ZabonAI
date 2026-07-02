import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BookOpen, Flame, Gem, Sparkles, Lock, ChevronDown, ChevronUp } from "lucide-react";
import confetti from "canvas-confetti";
import Navbar from "../components/Navbar";
import NeuralBackground from "../components/NeuralBackground";
import LevelUpModal from "../components/LevelUpModal";
import api from "../api/axios";
import { usePageTitle } from "../hooks/usePageTitle";
import { showToast } from "../utils/toastBus";

const LEVELS = [
  { key: "beginner", order: 1, label: "Ибтидоӣ", emoji: "🌱" },
  { key: "elementary", order: 2, label: "Миёна", emoji: "📚" },
  { key: "intermediate", order: 3, label: "Болотар", emoji: "🚀" },
  { key: "advanced", order: 4, label: "Баланд", emoji: "⭐" },
];

function LevelBadge({ level }) {
  const info = LEVELS.find((l) => l.key === level);
  const base = { borderRadius: 6, padding: "2px 10px", fontSize: 12, fontWeight: 600, display: "inline-block" };
  if (level === "beginner") {
    return (
      <span style={{ ...base, background: "rgba(20,184,166,0.15)", color: "#2DD4BF", border: "1px solid rgba(20,184,166,0.3)" }}>
        Ибтидоӣ
      </span>
    );
  }
  if (level === "elementary") {
    return (
      <span style={{ ...base, background: "rgba(251,191,36,0.15)", color: "#FBBF24", border: "1px solid rgba(251,191,36,0.3)" }}>
        Миёна
      </span>
    );
  }
  return (
    <span style={{ ...base, background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.7)", border: "1px solid rgba(255,255,255,0.18)" }}>
      {info?.label || level}
    </span>
  );
}

function LevelTrack({ courses, userLevelOrder }) {
  const coursesInCurrentLevel = courses.filter((c) => c.level_order === userLevelOrder);
  const totalLessons = coursesInCurrentLevel.reduce((sum, c) => sum + (c.total_lessons || 0), 0);
  const completedLessons = coursesInCurrentLevel.reduce((sum, c) => sum + (c.completed_lessons || 0), 0);
  const pct = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
  const currentInfo = LEVELS.find((l) => l.order === userLevelOrder);
  const nextInfo = LEVELS.find((l) => l.order === userLevelOrder + 1);

  return (
    <div className="glass-card p-5 mb-8">
      <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
        {LEVELS.map((lvl, i) => {
          const status = lvl.order < userLevelOrder ? "completed" : lvl.order === userLevelOrder ? "current" : "locked";
          return (
            <div key={lvl.key} className="flex items-center" style={{ flex: i < LEVELS.length - 1 ? 1 : "0 0 auto" }}>
              <div className="flex flex-col items-center gap-1.5" style={{ minWidth: 66 }}>
                <div
                  className={status === "current" ? "glow-pulse" : ""}
                  style={{
                    width: 40, height: 40, borderRadius: "50%",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    background: status === "current" ? "rgba(20,184,166,0.15)" : status === "completed" ? "rgba(20,184,166,0.1)" : "rgba(255,255,255,0.04)",
                    border: status === "current" ? "2px solid #14B8A6" : status === "completed" ? "1.5px solid rgba(20,184,166,0.5)" : "1.5px solid rgba(255,255,255,0.15)",
                    boxShadow: status === "current" ? "0 0 16px rgba(20,184,166,0.45)" : "none",
                    transition: "all 0.3s",
                  }}
                >
                  {status === "completed" ? (
                    <span style={{ color: "#2DD4BF", fontWeight: 700, fontSize: 16 }}>✓</span>
                  ) : status === "locked" ? (
                    <Lock size={15} style={{ color: "rgba(255,255,255,0.35)" }} />
                  ) : (
                    <span style={{ color: "#2DD4BF", fontWeight: 700, fontSize: 14 }}>{lvl.order}</span>
                  )}
                </div>
                <span style={{
                  fontSize: 12, fontWeight: 600, textAlign: "center",
                  color: status === "current" ? "#2DD4BF" : status === "completed" ? "rgba(45,212,191,0.75)" : "rgba(255,255,255,0.3)",
                }}>
                  {lvl.label}
                </span>
              </div>
              {i < LEVELS.length - 1 && (
                <div style={{
                  flex: 1, height: 2, margin: "0 4px 20px",
                  background: lvl.order < userLevelOrder ? "rgba(20,184,166,0.5)" : "rgba(255,255,255,0.1)",
                }} />
              )}
            </div>
          );
        })}
      </div>

      {currentInfo && (
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-sm" style={{ color: "rgba(255,255,255,0.7)" }}>
              {currentInfo.label}: {completedLessons} аз {totalLessons} дарс гузашт — {pct}%
            </span>
          </div>
          <div className="h-2 rounded-full overflow-hidden mb-2" style={{ background: "rgba(255,255,255,0.08)" }}>
            <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: "#14B8A6" }} />
          </div>
          {nextInfo && (
            <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
              Барои сатҳи {nextInfo.label} кушодан: ҳамаи дарсҳои {currentInfo.label.toLowerCase()}ро гузар (80%+)
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function CourseCard({ course, locked, onAction, requiredLevelLabel }) {
  const pct = course.completion_percentage ?? 0;
  const total = course.total_lessons ?? 0;
  const hasAny = (course.completed_lessons ?? 0) > 0;

  function handleClick() {
    if (locked) {
      showToast(`Барои кушодан сатҳи ${requiredLevelLabel}-ро тамом кун`, "info");
      return;
    }
    onAction(course);
  }

  return (
    <div className="glass-card p-5 flex flex-col gap-3 relative" style={{ borderRadius: 6, overflow: "hidden" }}>
      <div>
        <LevelBadge level={course.level} />
      </div>
      <h3 className="text-base font-medium" style={{ color: "white" }}>{course.title}</h3>
      <p className="text-sm line-clamp-2" style={{ color: "rgba(255,255,255,0.55)", fontSize: 13 }}>
        {course.description}
      </p>
      <div>
        <div className="h-1.5 rounded-full overflow-hidden mb-1.5" style={{ background: "rgba(255,255,255,0.08)" }}>
          <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: "#14B8A6" }} />
        </div>
        <div className="flex items-center justify-between">
          <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>{total} дарс</p>
          <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>{pct}% тамом</p>
        </div>
      </div>
      <button
        onClick={handleClick}
        disabled={!locked && total === 0}
        className="mt-auto w-full py-2.5 font-medium text-sm transition-all duration-200 hover:opacity-90 disabled:opacity-40"
        style={{ background: "#14B8A6", color: "#04231F", borderRadius: 6, border: "none", cursor: !locked && total === 0 ? "not-allowed" : "pointer" }}
      >
        {hasAny ? "Идома деҳ" : "Оғоз кун"}
      </button>

      {locked && (
        <div
          onClick={handleClick}
          className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-center px-4 cursor-pointer"
          style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(1px)" }}
        >
          <Lock size={26} style={{ color: "white" }} />
          <p style={{ color: "white", fontSize: 13, fontWeight: 500, margin: 0 }}>🔒 Баъдтар</p>
        </div>
      )}
    </div>
  );
}

export default function CoursesPage() {
  usePageTitle("Курсҳо");
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(null);
  const [navTargets, setNavTargets] = useState({});
  const [showUpcoming, setShowUpcoming] = useState(false);
  const [celebration, setCelebration] = useState(null);
  const [celebrationDismissed, setCelebrationDismissed] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get("/auth/me").catch(() => null),
      api.get("/courses/"),
      api.get("/progress/lessons").catch(() => ({ data: [] })),
      api.get("/progress/summary").catch(() => null),
    ]).then(([userRes, coursesRes, progressRes, summaryRes]) => {
      setUser(userRes?.data ?? null);
      const courseList = coursesRes.data;
      setCourses(courseList);
      const completed = new Set(progressRes.data.filter((p) => p.completed).map((p) => p.lesson_id));
      setSummary(summaryRes?.data ?? null);
      setLoading(false);
      loadNavTargets(courseList, completed);
      checkLevelAdvance(courseList);
    });
  }, []);

  function checkLevelAdvance(courseList) {
    const freshLevel = courseList[0]?.user_level;
    if (!freshLevel) return;
    const storedLevel = localStorage.getItem("user_level");
    const freshOrder = LEVELS.find((l) => l.key === freshLevel)?.order ?? 1;
    const storedOrder = LEVELS.find((l) => l.key === storedLevel)?.order ?? 0;
    if (storedLevel && freshOrder > storedOrder) {
      const info = LEVELS.find((l) => l.key === freshLevel);
      setCelebration({
        new_level: freshLevel,
        new_level_label_tj: info?.label || freshLevel,
        courses: courseList.filter((c) => c.level === freshLevel).map((c) => c.title),
      });
      confetti({ particleCount: 140, spread: 90, origin: { y: 0.5 } });
    }
    localStorage.setItem("user_level", freshLevel);
  }

  async function loadNavTargets(courseList, completed) {
    for (const course of courseList) {
      if (course.is_locked) continue;
      try {
        const modRes = await api.get(`/courses/${course.id}/modules`);
        const mods = [...modRes.data].sort((a, b) => a.order - b.order);
        const lessonResults = await Promise.all(
          mods.map((mod) =>
            api
              .get(`/courses/${course.id}/modules/${mod.id}/lessons`)
              .then((r) => ({ modId: mod.id, lessons: [...r.data].sort((a, b) => a.order - b.order) }))
              .catch(() => ({ modId: mod.id, lessons: [] }))
          )
        );
        let firstLesson = null;
        let firstIncomplete = null;
        for (const { modId, lessons } of lessonResults) {
          for (const lesson of lessons) {
            if (!firstLesson) firstLesson = { id: lesson.id, courseId: course.id, moduleId: modId };
            if (!firstIncomplete && !completed.has(lesson.id)) {
              firstIncomplete = { id: lesson.id, courseId: course.id, moduleId: modId };
            }
          }
        }
        setNavTargets((prev) => ({ ...prev, [course.id]: firstIncomplete || firstLesson }));
      } catch { /* ignore */ }
    }
  }

  function handleCourseAction(course) {
    const target = navTargets[course.id];
    if (target) {
      navigate(`/lessons/${target.id}`, { state: { courseId: target.courseId, moduleId: target.moduleId } });
    }
  }

  const overallTotal = summary?.total_lessons ?? 0;
  const overallCompleted = summary?.completed_lessons ?? 0;
  const overallPercent = overallTotal > 0 ? Math.round((overallCompleted / overallTotal) * 100) : 0;

  const userLevelKey = courses[0]?.user_level || "beginner";
  const userLevelOrder = courses[0]?.user_level_order || 1;
  const currentLevelInfo = LEVELS.find((l) => l.key === userLevelKey);
  const nextLevelInfo = LEVELS.find((l) => l.order === userLevelOrder + 1);

  const currentLevelCourses = courses.filter((c) => c.level === userLevelKey);
  const nextLevelCourses = nextLevelInfo ? courses.filter((c) => c.level === nextLevelInfo.key) : [];

  return (
    <div className="min-h-screen page-enter" style={{ background: "linear-gradient(160deg, #061A1C 0%, #0A2A2E 45%, #0E3A3F 100%)" }}>
      <Navbar />
      <div className="relative" style={{ minHeight: "calc(100vh - 64px)" }}>
        <div style={{ position: "absolute", inset: 0, overflow: "hidden", opacity: 0.3, pointerEvents: "none" }}>
          <NeuralBackground />
        </div>

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 py-10">
          {/* Welcome */}
          <div className="mb-8">
            <h1 className="text-2xl font-medium mb-4" style={{ color: "white", fontFamily: "Inter, sans-serif" }}>
              Хуш омадед{user ? `, ${user.full_name.split(" ")[0]}` : ""}!
            </h1>
            <div className="flex flex-wrap items-center gap-2">
              <span className="glass-card flex items-center gap-1.5 px-3 py-1.5 text-sm" style={{ borderRadius: 20 }}>
                <Flame size={14} style={{ color: "#FBBF24" }} />
                <span style={{ color: "#FBBF24", fontWeight: 500 }}>{user?.streak ?? 0} рӯз</span>
              </span>
              <span className="glass-card flex items-center gap-1.5 px-3 py-1.5 text-sm" style={{ borderRadius: 20 }}>
                <Gem size={14} style={{ color: "#2DD4BF" }} />
                <span style={{ color: "#2DD4BF", fontWeight: 500 }}>{user?.coins ?? 0} танга</span>
              </span>
              <span className="glass-card flex items-center gap-1.5 px-3 py-1.5 text-sm" style={{ borderRadius: 20 }}>
                <Sparkles size={14} style={{ color: "rgba(255,255,255,0.8)" }} />
                <span style={{ color: "rgba(255,255,255,0.7)", fontWeight: 500 }}>{user?.xp_points ?? 0} XP</span>
              </span>
            </div>
          </div>

          {/* Level progression */}
          {!loading && <LevelTrack courses={courses} userLevelOrder={userLevelOrder} />}

          {/* Progress overview */}
          {!loading && (
            <div className="glass-card p-5 mb-8">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-sm font-medium" style={{ color: "white" }}>Пешрафти умумӣ</h2>
                <span className="text-sm font-medium" style={{ color: "#2DD4BF" }}>{overallPercent}%</span>
              </div>
              <div className="h-2 rounded-full overflow-hidden mb-2" style={{ background: "rgba(255,255,255,0.08)" }}>
                <div className="h-full rounded-full transition-all duration-700" style={{ width: `${overallPercent}%`, background: "#14B8A6" }} />
              </div>
              <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
                {overallCompleted} аз {overallTotal} дарс гузашт
              </p>
            </div>
          )}

          {/* Current level courses */}
          {loading ? (
            <div className="grid sm:grid-cols-2 gap-5">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-52 rounded animate-pulse" style={{ background: "rgba(255,255,255,0.04)" }} />
              ))}
            </div>
          ) : (
            <>
              <h2 className="text-lg font-medium mb-4" style={{ color: "white" }}>
                Курсҳои {currentLevelInfo?.label} — {currentLevelInfo?.emoji}
              </h2>

              {currentLevelCourses.length === 0 ? (
                <div className="glass-card p-12 text-center mb-8">
                  <BookOpen size={48} style={{ color: "#14B8A6", margin: "0 auto 16px" }} />
                  <p style={{ color: "rgba(255,255,255,0.6)" }}>Курсҳо ҳанӯз нест. Зуд илова мешавад!</p>
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 gap-5 mb-8">
                  {currentLevelCourses.map((course) => (
                    <CourseCard key={course.id} course={course} locked={false} onAction={handleCourseAction} />
                  ))}
                </div>
              )}

              {/* Upcoming (locked) level preview */}
              {nextLevelInfo && nextLevelCourses.length > 0 && (
                <div>
                  <button
                    onClick={() => setShowUpcoming((v) => !v)}
                    className="flex items-center gap-2 mb-4"
                    style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.5)", fontSize: 14, fontWeight: 500 }}
                  >
                    Курсҳои оянда 🔒
                    {showUpcoming ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>

                  {showUpcoming && (
                    <div className="grid sm:grid-cols-2 gap-5">
                      {nextLevelCourses.map((course) => (
                        <CourseCard
                          key={course.id}
                          course={course}
                          locked
                          onAction={handleCourseAction}
                          requiredLevelLabel={currentLevelInfo?.label}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {celebration && !celebrationDismissed && (
        <LevelUpModal
          levelUp={celebration}
          unlockedCourses={celebration.courses}
          onClose={() => setCelebrationDismissed(true)}
        />
      )}
    </div>
  );
}
