import React, { useEffect, useMemo, useState } from 'react';
import { Trophy, RotateCcw, TriangleAlert, Heart, ChevronDown, ChevronUp } from 'lucide-react';
import HelpPlaceholder from './HelpPlaceholder';

const MAX_LEVEL = 3;
const LEVEL_ARRAYS = {
  1: [45, 20, 80, 55, 10, 30, 70],
  2: [64, 12, 91, 37, 58, 23, 86, 41, 5],
  3: [73, 18, 99, 42, 67, 24, 88, 53, 11, 35, 60],
};

const isLeveledMode = (mode) => mode === 'training' || mode === 'regular';
const getProgressKey = (mode) => `sortlogic.bubble.${mode}.maxLevel`;
const getUnlockedLevel = (mode) => {
  if (!isLeveledMode(mode)) return 1;
  try {
    const saved = Number(localStorage.getItem(getProgressKey(mode)));
    if (Number.isInteger(saved) && saved >= 1 && saved <= MAX_LEVEL) return saved;
  } catch {
    // Ignore storage errors and fall back to level 1.
  }
  return 1;
};
const saveCompletedLevel = (mode, level) => {
  if (!isLeveledMode(mode)) return;
  try {
    const key = `sortlogic.bubble.${mode}.completedLevel`;
    const prev = Number(localStorage.getItem(key) || 0);
    if (level > prev) {
      localStorage.setItem(key, String(level));
    }
  } catch {
    // Ignore storage errors and continue normally.
  }
};

