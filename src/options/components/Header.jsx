import React from 'react'

function Header({ totalWords, dueWords }) {
  return (
    <header className="sticky top-0 z-10 bg-white/70 backdrop-blur shadow-sm">
      <div className="container-max flex items-center justify-between py-4">
        <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-brand-500 to-brand-600 flex items-center gap-3">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" className="w-8 h-8 text-brand-500">
            <path d="M12 2L2 7l10 5 10-5-10-5z" fill="currentColor" opacity="0.6"/>
            <path d="M2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Vocabulary Note
        </h1>

        <div className="flex items-center gap-4">
          <div className="bg-white/90 px-4 py-2 rounded-lg shadow-sm border border-white/60 text-center">
            <div className="text-xl font-extrabold text-brand-600">{totalWords}</div>
            <div className="text-xs text-slate-500 uppercase">Total</div>
          </div>

          <div className="bg-white/90 px-4 py-2 rounded-lg shadow-sm border border-white/60 text-center">
            <div className="text-xl font-extrabold text-rose-500">{dueWords}</div>
            <div className="text-xs text-slate-500 uppercase">Due</div>
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header