import React, { useEffect, useMemo, useState } from 'react';
import { Trophy, RotateCcw, TriangleAlert, Heart } from 'lucide-react';
import { LEVELS, MAX_LEVEL, getUnlockedLevel, isLeveledMode, saveCompletedLevel, saveUnlockedLevel } from './gameLevelUtils';
import HelpPlaceholder from './HelpPlaceholder';

const LEVEL_ARRAYS = {
  1: [45, 20, 80, 55, 10, 30, 70],
  2: [64, 12, 91, 37, 58, 23, 86, 41, 5],
  3: [73, 18, 99, 42, 67, 24, 88, 53, 11, 35, 60],
};

const buildMergeTasks = (l, r, acc = []) => {
  if (l >= r) return acc;
  const m = Math.floor((l + r) / 2);
  buildMergeTasks(l, m, acc);
  buildMergeTasks(m + 1, r, acc);
  acc.push({ l, m, r });
  return acc;
};

export default function MergeSortGamePage({ mode, onExit, onBackToMode }) {
  const [level, setLevel] = useState(1);
  const [maxUnlockedLevel, setMaxUnlockedLevel] = useState(getUnlockedLevel('merge', mode));
  const [data, setData] = useState([...LEVEL_ARRAYS[1]]);
  const [tasks, setTasks] = useState(buildMergeTasks(0, LEVEL_ARRAYS[1].length - 1));
  const [taskIdx, setTaskIdx] = useState(0);
  const [leftArr, setLeftArr] = useState([]);
  const [rightArr, setRightArr] = useState([]);
  const [leftPos, setLeftPos] = useState(0);
  const [rightPos, setRightPos] = useState(0);
  const [merged, setMerged] = useState([]);
  const [mistakes, setMistakes] = useState(0);
  const [lives, setLives] = useState(5);
  const [timer, setTimer] = useState(0);
  const [moves, setMoves] = useState(0);
  const [score, setScore] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [modal, setModal] = useState({ open: false, msg: '' });
  const [activePseudoLine, setActivePseudoLine] = useState(1);

  useEffect(() => {
    const interval = setInterval(() => setTimer((t) => (isComplete ? t : t + 1)), 1000);
    return () => clearInterval(interval);
  }, [isComplete]);

  const formatTime = (s) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;
  const currentTask = tasks[taskIdx];

  const loadTaskState = (arr, nextTasks, idx) => {
    const t = nextTasks[idx];
    if (!t) return;
    setLeftArr(arr.slice(t.l, t.m + 1));
    setRightArr(arr.slice(t.m + 1, t.r + 1));
    setLeftPos(0);
    setRightPos(0);
    setMerged([]);
    setActivePseudoLine(3);
  };

  const resetGame = (targetLevel = level) => {
    const arr = [...LEVEL_ARRAYS[targetLevel]];
    const nextTasks = buildMergeTasks(0, arr.length - 1);
    setData(arr);
    setTasks(nextTasks);
    setTaskIdx(0);
    setMistakes(0);
    setLives(5);
    setTimer(0);
    setMoves(0);
    setScore(0);
    setIsComplete(false);
    setModal({ open: false, msg: '' });
    loadTaskState(arr, nextTasks, 0);
  };

  useEffect(() => {
    const unlocked = getUnlockedLevel('merge', mode);
    setLevel(1);
    setMaxUnlockedLevel(unlocked);
    resetGame(1);
  }, [mode]);

  const unlockNextLevel = () => {
    if (!isLeveledMode(mode)) return;
    setMaxUnlockedLevel((prev) => {
      const next = Math.min(MAX_LEVEL, Math.max(prev, level + 1));
      if (next !== prev) saveUnlockedLevel('merge', mode, next);
      return next;
    });
  };

  const triggerError = (msg) => {
    setMistakes((m) => m + 1);
    const modalMsg = mode === 'tutorial'
      ? `Tutorial: ${msg} Merge sort recursively splits, then merges by always taking the smaller front value.`
      : mode === 'training'
        ? 'Guided Practice: In merge step, always take the smaller front value.'
        : 'Merge: Pick smaller front value from left/right halves.';
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

  const finalizeCurrentTask = (nextMerged, nextData) => {
    if (!currentTask) return;
    const written = [...nextData];
    nextMerged.forEach((v, idx) => {
      written[currentTask.l + idx] = v;
    });
    setData(written);
    const nextTaskIdx = taskIdx + 1;
    if (nextTaskIdx >= tasks.length) {
      setIsComplete(true);
      saveCompletedLevel('merge', mode, level);
      unlockNextLevel();
      setActivePseudoLine(6);
      return;
    }
    setTaskIdx(nextTaskIdx);
    loadTaskState(written, tasks, nextTaskIdx);
  };

  const handleTake = (side) => {
    if (isComplete || !currentTask) return;
    const leftDone = leftPos >= leftArr.length;
    const rightDone = rightPos >= rightArr.length;
    let expected = 'left';
    if (leftDone) expected = 'right';
    else if (rightDone) expected = 'left';
    else expected = leftArr[leftPos] <= rightArr[rightPos] ? 'left' : 'right';

    if (side !== expected) {
      triggerError(`Compare ${leftArr[leftPos] ?? '-'} and ${rightArr[rightPos] ?? '-'}.`);
      return;
    }

    let nextLeft = leftPos;
    let nextRight = rightPos;
    const picked = side === 'left' ? leftArr[nextLeft++] : rightArr[nextRight++];
    const nextMerged = [...merged, picked];
    setLeftPos(nextLeft);
    setRightPos(nextRight);
    setMerged(nextMerged);
    setMoves((m) => m + 1);
    setScore((s) => s + 8);
    setActivePseudoLine(4);

    if (nextMerged.length >= leftArr.length + rightArr.length) {
      finalizeCurrentTask(nextMerged, data);
    }
  };

  const instruction = useMemo(() => {
    if (isComplete) return 'Sorted! Merge sort complete.';
    if (!currentTask) return 'No active merge.';
    return `Merge range [${currentTask.l}..${currentTask.r}]. Choose the smaller front value.`;
  }, [isComplete, currentTask]);

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

          <div className="mb-6">
            <h4 className="text-xs uppercase tracking-wider text-slate-500 mb-2">Array</h4>
            <div className="flex flex-wrap gap-3">
              {data.map((val, idx) => (
                <div key={`${val}-${idx}`} className={`px-4 py-3 rounded-xl border text-lg font-bold min-w-[72px] text-center ${currentTask && idx >= currentTask.l && idx <= currentTask.r ? 'bg-indigo-50 border-indigo-300 text-indigo-700' : 'bg-slate-50 border-slate-200 text-slate-700'}`}>{val}</div>
              ))}
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4 mb-8">
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
              <h4 className="text-xs uppercase tracking-wider text-slate-500 mb-2">Left Half</h4>
              <div className="flex flex-wrap gap-3 mb-3">
                {leftArr.map((v, idx) => (
                  <div key={`${v}-${idx}`} className={`px-3 py-2 rounded-lg border text-base font-bold min-w-[56px] text-center ${idx === leftPos ? 'bg-amber-50 border-amber-400 text-amber-700' : 'bg-white border-slate-200 text-slate-700'}`}>{v}</div>
                ))}
              </div>
              <button onClick={() => handleTake('left')} className="w-full py-2 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700">Take Left</button>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
              <h4 className="text-xs uppercase tracking-wider text-slate-500 mb-2">Right Half</h4>
              <div className="flex flex-wrap gap-3 mb-3">
                {rightArr.map((v, idx) => (
                  <div key={`${v}-${idx}`} className={`px-3 py-2 rounded-lg border text-base font-bold min-w-[56px] text-center ${idx === rightPos ? 'bg-amber-50 border-amber-400 text-amber-700' : 'bg-white border-slate-200 text-slate-700'}`}>{v}</div>
                ))}
              </div>
              <button onClick={() => handleTake('right')} className="w-full py-2 rounded-xl border border-slate-300 text-slate-700 font-bold hover:bg-slate-100">Take Right</button>
            </div>
          </div>

          {mode !== 'regular' && (
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 mb-4 text-center">
              <p className={`font-semibold text-slate-800 text-xl ${mode === 'tutorial' ? 'text-left leading-relaxed' : ''}`}>{instruction}</p>
            </div>
          )}
          <HelpPlaceholder mode={mode} />

          <div className="flex justify-center gap-3">
            <button onClick={() => resetGame(level)} className="px-6 py-3 border border-slate-300 rounded-xl hover:bg-slate-50 font-bold text-slate-700 text-lg flex items-center gap-2"><RotateCcw size={18} /> Reset Level</button>
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
              <span className={activePseudoLine === 1 ? 'bg-indigo-700 text-white px-1 rounded' : ''}>1: mergeSort(l, r)</span>{'\n'}
              <span className={activePseudoLine === 2 ? 'bg-indigo-700 text-white px-1 rounded' : ''}>2: split to [l..m] and [m+1..r]</span>{'\n'}
              <span className={activePseudoLine === 3 ? 'bg-indigo-700 text-white px-1 rounded' : ''}>3: merge two sorted halves</span>{'\n'}
              <span className={activePseudoLine === 4 ? 'bg-indigo-700 text-white px-1 rounded' : ''}>4: take smaller front value</span>{'\n'}
              <span className={activePseudoLine === 5 ? 'bg-indigo-700 text-white px-1 rounded' : ''}>5: append remaining values</span>{'\n'}
              <span className={activePseudoLine === 6 ? 'bg-indigo-700 text-white px-1 rounded' : ''}>6: done</span>
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





