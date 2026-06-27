export function extractVocab(content) {
  if (!content) return [];
  const regex = /\*{0,2}([A-Za-z][A-Za-z' ]{0,24}?)\*{0,2}\s+—\s+([^\n,]+)/g;
  const seen = new Set();
  const pairs = [];
  let match;
  while ((match = regex.exec(content)) !== null) {
    const word = match[1].trim();
    const translation = match[2].trim();
    const key = word.toLowerCase();
    if (!seen.has(key) && word.length > 1 && translation.length > 0) {
      seen.add(key);
      pairs.push({ word, translation });
    }
  }
  return pairs;
}
