import React, { useEffect, useMemo, useState } from 'react';
import { Trophy, RotateCcw, TriangleAlert, Heart, ChevronDown, ChevronUp } from 'lucide-react';
import HelpPlaceholder from './HelpPlaceholder';

const MAX_LEVEL = 3;
const LEVEL_ARRAYS = {
  1: [45, 20, 80, 55, 10, 30, 70],
  2: [64, 12, 91, 37, 58, 23, 86, 41, 5],
  3: [73, 18, 99, 42, 67, 24, 88, 53, 11, 35, 60],
};
const RANDOM_MIN = 0;
const RANDOM_MAX = 100;
const randomIntInRange = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const buildRandomLevelArray = (level) =>
  Array.from({ length: LEVEL_ARRAYS[level].length }, () => randomIntInRange(RANDOM_MIN, RANDOM_MAX));

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

export default function QuickSortGamePage({ mode, onExit, onBackToMode }) {
  const [level, setLevel] = useState(1);
  const [maxUnlockedLevel, setMaxUnlockedLevel] = useState(getUnlockedLevel(mode));
  const [data, setData] = useState([...LEVEL_ARRAYS[1]]);
  const [ranges, setRanges] = useState(getInitialRanges(1));
  const [partitionState, setPartitionState] = useState({
    i: -1,
    j: 0,
    phase: 'compare', // compare | partitionSwap | pivotSwap
  });
  const [dragIndex, setDragIndex] = useState(null);
  const [fixedPivots, setFixedPivots] = useState([]);
  const [mistakes, setMistakes] = useState(0);
  const [lives, setLives] = useState(5);
  const [timer, setTimer] = useState(0);
  const [comparisons, setComparisons] = useState(0);
  const [score, setScore] = useState(0);
  const [repeats, setRepeats] = useState(1);
  const [partitions, setPartitions] = useState(0);
  const [activityLog, setActivityLog] = useState([]);
  const [activityOpen, setActivityOpen] = useState(false);
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
      if (isTutorial) return `Partition scan is complete. Drag pivot ${pivotValue} from index ${currentRange.r} to index i+1 (${i + 1}) to lock the pivot in final position.`;
      if (isTraining) return `Drag pivot index ${currentRange.r} to index ${i + 1} to finish this partition.`;
      return `Finalize partition by swapping pivot index ${currentRange.r} with index ${i + 1}.`;
    }
    if (phase === 'partitionSwap') {
      if (isTutorial) return `You selected True for A[j] <= pivot, so now perform the swap yourself: drag index j (${j}) onto index i (${i}).`;
      if (isTraining) return `Manual step: drag j (${j}) and i (${i}) to complete the swap.`;
      return `Swap required: exchange indices i=${i} and j=${j}.`;
    }
    if (isTutorial) return `We’re partitioning [${currentRange.l}..${currentRange.r}] around pivot ${pivotValue}. Decide if arr[j=${j}] = ${data[j]} is <= pivot. If true, i moves right and you manually swap arr[i] with arr[j].`;
    if (isTraining) return `Decision step: compare arr[j=${j}] = ${data[j]} with pivot ${pivotValue}.`;
    return `Compare arr[${j}] (${data[j]}) with pivot ${pivotValue}.`;
  }, [currentRange, data, isComplete, mode, partitionState, pivotValue]);

  const logAction = (msg, cls = 'text-slate-400') => {
    setActivityLog((prev) => [{ msg, cls }, ...prev].slice(0, 80));
  };

  const resetGame = (isRepeat = false, targetLevel = level, randomizeValues = false) => {
    const nextData = randomizeValues ? buildRandomLevelArray(targetLevel) : [...LEVEL_ARRAYS[targetLevel]];
    setData(nextData);
    setRanges(getInitialRanges(targetLevel));
    setPartitionState({ i: -1, j: 0, phase: 'compare' });
    setDragIndex(null);
    setFixedPivots([]);
    setMistakes(0);
    setLives(5);
    setTimer(0);
    setComparisons(0);
    setScore(0);
    setPartitions(0);
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
      ? `Tutorial: ${msg} Use partition rule: if A[j] <= pivot, increment i and swap A[i] with A[j].`
      : mode === 'training'
        ? `Guided Practice: ${msg} Compare to pivot, then manually perform required swaps.`
        : 'Quick: Move left when value <= pivot.';
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
    setFixedPivots((prev) => [...prev, pivotFinalIndex]);
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

  const handleDecision = (isLeDecision) => {
    if (isComplete || !currentRange || partitionState.phase !== 'compare') return;

    const { l, r } = currentRange;
    const { i, j } = partitionState;
    if (j >= r) {
      setPartitionState((prev) => ({ ...prev, phase: 'pivotSwap' }));
      setActivePseudoLine(8);
      return;
    }

    const currentVal = data[j];
    const isActuallyLe = currentVal <= pivotValue;
    const relation = getRelation(currentVal, pivotValue);
    setComparisons((c) => c + 1);
    setActivePseudoLine(5);

    if (isLeDecision !== isActuallyLe) {
      triggerError(
        `${currentVal} is ${relation} than pivot ${pivotValue}. This comparison should evaluate to ${isActuallyLe ? 'true' : 'false'} for (A[j] <= pivot).`,
      );
      return;
    }

    let nextI = i;

    if (isActuallyLe) {
      nextI = i + 1;
      if (nextI === j) {
        setScore((s) => s + 5);
        logAction(`A[j]=${currentVal} <= pivot, i and j are same index (${j})`, 'text-cyan-400');
        const nextJ = j + 1;
        if (nextJ >= r) {
          setPartitionState({ i: nextI, j: nextJ, phase: 'pivotSwap' });
          setActivePseudoLine(8);
          return;
        }
        setPartitionState({ i: nextI, j: nextJ, phase: 'compare' });
        setActivePseudoLine(4);
        return;
      }
      setPartitionState({ i: nextI, j, phase: 'partitionSwap' });
      setActivePseudoLine(7);
      logAction(`True: now swap i=${nextI} with j=${j}`, 'text-cyan-400');
      return;
    }

    logAction(`A[j]=${currentVal} > pivot, kept on right side`, 'text-slate-400');
    const nextJ = j + 1;
    if (nextJ >= r) {
      setPartitionState({ i: nextI, j: nextJ, phase: 'pivotSwap' });
      setActivePseudoLine(8);
      return;
    }
    setPartitionState({ i: nextI, j: nextJ, phase: 'compare' });
    setActivePseudoLine(4);
  };

  const handleDragStart = (idx) => {
    if (isComplete || !currentRange) return;
    if (partitionState.phase === 'partitionSwap') {
      if (idx !== partitionState.i && idx !== partitionState.j) {
        triggerError(`Swap only i (${partitionState.i}) and j (${partitionState.j}) for this step.`);
        return;
      }
      setDragIndex(idx);
      return;
    }
    if (partitionState.phase === 'pivotSwap') {
      const swapTarget = partitionState.i + 1;
      if (idx !== pivotIndex && idx !== swapTarget) {
        triggerError(`Pivot placement allows only indices ${pivotIndex} and ${swapTarget}.`);
        return;
      }
      setDragIndex(idx);
    }
  };

  const handleDragEnd = () => {
    if (dragIndex !== null) setDragIndex(null);
  };

  const handleManualSwapDrop = (targetIdx) => {
    if (isComplete || !currentRange || dragIndex === null) return;
    const sourceIdx = dragIndex;
    setDragIndex(null);

    if (partitionState.phase === 'partitionSwap') {
      const valid = (sourceIdx === partitionState.i && targetIdx === partitionState.j)
        || (sourceIdx === partitionState.j && targetIdx === partitionState.i);
      if (!valid) {
        triggerError(`Swap only indices i=${partitionState.i} and j=${partitionState.j}.`);
        return;
      }
      const nextData = [...data];
      [nextData[partitionState.i], nextData[partitionState.j]] = [nextData[partitionState.j], nextData[partitionState.i]];
      setData(nextData);
      setScore((s) => s + 5);
      logAction(`Swapped arr[i=${partitionState.i}] and arr[j=${partitionState.j}]`, 'text-cyan-400');

      const nextJ = partitionState.j + 1;
      if (nextJ >= currentRange.r) {
        setPartitionState((prev) => ({ ...prev, j: nextJ, phase: 'pivotSwap' }));
        setActivePseudoLine(8);
        return;
      }
      setPartitionState((prev) => ({ ...prev, j: nextJ, phase: 'compare' }));
      setActivePseudoLine(4);
      return;
    }

    if (partitionState.phase !== 'pivotSwap') return;

    const { r } = currentRange;
    const pivotTarget = partitionState.i + 1;
    const valid = (sourceIdx === r && targetIdx === pivotTarget) || (sourceIdx === pivotTarget && targetIdx === r);
    if (!valid) {
      triggerError(`Swap only pivot index ${r} with index ${pivotTarget}.`);
      return;
    }
    const nextData = [...data];
    [nextData[pivotTarget], nextData[r]] = [nextData[r], nextData[pivotTarget]];
    setData(nextData);
    setScore((s) => s + 10);
    finishPartitionAndPushRanges(pivotTarget);
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

          <div className="h-64 flex items-end justify-between gap-1 mb-6 w-full">
            {data.map((val, idx) => {
              const inCurrentRange = currentRange ? idx >= currentRange.l && idx <= currentRange.r : false;
              const inAnyRange = isIndexInAnyActiveRange(idx);
              const isJ = currentRange && partitionState.phase === 'compare' && idx === partitionState.j && partitionState.j < currentRange.r;
              const isI = idx === partitionState.i;
              const isIP1 = idx === partitionState.i + 1 && currentRange;
              const isFixedPivot = fixedPivots.includes(idx);
              const isLeftPartition = inCurrentRange && idx >= currentRange.l && idx <= partitionState.i && idx !== pivotIndex;
              const isRightPartition = inCurrentRange && idx > partitionState.i && idx < pivotIndex;
              const isManualSwapTarget = partitionState.phase === 'partitionSwap' && (idx === partitionState.i || idx === partitionState.j);
              const isPivotSwapTarget = partitionState.phase === 'pivotSwap' && (idx === pivotIndex || idx === partitionState.i + 1);

              return (
                <div key={`${val}-${idx}`} className="flex-1 max-w-[84px] flex flex-col items-center gap-2">
                  <div
                    draggable={!isComplete && (isManualSwapTarget || isPivotSwapTarget)}
                    onDragStart={() => handleDragStart(idx)}
                    onDragEnd={handleDragEnd}
                    onDragOver={(e) => {
                      if (!isComplete && dragIndex !== null && (isManualSwapTarget || isPivotSwapTarget)) e.preventDefault();
                    }}
                    onDrop={() => handleManualSwapDrop(idx)}
                    className={`w-full rounded-t-xl flex items-center justify-center text-base font-bold pb-2 transition-all shadow-sm
                      ${isFixedPivot || !inAnyRange || isComplete ? 'bg-indigo-600 text-white' : isLeftPartition ? 'bg-emerald-100 text-emerald-800' : isRightPartition ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-500'}
                      ${inCurrentRange ? 'ring-2 ring-indigo-200' : ''}
                      ${idx === pivotIndex ? 'bg-purple-600 text-white ring-4 ring-purple-200' : ''}
                      ${isJ ? 'ring-4 ring-amber-200 border-2 border-amber-400' : ''}
                      ${isI ? 'border-2 border-cyan-500' : ''}
                      ${isIP1 ? 'border-2 border-emerald-500' : ''}
                      ${isFixedPivot ? 'border-2 border-purple-300' : ''}
                      ${(isManualSwapTarget || isPivotSwapTarget) ? 'cursor-grab active:cursor-grabbing' : ''}
                      ${dragIndex === idx ? 'opacity-60' : ''}
                    `}
                    style={{ height: `${val * 2}px` }}
                  >
                    {val}
                  </div>
                  {!isComplete && (
                    <div className="min-h-[12px] text-[9px] font-bold uppercase tracking-tight text-slate-500">
                      {[
                        currentRange && idx === currentRange.l ? 'p' : '',
                        idx === partitionState.j && partitionState.phase === 'compare' && partitionState.j < (currentRange?.r ?? -1) ? 'j' : '',
                        idx === partitionState.i ? 'i' : '',
                        currentRange && idx === partitionState.i + 1 ? 'i+1' : '',
                        idx === pivotIndex ? 'pivot,r' : '',
                        fixedPivots.includes(idx) ? 'pivot-fixed' : '',
                      ].filter(Boolean).join(' · ')}
                    </div>
                  )}
                  <span className="text-xs font-bold text-slate-500 uppercase">idx {idx}</span>
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
                    A[j] &lt;= pivot (True)
                  </button>
                  <button
                    onClick={() => handleDecision(false)}
                    className="px-5 py-3 rounded-xl border border-slate-300 text-slate-700 font-bold hover:bg-slate-50"
                  >
                    A[j] &gt; pivot (False)
                  </button>
                </div>
              ) : partitionState.phase === 'partitionSwap' ? (
                <div className="flex justify-center">
                  <div className="px-5 py-3 rounded-xl bg-cyan-50 border border-cyan-200 text-cyan-800 font-bold">
                    Drag i and j to perform the swap
                  </div>
                </div>
              ) : (
                <div className="flex justify-center">
                  <div className="px-5 py-3 rounded-xl bg-purple-50 border border-purple-200 text-purple-800 font-bold">
                    Drag pivot and i+1 to finalize this partition
                  </div>
                </div>
              )}
              <div className="text-center text-xs text-slate-500 mt-3">
                {partitionState.phase === 'compare'
                  ? `Pointer state: i = ${partitionState.i}, j = ${partitionState.j}, pivot index = ${pivotIndex}`
                  : partitionState.phase === 'partitionSwap'
                    ? `Manual swap: exchange i=${partitionState.i} with j=${partitionState.j}`
                    : `Finalize partition: place pivot from index ${pivotIndex} to index ${partitionState.i + 1}`}
              </div>
              <div className="text-center text-xs text-slate-500 mt-1">
                Green = current left subarray (&lt;= pivot zone), amber = current right subarray (&gt; pivot candidates), purple tags = finalized pivots.
              </div>
            </div>
          )}

          {mode !== 'regular' && (
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 mb-4 text-center">
              <p className={`font-semibold text-slate-800 text-xl ${mode === 'tutorial' ? 'text-left leading-relaxed' : ''}`}>{instruction}</p>
            </div>
          )}
          <HelpPlaceholder mode={mode} algorithm="quick" />

          <div className="flex justify-center gap-3">
            <button onClick={() => resetGame(true, level, true)} className="px-6 py-3 border border-slate-300 rounded-xl hover:bg-slate-50 font-bold text-slate-700 text-lg flex items-center gap-2">
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
              <span className={activePseudoLine === 1 ? 'bg-indigo-700 text-white px-1 rounded' : ''}>1: QUICKSORT(A, p, r)</span>
              {'\n'}
              <span className={activePseudoLine === 2 ? 'bg-indigo-700 text-white px-1 rounded' : ''}>2:   if p &lt; r</span>
              {'\n'}
              <span className={activePseudoLine === 3 ? 'bg-indigo-700 text-white px-1 rounded' : ''}>3:     q = PARTITION(A, p, r)</span>
              {'\n'}
              <span className={activePseudoLine === 4 ? 'bg-indigo-700 text-white px-1 rounded' : ''}>4: PARTITION(A, p, r): x = A[r], i = p - 1</span>
              {'\n'}
              <span className={activePseudoLine === 5 ? 'bg-indigo-700 text-white px-1 rounded' : ''}>5: for j = p to r - 1, if A[j] &lt;= x</span>
              {'\n'}
              <span className={activePseudoLine === 6 ? 'bg-indigo-700 text-white px-1 rounded' : ''}>6:       i = i + 1</span>
              {'\n'}
              <span className={activePseudoLine === 7 ? 'bg-indigo-700 text-white px-1 rounded' : ''}>7:       swap(A[i], A[j])</span>
              {'\n'}
              <span className={activePseudoLine === 8 ? 'bg-indigo-700 text-white px-1 rounded' : ''}>8: swap(A[i + 1], A[r]); return i + 1</span>
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





