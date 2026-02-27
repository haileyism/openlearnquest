import React, { useEffect, useMemo, useState } from 'react';
import { Trophy, RotateCcw, TriangleAlert, Heart } from 'lucide-react';
import { LEVELS, MAX_LEVEL, getUnlockedLevel, isLeveledMode, saveUnlockedLevel } from './gameLevelUtils';

const LEVEL_ARRAYS = {
  1: [45, 20, 80, 55, 10, 30, 70],
  2: [64, 12, 91, 37, 58, 23, 86, 41, 5],
  3: [73, 18, 99, 42, 67, 24, 88, 53, 11, 35, 60],
};

const buildHeapOps = (input) => {
  const arr = [...input];
  const ops = [];
  const swap = (i, j, heapSize, kind) => {
    [arr[i], arr[j]] = [arr[j], arr[i]];
    ops.push({ i, j, heapSize, kind });
  };
  const heapify = (n, root) => {
    let i = root;
    while (true) {
      let largest = i;
      const left = 2 * i + 1;
      const right = 2 * i + 2;
      if (left < n && arr[left] > arr[largest]) largest = left;
      if (right < n && arr[right] > arr[largest]) largest = right;
      if (largest === i) break;
      swap(i, largest, n, 'heapify');
      i = largest;
    }
  };

  for (let i = Math.floor(arr.length / 2) - 1; i >= 0; i -= 1) heapify(arr.length, i);
  for (let end = arr.length - 1; end > 0; end -= 1) {
    swap(0, end, end + 1, 'extract');
    heapify(end, 0);
  }
  return ops;
};

