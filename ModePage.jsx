import React from 'react';
import { ChevronLeft, GraduationCap, Flame, BookOpen, CheckCircle2 } from 'lucide-react';

export default function ModePage({ algoName, onBack, onStart }) {
  return (
    <div className="animate-in fade-in zoom-in-95 duration-400">
      <button onClick={onBack} className="text-slate-500 hover:text-indigo-600 mb-6 flex items-center gap-2 transition-colors font-medium">
        <ChevronLeft size={20} /> Back to Hub
      </button>
      <h2 className="text-4xl font-bold text-slate-900 mb-2">{algoName}</h2>
      <p className="text-slate-500 mb-10">Select your learning path to begin.</p>

      <div className="grid md:grid-cols-3 gap-8">
        <div
          onClick={() => onStart('tutorial')}
          className="bg-white p-8 rounded-3xl border-2 border-slate-100 hover:border-blue-400 transition-all cursor-pointer group shadow-sm hover:shadow-md"
        >
          <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <BookOpen size={32} />
          </div>
          <h3 className="text-2xl font-bold mb-2 text-slate-800">Tutorial Mode</h3>
          <ul className="text-slate-500 space-y-3 mb-8">
            <li className="flex items-center gap-2"><CheckCircle2 className="text-blue-500" size={18} /> Unlimited Lives</li>
            <li className="flex items-center gap-2"><CheckCircle2 className="text-blue-500" size={18} /> Extra Guidance in Every Message</li>
            <li className="flex items-center gap-2"><CheckCircle2 className="text-blue-500" size={18} /> Step-by-Step Explanations</li>
          </ul>
          <button className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold group-hover:bg-blue-600 transition-colors">Start Tutorial</button>
        </div>

        <div
          onClick={() => onStart('training')}
          className="bg-white p-8 rounded-3xl border-2 border-slate-100 hover:border-green-400 transition-all cursor-pointer group shadow-sm hover:shadow-md"
        >
          <div className="w-16 h-16 bg-green-100 text-green-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <GraduationCap size={32} />
          </div>
          <h3 className="text-2xl font-bold mb-2 text-slate-800">Training Mode</h3>
          <ul className="text-slate-500 space-y-3 mb-8">
            <li className="flex items-center gap-2"><CheckCircle2 className="text-green-500" size={18} /> Infinite Lives</li>
            <li className="flex items-center gap-2"><CheckCircle2 className="text-green-500" size={18} /> 3 Progressive Levels</li>
            <li className="flex items-center gap-2"><CheckCircle2 className="text-green-500" size={18} /> Reasoning Pop-ups</li>
            <li className="flex items-center gap-2"><CheckCircle2 className="text-green-500" size={18} /> Step-by-Step Hints</li>
          </ul>
          <button className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold group-hover:bg-green-600 transition-colors">Enter Training</button>
        </div>

        <div
          onClick={() => onStart('regular')}
          className="bg-white p-8 rounded-3xl border-2 border-slate-100 hover:border-red-400 transition-all cursor-pointer group shadow-sm hover:shadow-md"
        >
          <div className="w-16 h-16 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <Flame size={32} />
          </div>
          <h3 className="text-2xl font-bold mb-2 text-slate-800">Regular Mode</h3>
          <ul className="text-slate-500 space-y-3 mb-8">
            <li className="flex items-center gap-2"><CheckCircle2 className="text-red-500" size={18} /> 5 Lives Only</li>
            <li className="flex items-center gap-2"><CheckCircle2 className="text-red-500" size={18} /> 3 Progressive Levels</li>
            <li className="flex items-center gap-2"><CheckCircle2 className="text-red-500" size={18} /> Global Leaderboard</li>
            <li className="flex items-center gap-2"><CheckCircle2 className="text-red-500" size={18} /> Performance Analytics</li>
          </ul>
          <button className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold group-hover:bg-red-600 transition-colors">Start Regular</button>
        </div>
      </div>
    </div>
  );
}
