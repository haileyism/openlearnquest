import React, { useEffect, useMemo, useState } from 'react';
import { Trophy, RotateCcw, TriangleAlert, Heart } from 'lucide-react';
import { LEVELS, MAX_LEVEL, getUnlockedLevel, isLeveledMode, saveCompletedLevel, saveUnlockedLevel } from './gameLevelUtils';
import HelpPlaceholder from './HelpPlaceholder';

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

export default function SelectionSortGamePage({ mode, onExit, onBackToMode }) {
  const [level, setLevel] = useState(1);
  const [maxUnlockedLevel, setMaxUnlockedLevel] = useState(getUnlockedLevel('selection', mode));
  const [data, setData] = useState([...LEVEL_ARRAYS[1]]);
  const [iIndex, setIIndex] = useState(0);
  const [jIndex, setJIndex] = useState(1);
  const [minIndex, setMinIndex] = useState(0);
  const [phase, setPhase] = useState('scan');
  const [dragIndex, setDragIndex] = useState(null);
  const [mistakes, setMistakes] = useState(0);
  const [lives, setLives] = useState(5);
  const [timer, setTimer] = useState(0);
  const [comparisons, setComparisons] = useState(0);
  const [swaps, setSwaps] = useState(0);
  const [score, setScore] = useState(0);
  const [activityLog, setActivityLog] = useState([]);
  const [isComplete, setIsComplete] = useState(false);
  const [modal, setModal] = useState({ open: false, msg: '' });
  const [activePseudoLine, setActivePseudoLine] = useState(1);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimer((t) => (isComplete ? t : t + 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [isComplete]);

  const formatTime = (s) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;
  const logAction = (msg, cls = 'text-slate-400') => setActivityLog((prev) => [{ msg, cls }, ...prev].slice(0, 80));

  const resetGame = (targetLevel = level, randomizeValues = false) => {
    const arr = randomizeValues ? buildRandomLevelArray(targetLevel) : [...LEVEL_ARRAYS[targetLevel]];
    setData(arr);
    setIIndex(0);
    setJIndex(1);
    setMinIndex(0);
    setPhase('scan');
    setDragIndex(null);
    setMistakes(0);
    setLives(5);
    setTimer(0);
    setComparisons(0);
    setSwaps(0);
    setScore(0);
    setActivityLog([]);
    setIsComplete(false);
    setModal({ open: false, msg: '' });
    setActivePseudoLine(1);
  };

  useEffect(() => {
    const unlocked = getUnlockedLevel('selection', mode);
    setLevel(1);
    setMaxUnlockedLevel(unlocked);
    resetGame(1);
  }, [mode]);

  const unlockNextLevel = () => {
    if (!isLeveledMode(mode)) return;
    setMaxUnlockedLevel((prev) => {
      const next = Math.min(MAX_LEVEL, Math.max(prev, level + 1));
      if (next !== prev) saveUnlockedLevel('selection', mode, next);
      return next;
    });
  };

  const triggerError = (msg) => {
    setMistakes((m) => m + 1);
    const modalMsg = mode === 'tutorial'
      ? `Tutorial: ${msg} Selection sort scans the unsorted tail to find the minimum, then places it at index i.`
      : mode === 'training'
        ? 'Guided Practice: Update minimum only when current value is smaller.'
        : 'Selection: Keep smallest seen, then place it at i.';
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

  const moveToNextPass = (nextData) => {
    const nextI = iIndex + 1;
    if (nextI >= nextData.length - 1) {
      saveCompletedLevel('selection', mode, level);
      unlockNextLevel();
      setIsComplete(true);
      logAction('SORT COMPLETE', 'text-amber-500 font-bold');
      setActivePseudoLine(1);
      return;
    }
    setIIndex(nextI);
    setJIndex(nextI + 1);
    setMinIndex(nextI);
    setPhase('scan');
    setActivePseudoLine(2);
  };

  const advanceScan = (nextMin) => {
    if (jIndex + 1 >= data.length) {
      setPhase('place');
      setActivePseudoLine(6);
      return;
    }
    setJIndex(jIndex + 1);
    setMinIndex(nextMin);
  };

  const handleKeepMin = () => {
    if (isComplete || phase !== 'scan') return;
    const actualShouldMark = data[jIndex] < data[minIndex];
    setComparisons((c) => c + 1);
    setActivePseudoLine(4);
    if (actualShouldMark) {
      triggerError(`Index j=${jIndex} is the new minimum. Drag index ${jIndex} to the min_index box.`);
      return;
    }
    logAction(`Kept min_index at ${minIndex}`, 'text-slate-400');
    advanceScan(minIndex);
  };

  const handleDragStart = (idx) => {
    if (isComplete) return;
    if (phase === 'scan') {
      if (idx !== jIndex) {
        triggerError(`Drag only the active j index (${jIndex}) when updating min_index.`);
        return;
      }
      setDragIndex(idx);
      return;
    }
    if (phase === 'place') {
      if (idx !== iIndex && idx !== minIndex) {
        triggerError(`In swap phase, drag only i (${iIndex}) and min_index (${minIndex}).`);
        return;
      }
      setDragIndex(idx);
    }
  };

  const handleDragEnd = () => {
    if (dragIndex !== null) {
      setDragIndex(null);
    }
  };

  const handleDropMinIndex = () => {
    if (isComplete || phase !== 'scan' || dragIndex === null) return;
    const sourceIdx = dragIndex;
    setDragIndex(null);
    if (sourceIdx !== jIndex) {
      triggerError(`Drag only index j (${jIndex}) to update min_index.`);
      return;
    }
    const actualShouldMark = data[jIndex] < data[minIndex];
    setComparisons((c) => c + 1);
    setActivePseudoLine(4);
    if (!actualShouldMark) {
      triggerError(`Index j=${jIndex} is not smaller than min_index=${minIndex}. Click Keep Min.`);
      return;
    }
    setMinIndex(jIndex);
    setScore((s) => s + 5);
    logAction(`New min at idx ${jIndex}`, 'text-cyan-400');
    setActivePseudoLine(5);
    advanceScan(jIndex);
  };

  const handleDropSwap = (targetIdx) => {
    if (isComplete || phase !== 'place' || dragIndex === null) return;
    const sourceIdx = dragIndex;
    setDragIndex(null);
    const validSwap = (sourceIdx === iIndex && targetIdx === minIndex)
      || (sourceIdx === minIndex && targetIdx === iIndex);
    if (!validSwap) {
      triggerError(`Swap only index i (${iIndex}) with min_index (${minIndex}).`);
      return;
    }
    const next = [...data];
    if (minIndex !== iIndex) {
      [next[iIndex], next[minIndex]] = [next[minIndex], next[iIndex]];
      setSwaps((s) => s + 1);
      setScore((s) => s + 10);
      logAction(`Placed min at idx ${iIndex}`, 'text-green-500');
    }
    setData(next);
    moveToNextPass(next);
  };

  const handleContinuePlace = () => {
    if (isComplete || phase !== 'place' || minIndex !== iIndex) return;
    logAction(`Min already at idx ${iIndex}`);
    moveToNextPass([...data]);
  };

  const instruction = useMemo(() => {
    if (isComplete) return 'Sorted! Selection sort complete.';
    if (phase === 'scan') {
      return `Scan step: index j = ${jIndex}. Compare value ${data[jIndex]} against current min_value ${data[minIndex]} (min_index = ${minIndex}). If smaller, drag j to min_index.`;
    }
    if (minIndex === iIndex) return `Place step: min_index already equals i = ${iIndex}. Click Continue Pass.`;
    return `Place step: swap index i = ${iIndex} with min_index = ${minIndex} by dragging one onto the other.`;
  }, [isComplete, phase, jIndex, minIndex, iIndex]);

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
                Array.from({ length: 5 }).map((_, idx) => (
                  <Heart key={idx} fill={idx < lives ? 'currentColor' : 'none'} size={24} className={idx >= lives ? 'text-slate-200' : ''} />
                ))
              )}
            </div>
          </div>

          {isLeveledMode(mode) && (
            <div className="mb-4 flex items-center justify-between gap-3 flex-wrap">
              <div className="text-base font-bold uppercase tracking-wide text-slate-600">Level {level} · Array Size {LEVEL_ARRAYS[level].length}</div>
              <div className="flex gap-2">
                {LEVELS.map((lvl) => (
                  <button
                    key={lvl}
                    onClick={() => {
                      if (lvl <= maxUnlockedLevel) {
                        setLevel(lvl);
                        resetGame(lvl);
                      }
                    }}
                    disabled={lvl > maxUnlockedLevel}
                    className={`px-4 py-2 rounded-lg text-sm font-bold border transition-colors ${lvl === level ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-600 border-slate-300'} ${lvl > maxUnlockedLevel ? 'opacity-40 cursor-not-allowed' : 'hover:bg-slate-50'}`}
                  >
                    L{lvl}
                  </button>
                ))}
              </div>
            </div>
          )}

          {!isComplete && (
            <div className="grid md:grid-cols-2 gap-3 mb-4">
              <div
                onDragOver={(e) => {
                  if (phase === 'scan') e.preventDefault();
                }}
                onDrop={handleDropMinIndex}
                className="bg-cyan-50 border border-cyan-300 rounded-xl p-3"
              >
                <p className="text-[11px] font-bold uppercase tracking-wider text-cyan-700 mb-1">min_index</p>
                <p className="text-xl font-bold text-cyan-800">{minIndex}</p>
              </div>
              <div className="bg-indigo-50 border border-indigo-300 rounded-xl p-3">
                <p className="text-[11px] font-bold uppercase tracking-wider text-indigo-700 mb-1">min_val</p>
                <p className="text-xl font-bold text-indigo-800">{data[minIndex]}</p>
              </div>
            </div>
          )}

          <div className="h-64 flex items-end justify-between gap-1 mb-8 w-full">
            {data.map((val, idx) => (
              <div key={`${val}-${idx}`} className="flex-1 max-w-[84px] flex flex-col items-center gap-2">
                <div
                  draggable={!isComplete && ((phase === 'scan' && idx === jIndex) || (phase === 'place' && (idx === iIndex || idx === minIndex)))}
                  onDragStart={() => handleDragStart(idx)}
                  onDragEnd={handleDragEnd}
                  onDragOver={(e) => {
                    if (phase === 'place' && dragIndex !== null && (idx === iIndex || idx === minIndex)) e.preventDefault();
                  }}
                  onDrop={() => handleDropSwap(idx)}
                  className={`w-full rounded-t-xl flex items-center justify-center text-base font-bold pb-2 transition-all shadow-sm
                    ${idx < iIndex ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'}
                    ${idx === iIndex ? 'ring-4 ring-indigo-100 border-2 border-indigo-400 bg-white text-indigo-600' : ''}
                    ${phase === 'scan' && idx === jIndex ? 'ring-4 ring-amber-100 border-2 border-amber-400 bg-white text-slate-900' : ''}
                    ${idx === minIndex ? 'border-2 border-cyan-500' : ''}
                    ${(phase === 'place' && (idx === iIndex || idx === minIndex)) ? 'cursor-grab active:cursor-grabbing' : ''}
                    ${dragIndex === idx ? 'opacity-60' : ''}
                  `}
                  style={{ height: `${val * 2}px` }}
                >
                  {val}
                </div>
                <div className="min-h-[12px] text-[10px] font-bold uppercase tracking-tight text-slate-500">
                  {[
                    idx === iIndex ? 'i' : '',
                    phase === 'scan' && idx === jIndex ? 'j' : '',
                    idx === minIndex ? 'min' : '',
                  ].filter(Boolean).join(' · ')}
                </div>
                <span className="text-xs font-bold text-slate-500 uppercase">idx {idx}</span>
              </div>
            ))}
          </div>

          {!isComplete && (
            <div className="mb-8 flex justify-center gap-3 flex-wrap">
              {phase === 'scan' ? (
                <>
                  <button onClick={handleKeepMin} className="px-5 py-3 rounded-xl border border-slate-300 text-slate-700 font-bold hover:bg-slate-50">Keep Min</button>
                </>
              ) : (
                minIndex === iIndex ? (
                  <button onClick={handleContinuePlace} className="px-5 py-3 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700">Continue Pass</button>
                ) : (
                  <div className="px-5 py-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold">
                    Drag i and min_index to swap
                  </div>
                )
              )}
            </div>
          )}

          {mode !== 'regular' && (
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 mb-4 text-center">
              <p className={`font-semibold text-slate-800 text-xl ${mode === 'tutorial' ? 'text-left leading-relaxed' : ''}`}>{instruction}</p>
            </div>
          )}
          <HelpPlaceholder mode={mode} algorithm="selection" />

          <div className="flex justify-center gap-3">
            <button onClick={() => resetGame(level, true)} className="px-6 py-3 border border-slate-300 rounded-xl hover:bg-slate-50 font-bold text-slate-700 text-lg flex items-center gap-2"><RotateCcw size={18} /> Reset Level</button>
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
          </div>
          <div className="bg-slate-900 p-5 rounded-3xl shadow-lg text-white">
            <h4 className="font-bold mb-3 text-sm uppercase tracking-widest text-indigo-300">Pseudocode Trace</h4>
            <pre className="text-[16px] text-indigo-100 leading-relaxed font-mono">
              <span className={activePseudoLine === 1 ? 'bg-indigo-700 text-white px-1 rounded' : ''}>1: for i = 0 to n - 2</span>{'\n'}
              <span className={activePseudoLine === 2 ? 'bg-indigo-700 text-white px-1 rounded' : ''}>2:   min = i</span>{'\n'}
              <span className={activePseudoLine === 3 ? 'bg-indigo-700 text-white px-1 rounded' : ''}>3:   for j = i + 1 to n - 1</span>{'\n'}
              <span className={activePseudoLine === 4 ? 'bg-indigo-700 text-white px-1 rounded' : ''}>4:     if arr[j] &lt; arr[min]</span>{'\n'}
              <span className={activePseudoLine === 5 ? 'bg-indigo-700 text-white px-1 rounded' : ''}>5:       min = j</span>{'\n'}
              <span className={activePseudoLine === 6 ? 'bg-indigo-700 text-white px-1 rounded' : ''}>6:   swap(arr[i], arr[min])</span>
            </pre>
          </div>
        </div>
      </div>

      {modal.open && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-7 shadow-2xl">
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mb-6"><TriangleAlert size={32} /></div>
            <h3 className="text-3xl font-bold text-slate-900 mb-2">{mode === 'tutorial' ? 'Here\'s what went wrong' : 'Logic Violation!'}</h3>
            <p className="text-slate-700 text-xl mb-6 leading-relaxed">{modal.msg}</p>
            <button onClick={() => setModal({ open: false, msg: '' })} className="w-full bg-slate-900 text-white py-4 rounded-2xl text-xl font-bold hover:bg-slate-800">I Understand</button>
          </div>
        </div>
      )}
    </div>
  );
}