export default function BubbleSortGamePage({ mode, onExit, onBackToMode }) {
  const [level, setLevel] = useState(1);
  const [maxUnlockedLevel, setMaxUnlockedLevel] = useState(getUnlockedLevel(mode));
  const [data, setData] = useState([...LEVEL_ARRAYS[1]]);
  const [passIndex, setPassIndex] = useState(0);
  const [compareIndex, setCompareIndex] = useState(0);
  const [dragIndex, setDragIndex] = useState(null);
  const [swapMadeInPass, setSwapMadeInPass] = useState(false);
  const [mistakes, setMistakes] = useState(0);
  const [lives, setLives] = useState(5);
  const [timer, setTimer] = useState(0);
  const [comparisons, setComparisons] = useState(0);
  const [score, setScore] = useState(0);
  const [repeats, setRepeats] = useState(1);
  const [activityLog, setActivityLog] = useState([]);
  const [activityOpen, setActivityOpen] = useState(false);
  const [modal, setModal] = useState({ open: false, msg: '' });
  const [isComplete, setIsComplete] = useState(false);
  const [activePseudoLine, setActivePseudoLine] = useState(1);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimer((t) => (isComplete ? t : t + 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [isComplete]);

  const formatTime = (s) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;
  const getRelation = (a, b) => (a > b ? 'bigger' : a < b ? 'smaller' : 'equal');

  const instruction = useMemo(() => {
    const isTutorial = mode === 'tutorial';
    const isTraining = mode === 'training';
    if (isComplete) {
      if (isTutorial) return 'Sorted! Bubble sort is done when one full pass makes no swaps. Every element is now in ascending order. Great job!';
      if (isTraining) return 'Sorted! Well done.';
      return 'Sorted! Bubble Sort complete.';
    }
    const boundary = data.length - passIndex - 1;
    if (isTutorial) return `Pass ${passIndex + 1}: compare indices ${compareIndex} and ${compareIndex + 1}. If left > right, drag index ${compareIndex + 1} onto index ${compareIndex} to swap. If order is already correct, click Continue. This pass checks indices 0 to ${boundary}.`;
    if (isTraining) return 'Compare adjacent pair: drag right onto left to swap when left > right, otherwise click Continue.';
    return `Pass ${passIndex + 1}: active pair (${compareIndex}, ${compareIndex + 1}). Drag to swap if needed, or Continue.`;
  }, [compareIndex, data, mode, passIndex, isComplete]);

  const logAction = (msg, cls = 'text-slate-400') => {
    setActivityLog((prev) => [{ msg, cls }, ...prev].slice(0, 80));
  };

  const resetGame = (isRepeat = false, targetLevel = level) => {
    setData([...LEVEL_ARRAYS[targetLevel]]);
    setPassIndex(0);
    setCompareIndex(0);
    setDragIndex(null);
    setSwapMadeInPass(false);
    setMistakes(0);
    setLives(5);
    setTimer(0);
    setComparisons(0);
    setScore(0);
    setRepeats((r) => (isRepeat ? r + 1 : r));
    setActivityLog([]);
    setActivityOpen(false);
    setModal({ open: false, msg: '' });
    setIsComplete(false);
    setActivePseudoLine(1);
  };

  useEffect(() => {
    const unlocked = getUnlockedLevel(mode);
    setLevel(1);
    setMaxUnlockedLevel(unlocked);
    resetGame(false, 1);
  }, [mode]);

  const unlockNextLevel = () => {
    if (!isLeveledMode(mode)) return;
    setMaxUnlockedLevel((prev) => {
      const nextUnlocked = Math.min(MAX_LEVEL, Math.max(prev, level + 1));
      if (nextUnlocked !== prev) {
        try {
          localStorage.setItem(getProgressKey(mode), String(nextUnlocked));
        } catch {
          // Ignore storage errors and continue normally.
        }
        logAction(`Level ${nextUnlocked} unlocked`, 'text-emerald-400');
      }
      return nextUnlocked;
    });
  };

  const handleSelectLevel = (nextLevel) => {
    if (!isLeveledMode(mode) || nextLevel > maxUnlockedLevel) return;
    setLevel(nextLevel);
    resetGame(false, nextLevel);
  };

  const triggerError = (msg) => {
    setMistakes((m) => m + 1);
    const modalMsg = mode === 'tutorial'
      ? `Tutorial: ${msg} In tutorial mode you have unlimited lives—drag right onto left when left > right, otherwise click Continue.`
      : mode === 'training'
        ? 'Guided Practice: Compare adjacent pair. Drag right onto left only when left > right.'
        : 'Bubble: Drag swap only when left > right.';
    setModal({ open: true, msg: modalMsg });

    if (mode === 'regular') {
      setLives((l) => {
        if (l <= 1) {
          alert('Game Over! Try Guided Practice.');
          onExit();
          return 5;
        }
        return l - 1;
      });
    }
  };

  const finishSort = () => {
    saveCompletedLevel(mode, level);
    unlockNextLevel();
    setIsComplete(true);
    setActivePseudoLine(1);
    logAction('SORT COMPLETE', 'text-amber-500 font-bold');
  };

  const handleDecision = (shouldSwap) => {
    if (isComplete) return;
    const leftIdx = compareIndex;
    const rightIdx = compareIndex + 1;
    const leftVal = data[leftIdx];
    const rightVal = data[rightIdx];
    const needsSwap = leftVal > rightVal;
    const relation = getRelation(leftVal, rightVal);

    setComparisons((c) => c + 1);

    if (shouldSwap !== needsSwap) {
      triggerError(
        shouldSwap
          ? `Swap mismatch: ${leftVal} is ${relation} than ${rightVal}. This pair should not be swapped; click Continue instead.`
          : `Continue mismatch: ${leftVal} is ${relation} than ${rightVal}. This pair requires a drag swap (index ${rightIdx} onto index ${leftIdx}).`,
      );
      return;
    }

    let nextData = [...data];
    let didSwap = swapMadeInPass;

    if (needsSwap) {
      [nextData[leftIdx], nextData[rightIdx]] = [nextData[rightIdx], nextData[leftIdx]];
      didSwap = true;
      setData(nextData);
      setScore((s) => s + 10);
      setActivePseudoLine(4);
      logAction(`Swapped ${leftVal} and ${rightVal}`, 'text-green-500');
    } else {
      logAction(`Kept order: ${leftVal} <= ${rightVal}`, 'text-cyan-400');
    }

    const passBoundary = data.length - passIndex - 1;
    const reachedEndOfPass = rightIdx >= passBoundary;
    setDragIndex(null);

    if (reachedEndOfPass) {
      if (!didSwap || passIndex + 1 >= data.length - 1) {
        finishSort();
        return;
      }

      setPassIndex((p) => p + 1);
      setCompareIndex(0);
      setSwapMadeInPass(false);
      setActivePseudoLine(1);
      logAction(`Starting pass ${passIndex + 2}`);
      return;
    }

    setCompareIndex((j) => j + 1);
    setSwapMadeInPass(didSwap);
    setActivePseudoLine(3);
  };

  const handleContinue = () => {
    if (isComplete) return;
    setActivePseudoLine(3);
    handleDecision(false);
  };

  const handleDragStart = (idx) => {
    if (isComplete) return;
    const expectedSource = compareIndex + 1;
    if (idx !== expectedSource) {
      const sourceVal = data[idx];
      const expectedVal = data[expectedSource];
      const relation = getRelation(sourceVal, expectedVal);
      triggerError(
        `Invalid drag source: ${sourceVal} at index ${idx}. Drag the active right bar at index ${expectedSource} (value ${expectedVal}) onto index ${compareIndex}. ${sourceVal} is ${relation} than ${expectedVal}.`,
      );
      return;
    }
    setDragIndex(idx);
    setActivePseudoLine(3);
    logAction(`Inspecting pair [${data[compareIndex]}, ${data[compareIndex + 1]}]`);
  };

  const handleDragEnd = (idx) => {
    if (isComplete) return;
    if (dragIndex === idx) {
      setDragIndex(null);
      triggerError(`Invalid move. Drag index ${compareIndex + 1} onto index ${compareIndex} to swap, or click Continue.`);
    }
  };

  const handleDropSwap = (targetIdx) => {
    if (isComplete || dragIndex === null) return;
    const sourceIdx = dragIndex;
    setDragIndex(null);

    if (!(sourceIdx === compareIndex + 1 && targetIdx === compareIndex)) {
      const sourceVal = data[sourceIdx];
      const expectedVal = data[compareIndex + 1];
      const relation = getRelation(sourceVal, expectedVal);
      triggerError(
        `Invalid drop target. Drag index ${compareIndex + 1} (value ${expectedVal}) onto index ${compareIndex}. You dragged ${sourceVal}, which is ${relation} than the active right value.`,
      );
      return;
    }

    handleDecision(true);
  };

  return (
    <div className="animate-in fade-in duration-500 text-lg">
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex-grow bg-white rounded-3xl shadow-xl border border-slate-200 p-5">
          <div className="flex justify-between items-center mb-4">
            <div className="flex gap-4">
              {mode === 'regular' && (
                <>
                  <div className="bg-slate-50 px-5 py-3 rounded-xl font-mono text-slate-700 border border-slate-100 text-xl">Time: {formatTime(timer)}</div>
                  <div className="bg-slate-50 px-5 py-3 rounded-xl font-mono text-slate-700 border border-slate-100 text-xl">Mistakes: {mistakes}</div>
                </>
              )}
            </div>
            <div className="flex gap-2 text-red-500">
              {mode === 'tutorial' ? (
                <span className="text-xs font-bold text-slate-400 bg-slate-100 px-3 py-1 rounded-full uppercase tracking-tighter">
                  Tutorial • Unlimited Lives
                </span>
              ) : (
                Array.from({ length: 5 }).map((_, i) => (
                  <Heart key={i} fill={i < lives ? 'currentColor' : 'none'} size={24} className={i >= lives ? 'text-slate-200' : ''} />
                ))
              )}
            </div>
          </div>

          {isLeveledMode(mode) && (
            <div className="mb-4 flex items-center justify-between gap-3 flex-wrap">
              <div className="text-base font-bold uppercase tracking-wide text-slate-600">
                Level {level} · Array Size {LEVEL_ARRAYS[level].length}
              </div>
              <div className="flex gap-2">
                {[1, 2, 3].map((lvl) => (
                  <button
                    key={lvl}
                    onClick={() => handleSelectLevel(lvl)}
                    disabled={lvl > maxUnlockedLevel}
                    className={`px-4 py-2 rounded-lg text-sm font-bold border transition-colors
                      ${lvl === level ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-600 border-slate-300'}
                      ${lvl > maxUnlockedLevel ? 'opacity-40 cursor-not-allowed' : 'hover:bg-slate-50'}
                    `}
                  >
                    L{lvl}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="h-64 flex items-end justify-between gap-1 mb-8 w-full">
            {data.map((val, idx) => {
              const sortedTailStart = data.length - passIndex;
              const isSortedTail = idx >= sortedTailStart || isComplete;
              const isActivePair = !isComplete && (idx === compareIndex || idx === compareIndex + 1);
              return (
                <div key={`${val}-${idx}`} className="flex-1 max-w-[84px] flex flex-col items-center gap-2">
                  <div
                    draggable={!isComplete && idx === compareIndex + 1}
                    onDragStart={() => handleDragStart(idx)}
                    onDragEnd={() => handleDragEnd(idx)}
                    onDragOver={(e) => {
                      if (idx === compareIndex) e.preventDefault();
                    }}
                    onDrop={() => handleDropSwap(idx)}
                    className={`w-full rounded-t-xl flex items-center justify-center text-base font-bold pb-2 transition-all cursor-pointer shadow-sm
                      ${isSortedTail ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}
                      ${isActivePair ? 'ring-4 ring-amber-100 border-2 border-amber-400' : ''}
                      ${idx === compareIndex + 1 ? 'cursor-grab active:cursor-grabbing' : ''}
                      ${dragIndex === idx ? 'opacity-60' : ''}
                    `}
                    style={{ height: `${val * 2}px` }}
                  >
                    {val}
                  </div>
                  <span className="text-xs font-bold text-slate-500 uppercase">idx {idx}</span>
                </div>
              );
            })}
          </div>

          {!isComplete && (
            <div className="mb-8 flex justify-center">
              <button
                onClick={handleContinue}
                className="px-8 py-4 rounded-xl border border-slate-300 text-slate-800 text-xl font-bold hover:bg-slate-50"
              >
                Continue
              </button>
            </div>
          )}

          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 mb-4 text-center">
            <p className={`font-semibold text-slate-800 text-xl ${mode === 'tutorial' ? 'text-left leading-relaxed' : ''}`}>{instruction}</p>
          </div>
          <HelpPlaceholder mode={mode} />

          <div className="flex justify-center gap-3">
            <button onClick={() => resetGame(true)} className="px-6 py-3 border border-slate-300 rounded-xl hover:bg-slate-50 font-bold text-slate-700 text-lg flex items-center gap-2">
              <RotateCcw size={18} /> Reset Level
            </button>
            {onBackToMode && (
              <button
                onClick={onBackToMode}
                className="px-6 py-3 border border-slate-300 rounded-xl hover:bg-slate-50 font-bold text-slate-700 text-lg"
              >
                Back to Modes
              </button>
            )}
            <button onClick={onExit} className="px-6 py-3 bg-slate-900 text-white rounded-xl hover:bg-slate-800 font-bold text-lg">Exit</button>
          </div>
        </div>

        <div className="lg:w-80 xl:w-96 space-y-3">
          <div className="flex items-center gap-2">
            <div className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full uppercase tracking-tighter border border-slate-200">
              <Trophy size={12} className="text-amber-500" />
              Score: +{score}
            </div>
            <button
              onClick={() => setActivityOpen((prev) => !prev)}
              className="inline-flex items-center gap-1 text-xs font-bold text-indigo-700 bg-indigo-100 px-3 py-1 rounded-full uppercase tracking-tighter border border-indigo-200 hover:bg-indigo-200"
            >
              Activity
              {activityOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </button>
          </div>

          <div className="bg-slate-900 p-5 rounded-3xl shadow-lg text-white">
            <h4 className="font-bold mb-3 text-sm uppercase tracking-widest text-indigo-300">Pseudocode Trace</h4>
            <pre className="text-[16px] text-indigo-100 leading-relaxed font-mono">
              <span className={activePseudoLine === 1 ? 'bg-indigo-700 text-white px-1 rounded' : ''}>1: for i from 0 to n - 1</span>
              {'\n'}
              <span className={activePseudoLine === 2 ? 'bg-indigo-700 text-white px-1 rounded' : ''}>2:   for j from 0 to n - i - 2</span>
              {'\n'}
              <span className={activePseudoLine === 3 ? 'bg-indigo-700 text-white px-1 rounded' : ''}>3:     if arr[j] &gt; arr[j + 1]</span>
              {'\n'}
              <span className={activePseudoLine === 4 ? 'bg-indigo-700 text-white px-1 rounded' : ''}>4:       swap(arr[j], arr[j + 1])</span>
            </pre>
          </div>

          {activityOpen && (
            <div className="bg-slate-900 rounded-xl p-3 shadow-lg text-indigo-100">
              <div className="text-sm space-y-2 overflow-y-auto font-mono max-h-44 pr-1">
                {activityLog.length === 0 ? (
                  <div className="text-slate-400">No activity yet.</div>
                ) : (
                  activityLog.map((entry, idx) => (
                    <div key={`${entry.msg}-${idx}`} className={entry.cls}>
                      {'> '}
                      {entry.msg}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {modal.open && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-xl w-full p-7 shadow-2xl scale-100 animate-in zoom-in-95 duration-300">
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mb-6">
              <TriangleAlert size={32} />
            </div>
            <h3 className="text-3xl font-bold text-slate-900 mb-2">{mode === 'tutorial' ? 'Here\'s what went wrong' : 'Logic Violation!'}</h3>
            <p className="text-slate-700 text-xl mb-6 leading-relaxed">{modal.msg}</p>
            <button onClick={() => setModal({ open: false, msg: '' })} className="w-full bg-slate-900 text-white py-4 rounded-2xl text-xl font-bold hover:bg-slate-800 transition-colors">
              I Understand
            </button>
          </div>
        </div>
      )}
    </div>
  );
}





