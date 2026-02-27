import React, { useEffect, useMemo, useState } from 'react';
import { Trophy, RotateCcw, TriangleAlert, Heart, ArrowUpDown } from 'lucide-react';

const INITIAL_DATA = [45, 20, 80, 55, 10, 30, 70];

export default function BubbleSortGamePage({ mode, onExit }) {
  const [data, setData] = useState([...INITIAL_DATA]);
  const [passIndex, setPassIndex] = useState(0);
  const [compareIndex, setCompareIndex] = useState(0);
  const [selectedPair, setSelectedPair] = useState(false);
  const [swapMadeInPass, setSwapMadeInPass] = useState(false);
  const [mistakes, setMistakes] = useState(0);
  const [lives, setLives] = useState(5);
  const [timer, setTimer] = useState(0);
  const [comparisons, setComparisons] = useState(0);
  const [score, setScore] = useState(0);
  const [repeats, setRepeats] = useState(1);
  const [activityLog, setActivityLog] = useState([]);
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
    if (selectedPair) {
      if (isTutorial) return `You’re looking at the pair at indices ${compareIndex} and ${compareIndex + 1}. In bubble sort we compare adjacent elements: if the left is greater than the right, we swap so the larger value moves right. Choose “Swap Pair” if ${data[compareIndex]} > ${data[compareIndex + 1]}, otherwise “Keep Order”.`;
      if (isTraining) return 'Compare this pair: swap if left > right, otherwise keep order.';
      return `Decide the pair at indices ${compareIndex} and ${compareIndex + 1}: swap or keep order.`;
    }
    if (isTutorial) return `Pass ${passIndex + 1}: We scan left to right, comparing adjacent pairs. The active pair is at indices ${compareIndex} and ${compareIndex + 1}. We only look at indices 0 to ${boundary} in this pass (larger indices are already sorted). Click one of the two highlighted bars to select this pair, then choose swap or keep order.`;
    if (isTraining) return 'Compare adjacent pairs in this pass. Select the highlighted pair, then choose swap or keep order.';
    return `Pass ${passIndex + 1}: select a bar from the active pair (${compareIndex}, ${compareIndex + 1}). Range ends at index ${boundary}.`;
  }, [compareIndex, data, mode, passIndex, selectedPair, isComplete]);

  const logAction = (msg, cls = 'text-slate-400') => {
    setActivityLog((prev) => [{ msg, cls }, ...prev].slice(0, 80));
  };

  const resetGame = (isRepeat = false) => {
    setData([...INITIAL_DATA]);
    setPassIndex(0);
    setCompareIndex(0);
    setSelectedPair(false);
    setSwapMadeInPass(false);
    setMistakes(0);
    setLives(5);
    setTimer(0);
    setComparisons(0);
    setScore(0);
    setRepeats((r) => (isRepeat ? r + 1 : r));
    setActivityLog([]);
    setModal({ open: false, msg: '' });
    setIsComplete(false);
    setActivePseudoLine(1);
  };

  const triggerError = (msg) => {
    setMistakes((m) => m + 1);
    const modalMsg = mode === 'tutorial'
      ? `Tutorial: ${msg} In tutorial mode you have unlimited lives—use the hints above to decide whether this pair should be swapped (left > right) or kept in order.`
      : mode === 'training'
        ? 'Training: Compare adjacent pair. Swap if left > right.'
        : 'Bubble: Swap adjacent pair only when left > right.';
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

  const handleSelectPair = (idx) => {
    if (isComplete) return;
    const leftIdx = compareIndex;
    const rightIdx = compareIndex + 1;

    if (idx !== leftIdx && idx !== rightIdx) {
      const selected = data[idx];
      const leftVal = data[leftIdx];
      const rightVal = data[rightIdx];
      const relation = getRelation(selected, leftVal);
      triggerError(
        `This step compares indices ${leftIdx} and ${rightIdx} (${leftVal}, ${rightVal}). You clicked ${selected}, which is ${relation} than ${leftVal}, but not part of the active pair.`,
      );
      return;
    }

    setSelectedPair(true);
    setActivePseudoLine(3);
    logAction(`Inspecting pair [${data[leftIdx]}, ${data[rightIdx]}]`);
  };

  const finishSort = () => {
    setIsComplete(true);
    setActivePseudoLine(1);
    logAction('SORT COMPLETE', 'text-amber-500 font-bold');
  };

  const handleDecision = (shouldSwap) => {
    if (!selectedPair || isComplete) return;
    const leftIdx = compareIndex;
    const rightIdx = compareIndex + 1;
    const leftVal = data[leftIdx];
    const rightVal = data[rightIdx];
    const needsSwap = leftVal > rightVal;
    const relation = getRelation(leftVal, rightVal);

    setComparisons((c) => c + 1);

    if (shouldSwap !== needsSwap) {
      triggerError(
        `Decision mismatch: ${leftVal} is ${relation} than ${rightVal}. Re-check whether this pair should be swapped to keep ascending order.`,
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

    setSelectedPair(false);

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
    setActivePseudoLine(2);
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

          <div className="h-64 flex items-end justify-center gap-3 mb-8">
            {data.map((val, idx) => {
              const sortedTailStart = data.length - passIndex;
              const isSortedTail = idx >= sortedTailStart || isComplete;
              const isActivePair = !isComplete && (idx === compareIndex || idx === compareIndex + 1);
              return (
                <div key={`${val}-${idx}`} className="flex flex-col items-center gap-2">
                  <div
                    onClick={() => handleSelectPair(idx)}
                    className={`w-12 rounded-t-xl flex items-center justify-center text-[10px] font-bold pb-2 transition-all cursor-pointer shadow-sm
                      ${isSortedTail ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}
                      ${isActivePair ? 'ring-4 ring-amber-100 border-2 border-amber-400' : ''}
                      ${selectedPair && isActivePair ? 'bg-white text-slate-900' : ''}
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

          {selectedPair && !isComplete && (
            <div className="mb-8 flex justify-center gap-4">
              <button
                onClick={() => handleDecision(true)}
                className="px-6 py-3 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 flex items-center gap-2"
              >
                <ArrowUpDown size={16} /> Swap Pair
              </button>
              <button
                onClick={() => handleDecision(false)}
                className="px-6 py-3 rounded-xl border border-slate-300 text-slate-700 font-bold hover:bg-slate-50"
              >
                Keep Order
              </button>
            </div>
          )}

          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 mb-8 text-center">
            <p className={`font-semibold text-slate-700 ${mode === 'tutorial' ? 'text-left leading-relaxed' : ''}`}>{instruction}</p>
          </div>

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
              <div className="flex justify-between"><span className="text-slate-500">Comparisons</span><span className="font-bold text-slate-900">{comparisons}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Score</span><span className="font-bold text-green-600">+{score}</span></div>
            </div>
          </div>

          <div className="bg-slate-900 p-6 rounded-3xl shadow-lg text-white">
            <h4 className="font-bold mb-4 text-xs uppercase tracking-widest text-indigo-400">Pseudocode Trace</h4>
            <pre className="text-[11px] text-indigo-200 leading-relaxed font-mono">
              <span className={activePseudoLine === 1 ? 'bg-indigo-700 text-white px-1 rounded' : ''}>1: for i from 0 to n - 1</span>
              {'\n'}
              <span className={activePseudoLine === 2 ? 'bg-indigo-700 text-white px-1 rounded' : ''}>2:   for j from 0 to n - i - 2</span>
              {'\n'}
              <span className={activePseudoLine === 3 ? 'bg-indigo-700 text-white px-1 rounded' : ''}>3:     if arr[j] &gt; arr[j + 1]</span>
              {'\n'}
              <span className={activePseudoLine === 4 ? 'bg-indigo-700 text-white px-1 rounded' : ''}>4:       swap(arr[j], arr[j + 1])</span>
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
