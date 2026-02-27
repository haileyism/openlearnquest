export const MAX_LEVEL = 3;
export const LEVELS = [1, 2, 3];

export const isLeveledMode = (mode) => mode === 'training' || mode === 'regular';

export const getUnlockedLevel = (algoKey, mode) => {
  if (!isLeveledMode(mode)) return 1;
  try {
    const saved = Number(localStorage.getItem(`sortlogic.${algoKey}.${mode}.maxLevel`));
    if (Number.isInteger(saved) && saved >= 1 && saved <= MAX_LEVEL) return saved;
  } catch {
    // Ignore localStorage issues.
  }
  return 1;
};

export const saveUnlockedLevel = (algoKey, mode, level) => {
  if (!isLeveledMode(mode)) return;
  try {
    localStorage.setItem(`sortlogic.${algoKey}.${mode}.maxLevel`, String(level));
  } catch {
    // Ignore localStorage issues.
  }
};

export const saveCompletedLevel = (algoKey, mode, level) => {
  if (!isLeveledMode(mode)) return;
  try {
    const key = `sortlogic.${algoKey}.${mode}.completedLevel`;
    const prev = Number(localStorage.getItem(key) || 0);
    if (level > prev) {
      localStorage.setItem(key, String(level));
    }
  } catch {
    // Ignore localStorage issues.
  }
};

export const getCompletedLevel = (algoKey, mode) => {
  if (!isLeveledMode(mode)) return 0;
  try {
    const savedCompleted = Number(localStorage.getItem(`sortlogic.${algoKey}.${mode}.completedLevel`));
    if (Number.isInteger(savedCompleted) && savedCompleted >= 0 && savedCompleted <= MAX_LEVEL) {
      return savedCompleted;
    }
  } catch {
    // Ignore localStorage issues.
  }

  // Backward-compatible fallback for runs completed before completedLevel existed.
  const unlocked = getUnlockedLevel(algoKey, mode);
  return Math.max(0, Math.min(MAX_LEVEL, unlocked - 1));
};
