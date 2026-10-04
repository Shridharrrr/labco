import { Link } from 'react-router-dom';
import { useState } from 'react';

// --- Clean Minimalist Icons (1.5 stroke, uniform sizing) ---

const Icons = {
  Kanban: (props) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M8 7v7M16 7v4M12 7v10" />
    </svg>
  ),
  Sync: (props) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2" />
    </svg>
  ),
  Shield: (props) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  ),
  Clock: (props) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  ),
  Users: (props) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  Checklist: (props) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="m9 11 3 3L22 4" />
      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
    </svg>
  ),
  ChevronRight: (props) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <polyline points="9 18 15 12 9 6" />
    </svg>
  ),
  ChevronDown: (props) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <polyline points="6 9 12 15 18 9" />
    </svg>
  ),
  Github: (props) => (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
    </svg>
  ),
  Paperclip: (props) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48" />
    </svg>
  ),
};

function FaqItem({ question, answer }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-zinc-800/80 py-4 last:border-b-0">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between text-left py-1 text-sm font-medium text-zinc-200 hover:text-white transition-colors cursor-pointer"
      >
        <span>{question}</span>
        <Icons.ChevronDown className={`w-4 h-4 text-zinc-500 transition-transform duration-200 shrink-0 ml-4 ${open ? 'rotate-180 text-zinc-300' : ''}`} />
      </button>
      {open && (
        <p className="mt-2.5 text-xs sm:text-sm text-zinc-400 font-normal leading-relaxed pr-6">
          {answer}
        </p>
      )}
    </div>
  );
}

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#08080a] text-zinc-200 font-sans selection:bg-zinc-800 selection:text-white">
      
      {/* ── Navigation ─────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-[#08080a]/85 backdrop-blur-md border-b border-zinc-800/70">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          
          <div className="flex items-center gap-6">
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="w-6 h-6 rounded bg-zinc-100 flex items-center justify-center text-zinc-950 font-bold text-xs">
                <Icons.Kanban className="w-3.5 h-3.5 text-zinc-950 stroke-[2]" />
              </div>
              <span className="font-semibold text-sm tracking-tight text-zinc-100">LabCo</span>
            </Link>

            <nav className="hidden md:flex items-center gap-5 text-xs text-zinc-400">
              <a href="#features" className="hover:text-zinc-200 transition-colors">Features</a>
              <a href="#architecture" className="hover:text-zinc-200 transition-colors">Architecture</a>
              <a href="#faq" className="hover:text-zinc-200 transition-colors">FAQ</a>
            </nav>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <a
              href="https://github.com/Shridharrrr/labco"
              target="_blank"
              rel="noreferrer"
              className="text-xs text-zinc-400 hover:text-zinc-200 flex items-center gap-1.5 px-2.5 py-1.5 rounded-md hover:bg-zinc-900 transition-colors"
            >
              <Icons.Github className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">GitHub</span>
            </a>
            
            <Link
              to="/login"
              className="text-xs font-medium text-zinc-300 hover:text-white px-2.5 sm:px-3 py-1.5 rounded-md transition-colors"
            >
              Log in
            </Link>

            <Link
              to="/register"
              className="text-xs font-medium bg-zinc-100 text-zinc-950 hover:bg-white px-3 sm:px-3.5 py-1.5 rounded-md transition-all shadow-sm active:scale-95"
            >
              Get started
            </Link>

            {/* Mobile menu toggle */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-1.5 text-zinc-400 hover:text-white rounded-md hover:bg-zinc-900 transition-colors"
              aria-label="Toggle navigation menu"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>

        </div>

        {/* Mobile menu dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-zinc-800/80 bg-[#08080a] px-6 py-4 flex flex-col gap-3">
            <a href="#features" onClick={() => setMobileMenuOpen(false)} className="text-xs text-zinc-300 hover:text-white py-1 transition-colors">Features</a>
            <a href="#architecture" onClick={() => setMobileMenuOpen(false)} className="text-xs text-zinc-300 hover:text-white py-1 transition-colors">Architecture</a>
            <a href="#faq" onClick={() => setMobileMenuOpen(false)} className="text-xs text-zinc-300 hover:text-white py-1 transition-colors">FAQ</a>
          </div>
        )}
      </header>

      {/* ── Hero Section ───────────────────────────────────────────────── */}
      <section className="pt-20 sm:pt-28 pb-16 px-6 max-w-5xl mx-auto text-center">
        
        {/* Subtle status tag */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-zinc-800 bg-zinc-900/60 text-xs text-zinc-400 mb-8">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          <span>Real-time collaborative task board</span>
        </div>

        {/* Headline */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-semibold tracking-[-0.03em] text-zinc-100 leading-[1.12] max-w-3xl mx-auto mb-6">
          Task management for teams that move fast.
        </h1>

        {/* Description */}
        <p className="text-sm sm:text-base md:text-lg text-zinc-400 font-normal leading-relaxed max-w-2xl mx-auto mb-9">
          LabCo provides instant multiplayer board synchronization with zero polling.
          Move cards, organize columns, track checklists, and collaborate in real-time.
        </p>

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            to="/register"
            className="w-full sm:w-auto px-5 py-2.5 bg-zinc-100 hover:bg-white text-zinc-950 font-medium text-xs sm:text-sm rounded-md transition-all shadow-sm active:scale-[0.98] flex items-center justify-center gap-1.5"
          >
            <span>Create a board</span>
            <Icons.ChevronRight className="w-3.5 h-3.5 stroke-[2]" />
          </Link>
          <a
            href="https://github.com/Shridharrrr/labco"
            target="_blank"
            rel="noreferrer"
            className="w-full sm:w-auto px-4 py-2.5 bg-zinc-900/80 hover:bg-zinc-800/80 border border-zinc-800 text-zinc-300 hover:text-white font-medium text-xs sm:text-sm rounded-md transition-all active:scale-[0.98] flex items-center justify-center gap-2"
          >
            <Icons.Github className="w-3.5 h-3.5" />
            <span>View source</span>
          </a>
        </div>

        {/* ── Product Preview Frame ────────────────────────────────────── */}
        <div className="mt-14 sm:mt-18 border border-zinc-800/80 rounded-xl bg-[#0c0c0f] shadow-2xl overflow-hidden text-left">
          
          {/* Window Bar */}
          <div className="h-10 border-b border-zinc-800/70 bg-[#09090c] px-4 flex items-center justify-between text-xs text-zinc-400 select-none">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-zinc-700/60" />
              <span className="w-2.5 h-2.5 rounded-full bg-zinc-700/60" />
              <span className="w-2.5 h-2.5 rounded-full bg-zinc-700/60" />
              <span className="h-3 w-px bg-zinc-800 mx-1.5" />
              <span className="font-medium text-zinc-300">Sprint 42 · Platform Engine</span>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center -space-x-1.5">
                <span className="w-5 h-5 rounded-full bg-indigo-700 text-white font-medium text-[9px] flex items-center justify-center border border-[#09090c]">SK</span>
                <span className="w-5 h-5 rounded-full bg-teal-700 text-white font-medium text-[9px] flex items-center justify-center border border-[#09090c]">AM</span>
                <span className="w-5 h-5 rounded-full bg-zinc-700 text-zinc-300 font-medium text-[9px] flex items-center justify-center border border-[#09090c]">+2</span>
              </div>
              <span className="text-[11px] text-emerald-400 font-mono flex items-center gap-1 pl-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                Live
              </span>
            </div>
          </div>

          {/* Sub Navigation Bar */}
          <div className="px-5 py-2.5 border-b border-zinc-800/60 bg-[#0c0c0f] flex items-center justify-between text-xs text-zinc-400">
            <div className="flex items-center gap-4">
              <span className="text-zinc-200 font-medium border-b-2 border-zinc-200 pb-2 -mb-2.5">Tasks</span>
              <span className="text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer">Discussion</span>
              <span className="text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer">Timeline</span>
              <span className="text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer">Overview</span>
            </div>

            <div className="hidden sm:flex items-center gap-2 text-zinc-500 text-[11px]">
              <span>4 columns</span>
              <span>·</span>
              <span>12 tasks</span>
            </div>
          </div>

          {/* Kanban Columns View */}
          <div className="p-5 overflow-x-auto bg-[#09090c]">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3.5 min-w-[760px]">
              
              {/* Backlog */}
              <div className="bg-[#101014] border border-zinc-800/70 rounded-lg p-3">
                <div className="flex items-center justify-between mb-3 px-1 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-zinc-500" />
                    <span className="font-medium text-zinc-300">Backlog</span>
                  </div>
                  <span className="font-mono text-[10px] text-zinc-500 bg-zinc-800/50 px-1.5 py-0.5 rounded">2</span>
                </div>

                <div className="space-y-2">
                  <div className="bg-[#15151a] border border-zinc-800 hover:border-zinc-700 rounded-md p-3 transition-colors shadow-xs">
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400">Infra</span>
                      <span className="text-[10px] font-mono text-zinc-600">LAB-102</span>
                    </div>
                    <p className="text-xs font-medium text-zinc-200 leading-snug">
                      Redis presence tracking for collaborative boards
                    </p>
                  </div>

                  <div className="bg-[#15151a] border border-zinc-800 hover:border-zinc-700 rounded-md p-3 transition-colors shadow-xs">
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400">Docs</span>
                      <span className="text-[10px] font-mono text-zinc-600">LAB-103</span>
                    </div>
                    <p className="text-xs font-medium text-zinc-300 leading-snug">
                      REST API specification and event documentation
                    </p>
                  </div>
                </div>
              </div>

              {/* In Progress */}
              <div className="bg-[#101014] border border-zinc-800/70 rounded-lg p-3">
                <div className="flex items-center justify-between mb-3 px-1 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                    <span className="font-medium text-zinc-200">In Progress</span>
                  </div>
                  <span className="font-mono text-[10px] text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded">1</span>
                </div>

                <div className="space-y-2">
                  <div className="bg-[#15151a] border border-indigo-500/30 rounded-md p-3 shadow-xs">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-300">High</span>
                        <span className="text-[10px] font-mono text-zinc-600">LAB-89</span>
                      </div>
                      <span className="text-[10px] font-mono text-zinc-500">Alex</span>
                    </div>
                    <p className="text-xs font-medium text-zinc-100 leading-snug mb-2.5">
                      WebSocket reconnect state reconciliation
                    </p>
                    <div className="flex items-center justify-between text-[10px] text-zinc-500 border-t border-zinc-800/80 pt-2 font-mono">
                      <span>Checklist 3/4</span>
                      <span className="text-emerald-400">75%</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* In Review */}
              <div className="bg-[#101014] border border-zinc-800/70 rounded-lg p-3">
                <div className="flex items-center justify-between mb-3 px-1 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                    <span className="font-medium text-zinc-300">In Review</span>
                  </div>
                  <span className="font-mono text-[10px] text-zinc-500 bg-zinc-800/50 px-1.5 py-0.5 rounded">1</span>
                </div>

                <div className="space-y-2">
                  <div className="bg-[#15151a] border border-zinc-800 hover:border-zinc-700 rounded-md p-3 transition-colors shadow-xs">
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400">Security</span>
                      <span className="text-[10px] font-mono text-zinc-600">LAB-76</span>
                    </div>
                    <p className="text-xs font-medium text-zinc-200 leading-snug mb-2">
                      Dual-token rotation & cookie invalidation
                    </p>
                    <div className="text-[10px] font-mono text-zinc-500 border-t border-zinc-800/80 pt-2 flex items-center justify-between">
                      <span className="flex items-center gap-1"><Icons.Paperclip className="w-3 h-3" /> 1 attachment</span>
                      <span>David</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Done */}
              <div className="bg-[#101014] border border-zinc-800/70 rounded-lg p-3">
                <div className="flex items-center justify-between mb-3 px-1 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span className="font-medium text-zinc-300">Done</span>
                  </div>
                  <span className="font-mono text-[10px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">2</span>
                </div>

                <div className="space-y-2">
                  <div className="bg-[#15151a] border border-zinc-800 rounded-md p-3 opacity-70">
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400">UI</span>
                      <span className="text-[10px] font-mono text-zinc-600">LAB-64</span>
                    </div>
                    <p className="text-xs font-medium text-zinc-400 leading-snug line-through">
                      Optimistic store rollback snapshotting
                    </p>
                  </div>

                  <div className="bg-[#15151a] border border-zinc-800 rounded-md p-3 opacity-70">
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400">Auth</span>
                      <span className="text-[10px] font-mono text-zinc-600">LAB-51</span>
                    </div>
                    <p className="text-xs font-medium text-zinc-400 leading-snug line-through">
                      Google OAuth token verification
                    </p>
                  </div>
                </div>
              </div>

            </div>
          </div>

        </div>

      </section>

      {/* ── Key Features ───────────────────────────────────────────────── */}
      <section id="features" className="py-24 border-t border-zinc-800/70 max-w-5xl mx-auto px-6">
        
        <div className="mb-14 text-center sm:text-left">
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-[-0.02em] text-zinc-100 mb-3">
            Built for clarity and focus.
          </h2>
          <p className="text-sm text-zinc-400 font-normal max-w-xl">
            Everything you need to plan, track, and ship tasks with your team, without superfluous features or visual noise.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          
          <div className="border border-zinc-800/80 rounded-lg p-5 bg-[#0c0c0f] hover:border-zinc-700 transition-colors">
            <div className="w-8 h-8 rounded border border-zinc-800 bg-zinc-900/60 flex items-center justify-center text-zinc-300 mb-4">
              <Icons.Sync className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-semibold text-zinc-200 mb-1.5">Instant Synchronization</h3>
            <p className="text-xs text-zinc-400 font-normal leading-relaxed">
              Real-time WebSockets push card movements, column edits, and comments to all active collaborators with sub-second latency.
            </p>
          </div>

          <div className="border border-zinc-800/80 rounded-lg p-5 bg-[#0c0c0f] hover:border-zinc-700 transition-colors">
            <div className="w-8 h-8 rounded border border-zinc-800 bg-zinc-900/60 flex items-center justify-center text-zinc-300 mb-4">
              <Icons.Clock className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-semibold text-zinc-200 mb-1.5">Optimistic Rendering</h3>
            <p className="text-xs text-zinc-400 font-normal leading-relaxed">
              Drag actions and text changes apply immediately in memory. If a server validation or network issue occurs, the store reverts safely.
            </p>
          </div>

          <div className="border border-zinc-800/80 rounded-lg p-5 bg-[#0c0c0f] hover:border-zinc-700 transition-colors">
            <div className="w-8 h-8 rounded border border-zinc-800 bg-zinc-900/60 flex items-center justify-center text-zinc-300 mb-4">
              <Icons.Users className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-semibold text-zinc-200 mb-1.5">Multiplayer Presence</h3>
            <p className="text-xs text-zinc-400 font-normal leading-relaxed">
              See who is currently active on the board. Active members are registered in Redis sets and synchronized when they join or disconnect.
            </p>
          </div>

          <div className="border border-zinc-800/80 rounded-lg p-5 bg-[#0c0c0f] hover:border-zinc-700 transition-colors">
            <div className="w-8 h-8 rounded border border-zinc-800 bg-zinc-900/60 flex items-center justify-center text-zinc-300 mb-4">
              <Icons.Checklist className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-semibold text-zinc-200 mb-1.5">Detailed Task Context</h3>
            <p className="text-xs text-zinc-400 font-normal leading-relaxed">
              Add sub-item checklists, color-coded priority labels, due dates, assignee lists, and file attachments directly to each card.
            </p>
          </div>

          <div className="border border-zinc-800/80 rounded-lg p-5 bg-[#0c0c0f] hover:border-zinc-700 transition-colors">
            <div className="w-8 h-8 rounded border border-zinc-800 bg-zinc-900/60 flex items-center justify-center text-zinc-300 mb-4">
              <Icons.Shield className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-semibold text-zinc-200 mb-1.5">Role-Based Access</h3>
            <p className="text-xs text-zinc-400 font-normal leading-relaxed">
              Enforce Owner, Editor, and Viewer permissions. Owners manage board settings and invitations, while editors manage workflow tasks.
            </p>
          </div>

          <div className="border border-zinc-800/80 rounded-lg p-5 bg-[#0c0c0f] hover:border-zinc-700 transition-colors">
            <div className="w-8 h-8 rounded border border-zinc-800 bg-zinc-900/60 flex items-center justify-center text-zinc-300 mb-4">
              <Icons.Kanban className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-semibold text-zinc-200 mb-1.5">Audit Trail & Discussion</h3>
            <p className="text-xs text-zinc-400 font-normal leading-relaxed">
              Every card update, status change, and member invitation is recorded in a chronological board activity log.
            </p>
          </div>

        </div>

      </section>

      {/* ── Architecture Overview ──────────────────────────────────────── */}
      <section id="architecture" className="py-24 border-t border-zinc-800/70 bg-[#060608]">
        <div className="max-w-5xl mx-auto px-6">
          
          <div className="mb-12 text-center sm:text-left">
            <h2 className="text-2xl sm:text-3xl font-semibold tracking-[-0.02em] text-zinc-100 mb-3">
              Architecture & Lifecycle
            </h2>
            <p className="text-sm text-zinc-400 font-normal max-w-xl">
              Strict separation between persistent document storage and fast ephemeral messaging.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            
            <div className="border border-zinc-800/80 rounded-lg p-5 bg-[#0c0c0f]">
              <div className="font-mono text-xs text-zinc-500 mb-2">01 / DISPATCH</div>
              <h4 className="text-sm font-semibold text-zinc-200 mb-1.5">Optimistic Mutation</h4>
              <p className="text-xs text-zinc-400 font-normal leading-relaxed">
                When a user moves a card, the client snapshots local state and updates the Zustand store instantly, giving immediate 60fps interaction.
              </p>
            </div>

            <div className="border border-zinc-800/80 rounded-lg p-5 bg-[#0c0c0f]">
              <div className="font-mono text-xs text-zinc-500 mb-2">02 / PERSISTENCE</div>
              <h4 className="text-sm font-semibold text-zinc-200 mb-1.5">Validation & Storage</h4>
              <p className="text-xs text-zinc-400 font-normal leading-relaxed">
                Express validates user session and permissions, persists the updated column positions into MongoDB, and appends an audit event.
              </p>
            </div>

            <div className="border border-zinc-800/80 rounded-lg p-5 bg-[#0c0c0f]">
              <div className="font-mono text-xs text-zinc-500 mb-2">03 / BROADCAST</div>
              <h4 className="text-sm font-semibold text-zinc-200 mb-1.5">Room Broadcast</h4>
              <p className="text-xs text-zinc-400 font-normal leading-relaxed">
                Socket.io broadcasts the mutation event exclusively to other peers in room <code className="text-zinc-300 font-mono text-[11px]">board:id</code> without echo to sender.
              </p>
            </div>

          </div>

        </div>
      </section>



      {/* ── FAQ Section ────────────────────────────────────────────────── */}
      <section id="faq" className="py-20 border-t border-zinc-800/70 bg-[#060608]">
        <div className="max-w-3xl mx-auto px-6">
          
          <div className="text-center mb-10">
            <h2 className="text-2xl font-semibold text-zinc-200 mb-2">Frequently asked questions</h2>
            <p className="text-xs text-zinc-400">Everything you need to know about setting up and running LabCo.</p>
          </div>

          <div className="border border-zinc-800/80 rounded-lg p-5 sm:p-6 bg-[#0c0c0f]">
            <FaqItem
              question="Can I self-host LabCo locally?"
              answer="Yes. The repository includes a docker-compose.yml file that launches MongoDB and Redis in isolated local containers. You can run the server and client with standard npm scripts without any cloud dependencies."
            />
            <FaqItem
              question="How are concurrent card moves handled?"
              answer="Each card movement updates the parent column's card array. Changes are committed to MongoDB and broadcast in room order, ensuring that all participants converge on the same state."
            />
            <FaqItem
              question="How does authentication and token refresh work?"
              answer="LabCo uses short-lived 15-minute access tokens kept in memory, combined with 7-day refresh tokens in httpOnly cookies. When an access token expires, an Axios interceptor requests a fresh token automatically."
            />
            <FaqItem
              question="What happens if a user goes offline?"
              answer="The frontend catches failed API requests and restores the previous board snapshot. Redis tracks active socket disconnections and updates the presence indicator for other members."
            />
          </div>

        </div>
      </section>

      {/* ── Call to Action ─────────────────────────────────────────────── */}
      <section className="py-24 border-t border-zinc-800/70 text-center px-6">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-semibold tracking-[-0.02em] text-zinc-100 mb-4">
            Ready to organize your team's work?
          </h2>
          <p className="text-sm text-zinc-400 font-normal mb-8">
            Create an account in seconds and experience real-time task management.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to="/register"
              className="w-full sm:w-auto px-5 py-2.5 bg-zinc-100 hover:bg-white text-zinc-950 font-medium text-xs sm:text-sm rounded-md transition-all shadow-sm active:scale-95"
            >
              Get started for free
            </Link>
            <Link
              to="/login"
              className="w-full sm:w-auto px-5 py-2.5 border border-zinc-800 hover:border-zinc-700 bg-zinc-900/60 text-zinc-300 hover:text-white font-medium text-xs sm:text-sm rounded-md transition-all"
            >
              Sign in
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────────────── */}
      <footer className="py-8 border-t border-zinc-800/70 text-xs text-zinc-500">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-zinc-100 flex items-center justify-center text-zinc-950 font-bold text-[10px]">
              <Icons.Kanban className="w-3 h-3 text-zinc-950 stroke-[2]" />
            </div>
            <span className="font-medium text-zinc-300">LabCo</span>
            <span>·</span>
            <span>Real-time collaborative Kanban board</span>
          </div>

          <div className="flex items-center gap-4 text-zinc-400">
            <a href="https://github.com/Shridharrrr/labco" target="_blank" rel="noreferrer" className="hover:text-zinc-200 transition-colors">
              GitHub
            </a>
            <span>&copy; {new Date().getFullYear()} LabCo</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
