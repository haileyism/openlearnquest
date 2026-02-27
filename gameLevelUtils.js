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
