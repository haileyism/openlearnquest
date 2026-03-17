import React, { useState } from 'react';
import { Trophy } from 'lucide-react';
import MenuPage from './MenuPage';
import ModePage from './ModePage';
import InsertionSortGamePage from './InsertionSortGamePage';
import BubbleSortGamePage from './BubbleSortGamePage';
import QuickSortGamePage from './QuickSortGamePage';
import SelectionSortGamePage from './SelectionSortGamePage';
import MergeSortGamePage from './MergeSortGamePage';
import HeapSortGamePage from './HeapSortGamePage';
import CountingSortGamePage from './CountingSortGamePage';
import RadixSortGamePage from './RadixSortGamePage';
import BucketSortGamePage from './BucketSortGamePage';

export default function App() {
  const [view, setView] = useState('menu'); // 'menu', 'mode', 'game'
  const [selectedAlgo, setSelectedAlgo] = useState(null);
  const [gameMode, setGameMode] = useState(null);

  const handleSelectAlgo = (name) => {
    setSelectedAlgo(name);
    setView('mode');
  };

  const handleStartGame = (mode) => {
    setGameMode(mode);
    setView('game');
  };

  return (
    <div className="min-h-screen p-4 md:p-8 bg-slate-50 font-sans">
      <div className="max-w-6xl mx-auto">
        {/* GLOBAL HEADER */}
        <header className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">
              SortLogic <span className="text-indigo-600">Elite</span>
            </h1>
            <p className="text-slate-500 font-medium">Educational Lab Prototype</p>
          </div>
          <div className="bg-white px-4 py-2 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-3">
            <Trophy className="text-amber-500" size={20} />
            <span className="font-bold text-slate-700">Rank: Novice</span>
          </div>
        </header>

        {/* MODULAR VIEW SYSTEM */}
        {view === 'menu' && <MenuPage onSelectAlgo={handleSelectAlgo} />}

        {view === 'mode' && (
          <ModePage
            algoName={selectedAlgo}
            onBack={() => setView('menu')}
            onStart={handleStartGame}
          />
        )}

        {view === 'game' && (
          <>
            {selectedAlgo === 'Insertion Sort' && (
              <InsertionSortGamePage
                mode={gameMode}
                onBackToMode={() => setView('mode')}
                onExit={() => setView('menu')}
              />
            )}
            {selectedAlgo === 'Bubble Sort' && (
              <BubbleSortGamePage
                mode={gameMode}
                onExit={() => setView('menu')}
              />
            )}
            {selectedAlgo === 'Quick Sort' && (
              <QuickSortGamePage
                mode={gameMode}
                onExit={() => setView('menu')}
              />
            )}
            {selectedAlgo === 'Selection Sort' && (
              <SelectionSortGamePage
                mode={gameMode}
                onExit={() => setView('menu')}
              />
            )}
            {selectedAlgo === 'Merge Sort' && (
              <MergeSortGamePage
                mode={gameMode}
                onExit={() => setView('menu')}
              />
            )}
            {selectedAlgo === 'Heap Sort' && (
              <HeapSortGamePage
                mode={gameMode}
                onExit={() => setView('menu')}
              />
            )}
            {selectedAlgo === 'Counting Sort' && (
              <CountingSortGamePage
                mode={gameMode}
                onExit={() => setView('menu')}
              />
            )}
            {selectedAlgo === 'Radix Sort' && (
              <RadixSortGamePage
                mode={gameMode}
                onExit={() => setView('menu')}
              />
            )}
            {selectedAlgo === 'Bucket Sort' && (
              <BucketSortGamePage
                mode={gameMode}
                onExit={() => setView('menu')}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}
