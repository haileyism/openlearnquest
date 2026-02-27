import React, { useEffect, useMemo, useState } from 'react';
import { Trophy, RotateCcw, TriangleAlert, Heart } from 'lucide-react';
import { LEVELS, MAX_LEVEL, getUnlockedLevel, isLeveledMode, saveUnlockedLevel } from './gameLevelUtils';

const LEVEL_ARRAYS = {
  1: [4, 2, 7, 2, 5, 1, 4],
  2: [6, 3, 2, 7, 5, 3, 8, 1, 6],
  3: [9, 4, 7, 3, 5, 2, 8, 1, 6, 4, 2],
};
const MAX_VALUE = 9;

export default function CountingSortGamePage({ mode, onExit }) {
  const [level, setLevel] = useState(1);
  const [maxUnlockedLevel, setMaxUnlockedLevel] = useState(getUnlockedLevel('counting', mode));
  const [data, setData] = useState([...LEVEL_ARRAYS[1]]);
  const [counts, setCounts] = useState(Array(MAX_VALUE + 1).fill(0));
  const [output, setOutput] = useState([]);
  const [phase, setPhase] = useState('count');
  const [scanIdx, setScanIdx] = useState(0);
  const [writeVal, setWriteVal] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [lives, setLives] = useState(5);
  const [timer, setTimer] = useState(0);
  const [steps, setSteps] = useState(0);
  const [score, setScore] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [modal, setModal] = useState({ open: false, msg: '' });
  const [activePseudoLine, setActivePseudoLine] = useState(1);

  useEffect(() => {
    const interval = setInterval(() => setTimer((t) => (isComplete ? t : t + 1)), 1000);
    return () => clearInterval(interval);
  }, [isComplete]);

  const formatTime = (s) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  const resetGame = (targetLevel = level) => {
    const arr = [...LEVEL_ARRAYS[targetLevel]];
    setData(arr);
    setCounts(Array(MAX_VALUE + 1).fill(0));
    setOutput([]);
    setPhase('count');
    setScanIdx(0);
    setWriteVal(0);
    setMistakes(0);
    setLives(5);
    setTimer(0);
    setSteps(0);
    setScore(0);
    setIsComplete(false);
    setModal({ open: false, msg: '' });
    setActivePseudoLine(1);
  };

  useEffect(() => {
    const unlocked = getUnlockedLevel('counting', mode);
    setLevel(1);
    setMaxUnlockedLevel(unlocked);
    resetGame(1);
  }, [mode]);

  const unlockNextLevel = () => {
    if (!isLeveledMode(mode)) return;
    setMaxUnlockedLevel((prev) => {
      const next = Math.min(MAX_LEVEL, Math.max(prev, level + 1));
      if (next !== prev) saveUnlockedLevel('counting', mode, next);
      return next;
    });
  };

  const triggerError = (msg) => {
    setMistakes((m) => m + 1);
    const modalMsg = mode === 'tutorial'
      ? `Tutorial: ${msg} Counting sort first records frequencies, then writes values in order.`
      : mode === 'training'
        ? 'Training: First count frequencies, then write values from low to high.'
        : 'Counting: Build counts, then output in ascending value.';
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

  const handleCountBucket = (bucket) => {
    if (isComplete || phase !== 'count') return;
    const expected = data[scanIdx];
    if (bucket !== expected) {
      triggerError(`Current value is ${expected}. Increment count[${expected}].`);
      return;
    }
    const nextCounts = [...counts];
    nextCounts[bucket] += 1;
    setCounts(nextCounts);
    setSteps((s) => s + 1);
    setScore((s) => s + 5);
    setActivePseudoLine(2);

    if (scanIdx + 1 >= data.length) {
      setPhase('write');
      setScanIdx(0);
      setWriteVal(0);
      setActivePseudoLine(3);
      return;
    }
    setScanIdx((i) => i + 1);
  };

  const getCurrentWritable = () => {
    let v = writeVal;
    while (v <= MAX_VALUE && counts[v] === 0) v += 1;
    return v;
  };

  const handleWriteValue = (value) => {
    if (isComplete || phase !== 'write') return;
    const expected = getCurrentWritable();
    if (expected > MAX_VALUE) return;
    if (value !== expected) {
      triggerError(`Next output should be ${expected}.`);
      return;
    }

    const nextCounts = [...counts];
    nextCounts[value] -= 1;
    const nextOutput = [...output, value];
    setCounts(nextCounts);
    setOutput(nextOutput);
    setSteps((s) => s + 1);
    setScore((s) => s + 10);
    setActivePseudoLine(4);

    let nextWrite = value;
    while (nextWrite <= MAX_VALUE && nextCounts[nextWrite] === 0) nextWrite += 1;
    setWriteVal(nextWrite);

    if (nextOutput.length >= data.length) {
      setData(nextOutput);
      setIsComplete(true);
      unlockNextLevel();
      setActivePseudoLine(5);
    }
  };

  const instruction = useMemo(() => {
    if (isComplete) return 'Sorted! Counting sort complete.';
    if (phase === 'count') return `Count phase: current value is ${data[scanIdx]}. Increment its frequency bucket.`;
    return `Write phase: output the smallest value with remaining count.`;
  }, [isComplete, phase, data, scanIdx]);

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

          <div className="mb-6">
            <h4 className="text-xs uppercase tracking-wider text-slate-500 mb-2">Input</h4>
            <div className="flex flex-wrap gap-2">
              {data.map((val, idx) => (
                <div key={`${val}-${idx}`} className={`px-3 py-1 rounded-lg border text-sm font-bold ${phase === 'count' && idx === scanIdx ? 'bg-amber-50 border-amber-400 text-amber-700' : 'bg-slate-50 border-slate-200 text-slate-700'}`}>
                  {val}
                </div>
              ))}
            </div>
          </div>

          <div className="mb-6">
            <h4 className="text-xs uppercase tracking-wider text-slate-500 mb-2">Counts</h4>
            <div className="grid grid-cols-5 md:grid-cols-10 gap-2">
              {counts.map((count, bucket) => (
                <button
                  key={bucket}
                  onClick={() => (phase === 'count' ? handleCountBucket(bucket) : handleWriteValue(bucket))}
                  className="bg-slate-50 border border-slate-200 rounded-lg py-2 text-xs font-bold text-slate-700 hover:bg-slate-100"
                >
                  {bucket}:{count}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-8">
            <h4 className="text-xs uppercase tracking-wider text-slate-500 mb-2">Output</h4>
            <div className="flex flex-wrap gap-2 min-h-[40px]">
              {output.map((val, idx) => (
                <div key={`${val}-${idx}`} className="px-3 py-1 rounded-lg border bg-emerald-50 border-emerald-300 text-emerald-700 text-sm font-bold">{val}</div>
              ))}
            </div>
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
              <div className="flex justify-between"><span className="text-slate-500">Steps</span><span className="font-bold text-slate-900">{steps}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Output Size</span><span className="font-bold text-slate-900">{output.length}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Score</span><span className="font-bold text-green-600">+{score}</span></div>
            </div>
          </div>
          <div className="bg-slate-900 p-6 rounded-3xl shadow-lg text-white">
            <h4 className="font-bold mb-4 text-xs uppercase tracking-widest text-indigo-400">Pseudocode Trace</h4>
            <pre className="text-[11px] text-indigo-200 leading-relaxed font-mono">
              <span className={activePseudoLine === 1 ? 'bg-indigo-700 text-white px-1 rounded' : ''}>1: create count[0..k] = 0</span>{'\n'}
              <span className={activePseudoLine === 2 ? 'bg-indigo-700 text-white px-1 rounded' : ''}>2: for x in arr: count[x]++</span>{'\n'}
              <span className={activePseudoLine === 3 ? 'bg-indigo-700 text-white px-1 rounded' : ''}>3: for v = 0..k</span>{'\n'}
              <span className={activePseudoLine === 4 ? 'bg-indigo-700 text-white px-1 rounded' : ''}>4:   while count[v] &gt; 0: write v</span>{'\n'}
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
