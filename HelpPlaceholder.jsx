import React, { useEffect, useMemo, useState } from 'react';

const ALGORITHM_CONTENT = {
  bubble: {
    name: 'Bubble Sort',
    complexity: 'Best: O(n) | Average/Worst: O(n^2)',
    tutorial: 'Compare adjacent values. Swap only when left > right, then continue pass by pass.',
    training: 'Focus on one adjacent pair at a time. Swap only when needed.',
    intro: [
      'Bubble sort repeatedly compares adjacent pairs and pushes larger values rightward.',
      'One full pass places the largest remaining value in its final position.',
      'When a pass makes no swaps, the array is sorted.',
    ],
  },
  selection: {
    name: 'Selection Sort',
    complexity: 'Best/Average/Worst: O(n^2)',
    tutorial: 'Scan the unsorted range to track the minimum, then place it at index i.',
    training: 'Only mark a new minimum when the current value is smaller.',
    intro: [
      'Selection sort picks the smallest value from the unsorted portion each pass.',
      'After scanning, it swaps that minimum into index i.',
      'The sorted region grows from left to right.',
    ],
  },
  merge: {
    name: 'Merge Sort',
    complexity: 'Best/Average/Worst: O(n log n)',
    tutorial: 'Always take the smaller front value from left/right halves while merging.',
    training: 'Compare front values and choose the smaller one every step.',
    intro: [
      'Merge sort uses divide-and-conquer: split the array until small parts remain.',
      'Then merge sorted halves by repeatedly taking the smaller front value.',
      'This gives consistent O(n log n) performance.',
    ],
  },
  heap: {
    name: 'Heap Sort',
    complexity: 'Best/Average/Worst: O(n log n)',
    tutorial: 'Follow the next required heap swap from MAX-HEAPIFY or extract-max.',
    training: 'Think in heap structure: parent, left child, right child.',
    intro: [
      'Heap sort first builds a max heap so the largest value is at the root.',
      'It swaps the root with the end, then heapifies the reduced heap.',
      'Repeating this produces a sorted array in ascending order.',
    ],
  },
  quick: {
    name: 'Quick Sort',
    complexity: 'Best/Average: O(n log n) | Worst: O(n^2)',
    tutorial: 'For each j, decide whether A[j] <= pivot, then place pivot at i + 1.',
    training: 'Partition carefully: values <= pivot move left side.',
    intro: [
      'Quick sort partitions a range around a pivot value.',
      'Items <= pivot move left; larger items remain on the right.',
      'Then it recursively sorts both subranges.',
    ],
  },
  counting: {
    name: 'Counting Sort',
    complexity: 'Time: O(n + k) | Space: O(n + k)',
    tutorial: 'Build counts, convert to prefix sums, then place values from right to left.',
    training: 'Keep the three phases in order: count, prefix, stable placement.',
    intro: [
      'Counting sort counts how many times each value appears.',
      'Prefix sums convert counts into output positions.',
      'Right-to-left placement keeps equal values stable.',
    ],
  },
  radix: {
    name: 'Radix Sort',
    complexity: 'Time: O(d*(n + k))',
    tutorial: 'Bucket numbers by current digit place, then rebuild and continue.',
    training: 'Complete all items for one digit place before moving to the next.',
    intro: [
      'Radix sort processes digits from least significant to most significant.',
      'Each pass uses bucket placement by the current digit.',
      'Stable passes across all digits produce sorted order.',
    ],
  },
  bucket: {
    name: 'Bucket Sort',
    complexity: 'Average: O(n + k) | Worst: O(n^2)',
    tutorial: 'Distribute into range buckets, sort each bucket, then gather left to right.',
    training: 'Pick the correct bucket range first, then collect in bucket order.',
    intro: [
      'Bucket sort groups values into predefined ranges.',
      'Each bucket is sorted individually (often with a simpler sort).',
      'Concatenating buckets in order yields the final sorted array.',
    ],
  },
  insertion: {
    name: 'Insertion Sort',
    complexity: 'Best: O(n) | Average/Worst: O(n^2)',
    tutorial: 'Move the current value left until it reaches sorted position.',
    training: 'Swap left only when needed; otherwise continue.',
    intro: [
      'Insertion sort grows a sorted prefix from left to right.',
      'Each new value is inserted into its correct spot in that prefix.',
      'This is efficient for nearly sorted data.',
    ],
  },
};

export default function HelpPlaceholder({ mode, algorithm = 'insertion' }) {
  const isGuidedMode = mode === 'training' || mode === 'tutorial';
  const [introOpen, setIntroOpen] = useState(isGuidedMode);
  const details = ALGORITHM_CONTENT[algorithm] || ALGORITHM_CONTENT.insertion;

  useEffect(() => {
    setIntroOpen(isGuidedMode);
  }, [isGuidedMode, algorithm]);

  const helpMessage = useMemo(
    () => (mode === 'tutorial' ? details.tutorial : details.training),
    [details.training, details.tutorial, mode],
  );

  return (
    <>
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 mb-4">
        <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Time Complexity</p>
        <p className="text-sm text-slate-700 font-semibold">{details.name}: {details.complexity}</p>
      </div>

      {isGuidedMode && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 mb-8">
          <div className="flex items-center justify-between gap-3 mb-2">
            <p className="text-xs font-bold uppercase tracking-wider text-amber-700">
              {mode === 'tutorial' ? 'Tutorial Help' : 'Guided Practice Help'}
            </p>
            <button
              onClick={() => setIntroOpen(true)}
              className="inline-flex items-center justify-center text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full uppercase tracking-tighter border border-slate-200 hover:bg-slate-200"
            >
              Show Intro Again
            </button>
          </div>
          <p className="text-sm text-amber-800 font-medium">{helpMessage}</p>
        </div>
      )}

      {introOpen && isGuidedMode && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[85vh] overflow-y-auto p-6 shadow-2xl scale-100 animate-in zoom-in-95 duration-300">
            <h3 className="text-3xl font-bold text-slate-900 mb-2">{details.name} Intro</h3>
            <p className="text-slate-600 text-xl mb-4">
              {mode === 'tutorial' ? 'How this tutorial works' : 'Quick guided practice overview'}
            </p>
            <ul className="space-y-3 text-slate-700 text-xl leading-relaxed list-disc pl-6">
              {details.intro.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <div className="mt-5 p-4 rounded-2xl border border-slate-200 bg-slate-50">
              <p className="text-sm uppercase tracking-wider font-bold text-slate-500 mb-1">Time Complexity</p>
              <p className="text-base font-semibold text-slate-700">{details.complexity}</p>
            </div>
            <div className="flex justify-end mt-5">
              <button
                onClick={() => setIntroOpen(false)}
                className="bg-slate-900 text-white px-7 py-3 rounded-2xl text-xl font-bold hover:bg-slate-800 transition-colors"
              >
                Start Lesson
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
