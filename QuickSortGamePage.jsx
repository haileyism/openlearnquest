import React, { useEffect, useMemo, useState } from 'react';
import { Trophy, RotateCcw, TriangleAlert, Heart } from 'lucide-react';

const MAX_LEVEL = 3;
const LEVEL_ARRAYS = {
  1: [45, 20, 80, 55, 10, 30, 70],
  2: [64, 12, 91, 37, 58, 23, 86, 41, 5],
  3: [73, 18, 99, 42, 67, 24, 88, 53, 11, 35, 60],
};

const isLeveledMode = (mode) => mode === 'training' || mode === 'regular';
const getProgressKey = (mode) => `sortlogic.quick.${mode}.maxLevel`;
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
    const key = `sortlogic.quick.${mode}.completedLevel`;
    const prev = Number(localStorage.getItem(key) || 0);
    if (level > prev) {
      localStorage.setItem(key, String(level));
    }
  } catch {
    // Ignore storage errors and continue normally.
  }
};
const getInitialRanges = (level) => [{ l: 0, r: LEVEL_ARRAYS[level].length - 1 }];

export default function QuickSortGamePage({ mode, onExit }) {
  const [level, setLevel] = useState(1);
  const [maxUnlockedLevel, setMaxUnlockedLevel] = useState(getUnlockedLevel(mode));
  const [data, setData] = useState([...LEVEL_ARRAYS[1]]);
  const [ranges, setRanges] = useState(getInitialRanges(1));
  const [partitionState, setPartitionState] = useState({
    i: -1,
    j: 0,
    phase: 'compare', // compare | pivotSwap
  });
  const [mistakes, setMistakes] = useState(0);
  const [lives, setLives] = useState(5);
  const [timer, setTimer] = useState(0);
  const [comparisons, setComparisons] = useState(0);
  const [score, setScore] = useState(0);
  const [repeats, setRepeats] = useState(1);
  const [partitions, setPartitions] = useState(0);
  const [activityLog, setActivityLog] = useState([]);
  const [modal, setModal] = useState({ open: false, msg: '' });
  const [isComplete, setIsComplete] = useState(false);
  const [activePseudoLine, setActivePseudoLine] = useState(1);

  const currentRange = ranges.length > 0 ? ranges[ranges.length - 1] : null;
  const pivotIndex = currentRange ? currentRange.r : -1;
  const pivotValue = pivotIndex >= 0 ? data[pivotIndex] : null;

  useEffect(() => {
    const interval = setInterval(() => {
      setTimer((t) => (isComplete ? t : t + 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [isComplete]);

  useEffect(() => {
    if (!currentRange || isComplete) return;
    if (partitionState.j < currentRange.l || partitionState.j > currentRange.r) {
      setPartitionState({
        i: currentRange.l - 1,
        j: currentRange.l,
        phase: 'compare',
      });
      setActivePseudoLine(2);
    }
  }, [currentRange, isComplete, partitionState.j]);

  const formatTime = (s) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;
  const getRelation = (a, b) => (a > b ? 'bigger' : a < b ? 'smaller' : 'equal');

  const instruction = useMemo(() => {
    const isTutorial = mode === 'tutorial';
    const isTraining = mode === 'training';
    if (isComplete) {
      if (isTutorial) return 'Sorted! Quick sort is done when every partition has at most one element. The pivot is always in its final position. Well done!';
      if (isTraining) return 'Sorted! Well done.';
      return 'Sorted! Quick Sort complete.';
    }
    if (!currentRange) {
      if (isTutorial) return 'No active partition—wait for the next range to be processed.';
      if (isTraining) return 'Waiting for next partition.';
      return 'No active partition.';
    }
    const { i, j, phase } = partitionState;
    if (phase === 'pivotSwap') {
      if (isTutorial) return `Partition scan is complete. All elements less than the pivot (${pivotValue}) are to the left of index i+1. Now we place the pivot in its final position by swapping it from index ${currentRange.r} to index ${i + 1}. Click “Swap Pivot with arr[i + 1]”.`;
      if (isTraining) return 'Place the pivot in its final position.';
      return `Partition scan finished. Now swap pivot ${pivotValue} at index ${currentRange.r} with index ${i + 1}.`;
    }
    if (isTutorial) return `We’re partitioning the range [${currentRange.l}..${currentRange.r}] with pivot ${pivotValue} (at the end). For each element arr[j] = ${data[j]} we ask: is it less than the pivot? If yes, we extend the “small” region and swap. Choose “True” if ${data[j]} < ${pivotValue}, otherwise “False”.`;
    if (isTraining) return 'For each element, decide if it’s less than the pivot.';
    return `Range [${currentRange.l}..${currentRange.r}], pivot ${pivotValue}. Decide whether arr[${j}] (${data[j]}) is < pivot.`;
  }, [currentRange, data, isComplete, mode, partitionState, pivotValue]);

  const logAction = (msg, cls = 'text-slate-400') => {
    setActivityLog((prev) => [{ msg, cls }, ...prev].slice(0, 80));
  };

  const resetGame = (isRepeat = false, targetLevel = level) => {
    setData([...LEVEL_ARRAYS[targetLevel]]);
    setRanges(getInitialRanges(targetLevel));
    setPartitionState({ i: -1, j: 0, phase: 'compare' });
    setMistakes(0);
    setLives(5);
    setTimer(0);
    setComparisons(0);
    setScore(0);
    setPartitions(0);
    setRepeats((r) => (isRepeat ? r + 1 : r));
    setActivityLog([]);
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
      ? `Tutorial: ${msg} In tutorial mode you have unlimited lives. Use the instruction above to decide whether the current element is less than the pivot.`
      : mode === 'training'
        ? 'Training: Compare to pivot. Move left only if value < pivot.'
        : 'Quick: Move left only when value < pivot.';
    setModal({ open: true, msg: modalMsg });

    if (mode === 'regular') {
      setLives((l) => {
        if (l <= 1) {
          alert('Game Over! Try Training Mode.');
          onExit();
          return 5;
        }
        return l - 1;
      });
    }
  };

  const isIndexInAnyActiveRange = (idx) => ranges.some((range) => idx >= range.l && idx <= range.r);

  const finishPartitionAndPushRanges = (pivotFinalIndex) => {
    if (!currentRange) return;
    const { l, r } = currentRange;
    const nextRanges = ranges.slice(0, -1);
    const leftRange = { l, r: pivotFinalIndex - 1 };
    const rightRange = { l: pivotFinalIndex + 1, r };

    if (rightRange.r - rightRange.l >= 1) nextRanges.push(rightRange);
    if (leftRange.r - leftRange.l >= 1) nextRanges.push(leftRange);

    setRanges(nextRanges);
    setPartitions((p) => p + 1);
    setScore((s) => s + 10);
    setActivePseudoLine(8);
    logAction(`Pivot ${data[pivotFinalIndex]} placed at index ${pivotFinalIndex}`, 'text-green-500');

    if (nextRanges.length === 0) {
      saveCompletedLevel(mode, level);
      unlockNextLevel();
      setIsComplete(true);
      setActivePseudoLine(1);
      logAction('SORT COMPLETE', 'text-amber-500 font-bold');
      return;
    }

    const nextRange = nextRanges[nextRanges.length - 1];
    setPartitionState({
      i: nextRange.l - 1,
      j: nextRange.l,
      phase: 'compare',
    });
    setActivePseudoLine(2);
  };

  const handleDecision = (isLessDecision) => {
    if (isComplete || !currentRange || partitionState.phase !== 'compare') return;

    const { l, r } = currentRange;
    const { i, j } = partitionState;
    if (j >= r) {
      setPartitionState((prev) => ({ ...prev, phase: 'pivotSwap' }));
      setActivePseudoLine(8);
      return;
    }

    const currentVal = data[j];
    const isActuallyLess = currentVal < pivotValue;
    const relation = getRelation(currentVal, pivotValue);
    setComparisons((c) => c + 1);
    setActivePseudoLine(5);

    if (isLessDecision !== isActuallyLess) {
      triggerError(
        `${currentVal} is ${relation} than pivot ${pivotValue}. This comparison should evaluate to ${isActuallyLess ? 'true' : 'false'}.`,
      );
      return;
    }

    let nextData = [...data];
    let nextI = i;

    if (isActuallyLess) {
      nextI = i + 1;
      [nextData[nextI], nextData[j]] = [nextData[j], nextData[nextI]];
      setData(nextData);
      setScore((s) => s + 5);
      setActivePseudoLine(7);
      logAction(`Moved ${currentVal} left of pivot boundary`, 'text-cyan-400');
    } else {
      logAction(`Kept ${currentVal} on right side of pivot`, 'text-slate-400');
    }

    const nextJ = j + 1;
    if (nextJ >= r) {
      setPartitionState({ i: nextI, j: nextJ, phase: 'pivotSwap' });
      setActivePseudoLine(8);
      return;
    }

    setPartitionState({ i: nextI, j: nextJ, phase: 'compare' });
    setActivePseudoLine(4);
  };

  const handlePivotSwap = () => {
    if (isComplete || !currentRange || partitionState.phase !== 'pivotSwap') return;

    const { r } = currentRange;
    const pivotTarget = partitionState.i + 1;
    const nextData = [...data];
    [nextData[pivotTarget], nextData[r]] = [nextData[r], nextData[pivotTarget]];
    setData(nextData);
    setScore((s) => s + 10);
    finishPartitionAndPushRanges(pivotTarget);
  };

  return (
    <div className="animate-in fade-in duration-500">
      <div className="flex flex-col lg:flex-row gap-8">
        <div className="flex-grow bg-white rounded-3xl shadow-xl border border-slate-200 p-8">
          <div className="flex justify-between items-center mb-8">
            <div className="flex gap-4">
              <div className="bg-slate-50 px-4 py-2 rounded-xl font-mono text-slate-600 border border-slate-100">Time: {formatTime(timer)}</div>
              <div className="bg-slate-50 px-4 py-2 rounded-xl font-mono text-slate-600 border border-slate-100">Mistakes: {mistakes}</div>
            </div>
            <div className="flex gap-2 text-red-500">
              {mode === 'training' || mode === 'tutorial' ? (
                <span className="text-xs font-bold text-slate-400 bg-slate-100 px-3 py-1 rounded-full uppercase tracking-tighter">
                  {mode === 'tutorial' ? 'Tutorial • Unlimited Lives' : 'Unlimited Lives'}
                </span>
              ) : (
                Array.from({ length: 5 }).map((_, i) => (
                  <Heart key={i} fill={i < lives ? 'currentColor' : 'none'} size={24} className={i >= lives ? 'text-slate-200' : ''} />
                ))
              )}
            </div>
          </div>

          {isLeveledMode(mode) && (
            <div className="mb-6 flex items-center justify-between gap-4 flex-wrap">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Level {level} · Array Size {LEVEL_ARRAYS[level].length}
              </div>
              <div className="flex gap-2">
                {[1, 2, 3].map((lvl) => (
                  <button
                    key={lvl}
                    onClick={() => handleSelectLevel(lvl)}
                    disabled={lvl > maxUnlockedLevel}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors
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

          <div className="h-64 flex items-end justify-center gap-3 mb-6">
            {data.map((val, idx) => {
              const inCurrentRange = currentRange ? idx >= currentRange.l && idx <= currentRange.r : false;
              const inAnyRange = isIndexInAnyActiveRange(idx);
              const isJ = currentRange && partitionState.phase === 'compare' && idx === partitionState.j && partitionState.j < currentRange.r;
              const isI = idx === partitionState.i;
              const isIP1 = idx === partitionState.i + 1 && currentRange;

              return (
                <div key={`${val}-${idx}`} className="flex flex-col items-center gap-2">
                  <div
                    className={`w-12 rounded-t-xl flex items-center justify-center text-[10px] font-bold pb-2 transition-all shadow-sm
                      ${!inAnyRange || isComplete ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'}
                      ${inCurrentRange ? 'ring-2 ring-indigo-200' : ''}
                      ${idx === pivotIndex ? 'bg-purple-600 text-white ring-4 ring-purple-200' : ''}
                      ${isJ ? 'ring-4 ring-amber-200 border-2 border-amber-400' : ''}
                      ${isI ? 'border-2 border-cyan-500' : ''}
                      ${isIP1 ? 'border-2 border-emerald-500' : ''}
                    `}
                    style={{ height: `${val * 2}px` }}
                  >
                    {val}
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">idx {idx}</span>
                </div>
              );
            })}
          </div>

          {!isComplete && currentRange && (
            <div className="mb-8">
              {partitionState.phase === 'compare' ? (
                <div className="flex justify-center gap-3 flex-wrap">
                  <button
                    onClick={() => handleDecision(true)}
                    className="px-5 py-3 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700"
                  >
                    arr[j] &lt; pivot (True)
                  </button>
                  <button
                    onClick={() => handleDecision(false)}
                    className="px-5 py-3 rounded-xl border border-slate-300 text-slate-700 font-bold hover:bg-slate-50"
                  >
                    arr[j] &gt;= pivot (False)
                  </button>
                </div>
              ) : (
                <div className="flex justify-center">
                  <button
                    onClick={handlePivotSwap}
                    className="px-5 py-3 rounded-xl bg-purple-600 text-white font-bold hover:bg-purple-700"
                  >
                    Swap Pivot with arr[i + 1]
                  </button>
                </div>
              )}
              <div className="text-center text-xs text-slate-500 mt-3">
                {partitionState.phase === 'compare'
                  ? `Pointer state: i = ${partitionState.i}, j = ${partitionState.j}, pivot index = ${pivotIndex}`
                  : `Finalize partition: place pivot from index ${pivotIndex} to index ${partitionState.i + 1}`}
              </div>
            </div>
          )}

          {mode !== 'regular' && (
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 mb-8 text-center">
              <p className={`font-semibold text-slate-700 ${mode === 'tutorial' ? 'text-left leading-relaxed' : ''}`}>{instruction}</p>
            </div>
          )}

          <div className="flex justify-center gap-4">
            <button onClick={() => resetGame(true)} className="px-6 py-2 border border-slate-300 rounded-xl hover:bg-slate-50 font-bold text-slate-600 flex items-center gap-2">
              <RotateCcw size={18} /> Reset Level
            </button>
            <button onClick={onExit} className="px-6 py-2 bg-slate-900 text-white rounded-xl hover:bg-slate-800 font-bold">Exit</button>
          </div>
        </div>

        <div className="lg:w-80 space-y-6">
          <div className="bg-white p-6 rounded-3xl shadow-lg border border-slate-200">
            <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Trophy size={18} className="text-amber-500" /> Analytics
            </h4>
            <div className="space-y-4 text-sm">
              <div className="flex justify-between"><span className="text-slate-500">Repeats</span><span className="font-bold text-slate-900">{repeats}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Partitions</span><span className="font-bold text-slate-900">{partitions}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Comparisons</span><span className="font-bold text-slate-900">{comparisons}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Score</span><span className="font-bold text-green-600">+{score}</span></div>
            </div>
          </div>

          <div className="bg-slate-900 p-6 rounded-3xl shadow-lg text-white">
            <h4 className="font-bold mb-4 text-xs uppercase tracking-widest text-indigo-400">Pseudocode Trace</h4>
            <pre className="text-[11px] text-indigo-200 leading-relaxed font-mono">
              <span className={activePseudoLine === 1 ? 'bg-indigo-700 text-white px-1 rounded' : ''}>1: quickSort(low, high)</span>
              {'\n'}
              <span className={activePseudoLine === 2 ? 'bg-indigo-700 text-white px-1 rounded' : ''}>2:   pivot = arr[high]</span>
              {'\n'}
              <span className={activePseudoLine === 3 ? 'bg-indigo-700 text-white px-1 rounded' : ''}>3:   i = low - 1</span>
              {'\n'}
              <span className={activePseudoLine === 4 ? 'bg-indigo-700 text-white px-1 rounded' : ''}>4:   for j = low to high - 1</span>
              {'\n'}
              <span className={activePseudoLine === 5 ? 'bg-indigo-700 text-white px-1 rounded' : ''}>5:     if arr[j] &lt; pivot</span>
              {'\n'}
              <span className={activePseudoLine === 6 ? 'bg-indigo-700 text-white px-1 rounded' : ''}>6:       i = i + 1</span>
              {'\n'}
              <span className={activePseudoLine === 7 ? 'bg-indigo-700 text-white px-1 rounded' : ''}>7:       swap(arr[i], arr[j])</span>
              {'\n'}
              <span className={activePseudoLine === 8 ? 'bg-indigo-700 text-white px-1 rounded' : ''}>8:   swap(arr[i + 1], arr[high])</span>
            </pre>
          </div>

          <div className="bg-slate-900 rounded-3xl p-6 shadow-lg text-indigo-100 h-[300px] flex flex-col">
            <h3 className="font-bold mb-4 text-xs uppercase tracking-widest text-slate-500">Activity Log</h3>
            <div className="text-xs space-y-2 overflow-y-auto font-mono flex-grow">
              {activityLog.map((entry, idx) => (
                <div key={`${entry.msg}-${idx}`} className={entry.cls}>
                  {'> '}
                  {entry.msg}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {modal.open && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full p-8 shadow-2xl scale-100 animate-in zoom-in-95 duration-300">
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mb-6">
              <TriangleAlert size={32} />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-2">{mode === 'tutorial' ? 'Here\'s what went wrong' : 'Logic Violation!'}</h3>
            <p className="text-slate-600 mb-8 leading-relaxed">{modal.msg}</p>
            <button onClick={() => setModal({ open: false, msg: '' })} className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold hover:bg-slate-800 transition-colors">
              I Understand
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
