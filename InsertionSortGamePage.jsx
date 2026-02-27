import React, { useEffect, useMemo, useState } from 'react';
import { Trophy, RotateCcw, TriangleAlert, Heart } from 'lucide-react';

const INITIAL_ARRAY = [45, 20, 80, 55, 10, 30, 70];

export default function InsertionSortGamePage({ mode, onExit }) {
  const [data, setData] = useState([...INITIAL_ARRAY]);
  const [iIndex, setIIndex] = useState(1);
  const [jIndex, setJIndex] = useState(1);
  const [dragIndex, setDragIndex] = useState(null);
  const [mistakes, setMistakes] = useState(0);
  const [lives, setLives] = useState(5);
  const [timer, setTimer] = useState(0);
  const [comparisons, setComparisons] = useState(0);
  const [score, setScore] = useState(0);
  const [repeats, setRepeats] = useState(1);
  const [activityLog, setActivityLog] = useState([]);
  const [modal, setModal] = useState({ open: false, msg: '' });
  const [isComplete, setIsComplete] = useState(false);
  const [activePseudoLine, setActivePseudoLine] = useState(3);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimer((t) => (isComplete ? t : t + 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [isComplete]);

  const instruction = useMemo(() => {
    const isTutorial = mode === 'tutorial';
    const isTraining = mode === 'training';
    if (isComplete) {
      if (isTutorial) return 'Sorted! You’ve finished this run. In insertion sort, the array is sorted when every element has been placed in order. Well done!';
      if (isTraining) return 'Sorted! Well done.';
      return 'Sorted! Mastery achieved.';
    }
    if (jIndex <= 0) {
      if (isTutorial) return `Inner loop done for this element. When j reaches 0 or the element is in the right place, we stop moving it left. Click Continue to advance the outer loop to the next index i = ${iIndex + 1}.`;
      if (isTraining) return 'Current element is in place. Continue to the next.';
      return `Inner loop finished for i = ${iIndex}. Click Continue.`;
    }
    if (data[jIndex - 1] > data[jIndex]) {
      if (isTutorial) return `The value at index ${jIndex} (${data[jIndex]}) is smaller than the one to its left (${data[jIndex - 1]}). In insertion sort we always move the current element left until it’s in sorted order. Drag the bar at index ${jIndex} onto index ${jIndex - 1} to swap them.`;
      if (isTraining) return 'This element is out of order—swap it left into sorted position.';
      return `Drag index ${jIndex} (value ${data[jIndex]}) onto index ${jIndex - 1} (value ${data[jIndex - 1]}) to swap.`;
    }
    if (isTutorial) return `The value at index ${jIndex} (${data[jIndex]}) is already greater than or equal to the one at ${jIndex - 1} (${data[jIndex - 1]}), so no swap is needed. Click Continue to move the inner loop forward.`;
    if (isTraining) return 'Order is correct here. Continue.';
    return `No swap needed at indices ${jIndex - 1} and ${jIndex}. Click Continue.`;
  }, [data, iIndex, isComplete, jIndex, mode]);

  const formatTime = (s) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;
  const getNumberRelation = (a, b) => {
    if (a > b) return 'bigger';
    if (a < b) return 'smaller';
    return 'equal';
  };

  const logAction = (msg, cls = 'text-slate-400') => {
    setActivityLog((prev) => [{ msg, cls }, ...prev].slice(0, 80));
  };

  const resetGame = (isRepeat = false) => {
    setData([...INITIAL_ARRAY]);
    setIIndex(1);
    setJIndex(1);
    setDragIndex(null);
    setMistakes(0);
    setLives(5);
    setTimer(0);
    setComparisons(0);
    setScore(0);
    setActivityLog([]);
    setModal({ open: false, msg: '' });
    setIsComplete(false);
    setActivePseudoLine(3);
    if (isRepeat) setRepeats((r) => r + 1);
  };

  const triggerError = (msg) => {
    setMistakes((m) => m + 1);
    const modalMsg = mode === 'tutorial'
      ? `Tutorial: ${msg} Take your time—in tutorial mode you have unlimited lives and we’re here to help you learn each step.`
      : mode === 'training'
        ? 'Training: Keep left side sorted. Swap only if left > right.'
        : 'Insertion: Swap only if left > right.';
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

  const needsSwap = !isComplete && jIndex > 0 && data[jIndex - 1] > data[jIndex];

  const moveToNextI = () => {
    const nextI = iIndex + 1;
    if (nextI >= data.length) {
      setIsComplete(true);
      setActivePseudoLine(1);
      logAction('SORT COMPLETE', 'text-amber-500 font-bold');
      return;
    }

    setIIndex(nextI);
    setJIndex(nextI);
    setActivePseudoLine(2);
    setTimeout(() => setActivePseudoLine(3), 60);
    logAction(`Move to i = ${nextI}`);
  };

  const handleContinue = () => {
    if (isComplete) return;
    if (jIndex > 0) setComparisons((c) => c + 1);

    if (needsSwap) {
      const left = data[jIndex - 1];
      const right = data[jIndex];
      const relation = getNumberRelation(left, right);
      triggerError(`${left} is ${relation} than ${right}, so this step requires a swap. Drag ${right} (index ${jIndex}) onto ${left} (index ${jIndex - 1}).`);
      return;
    }

    moveToNextI();
  };

  const handleDragStart = (idx) => {
    if (isComplete) return;
    setDragIndex(idx);
  };

  const handleDropSwap = (targetIdx) => {
    if (isComplete || dragIndex === null) return;
    const sourceIdx = dragIndex;
    setDragIndex(null);

    if (!(sourceIdx === jIndex && targetIdx === jIndex - 1)) {
      const sourceVal = data[sourceIdx];
      const expectedVal = data[jIndex];
      const relation = getNumberRelation(expectedVal, sourceVal);
      triggerError(`You dragged ${sourceVal}, but active swap is index ${jIndex} (value ${expectedVal}). ${expectedVal} is ${relation} than ${sourceVal} for this step.`);
      return;
    }

    setComparisons((c) => c + 1);
    if (!needsSwap) {
      const left = data[jIndex - 1];
      const right = data[jIndex];
      const relation = getNumberRelation(left, right);
      triggerError(`No swap needed: ${left} is ${relation} than ${right}. Click Continue to move to the next i.`);
      return;
    }

    const next = [...data];
    const leftIdx = jIndex - 1;
    const rightIdx = jIndex;
    [next[leftIdx], next[rightIdx]] = [next[rightIdx], next[leftIdx]];
    setData(next);
    setScore((s) => s + 10);
    logAction(`Swapped ${next[rightIdx]} and ${next[leftIdx]}`, 'text-green-500');
    setActivePseudoLine(4);

    const nextJ = jIndex - 1;
    setJIndex(nextJ);
    setTimeout(() => {
      setActivePseudoLine(5);
      setTimeout(() => setActivePseudoLine(3), 60);
    }, 60);
  };

  return (
    <div className="animate-in fade-in duration-500">
      <div className="flex flex-col lg:flex-row gap-8">
        <div className="flex-grow bg-white rounded-3xl shadow-xl border border-slate-200 p-8">
          <div className="flex justify-between items-center mb-8">
            <div className="flex gap-4">
              <div className="bg-slate-50 px-4 py-2 rounded-xl font-mono text-slate-600 border border-slate-100">
                Time: {formatTime(timer)}
              </div>
              <div className="bg-slate-50 px-4 py-2 rounded-xl font-mono text-slate-600 border border-slate-100">
                Mistakes: {mistakes}
              </div>
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

          <div className="h-64 flex items-end justify-center gap-3 mb-6">
            {data.map((val, idx) => (
              <div
                key={`${val}-${idx}`}
                className="flex flex-col items-center gap-2"
              >
                <div
                  draggable={!isComplete && idx === jIndex}
                  onDragStart={() => handleDragStart(idx)}
                  onDragOver={(e) => {
                    if (idx === jIndex - 1) e.preventDefault();
                  }}
                  onDrop={() => handleDropSwap(idx)}
                  className={`w-12 rounded-t-xl flex items-center justify-center text-[10px] font-bold pb-2 transition-all cursor-pointer shadow-sm
                    ${idx < iIndex ? 'bg-indigo-600 text-white shadow-indigo-100' : 'bg-slate-100 text-slate-400'}
                    ${idx === jIndex ? 'ring-4 ring-indigo-100 border-2 border-indigo-400 bg-white text-indigo-600' : ''}
                    ${idx === jIndex - 1 ? 'ring-2 ring-amber-200 border-2 border-amber-400' : ''}
                    ${dragIndex === idx ? 'opacity-60' : ''}
                  `}
                  style={{ height: `${val * 2}px` }}
                >
                  {val}
                </div>
                <span className="text-[10px] font-bold text-slate-400 uppercase">idx {idx}</span>
              </div>
            ))}
          </div>

          {!isComplete && (
            <div className="mb-8 flex justify-center">
              <button
                onClick={handleContinue}
                className="px-6 py-3 rounded-xl border border-slate-300 text-slate-700 font-bold hover:bg-slate-50"
              >
                Continue
              </button>
            </div>
          )}

          {mode !== 'regular' && (
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 mb-8 text-center">
              <p className={`font-semibold text-slate-700 ${mode === 'tutorial' ? 'text-left leading-relaxed' : ''}`}>{instruction}</p>
            </div>
          )}

          <div className="flex justify-center gap-4">
            <button
              onClick={() => resetGame(true)}
              className="px-6 py-2 border border-slate-300 rounded-xl hover:bg-slate-50 font-bold text-slate-600 flex items-center gap-2"
            >
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
              <div className="flex justify-between">
                <span className="text-slate-500">Repeats</span>
                <span className="font-bold text-slate-900">{repeats}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Comparisons</span>
                <span className="font-bold text-slate-900">{comparisons}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Score</span>
                <span className="font-bold text-green-600">+{score}</span>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 p-6 rounded-3xl shadow-lg text-white">
            <h4 className="font-bold mb-4 text-xs uppercase tracking-widest text-indigo-400">Pseudocode Trace</h4>
            <pre className="text-[11px] text-indigo-200 leading-relaxed font-mono">
              <span className={activePseudoLine === 1 ? 'bg-indigo-700 text-white px-1 rounded' : ''}>1: for i from 1 to n-1</span>
              {'\n'}
              <span className={activePseudoLine === 2 ? 'bg-indigo-700 text-white px-1 rounded' : ''}>2:   j = i</span>
              {'\n'}
              <span className={activePseudoLine === 3 ? 'bg-indigo-700 text-white px-1 rounded' : ''}>3:   while j {'>'} 0 and arr[j - 1] {'>'} arr[j]</span>
              {'\n'}
              <span className={activePseudoLine === 4 ? 'bg-indigo-700 text-white px-1 rounded' : ''}>4:     swap(arr[j], arr[j - 1])</span>
              {'\n'}
              <span className={activePseudoLine === 5 ? 'bg-indigo-700 text-white px-1 rounded' : ''}>5:     j = j - 1</span>
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
            <button
              onClick={() => setModal({ open: false, msg: '' })}
              className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold hover:bg-slate-800 transition-colors"
            >
              I Understand
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
