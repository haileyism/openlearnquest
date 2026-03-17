import React, { useEffect, useMemo, useState } from 'react';
import { Trophy, RotateCcw, TriangleAlert, Heart } from 'lucide-react';
import { LEVELS, MAX_LEVEL, getUnlockedLevel, isLeveledMode, saveCompletedLevel, saveUnlockedLevel } from './gameLevelUtils';
import HelpPlaceholder from './HelpPlaceholder';

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
  const [output, setOutput] = useState(Array(LEVEL_ARRAYS[1].length).fill(null));
  const [phase, setPhase] = useState('count');
  const [scanIdx, setScanIdx] = useState(0);
  const [prefixIdx, setPrefixIdx] = useState(1);
  const [placeIdx, setPlaceIdx] = useState(LEVEL_ARRAYS[1].length - 1);
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
    setOutput(Array(arr.length).fill(null));
    setPhase('count');
    setScanIdx(0);
    setPrefixIdx(1);
    setPlaceIdx(arr.length - 1);
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
      ? `Tutorial: ${msg} Follow counting sort in three steps: frequency count, prefix sums, then stable placement from right to left.`
      : mode === 'training'
        ? 'Guided Practice: Count, prefix-sum, then place from right to left.'
        : 'Counting: Use frequency, prefix, then stable backward placement.';
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
    setActivePseudoLine(5);

    if (scanIdx + 1 >= data.length) {
      setPhase('prefix');
      setPrefixIdx(1);
      setActivePseudoLine(7);
      return;
    }
    setScanIdx((i) => i + 1);
  };

  const handlePrefixBucket = (bucket) => {
    if (isComplete || phase !== 'prefix') return;
    if (bucket !== prefixIdx) {
      triggerError(`Prefix step expects bucket ${prefixIdx}: C[${prefixIdx}] = C[${prefixIdx}] + C[${prefixIdx - 1}].`);
      return;
    }
    const nextCounts = [...counts];
    nextCounts[prefixIdx] = nextCounts[prefixIdx] + nextCounts[prefixIdx - 1];
    setCounts(nextCounts);
    setSteps((s) => s + 1);
    setScore((s) => s + 6);
    setActivePseudoLine(8);

    if (prefixIdx >= MAX_VALUE) {
      setPhase('place');
      setPlaceIdx(data.length - 1);
      setActivePseudoLine(10);
      return;
    }
    setPrefixIdx((v) => v + 1);
  };

  const handlePlaceBucket = (bucket) => {
    if (isComplete || phase !== 'place') return;
    const expectedValue = data[placeIdx];
    if (bucket !== expectedValue) {
      triggerError(`Placement step uses A[j]. Current j points to value ${expectedValue}, so use bucket ${expectedValue}.`);
      return;
    }

    const nextCounts = [...counts];
    const nextOutput = [...output];
    const outPos = nextCounts[expectedValue] - 1;
    nextOutput[outPos] = expectedValue;
    nextCounts[expectedValue] -= 1;

    setCounts(nextCounts);
    setOutput(nextOutput);
    setSteps((s) => s + 1);
    setScore((s) => s + 10);
    setActivePseudoLine(11);

    if (placeIdx <= 0) {
      setData(nextOutput);
      setIsComplete(true);
      saveCompletedLevel('counting', mode, level);
      unlockNextLevel();
      setActivePseudoLine(12);
      return;
    }
    setPlaceIdx((i) => i - 1);
  };

  const instruction = useMemo(() => {
    if (isComplete) return 'Sorted! Counting sort complete.';
    if (phase === 'count') return `Step 1 (Build C): current value is A[j] = ${data[scanIdx]}. Increment C[A[j]].`;
    if (phase === 'prefix') return `Step 2 (Prefix sums): update C[${prefixIdx}] = C[${prefixIdx}] + C[${prefixIdx - 1}].`;
    return `Step 3 (Sort): j moves right-to-left. Current A[j] = ${data[placeIdx]}. Place into B[C[A[j]] - 1], then decrement C[A[j]].`;
  }, [isComplete, phase, data, scanIdx, prefixIdx, placeIdx]);

  return (
    <div className="animate-in fade-in duration-500 text-lg">
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex-grow bg-white rounded-3xl shadow-xl border border-slate-200 p-5">
          <div className="flex justify-between items-center mb-4">
            <div className="flex gap-4">
              <div className="bg-slate-50 px-5 py-3 rounded-xl font-mono text-slate-700 border border-slate-100 text-xl">Time: {formatTime(timer)}</div>
              {mode !== 'training' && (
                <div className="bg-slate-50 px-5 py-3 rounded-xl font-mono text-slate-700 border border-slate-100 text-xl">Mistakes: {mistakes}</div>
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
            <h4 className="text-xs uppercase tracking-wider text-slate-500 mb-2">Input</h4>
            <div className="flex flex-wrap gap-2">
              {data.map((val, idx) => (
                <div
                  key={`${val}-${idx}`}
                  className={`px-3 py-1 rounded-lg border text-sm font-bold ${
                    (phase === 'count' && idx === scanIdx) || (phase === 'place' && idx === placeIdx)
                      ? 'bg-amber-50 border-amber-400 text-amber-700'
                      : 'bg-slate-50 border-slate-200 text-slate-700'
                  }`}
                >
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
                  onClick={() => {
                    if (phase === 'count') handleCountBucket(bucket);
                    else if (phase === 'prefix') handlePrefixBucket(bucket);
                    else handlePlaceBucket(bucket);
                  }}
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
                <div key={`${val}-${idx}`} className="px-3 py-1 rounded-lg border bg-emerald-50 border-emerald-300 text-emerald-700 text-sm font-bold min-w-[34px] text-center">
                  {val ?? '_'}
                </div>
              ))}
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
            <button onClick={onExit} className="px-6 py-3 bg-slate-900 text-white rounded-xl hover:bg-slate-800 font-bold text-lg">Exit</button>
          </div>
        </div>

        <div className="lg:w-96 space-y-4">
          <div className="bg-white p-5 rounded-3xl shadow-lg border border-slate-200">
            <h4 className="font-bold text-slate-800 mb-3 text-xl flex items-center gap-2"><Trophy size={18} className="text-amber-500" /> Analytics</h4>
            <div className="space-y-3 text-lg"><div className="flex justify-between"><span className="text-slate-500">Score</span><span className="font-bold text-green-600">+{score}</span></div></div>
          </div>
          <div className="bg-slate-900 p-5 rounded-3xl shadow-lg text-white">
            <h4 className="font-bold mb-3 text-sm uppercase tracking-widest text-indigo-300">Pseudocode Trace</h4>
            <pre className="text-[16px] text-indigo-100 leading-relaxed font-mono">
              <span className={activePseudoLine === 1 ? 'bg-indigo-700 text-white px-1 rounded' : ''}>1: let C[0..k] be a new array</span>{'\n'}
              <span className={activePseudoLine === 2 ? 'bg-indigo-700 text-white px-1 rounded' : ''}>2: for i = 0 to k</span>{'\n'}
              <span className={activePseudoLine === 3 ? 'bg-indigo-700 text-white px-1 rounded' : ''}>3:   C[i] = 0</span>{'\n'}
              <span className={activePseudoLine === 4 ? 'bg-indigo-700 text-white px-1 rounded' : ''}>4: for j = 1 to A.length</span>{'\n'}
              <span className={activePseudoLine === 5 ? 'bg-indigo-700 text-white px-1 rounded' : ''}>5:   C[A[j]] = C[A[j]] + 1</span>{'\n'}
              <span className={activePseudoLine === 7 ? 'bg-indigo-700 text-white px-1 rounded' : ''}>7: for i = 1 to k</span>{'\n'}
              <span className={activePseudoLine === 8 ? 'bg-indigo-700 text-white px-1 rounded' : ''}>8:   C[i] = C[i] + C[i - 1]</span>{'\n'}
              <span className={activePseudoLine === 10 ? 'bg-indigo-700 text-white px-1 rounded' : ''}>10: for j = A.length down to 1</span>{'\n'}
              <span className={activePseudoLine === 11 ? 'bg-indigo-700 text-white px-1 rounded' : ''}>11:   B[C[A[j]] - 1] = A[j]</span>{'\n'}
              <span className={activePseudoLine === 12 ? 'bg-indigo-700 text-white px-1 rounded' : ''}>12:   C[A[j]] = C[A[j]] - 1</span>
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





