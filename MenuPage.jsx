import React from 'react';
import { Layers, Zap, Container, Microchip, Bug, Sparkles } from 'lucide-react';

const ALGO_DATA = {
  'Insertion Sort': {
    complexity: 'O(n²)',
    description: 'Foundational logic. Build the sorted array one item at a time.',
    levels: 3,
    progress: '66%',
  },
  'Bubble Sort': {
    complexity: 'O(n²)',
    description: 'Repeatedly compare adjacent items and bubble large values rightward.',
    levels: 3,
    progress: '0%',
  },
  'Quick Sort': {
    complexity: 'O(n log n)',
    description: 'Choose pivots and partition ranges to sort recursively.',
    levels: 3,
    progress: '0%',
  },
};

export default function MenuPage({ onSelectAlgo }) {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div
          onClick={() => onSelectAlgo('Insertion Sort')}
          className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:border-indigo-400 transition-all cursor-pointer group"
        >
          <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600 mb-4 group-hover:scale-110 transition-transform">
            <Layers size={24} />
          </div>
          <h3 className="text-xl font-bold text-slate-800">Insertion Sort</h3>
          <p className="text-slate-500 text-sm mb-4">{ALGO_DATA['Insertion Sort'].description}</p>
          <div className="flex justify-between items-center text-xs font-semibold uppercase tracking-wider text-slate-400">
            <span>{ALGO_DATA['Insertion Sort'].complexity}</span>
            <span className="text-green-500">{ALGO_DATA['Insertion Sort'].progress} Completed</span>
          </div>
        </div>

        <div
          onClick={() => onSelectAlgo('Bubble Sort')}
          className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:border-indigo-400 transition-all cursor-pointer group"
        >
          <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600 mb-4 group-hover:scale-110 transition-transform">
            <Zap size={24} />
          </div>
          <h3 className="text-xl font-bold text-slate-800">Bubble Sort</h3>
          <p className="text-slate-500 text-sm mb-4">{ALGO_DATA['Bubble Sort'].description}</p>
          <div className="flex justify-between items-center text-xs font-semibold uppercase tracking-wider text-slate-400">
            <span>{ALGO_DATA['Bubble Sort'].complexity}</span>
            <span className="text-green-500">{ALGO_DATA['Bubble Sort'].progress} Completed</span>
          </div>
        </div>

        <div
          onClick={() => onSelectAlgo('Quick Sort')}
          className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:border-indigo-400 transition-all cursor-pointer group"
        >
          <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600 mb-4 group-hover:scale-110 transition-transform">
            <Container size={24} />
          </div>
          <h3 className="text-xl font-bold text-slate-800">Quick Sort</h3>
          <p className="text-slate-500 text-sm mb-4">{ALGO_DATA['Quick Sort'].description}</p>
          <div className="flex justify-between items-center text-xs font-semibold uppercase tracking-wider text-slate-400">
            <span>{ALGO_DATA['Quick Sort'].complexity}</span>
            <span className="text-green-500">{ALGO_DATA['Quick Sort'].progress} Completed</span>
          </div>
        </div>

        <div className="bg-slate-50 p-6 rounded-2xl border border-dashed border-slate-300 opacity-75 cursor-not-allowed">
          <div className="w-12 h-12 bg-slate-200 rounded-xl flex items-center justify-center text-slate-400 mb-4">
            <Container size={24} />
          </div>
          <h3 className="text-xl font-bold text-slate-400">Distribution</h3>
          <p className="text-slate-400 text-sm mb-4">Radix & Bucket Sorts.</p>
          <span className="bg-slate-200 text-slate-500 px-2 py-1 rounded text-[10px] font-bold">LOCKED</span>
        </div>

        <div className="bg-slate-50 p-6 rounded-2xl border border-dashed border-slate-300 opacity-75 cursor-not-allowed">
          <div className="w-12 h-12 bg-slate-200 rounded-xl flex items-center justify-center text-slate-400 mb-4">
            <Microchip size={24} />
          </div>
          <h3 className="text-xl font-bold text-slate-400">Hybrid</h3>
          <p className="text-slate-400 text-sm mb-4">Timsort & Introsort.</p>
          <span className="bg-slate-200 text-slate-500 px-2 py-1 rounded text-[10px] font-bold">LOCKED</span>
        </div>
      </div>

      <div className="bg-indigo-900 rounded-3xl p-8 text-white relative overflow-hidden shadow-xl">
        <div className="relative z-10">
          <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
            Regular Mode <Sparkles className="text-amber-400" size={20} />
          </h2>
          <p className="text-indigo-200 mb-6 max-w-md">
            Can you design an array that forces Insertion Sort to take more than 25 swaps?
          </p>
          <button className="bg-white text-indigo-900 px-6 py-2 rounded-full font-bold hover:bg-indigo-50 transition-colors shadow-lg">
            Start Regular Mode
          </button>
        </div>
        <Bug className="absolute right-[-20px] bottom-[-20px] text-white/10 rotate-12" size={160} />
      </div>
    </div>
  );
}
