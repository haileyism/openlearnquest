import React from 'react';
import { Layers, Zap, Container, ListFilter, GitMerge, TreePine, Hash, Milestone, PackageOpen, Bug, Sparkles } from 'lucide-react';
import { MAX_LEVEL, getCompletedLevel } from './gameLevelUtils';

const ALGO_DATA = {
  'Insertion Sort': {
    complexity: 'O(n²)',
    description: 'Foundational logic. Build the sorted array one item at a time.',
  },
  'Bubble Sort': {
    complexity: 'O(n²)',
    description: 'Repeatedly compare adjacent items and bubble large values rightward.',
  },
  'Quick Sort': {
    complexity: 'O(n log n)',
    description: 'Choose pivots and partition ranges to sort recursively.',
  },
  'Selection Sort': {
    complexity: 'O(n²)',
    description: 'Scan for the minimum and place it at the front each pass.',
  },
  'Merge Sort': {
    complexity: 'O(n log n)',
    description: 'Recursive divide-and-conquer with stable merging.',
  },
  'Heap Sort': {
    complexity: 'O(n log n)',
    description: 'Build a max-heap and repeatedly extract the root.',
  },
  'Counting Sort': {
    complexity: 'O(n + k)',
    description: 'Track frequencies and reconstruct sorted output.',
  },
  'Radix Sort': {
    complexity: 'O(d(n + k))',
    description: 'Sort digit by digit using stable bucket passes.',
  },
  'Bucket Sort': {
    complexity: 'O(n + k)',
    description: 'Distribute by ranges, sort buckets, and gather.',
  },
};

const ALGO_KEYS = {
  'Insertion Sort': 'insertion',
  'Bubble Sort': 'bubble',
  'Quick Sort': 'quick',
  'Selection Sort': 'selection',
  'Merge Sort': 'merge',
  'Heap Sort': 'heap',
  'Counting Sort': 'counting',
  'Radix Sort': 'radix',
  'Bucket Sort': 'bucket',
};

export default function MenuPage({ onSelectAlgo }) {
  const getProgressPercent = (name) => {
    const algoKey = ALGO_KEYS[name];
    const trainingDone = getCompletedLevel(algoKey, 'training');
    const regularDone = getCompletedLevel(algoKey, 'regular');
    const completed = Math.max(trainingDone, regularDone);
    return Math.round((completed / MAX_LEVEL) * 100);
  };

  const cards = [
    { name: 'Insertion Sort', Icon: Layers },
    { name: 'Bubble Sort', Icon: Zap },
    { name: 'Selection Sort', Icon: ListFilter },
    { name: 'Quick Sort', Icon: Container },
    { name: 'Merge Sort', Icon: GitMerge },
    { name: 'Heap Sort', Icon: TreePine },
    { name: 'Counting Sort', Icon: Hash },
    { name: 'Radix Sort', Icon: Milestone },
    { name: 'Bucket Sort', Icon: PackageOpen },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map(({ name, Icon }) => (
          <div
            key={name}
            onClick={() => onSelectAlgo(name)}
            className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:border-indigo-400 transition-all cursor-pointer group"
          >
            <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600 mb-4 group-hover:scale-110 transition-transform">
              <Icon size={24} />
            </div>
            <h3 className="text-xl font-bold text-slate-800">{name}</h3>
            <p className="text-slate-500 text-sm mb-4">{ALGO_DATA[name].description}</p>
            <div className="flex justify-between items-center text-xs font-semibold uppercase tracking-wider text-slate-400">
              <span>{ALGO_DATA[name].complexity}</span>
              <span className="text-green-500">{getProgressPercent(name)}% Completed</span>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-indigo-900 rounded-3xl p-8 text-white relative overflow-hidden shadow-xl">
        <div className="relative z-10">
          <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
            Challenge Mode <Sparkles className="text-amber-400" size={20} />
          </h2>
          <p className="text-indigo-200 mb-6 max-w-md">
            Can you design an array that forces Insertion Sort to take more than 25 swaps?
          </p>
          <button className="bg-white text-indigo-900 px-6 py-2 rounded-full font-bold hover:bg-indigo-50 transition-colors shadow-lg">
            Start Challenge Mode
          </button>
        </div>
        <Bug className="absolute right-[-20px] bottom-[-20px] text-white/10 rotate-12" size={160} />
      </div>
    </div>
  );
}
