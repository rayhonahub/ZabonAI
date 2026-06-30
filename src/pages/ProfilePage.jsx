import { useEffect, useState } from "react";
import { Trophy, BookOpen, Gem, Flame, Users, Star, Lock, Gift, Shuffle, Copy } from "lucide-react";
import Navbar from "../components/Navbar";
import api from "../api/axios";
import { LANGUAGES, setLang } from "../utils/lang";
import { AVATAR_STYLES, avatarUrl, randomAvatarSeed } from "../utils/avatar";
import { showToast } from "../utils/toastBus";
import { usePageTitle } from "../hooks/usePageTitle";

const LEVEL_BANDS = [
  { key: "beginner", min: 0, max: 100, label: "Beginner" },
  { key: "elementary", min: 101, max: 300, label: "Elementary" },
  { key: "intermediate", min: 301, max: 600, label: "Intermediate" },
  { key: "advanced", min: 601, max: Infinity, label: "Advanced" },
];

const ACHIEVEMENTS = [
  { key: "first_steps", Icon: Star, color: "#f0a500", title: "First Steps", sub: "Первый шаг", check: (s) => s.total_lessons_completed >= 1 },
  { key: "on_fire", Icon: Flame, color: "#FF5C8A", title: "On Fire", sub: "3-дневная серия", check: (s) => s.streak >= 3 },
  { key: "quiz_master", Icon: Trophy, color: "#6D4FF0", title: "Quiz Master", sub: "5 тестов пройдено", check: (s) => s.total_quizzes_passed >= 5 },
  { key: "bookworm", Icon: BookOpen, color: "#10b981", title: "Bookworm", sub: "10 уроков пройдено", check: (s) => s.total_lessons_completed >= 10 },
  { key: "traveler", Icon: Star, color: "#f0a500", title: "Traveler", sub: "Курс пройден", check: (s) => s.travel_completed },
];

function levelProgress(xp) {
  const band = LEVEL_BANDS.find((b) => xp >= b.min && xp <= b.max) || LEVEL_BANDS[0];
  if (band.max === Infinity) return { band, percent: 100, toNext: 0 };
  const percent = Math.round(((xp - band.min) / (band.max - band.min + 1)) * 100);
  return { band, percent: Math.min(100, Math.max(0, percent)), toNext: band.max + 1 - xp };
}

function StatCard({ Icon, iconColor, value, label, sub }) {
  return (
    <div className="glass-card-light p-5 text-center">
      <Icon size={22} style={{ color: iconColor, margin: '0 auto 8px' }} />
      <p className="text-2xl font-extrabold font-sora" style={{ color: '#1A1532' }}>{value}</p>
      <p className="text-xs font-semibold mt-0.5" style={{ color: '#534A7A' }}>{label}</p>
      <p className="text-xs" style={{ color: '#8A82AD' }}>{sub}</p>
    </div>
  );
}