export default function HeapSortGamePage({ mode, onExit }) {
  const [level, setLevel] = useState(1);
  const [maxUnlockedLevel, setMaxUnlockedLevel] = useState(getUnlockedLevel('heap', mode));
  const [data, setData] = useState([...LEVEL_ARRAYS[1]]);
  const [ops, setOps] = useState(buildHeapOps(LEVEL_ARRAYS[1]));
  const [opIdx, setOpIdx] = useState(0);
  const [selectedIdx, setSelectedIdx] = useState(null);
  const [mistakes, setMistakes] = useState(0);
  const [lives, setLives] = useState(5);
  const [timer, setTimer] = useState(0);
  const [swaps, setSwaps] = useState(0);
  const [score, setScore] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [modal, setModal] = useState({ open: false, msg: '' });
  const [activePseudoLine, setActivePseudoLine] = useState(1);

  useEffect(() => {
    const interval = setInterval(() => setTimer((t) => (isComplete ? t : t + 1)), 1000);
    return () => clearInterval(interval);
  }, [isComplete]);

  const formatTime = (s) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;
  const currentOp = ops[opIdx];

  const resetGame = (targetLevel = level) => {
    const arr = [...LEVEL_ARRAYS[targetLevel]];
    setData(arr);
    setOps(buildHeapOps(arr));
    setOpIdx(0);
    setSelectedIdx(null);
    setMistakes(0);
    setLives(5);
    setTimer(0);
    setSwaps(0);
    setScore(0);
    setIsComplete(false);
    setModal({ open: false, msg: '' });
    setActivePseudoLine(1);
  };

  useEffect(() => {
    const unlocked = getUnlockedLevel('heap', mode);
    setLevel(1);
    setMaxUnlockedLevel(unlocked);
    resetGame(1);
  }, [mode]);

  const unlockNextLevel = () => {
    if (!isLeveledMode(mode)) return;
    setMaxUnlockedLevel((prev) => {
      const next = Math.min(MAX_LEVEL, Math.max(prev, level + 1));
      if (next !== prev) saveUnlockedLevel('heap', mode, next);
      return next;
    });
  };

  const triggerError = (msg) => {
    setMistakes((m) => m + 1);
    const modalMsg = mode === 'tutorial'
      ? `Tutorial: ${msg} Heap sort repeatedly swaps during heapify and extraction while maintaining max-heap property.`
      : mode === 'training'
        ? 'Training: Follow heap swap order from heapify/extract steps.'
        : 'Heap: Apply required heap swap to maintain max-heap.';
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

  const applyExpectedSwap = () => {
    if (!currentOp) return;
    const next = [...data];
    [next[currentOp.i], next[currentOp.j]] = [next[currentOp.j], next[currentOp.i]];
    setData(next);
    setSwaps((s) => s + 1);
    setScore((s) => s + 10);
    const nextIdx = opIdx + 1;
    if (nextIdx >= ops.length) {
      setIsComplete(true);
      unlockNextLevel();
      setActivePseudoLine(5);
      return;
    }
    setOpIdx(nextIdx);
    setActivePseudoLine(3);
  };

  const handlePickIndex = (idx) => {
    if (isComplete || !currentOp) return;
    if (selectedIdx === null) {
      setSelectedIdx(idx);
      setActivePseudoLine(4);
      return;
    }
    const matches = (selectedIdx === currentOp.i && idx === currentOp.j)
      || (selectedIdx === currentOp.j && idx === currentOp.i);
    setSelectedIdx(null);
    if (!matches) {
      triggerError(`Expected swap touches indices ${currentOp.i} and ${currentOp.j}.`);
      return;
    }
    applyExpectedSwap();
  };

  const instruction = useMemo(() => {
    if (isComplete) return 'Sorted! Heap sort complete.';
    if (!currentOp) return 'No pending operation.';
    if (mode === 'tutorial') {
      return `Perform next swap for ${currentOp.kind}: indices ${currentOp.i} and ${currentOp.j}.`;
    }
    return 'Select two bars for the next required heap swap.';
  }, [isComplete, currentOp, mode]);

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
                Array.from({ length: 5 }).map((_, idx) => (
                  <Heart key={idx} fill={idx < lives ? 'currentColor' : 'none'} size={24} className={idx >= lives ? 'text-slate-200' : ''} />
                ))
              )}
            </div>
          </div>

          {isLeveledMode(mode) && (
            <div className="mb-6 flex items-center justify-between gap-4 flex-wrap">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-500">Level {level} · Array Size {LEVEL_ARRAYS[level].length}</div>
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
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${lvl === level ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-600 border-slate-300'} ${lvl > maxUnlockedLevel ? 'opacity-40 cursor-not-allowed' : 'hover:bg-slate-50'}`}
                  >
                    L{lvl}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="h-64 flex items-end justify-center gap-3 mb-8">
            {data.map((val, idx) => {
              const heapSize = currentOp ? currentOp.heapSize : 0;
              const inHeap = idx < heapSize || isComplete;
              return (
                <div key={`${val}-${idx}`} className="flex flex-col items-center gap-2">
                  <button
                    onClick={() => handlePickIndex(idx)}
                    className={`w-12 rounded-t-xl flex items-center justify-center text-[10px] font-bold pb-2 transition-all shadow-sm
                      ${inHeap ? 'bg-slate-100 text-slate-600 hover:bg-slate-200' : 'bg-indigo-600 text-white'}
                      ${selectedIdx === idx ? 'ring-4 ring-amber-200 border-2 border-amber-400' : ''}
                      ${currentOp && (idx === currentOp.i || idx === currentOp.j) ? 'border-2 border-cyan-500' : ''}
                    `}
                    style={{ height: `${val * 2}px` }}
                  >
                    {val}
                  </button>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">idx {idx}</span>
                </div>
              );
            })}
          </div>

          {mode !== 'regular' && (
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 mb-8 text-center">
              <p className={`font-semibold text-slate-700 ${mode === 'tutorial' ? 'text-left leading-relaxed' : ''}`}>{instruction}</p>
            </div>
          )}

          <div className="flex justify-center gap-4">
            <button onClick={() => resetGame(level)} className="px-6 py-2 border border-slate-300 rounded-xl hover:bg-slate-50 font-bold text-slate-600 flex items-center gap-2"><RotateCcw size={18} /> Reset Level</button>
            <button onClick={onExit} className="px-6 py-2 bg-slate-900 text-white rounded-xl hover:bg-slate-800 font-bold">Exit</button>
          </div>
        </div>

        <div className="lg:w-80 space-y-6">
          <div className="bg-white p-6 rounded-3xl shadow-lg border border-slate-200">
            <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><Trophy size={18} className="text-amber-500" /> Analytics</h4>
            <div className="space-y-4 text-sm">
              <div className="flex justify-between"><span className="text-slate-500">Swaps</span><span className="font-bold text-slate-900">{swaps}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Step</span><span className="font-bold text-slate-900">{Math.min(opIdx + 1, ops.length)}/{ops.length}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Score</span><span className="font-bold text-green-600">+{score}</span></div>
            </div>
          </div>
          <div className="bg-slate-900 p-6 rounded-3xl shadow-lg text-white">
            <h4 className="font-bold mb-4 text-xs uppercase tracking-widest text-indigo-400">Pseudocode Trace</h4>
            <pre className="text-[11px] text-indigo-200 leading-relaxed font-mono">
              <span className={activePseudoLine === 1 ? 'bg-indigo-700 text-white px-1 rounded' : ''}>1: build max-heap</span>{'\n'}
              <span className={activePseudoLine === 2 ? 'bg-indigo-700 text-white px-1 rounded' : ''}>2: swap root with end</span>{'\n'}
              <span className={activePseudoLine === 3 ? 'bg-indigo-700 text-white px-1 rounded' : ''}>3: heapify reduced heap</span>{'\n'}
              <span className={activePseudoLine === 4 ? 'bg-indigo-700 text-white px-1 rounded' : ''}>4: repeat swaps</span>{'\n'}
              <span className={activePseudoLine === 5 ? 'bg-indigo-700 text-white px-1 rounded' : ''}>5: done</span>
            </pre>
          </div>
        </div>
      </div>

      {modal.open && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-8 shadow-2xl">
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mb-6"><TriangleAlert size={32} /></div>
            <h3 className="text-2xl font-bold text-slate-900 mb-2">{mode === 'tutorial' ? 'Here\'s what went wrong' : 'Logic Violation!'}</h3>
            <p className="text-slate-600 mb-8 leading-relaxed">{modal.msg}</p>
            <button onClick={() => setModal({ open: false, msg: '' })} className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold hover:bg-slate-800">I Understand</button>
          </div>
        </div>
      )}
    </div>
  );
}
