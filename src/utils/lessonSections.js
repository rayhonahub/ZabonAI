export function parseSections(content) {
  if (!content) return [];
  const lines = content.split("\n");
  const sections = [];
  let current = null;

  for (const line of lines) {
    const match = line.match(/^(#{2,3})\s+(.*)/);
    if (match) {
      if (current) sections.push(current);
      current = { heading: match[2], level: match[1].length, body: "" };
    } else if (current) {
      current.body += line + "\n";
    } else {
      current = { heading: null, level: 2, body: line + "\n" };
    }
  }
  if (current) sections.push(current);
  return sections.filter((s) => s.heading || s.body.trim());
}

const EMOJI_RULES = [
  [/greet|hello|introduc/i, "👋"],
  [/number|count|age/i, "🔢"],
  [/colo[u]?r/i, "🎨"],
  [/day|week|calendar/i, "📅"],
  [/famil/i, "👨‍👩‍👧"],
  [/body/i, "🧍"],
  [/home|room|furnitur/i, "🏠"],
  [/food|drink|eat/i, "🍎"],
  [/animal/i, "🐾"],
  [/weather/i, "☀️"],
  [/verb|tense|grammar|be\b/i, "✍️"],
  [/question/i, "❓"],
  [/past/i, "⏳"],
  [/future|will|going to/i, "🔮"],
  [/modal|can|must|should/i, "💪"],
  [/article/i, "📰"],
  [/talk|conversation|small talk/i, "💬"],
  [/restaurant|food|order/i, "🍽️"],
  [/airport|travel|hotel/i, "✈️"],
  [/doctor|health/i, "🩺"],
  [/work|job|interview/i, "💼"],
  [/email|writ/i, "✉️"],
  [/idiom|express/i, "💡"],
  [/opinion|agree/i, "🗣️"],
];

export function emojiForLesson(title) {
  if (!title) return "📘";
  for (const [pattern, emoji] of EMOJI_RULES) {
    if (pattern.test(title)) return emoji;
  }
  return "📘";
}
