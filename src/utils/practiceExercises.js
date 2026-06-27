const FALLBACK_WORDS = ["hello", "book", "water", "house", "friend", "learn", "table", "happy"];

function shuffle(arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function generatePracticeExercises(vocabPairs, count = 3) {
  if (!vocabPairs || vocabPairs.length === 0) return [];
  const picked = shuffle(vocabPairs).slice(0, count);

  return picked.map((pair) => {
    const distractorPool = vocabPairs.filter((v) => v.word.toLowerCase() !== pair.word.toLowerCase()).map((v) => v.word);
    const fallback = FALLBACK_WORDS.filter((w) => w.toLowerCase() !== pair.word.toLowerCase());
    const distractors = shuffle([...distractorPool, ...fallback]).slice(0, 3);
    const options = shuffle([pair.word, ...distractors]);
    return {
      translation: pair.translation,
      answer: pair.word,
      options,
    };
  });
}
