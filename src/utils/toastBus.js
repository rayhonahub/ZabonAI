const listeners = new Set();

export function subscribeToast(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function showToast(message, type = "info") {
  listeners.forEach((fn) => fn({ id: Date.now() + Math.random(), message, type }));
}
