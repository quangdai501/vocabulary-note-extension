import React from 'react'

function Navigation({ currentSection, setCurrentSection }) {
  const sections = [
    { id: 'review', label: 'Today Review', icon: (
      <svg width="20" height="20" viewBox="0 0 16 16" fill="none" className="w-5 h-5">
        <path d="M8 2v6l4 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5" fill="none"/>
      </svg>
    )},
    { id: 'vocabulary', label: 'All Vocabulary', icon: (
      <svg width="20" height="20" viewBox="0 0 16 16" fill="none" className="w-5 h-5">
        <path d="M2 3h12M2 8h12M2 13h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    )},
    { id: 'add', label: 'Add Word', icon: (
      <svg width="20" height="20" viewBox="0 0 16 16" fill="none" className="w-5 h-5">
        <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    )},
    { id: 'settings', label: 'Settings', icon: (
      <svg width="20" height="20" viewBox="0 0 16 16" fill="none" className="w-5 h-5">
        <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M8 4v1M8 11v1M6 6h1M11 6h1M6 10h1M11 10h1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    )}
  ]

  return (
    <nav className="bg-white/70 sticky top-0 z-9">
      <div className="container-max">
        <div className="flex gap-3 p-3 bg-white/80 rounded-xl shadow-sm border border-white/60">
          {sections.map(section => {
            const active = currentSection === section.id
            return (
              <button
                key={section.id}
                onClick={() => setCurrentSection(section.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition cursor-pointer ${active ? 'bg-gradient-to-r from-brand-500 to-brand-600 text-white shadow' : 'text-slate-600 hover:bg-slate-50'}`}
              >
                {section.icon}
                <span>{section.label}</span>
              </button>
            )
          })}
        </div>
      </div>
    </nav>
  )
}

export default Navigation