import React, { useEffect, useMemo, useState } from 'react';
import { Trophy, RotateCcw, TriangleAlert, Heart } from 'lucide-react';
import { LEVELS, MAX_LEVEL, getUnlockedLevel, isLeveledMode, saveCompletedLevel, saveUnlockedLevel } from './gameLevelUtils';

const LEVEL_ARRAYS = {
  1: [12, 68, 43, 5, 57, 24, 89],
  2: [34, 79, 11, 62, 48, 7, 95, 53, 26],
  3: [17, 72, 39, 84, 6, 58, 91, 43, 27, 65, 10],
};
const BUCKET_COUNT = 5;

const bucketFor = (value) => Math.min(BUCKET_COUNT - 1, Math.floor((value / 100) * BUCKET_COUNT));

export default function BucketSortGamePage({ mode, onExit }) {
  const [level, setLevel] = useState(1);
  const [maxUnlockedLevel, setMaxUnlockedLevel] = useState(getUnlockedLevel('bucket', mode));
  const [data, setData] = useState([...LEVEL_ARRAYS[1]]);
  const [phase, setPhase] = useState('distribute');
  const [scanIdx, setScanIdx] = useState(0);
  const [buckets, setBuckets] = useState(Array.from({ length: BUCKET_COUNT }, () => []));
  const [sortedBuckets, setSortedBuckets] = useState(Array.from({ length: BUCKET_COUNT }, () => []));
  const [gatherPos, setGatherPos] = useState(Array(BUCKET_COUNT).fill(0));
  const [output, setOutput] = useState([]);
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

  const resetGame = (targetLevel = level) => {
    setData([...LEVEL_ARRAYS[targetLevel]]);
    setPhase('distribute');
    setScanIdx(0);
    setBuckets(Array.from({ length: BUCKET_COUNT }, () => []));
    setSortedBuckets(Array.from({ length: BUCKET_COUNT }, () => []));
    setGatherPos(Array(BUCKET_COUNT).fill(0));
    setOutput([]);
    setMistakes(0);
    setLives(5);
    setTimer(0);
    setMoves(0);
    setScore(0);
    setIsComplete(false);
    setModal({ open: false, msg: '' });
    setActivePseudoLine(1);
  };

  useEffect(() => {
    const unlocked = getUnlockedLevel('bucket', mode);
    setLevel(1);
    setMaxUnlockedLevel(unlocked);
    resetGame(1);
  }, [mode]);

  const unlockNextLevel = () => {
    if (!isLeveledMode(mode)) return;
    setMaxUnlockedLevel((prev) => {
      const next = Math.min(MAX_LEVEL, Math.max(prev, level + 1));
      if (next !== prev) saveUnlockedLevel('bucket', mode, next);
      return next;
    });
  };

  const triggerError = (msg) => {
    setMistakes((m) => m + 1);
    const modalMsg = mode === 'tutorial'
      ? `Tutorial: ${msg} Bucket sort distributes values into ranges, sorts inside buckets, then gathers in bucket order.`
      : mode === 'training'
        ? 'Training: Put values in range buckets, then gather buckets left to right.'
        : 'Bucket: Distribute by range, then collect in bucket order.';
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

  const handleBucketPick = (bucket) => {
    if (isComplete || phase !== 'distribute') return;
    const value = data[scanIdx];
    const expected = bucketFor(value);
    if (bucket !== expected) {
      triggerError(`${value} belongs to bucket ${expected}.`);
      return;
    }
    const nextBuckets = buckets.map((arr) => [...arr]);
    nextBuckets[bucket].push(value);
    setBuckets(nextBuckets);
    setMoves((m) => m + 1);
    setScore((s) => s + 6);
    setActivePseudoLine(2);
    if (scanIdx + 1 >= data.length) {
      const nextSorted = nextBuckets.map((arr) => [...arr].sort((a, b) => a - b));
      setSortedBuckets(nextSorted);
      setPhase('gather');
      setScanIdx(0);
      setActivePseudoLine(3);
      return;
    }
    setScanIdx((i) => i + 1);
  };

  const getExpectedGatherBucket = () => {
    for (let b = 0; b < BUCKET_COUNT; b += 1) {
      if (gatherPos[b] < sortedBuckets[b].length) return b;
    }
    return -1;
  };

  const handleGatherBucket = (bucket) => {
    if (isComplete || phase !== 'gather') return;
    const expected = getExpectedGatherBucket();
    if (bucket !== expected) {
      triggerError(`Next output must come from bucket ${expected}.`);
      return;
    }
    const value = sortedBuckets[bucket][gatherPos[bucket]];
    const nextPos = [...gatherPos];
    nextPos[bucket] += 1;
    const nextOutput = [...output, value];
    setGatherPos(nextPos);
    setOutput(nextOutput);
    setMoves((m) => m + 1);
    setScore((s) => s + 10);
    setActivePseudoLine(4);
    if (nextOutput.length >= data.length) {
      setData(nextOutput);
      setIsComplete(true);
      saveCompletedLevel('bucket', mode, level);
      unlockNextLevel();
      setActivePseudoLine(5);
    }
  };

  const instruction = useMemo(() => {
    if (isComplete) return 'Sorted! Bucket sort complete.';
    if (phase === 'distribute') return `Distribute ${data[scanIdx]} to its range bucket.`;
    return 'Gather from the leftmost non-empty bucket.';
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

          <div className="flex flex-wrap gap-2 mb-6">
            {data.map((val, idx) => (
              <div key={`${val}-${idx}`} className={`px-3 py-1 rounded-lg border text-sm font-bold ${phase === 'distribute' && idx === scanIdx ? 'bg-amber-50 border-amber-400 text-amber-700' : 'bg-slate-50 border-slate-200 text-slate-700'}`}>{val}</div>
            ))}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-6">
            {Array.from({ length: BUCKET_COUNT }).map((_, bucket) => (
              <button
                key={bucket}
                onClick={() => (phase === 'distribute' ? handleBucketPick(bucket) : handleGatherBucket(bucket))}
                className="bg-slate-50 border border-slate-200 rounded-lg py-2 text-xs font-bold text-slate-700 hover:bg-slate-100"
              >
                B{bucket} [{Math.round((bucket * 100) / BUCKET_COUNT)}-{Math.round(((bucket + 1) * 100) / BUCKET_COUNT) - 1}]
              </button>
            ))}
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
              <div className="flex justify-between"><span className="text-slate-500">Moves</span><span className="font-bold text-slate-900">{moves}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Output Size</span><span className="font-bold text-slate-900">{output.length}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Score</span><span className="font-bold text-green-600">+{score}</span></div>
            </div>
          </div>
          <div className="bg-slate-900 p-6 rounded-3xl shadow-lg text-white">
            <h4 className="font-bold mb-4 text-xs uppercase tracking-widest text-indigo-400">Pseudocode Trace</h4>
            <pre className="text-[11px] text-indigo-200 leading-relaxed font-mono">
              <span className={activePseudoLine === 1 ? 'bg-indigo-700 text-white px-1 rounded' : ''}>1: create buckets[0..k-1]</span>{'\n'}
              <span className={activePseudoLine === 2 ? 'bg-indigo-700 text-white px-1 rounded' : ''}>2: distribute each value to bucket</span>{'\n'}
              <span className={activePseudoLine === 3 ? 'bg-indigo-700 text-white px-1 rounded' : ''}>3: sort each bucket</span>{'\n'}
              <span className={activePseudoLine === 4 ? 'bg-indigo-700 text-white px-1 rounded' : ''}>4: gather buckets in order</span>{'\n'}
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
