export const AVATAR_STYLES = [
  { key: "fun-emoji", emoji: "😊", label: "Fun" },
  { key: "bottts", emoji: "🤖", label: "Robot" },
  { key: "croodles", emoji: "🎨", label: "Art" },
  { key: "avataaars", emoji: "👤", label: "Human" },
  { key: "adventurer", emoji: "🌟", label: "Cool" },
];

export function avatarUrl(style, seed) {
  return `https://api.dicebear.com/7.x/${style || "adventurer"}/svg?seed=${encodeURIComponent(seed || "default")}`;
}

export function randomAvatarSeed() {
  return Math.random().toString(36).slice(2, 10);
}
