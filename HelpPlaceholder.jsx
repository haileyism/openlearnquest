import React from 'react';

export default function HelpPlaceholder({ mode }) {
  if (mode !== 'training' && mode !== 'tutorial') return null;

  const title = mode === 'tutorial' ? 'Tutorial Help' : 'Guided Practice Help';
  const message = mode === 'tutorial'
    ? 'Help content coming soon. This area will provide guided walkthrough steps for the current algorithm.'
    : 'Help content coming soon. This area will provide quick strategy tips for the current algorithm.';

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 mb-8">
      <p className="text-xs font-bold uppercase tracking-wider text-amber-700 mb-2">{title}</p>
      <p className="text-sm text-amber-800 font-medium">{message}</p>
    </div>
  );
}