export default function ProfilePage() {
  usePageTitle("Profile");
  const [profile, setProfile] = useState(null);
  const [activity, setActivity] = useState([]);
  const [referral, setReferral] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ full_name: "", bio: "", selected_language: "ru" });
  const [editingName, setEditingName] = useState(false);
  const [editingBio, setEditingBio] = useState(false);
  const [nameDraft, setNameDraft] = useState("");
  const [bioDraft, setBioDraft] = useState("");

  useEffect(() => {
    Promise.all([api.get("/profile/me"), api.get("/progress/lessons"), api.get("/profile/referral")])
      .then(([profileRes, progressRes, referralRes]) => {
        setProfile(profileRes.data);
        setForm({
          full_name: profileRes.data.full_name,
          bio: profileRes.data.bio || "",
          selected_language: profileRes.data.selected_language,
        });
        setActivity(progressRes.data.slice(0, 5));
        setReferral(referralRes.data);
      })
      .finally(() => setLoading(false));
  }, []);

  function handleCopyReferralLink() {
    navigator.clipboard.writeText(referral.referral_link);
    showToast("Ссылка скопирована!", "success");
  }

  async function saveProfile(patch) {
    const res = await api.put("/profile/update", patch);
    setProfile(res.data);
    return res.data;
  }

  async function handleSave() {
    setSaving(true);
    try {
      const data = await saveProfile(form);
      setLang(data.selected_language);
      setEditing(false);
    } catch {
      // keep the form open so the user can retry
    } finally {
      setSaving(false);
    }
  }

  async function handleStyleChange(style) {
    try { await saveProfile({ avatar_style: style }); } catch { /* ignore */ }
  }

  async function handleRandomize() {
    try { await saveProfile({ avatar_seed: randomAvatarSeed() }); } catch { /* ignore */ }
  }

  async function handleNameSave() {
    setEditingName(false);
    const trimmed = nameDraft.trim();
    if (!trimmed || trimmed === profile.full_name) return;
    try { await saveProfile({ full_name: trimmed }); } catch { /* ignore */ }
  }

  async function handleBioSave() {
    setEditingBio(false);
    if (bioDraft === (profile.bio || "")) return;
    try { await saveProfile({ bio: bioDraft }); } catch { /* ignore */ }
  }

  if (loading) {
    return (
      <div className="min-h-screen" style={{ background: '#F4F1FF' }}>
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 py-10 animate-pulse space-y-5">
          <div className="h-40 rounded-2xl" style={{ background: 'rgba(109,79,240,0.08)' }} />
          <div className="grid sm:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => <div key={i} className="h-24 rounded-2xl" style={{ background: 'rgba(109,79,240,0.08)' }} />)}
          </div>
        </div>
      </div>
    );
  }

  const { band, percent, toNext } = levelProgress(profile.xp_points);

  return (
    <div className="min-h-screen page-enter" style={{ background: '#F4F1FF' }}>
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-6">

        {/* Avatar + info */}
        <div className="glass-card-light p-6 sm:p-8">
          <div className="flex flex-col items-center text-center gap-3">
            <img
              src={avatarUrl(profile.avatar_style, profile.avatar_seed)}
              alt={profile.full_name}
              className="w-[120px] h-[120px] rounded-full"
              style={{ border: '2px solid rgba(109,79,240,0.25)', boxShadow: '0 8px 24px rgba(109,79,240,0.15)' }}
            />

            <div className="flex flex-wrap items-center justify-center gap-2">
              {AVATAR_STYLES.map((s) => (
                <button
                  key={s.key}
                  onClick={() => handleStyleChange(s.key)}
                  title={s.label}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-semibold transition-all duration-150"
                  style={profile.avatar_style === s.key
                    ? { background: '#6D4FF0', color: 'white' }
                    : { background: 'rgba(109,79,240,0.08)', color: '#534A7A' }
                  }
                >
                  <span>{s.emoji}</span> {s.label}
                </button>
              ))}
              <button
                onClick={handleRandomize}
                className="flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-semibold transition-all duration-150"
                style={{ background: 'rgba(109,79,240,0.08)', color: '#6D4FF0' }}
              >
                <Shuffle size={13} /> Randomize
              </button>
            </div>

            {editingName ? (
              <input
                autoFocus
                value={nameDraft}
                onChange={(e) => setNameDraft(e.target.value)}
                onBlur={handleNameSave}
                onKeyDown={(e) => e.key === "Enter" && handleNameSave()}
                className="text-2xl font-extrabold text-center outline-none bg-transparent"
                style={{ color: '#1A1532', borderBottom: '2px solid rgba(109,79,240,0.35)' }}
              />
            ) : (
              <h1
                onClick={() => { setNameDraft(profile.full_name); setEditingName(true); }}
                title="Click to edit"
                className="text-2xl font-extrabold font-sora cursor-pointer hover:opacity-70 transition-opacity duration-150"
                style={{ color: '#1A1532' }}
              >
                {profile.full_name}
              </h1>
            )}
            <p className="text-sm" style={{ color: '#8A82AD' }}>{profile.email}</p>

            {editingBio ? (
              <textarea
                autoFocus
                rows={2}
                value={bioDraft}
                onChange={(e) => setBioDraft(e.target.value)}
                onBlur={handleBioSave}
                className="glass-input-light w-full max-w-md p-2 text-sm resize-none rounded-xl"
              />
            ) : (
              <p
                onClick={() => { setBioDraft(profile.bio || ""); setEditingBio(true); }}
                title="Click to edit"
                className="text-sm cursor-pointer hover:opacity-70 transition-opacity duration-150 max-w-md"
                style={{ color: '#8A82AD' }}
              >
                {profile.bio || "Add a bio / Добавить описание"}
              </p>
            )}

            <div className="w-full max-w-xs">
              <div className="flex items-center justify-center gap-2 mb-1">
                <span className="text-sm font-bold" style={{ color: '#1A1532' }}>{band.label}</span>
                <span className="text-xs" style={{ color: '#8A82AD' }}>{profile.xp_points} XP</span>
              </div>
              <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(109,79,240,0.1)' }}>
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${percent}%`, background: 'linear-gradient(90deg, #6D4FF0, #9B7AFF)' }}
                />
              </div>
              {band.max !== Infinity && (
                <p className="text-xs mt-1" style={{ color: '#8A82AD' }}>{toNext} XP to next level</p>
              )}
            </div>

            <button
              onClick={() => setEditing((v) => !v)}
              className="mt-2 px-5 py-2.5 rounded-xl font-semibold text-sm text-white transition-all duration-200 hover:-translate-y-0.5"
              style={{ background: 'linear-gradient(135deg, #6D4FF0, #9B7AFF)', boxShadow: '0 4px 12px rgba(109,79,240,0.2)' }}
            >
              {editing ? "Close / Закрыть" : "Edit Profile / Редактировать"}
            </button>
          </div>

          {editing && (
            <div className="mt-6 pt-6 space-y-4 animate-slide-up" style={{ borderTop: '1px solid rgba(109,79,240,0.1)' }}>
              <div>
                <label className="text-xs font-bold uppercase mb-1.5 block" style={{ color: '#8A82AD' }}>Full name / Имя</label>
                <input
                  value={form.full_name}
                  onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))}
                  className="glass-input-light w-full px-3 py-2.5 text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-bold uppercase mb-1.5 block" style={{ color: '#8A82AD' }}>Bio / О себе</label>
                <textarea
                  rows={3}
                  value={form.bio}
                  onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
                  className="glass-input-light w-full px-3 py-2.5 text-sm resize-none"
                />
              </div>
              <div>
                <label className="text-xs font-bold uppercase mb-1.5 block" style={{ color: '#8A82AD' }}>
                  Language / Язык объяснений
                </label>
                <div className="flex gap-2">
                  {LANGUAGES.map((l) => (
                    <button
                      key={l.code}
                      onClick={() => setForm((f) => ({ ...f, selected_language: l.code }))}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-150"
                      style={form.selected_language === l.code
                        ? { background: '#6D4FF0', color: 'white' }
                        : { background: 'rgba(109,79,240,0.08)', color: '#534A7A' }
                      }
                    >
                      {l.flag} {l.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-6 py-2.5 rounded-xl font-semibold text-sm text-white transition-all duration-200 disabled:opacity-60"
                  style={{ background: 'linear-gradient(135deg, #6D4FF0, #9B7AFF)' }}
                >
                  {saving ? "Saving..." : "Save / Сохранить"}
                </button>
                <button
                  onClick={() => setEditing(false)}
                  className="px-6 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200"
                  style={{ background: 'rgba(109,79,240,0.08)', color: '#534A7A' }}
                >
                  Cancel / Отмена
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Stat cards */}
        <div className="grid sm:grid-cols-4 gap-4">
          <StatCard Icon={Flame} iconColor="#FF5C8A" value={profile.streak} label="Day streak" sub="дней подряд" />
          <StatCard Icon={Star} iconColor="#f0a500" value={profile.xp_points} label="XP points" sub="очков опыта" />
          <StatCard Icon={BookOpen} iconColor="#6D4FF0" value={profile.total_lessons_completed} label="Lessons done" sub="уроков пройдено" />
          <StatCard Icon={Gem} iconColor="#6D4FF0" value={profile.coins} label="Coins" sub="монеты" />
        </div>

        {/* Achievements */}
        <div className="glass-card-light p-6 sm:p-8">
          <h2 className="text-lg font-bold font-sora mb-0.5" style={{ color: '#1A1532' }}>Achievements</h2>
          <p className="text-sm mb-5" style={{ color: '#8A82AD' }}>Достижения</p>
          <div className="grid sm:grid-cols-5 gap-4">
            {ACHIEVEMENTS.map((a) => {
              const unlocked = a.check(profile);
              return (
                <div
                  key={a.key}
                  className="relative rounded-xl p-4 text-center border transition-all duration-200"
                  style={unlocked
                    ? { borderColor: 'rgba(109,79,240,0.3)', background: 'rgba(109,79,240,0.06)' }
                    : { borderColor: 'rgba(26,21,50,0.1)', background: 'rgba(26,21,50,0.03)', opacity: 0.6 }
                  }
                >
                  {!unlocked && (
                    <span className="absolute top-2 right-2">
                      <Lock size={11} style={{ color: '#8A82AD' }} />
                    </span>
                  )}
                  <a.Icon size={28} style={{ color: unlocked ? a.color : '#8A82AD', margin: '0 auto 8px', opacity: unlocked ? 1 : 0.5 }} />
                  <p className="text-sm font-bold" style={{ color: '#1A1532' }}>{a.title}</p>
                  <p className="text-xs" style={{ color: '#8A82AD' }}>{a.sub}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Referral */}
        {referral && (
          <div className="glass-card-light p-6 sm:p-8">
            <h2 className="text-lg font-bold font-sora mb-1 flex items-center gap-2" style={{ color: '#1A1532' }}>
              <Gift size={18} style={{ color: '#6D4FF0' }} /> Пригласи друга / Даъват кун дӯстро
            </h2>
            <p className="text-sm mb-1" style={{ color: '#8A82AD' }}>За каждого приглашённого друга ты получаешь <Gem size={13} className="inline" style={{ color: '#6D4FF0' }} /> 50 монет!</p>
            <p className="text-sm mb-5" style={{ color: '#8A82AD' }}>Твой друг получает <Gem size={13} className="inline" style={{ color: '#6D4FF0' }} /> 20 монет в подарок!</p>

            <div className="flex flex-col sm:flex-row gap-2 mb-5">
              <input
                readOnly
                value={referral.referral_link}
                onFocus={(e) => e.target.select()}
                className="glass-input-light flex-1 px-3 py-2.5 text-sm"
              />
              <button
                onClick={handleCopyReferralLink}
                className="px-5 py-2.5 rounded-xl font-semibold text-sm text-white transition-all duration-200 flex items-center gap-2 justify-center whitespace-nowrap"
                style={{ background: 'linear-gradient(135deg, #6D4FF0, #9B7AFF)' }}
              >
                <Copy size={14} /> Copy
              </button>
            </div>

            <div className="grid sm:grid-cols-2 gap-4 mb-5">
              <StatCard Icon={Users} iconColor="#6D4FF0" value={referral.referral_count} label="Приглашено друзей" sub="referrals" />
              <StatCard Icon={Gem} iconColor="#6D4FF0" value={referral.coins_earned} label="Заработано монет" sub="coins earned" />
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <a
                href={`https://t.me/share/url?url=${encodeURIComponent(referral.referral_link)}&text=${encodeURIComponent("Учи английский бесплатно с ИИ!")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 text-center px-5 py-2.5 rounded-xl font-semibold text-sm text-white hover:opacity-90 transition-all duration-200"
                style={{ background: '#229ED9' }}
              >
                Поделиться в Telegram
              </a>
              <a
                href={`https://wa.me/?text=${encodeURIComponent(`Учи английский с ZaboniAI! ${referral.referral_link}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 text-center px-5 py-2.5 rounded-xl font-semibold text-sm text-white hover:opacity-90 transition-all duration-200"
                style={{ background: '#25D366' }}
              >
                Поделиться в WhatsApp
              </a>
            </div>
          </div>
        )}

        {/* Activity */}
        <div className="glass-card-light p-6 sm:p-8">
          <h2 className="text-lg font-bold font-sora mb-0.5" style={{ color: '#1A1532' }}>Recent Activity</h2>
          <p className="text-sm mb-5" style={{ color: '#8A82AD' }}>Недавняя активность</p>
          {activity.length === 0 ? (
            <p className="text-sm" style={{ color: '#8A82AD' }}>No activity yet / Пока нет активности</p>
          ) : (
            <div className="space-y-2">
              {activity.map((a) => (
                <div
                  key={a.lesson_id}
                  className="flex items-center justify-between px-4 py-3 rounded-xl"
                  style={{ background: 'rgba(109,79,240,0.04)' }}
                >
                  <span className="text-sm font-medium" style={{ color: '#1A1532' }}>{a.lesson_title || `Lesson #${a.lesson_id}`}</span>
                  <span
                    className="text-sm font-bold px-2.5 py-1 rounded-full"
                    style={a.score >= 60
                      ? { background: 'rgba(16,185,129,0.1)', color: '#059669' }
                      : { background: 'rgba(244,63,94,0.1)', color: '#e11d48' }
                    }
                  >
                    {a.score}%
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
