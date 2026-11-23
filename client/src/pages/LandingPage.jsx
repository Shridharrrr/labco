import { Link } from 'react-router-dom';
import { useState } from 'react';
import useUIStore from '../store/uiSlice';
import Logo from '../components/ui/Logo';

// --- Clean Minimalist Icons ---
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
  ArrowUpRight: (props) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <line x1="7" y1="17" x2="17" y2="7" />
      <polyline points="7 7 17 7 17 17" />
    </svg>
  ),
  Play: (props) => (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <polygon points="5 3 19 12 5 21 5 3" />
    </svg>
  ),
  ChevronDown: (props) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <polyline points="6 9 12 15 18 9" />
    </svg>
  ),
  Sun: (props) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" />
      <line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" />
      <line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  ),
  Moon: (props) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  ),
  Layers: (props) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <polygon points="12 2 2 7 12 12 22 7 12 2" />
      <polyline points="2 17 12 22 22 17" />
      <polyline points="2 12 12 17 22 12" />
    </svg>
  ),
  Sparkles: (props) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
    </svg>
  ),
  Github: (props) => (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
    </svg>
  ),
};

function FaqItem({ question, answer }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-black/[0.08] dark:border-white/[0.08] py-4.5 last:border-b-0 transition-colors">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between text-left py-1 text-sm font-medium text-zinc-900 dark:text-zinc-200 hover:text-black dark:hover:text-white transition-colors cursor-pointer"
      >
        <span>{question}</span>
        <Icons.ChevronDown className={`w-4 h-4 text-zinc-400 dark:text-zinc-500 transition-transform duration-200 shrink-0 ml-4 ${open ? 'rotate-180 text-black dark:text-zinc-200' : ''}`} />
      </button>
      {open && (
        <p className="mt-2.5 text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 font-normal leading-relaxed pr-6 animate-fadeIn">
          {answer}
        </p>
      )}
    </div>
  );
}

export default function LandingPage() {
  const { theme, toggleTheme } = useUIStore();
  const [previewTab, setPreviewTab] = useState('list'); // 'list' (Linear style from reference) | 'kanban'

  return (
    <div className="min-h-screen bg-[#f8f9fb] dark:bg-[#07080b] text-zinc-900 dark:text-zinc-100 font-sans selection:bg-zinc-200 dark:selection:bg-white/15 relative overflow-hidden transition-colors duration-200">
      
      {/* ── Ambient Aurora Mesh (Matches Reference Image 2) ──────────────── */}
      <div className="hero-aurora pointer-events-none" />
      <div className="hero-aurora-left pointer-events-none" />

      {/* ── Floating Pill Navigation ────────────────────────────────────── */}
      <nav className="sticky top-4 z-50 max-w-5xl mx-auto px-4 sm:px-6">
        <div className="bg-white/80 dark:bg-[#0d0e14]/75 backdrop-blur-xl border border-black/[0.08] dark:border-white/[0.09] rounded-full px-4 sm:px-6 h-14 flex items-center justify-between shadow-sm dark:shadow-2xl">
          
          {/* Logo mark */}
          <Link to="/" className="flex items-center group">
            <Logo size="sm" showText={true} />
          </Link>

          {/* Centered navigation items */}
          <div className="hidden md:flex items-center gap-6 text-xs font-medium text-zinc-600 dark:text-zinc-300">
            <a href="#features" className="hover:text-black dark:hover:text-white transition-colors">Features</a>
            <a href="#preview" className="hover:text-black dark:hover:text-white transition-colors">Interactive Demo</a>
            <a href="#faq" className="hover:text-black dark:hover:text-white transition-colors">FAQ</a>
            <a href="https://github.com/Shridharrrr/labco" target="_blank" rel="noreferrer" className="flex items-center gap-1.5 hover:text-black dark:hover:text-white transition-colors">
              <Icons.Github className="w-3.5 h-3.5" />
              <span>Source</span>
            </a>
          </div>

          {/* Right action group */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              className="w-8 h-8 rounded-full flex items-center justify-center border border-black/[0.08] dark:border-white/[0.09] bg-black/[0.02] dark:bg-white/[0.03] text-zinc-600 hover:text-black dark:text-zinc-300 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-all shadow-xs"
              title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Icons.Sun className="w-4 h-4 text-amber-400" /> : <Icons.Moon className="w-4 h-4 text-zinc-700" />}
            </button>

            <Link
              to="/login"
              className="text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:text-black dark:hover:text-white px-2.5 sm:px-3 py-1.5 rounded-full transition-colors"
            >
              Log in
            </Link>

            <Link
              to="/register"
              className="text-xs font-semibold bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 hover:bg-zinc-800 dark:hover:bg-zinc-200 px-4 py-2 rounded-full transition-all shadow-sm active:scale-95"
            >
              Start Free
            </Link>
          </div>

        </div>
      </nav>

      {/* ── Hero Section (Editorial Serif + Non-AI bespoke touch) ───────── */}
      <section className="relative z-10 pt-16 sm:pt-24 pb-14 px-6 max-w-5xl mx-auto text-center">
        
        {/* Subtle pill tag */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-black/[0.08] dark:border-white/[0.08] bg-white/70 dark:bg-white/[0.04] backdrop-blur-md text-xs text-zinc-600 dark:text-zinc-300 mb-8 shadow-xs">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-medium">Sub-10ms Multi-User Synchronization</span>
        </div>

        {/* Editorial Serif Headline (Matches Reference Image 2) */}
        <h1 className="font-editorial text-4xl sm:text-6xl md:text-7xl font-normal tracking-[-0.02em] text-zinc-950 dark:text-white leading-[1.08] max-w-4xl mx-auto mb-6">
          All your projects, tasks, and ideas in one intelligent workspace
        </h1>

        {/* Clean subtitle */}
        <p className="text-sm sm:text-base md:text-lg text-zinc-600 dark:text-zinc-400 font-normal leading-relaxed max-w-2xl mx-auto mb-10">
          Effortlessly manage roadmaps, design systems, and daily task lists
          with real-time multiplayer tracking and zero distraction.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 mb-14">
          <Link
            to="/register"
            className="w-full sm:w-auto px-6 py-3 bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 font-medium text-xs sm:text-sm rounded-xl hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-all shadow-sm active:scale-98 flex items-center justify-center gap-2"
          >
            <span>Start Exploring</span>
            <Icons.ArrowUpRight className="w-4 h-4" />
          </Link>
          <a
            href="#preview"
            className="w-full sm:w-auto px-5 py-3 border border-black/10 dark:border-white/10 hover:border-black/20 dark:hover:border-white/20 bg-white/60 dark:bg-white/[0.03] text-zinc-800 dark:text-zinc-200 font-medium text-xs sm:text-sm rounded-xl hover:bg-black/5 dark:hover:bg-white/[0.07] transition-all flex items-center justify-center gap-2"
          >
            <Icons.Play className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />
            <span>Interactive Preview</span>
          </a>
        </div>

        {/* ── Product Showcase Mockup (Faithfully matches Reference 2) ─── */}
        <div id="preview" className="relative mx-auto rounded-2xl border border-black/[0.08] dark:border-white/[0.09] bg-white dark:bg-[#0c0d13] shadow-2xl overflow-hidden text-left transition-colors">
          
          {/* Top Window Bezel */}
          <div className="h-11 border-b border-black/[0.06] dark:border-white/[0.07] bg-zinc-50 dark:bg-[#090a0f] px-4.5 flex items-center justify-between text-xs text-zinc-500 select-none">
            
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
              <div className="h-3 w-px bg-black/10 dark:bg-white/10 mx-2" />
              
              {/* Breadcrumb identifier */}
              <div className="flex items-center gap-1.5 text-zinc-900 dark:text-zinc-200 font-medium">
                <span className="w-4 h-4 rounded bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-[10px] font-bold">P</span>
                <span>Personal Workspace</span>
              </div>
            </div>

            {/* View Mode Toggle Pill */}
            <div className="flex items-center gap-1 bg-black/5 dark:bg-white/5 p-0.5 rounded-lg border border-black/[0.04] dark:border-white/[0.06]">
              <button
                onClick={() => setPreviewTab('list')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${previewTab === 'list' ? 'bg-white dark:bg-[#1a1c27] text-black dark:text-white shadow-xs' : 'text-zinc-500 hover:text-black dark:hover:text-white'}`}
              >
                List View
              </button>
              <button
                onClick={() => setPreviewTab('kanban')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${previewTab === 'kanban' ? 'bg-white dark:bg-[#1a1c27] text-black dark:text-white shadow-xs' : 'text-zinc-500 hover:text-black dark:hover:text-white'}`}
              >
                Multiplayer Kanban
              </button>
            </div>

          </div>

          {/* Interactive Mockup Body: Split into Sidebar + Workspace */}
          <div className="grid grid-cols-1 md:grid-cols-12 min-h-[460px]">
            
            {/* Left Mini-Sidebar (Reference Image 2) */}
            <div className="hidden md:block md:col-span-3 border-r border-black/[0.06] dark:border-white/[0.07] bg-zinc-50/50 dark:bg-[#0a0b10] p-4 text-xs select-none">
              
              {/* Team switch header */}
              <div className="flex items-center justify-between p-2 rounded-lg bg-black/[0.03] dark:bg-white/[0.04] border border-black/[0.04] dark:border-white/[0.06] mb-5">
                <div className="flex items-center gap-2">
                  <Logo size="xs" showText={false} />
                  <span className="font-semibold text-zinc-900 dark:text-white text-xs">LabCo Workspace</span>
                </div>
                <Icons.ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
              </div>

              {/* Navigation items */}
              <div className="space-y-1 mb-6">
                <div className="flex items-center justify-between px-2.5 py-1.5 rounded-lg text-zinc-600 dark:text-zinc-400 hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer">
                  <div className="flex items-center gap-2.5">
                    <Icons.Checklist className="w-3.5 h-3.5" />
                    <span>Inbox</span>
                  </div>
                  <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">22</span>
                </div>

                <div className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-zinc-600 dark:text-zinc-400 hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer">
                  <Icons.Layers className="w-3.5 h-3.5" />
                  <span>My issues</span>
                </div>
              </div>

              {/* Workspace tree */}
              <div className="mb-6">
                <p className="px-2.5 text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-2">Workspace</p>
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-black/5 dark:bg-white/[0.08] text-zinc-900 dark:text-white font-medium cursor-pointer">
                    <span className="w-2 h-2 rounded-full bg-blue-500" />
                    <span>Personal</span>
                  </div>
                  <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-zinc-600 dark:text-zinc-400 hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer">
                    <span className="w-2 h-2 rounded-full bg-purple-500" />
                    <span>Templates</span>
                  </div>
                </div>
              </div>

              {/* Teams section */}
              <div>
                <p className="px-2.5 text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-2">Your teams</p>
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-zinc-600 dark:text-zinc-400 hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    <span>Core Platform</span>
                  </div>
                  <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-zinc-600 dark:text-zinc-400 hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                    <span>Design System</span>
                  </div>
                </div>
              </div>

            </div>

            {/* Main Workspace Frame */}
            <div className="md:col-span-9 p-4 sm:p-5 flex flex-col justify-between">
              
              {previewTab === 'list' ? (
                /* ── Linear / Solaris Style List View (Matches Reference 2) ── */
                <div className="space-y-5">
                  
                  {/* Category: In Progress */}
                  <div>
                    <div className="flex items-center gap-2 mb-2 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                      <span className="w-2 h-2 rounded-full bg-amber-500" />
                      <span>In Progress</span>
                      <span className="text-zinc-400 dark:text-zinc-600 font-mono text-[11px]">2</span>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between p-2.5 rounded-lg border border-black/[0.05] dark:border-white/[0.06] bg-zinc-50 dark:bg-[#12131b] hover:border-black/10 dark:hover:border-white/10 transition-colors">
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-[10px] text-zinc-400 dark:text-zinc-500">PER-08</span>
                          <span className="text-xs font-medium text-zinc-900 dark:text-zinc-200">Making Suprema's design system</span>
                        </div>
                        <div className="flex items-center gap-3 text-xs">
                          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                            Project (Build in Public)
                          </span>
                          <span className="text-[11px] text-zinc-400 font-mono">Apr 10</span>
                          <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-[9px] flex items-center justify-center font-bold">SK</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between p-2.5 rounded-lg border border-black/[0.05] dark:border-white/[0.06] bg-zinc-50 dark:bg-[#12131b] hover:border-black/10 dark:hover:border-white/10 transition-colors">
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-[10px] text-zinc-400 dark:text-zinc-500">PER-07</span>
                          <span className="text-xs font-medium text-zinc-900 dark:text-zinc-200">Create working prototype</span>
                        </div>
                        <div className="flex items-center gap-3 text-xs">
                          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                            Project (Build in Public)
                          </span>
                          <span className="text-[11px] text-zinc-400 font-mono">Apr 11</span>
                          <span className="w-5 h-5 rounded-full bg-emerald-600 text-white text-[9px] flex items-center justify-center font-bold">AL</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Category: Todo */}
                  <div>
                    <div className="flex items-center gap-2 mb-2 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                      <span className="w-2 h-2 rounded-full border border-zinc-400 dark:border-zinc-500" />
                      <span>Todo</span>
                      <span className="text-zinc-400 dark:text-zinc-600 font-mono text-[11px]">2</span>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between p-2.5 rounded-lg border border-black/[0.05] dark:border-white/[0.06] bg-zinc-50 dark:bg-[#12131b] hover:border-black/10 dark:hover:border-white/10 transition-colors">
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-[10px] text-zinc-400 dark:text-zinc-500">PER-06</span>
                          <span className="text-xs font-medium text-zinc-900 dark:text-zinc-200">Add a landing page for design system on framer</span>
                        </div>
                        <div className="flex items-center gap-3 text-xs">
                          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                            Framer Projects
                          </span>
                          <span className="text-[11px] text-zinc-400 font-mono">Apr 11</span>
                          <span className="w-5 h-5 rounded-full bg-zinc-700 text-white text-[9px] flex items-center justify-center font-bold">MD</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between p-2.5 rounded-lg border border-black/[0.05] dark:border-white/[0.06] bg-zinc-50 dark:bg-[#12131b] hover:border-black/10 dark:hover:border-white/10 transition-colors">
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-[10px] text-zinc-400 dark:text-zinc-500">PER-05</span>
                          <span className="text-xs font-medium text-zinc-900 dark:text-zinc-200">Add a live preview page on framer</span>
                        </div>
                        <div className="flex items-center gap-3 text-xs">
                          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                            Framer Projects
                          </span>
                          <span className="text-[11px] text-zinc-400 font-mono">Apr 11</span>
                          <span className="w-5 h-5 rounded-full bg-sky-600 text-white text-[9px] flex items-center justify-center font-bold">TH</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Category: Done */}
                  <div>
                    <div className="flex items-center gap-2 mb-2 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span>Done</span>
                      <span className="text-zinc-400 dark:text-zinc-600 font-mono text-[11px]">2</span>
                    </div>

                    <div className="space-y-1.5 opacity-80">
                      <div className="flex items-center justify-between p-2.5 rounded-lg border border-black/[0.05] dark:border-white/[0.06] bg-zinc-50 dark:bg-[#12131b]">
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-[10px] text-zinc-400 dark:text-zinc-500">PER-02</span>
                          <span className="text-xs font-medium text-zinc-600 dark:text-zinc-300 line-through">Make cool a space themed portfolio</span>
                        </div>
                        <div className="flex items-center gap-3 text-xs">
                          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                            Completed
                          </span>
                          <span className="text-[11px] text-zinc-400 font-mono">Apr 8</span>
                          <span className="w-5 h-5 rounded-full bg-zinc-600 text-white text-[9px] flex items-center justify-center font-bold">SK</span>
                        </div>
                      </div>
                    </div>
                  </div>

                </div>
              ) : (
                /* ── Kanban Columns Preview ── */
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3 rounded-xl bg-zinc-50 dark:bg-[#101118] border border-black/[0.05] dark:border-white/[0.06]">
                    <div className="flex items-center justify-between mb-3 text-xs font-medium text-zinc-700 dark:text-zinc-300">
                      <span>Backlog</span>
                      <span className="font-mono text-[10px] text-zinc-400">2</span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-white dark:bg-[#171924] border border-black/[0.06] dark:border-white/[0.07] text-xs font-medium text-zinc-800 dark:text-zinc-200 shadow-xs mb-2">
                      Multiplayer socket rooms
                    </div>
                    <div className="p-2.5 rounded-lg bg-white dark:bg-[#171924] border border-black/[0.06] dark:border-white/[0.07] text-xs font-medium text-zinc-800 dark:text-zinc-200 shadow-xs">
                      JWT refresh token blacklisting
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-zinc-50 dark:bg-[#101118] border border-black/[0.05] dark:border-white/[0.06]">
                    <div className="flex items-center justify-between mb-3 text-xs font-medium text-amber-600 dark:text-amber-400">
                      <span>In Progress</span>
                      <span className="font-mono text-[10px] text-amber-500">1</span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-white dark:bg-[#171924] border border-amber-500/30 text-xs font-medium text-zinc-800 dark:text-zinc-200 shadow-xs">
                      Upstash Redis presence sync
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-zinc-50 dark:bg-[#101118] border border-black/[0.05] dark:border-white/[0.06]">
                    <div className="flex items-center justify-between mb-3 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                      <span>Done</span>
                      <span className="font-mono text-[10px] text-emerald-500">4</span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-white dark:bg-[#171924] border border-black/[0.06] dark:border-white/[0.07] text-xs font-medium text-zinc-800 dark:text-zinc-200 shadow-xs opacity-80">
                      MongoDB Atlas integration
                    </div>
                  </div>
                </div>
              )}

              {/* Bottom Live Sync Status */}
              <div className="mt-6 pt-3 border-t border-black/[0.06] dark:border-white/[0.07] flex items-center justify-between text-[11px] text-zinc-500">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span>Real-time presence: 4 collaborators online</span>
                </div>
                <div className="font-mono text-zinc-400">
                  Latency: 4ms · Zero polling
                </div>
              </div>

            </div>

          </div>

        </div>

      </section>

      {/* ── Key Metrics Bar (Matching Reference 1 & 2) ─────────────────── */}
      <section className="py-10 border-y border-black/[0.06] dark:border-white/[0.07] bg-white/40 dark:bg-[#0a0b10]/60 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <div>
            <p className="text-2xl sm:text-3xl font-bold font-editorial text-zinc-950 dark:text-white">&lt; 10ms</p>
            <p className="text-xs text-zinc-500 mt-1">Multiplayer sync latency</p>
          </div>
          <div>
            <p className="text-2xl sm:text-3xl font-bold font-editorial text-zinc-950 dark:text-white">100%</p>
            <p className="text-xs text-zinc-500 mt-1">Audit-verified architecture</p>
          </div>
          <div>
            <p className="text-2xl sm:text-3xl font-bold font-editorial text-zinc-950 dark:text-white">Zero</p>
            <p className="text-xs text-zinc-500 mt-1">Polling battery drain</p>
          </div>
          <div>
            <p className="text-2xl sm:text-3xl font-bold font-editorial text-zinc-950 dark:text-white">Cloud Native</p>
            <p className="text-xs text-zinc-500 mt-1">Atlas, Upstash & Brevo</p>
          </div>
        </div>
      </section>

      {/* ── Features Grid (Sharp Edges, Minimalist Aesthetic) ──────────── */}
      <section id="features" className="py-20 px-6 max-w-5xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <p className="text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 mb-2">Engineered for Velocity</p>
          <h2 className="font-editorial text-3xl sm:text-5xl font-normal text-zinc-950 dark:text-white">
            Everything you need to ship projects on time
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4.5">
          
          <div className="p-6 rounded-2xl border border-black/[0.06] dark:border-white/[0.07] bg-white dark:bg-[#0c0d14] shadow-xs hover:border-black/15 dark:hover:border-white/15 transition-all">
            <div className="w-10 h-10 rounded-xl bg-black/5 dark:bg-white/5 flex items-center justify-center text-zinc-900 dark:text-white mb-4">
              <Icons.Sync className="w-5 h-5 stroke-[1.5]" />
            </div>
            <h3 className="text-base font-semibold text-zinc-900 dark:text-white mb-2">Live Multiplayer Sync</h3>
            <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
              Every card moved, tag edited, and comment posted synchronizes instantly across team screens using bi-directional WebSockets.
            </p>
          </div>

          <div className="p-6 rounded-2xl border border-black/[0.06] dark:border-white/[0.07] bg-white dark:bg-[#0c0d14] shadow-xs hover:border-black/15 dark:hover:border-white/15 transition-all">
            <div className="w-10 h-10 rounded-xl bg-black/5 dark:bg-white/5 flex items-center justify-center text-zinc-900 dark:text-white mb-4">
              <Icons.Users className="w-5 h-5 stroke-[1.5]" />
            </div>
            <h3 className="text-base font-semibold text-zinc-900 dark:text-white mb-2">Live Cursor Presence</h3>
            <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
              See who is currently active on the board with real-time cursor tracking and presence indicators backed by Upstash Redis.
            </p>
          </div>

          <div className="p-6 rounded-2xl border border-black/[0.06] dark:border-white/[0.07] bg-white dark:bg-[#0c0d14] shadow-xs hover:border-black/15 dark:hover:border-white/15 transition-all">
            <div className="w-10 h-10 rounded-xl bg-black/5 dark:bg-white/5 flex items-center justify-center text-zinc-900 dark:text-white mb-4">
              <Icons.Layers className="w-5 h-5 stroke-[1.5]" />
            </div>
            <h3 className="text-base font-semibold text-zinc-900 dark:text-white mb-2">Multi-View Workspace</h3>
            <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
              Switch fluidly between Kanban columns, detailed spreadsheet tables, Gantt timelines, discussion threads, and file galleries.
            </p>
          </div>

          <div className="p-6 rounded-2xl border border-black/[0.06] dark:border-white/[0.07] bg-white dark:bg-[#0c0d14] shadow-xs hover:border-black/15 dark:hover:border-white/15 transition-all">
            <div className="w-10 h-10 rounded-xl bg-black/5 dark:bg-white/5 flex items-center justify-center text-zinc-900 dark:text-white mb-4">
              <Icons.Shield className="w-5 h-5 stroke-[1.5]" />
            </div>
            <h3 className="text-base font-semibold text-zinc-900 dark:text-white mb-2">Security Hardened</h3>
            <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
              Full XSS input sanitization, IDOR move protection, role-based access controls, and strict MIME file extension filtering.
            </p>
          </div>

          <div className="p-6 rounded-2xl border border-black/[0.06] dark:border-white/[0.07] bg-white dark:bg-[#0c0d14] shadow-xs hover:border-black/15 dark:hover:border-white/15 transition-all">
            <div className="w-10 h-10 rounded-xl bg-black/5 dark:bg-white/5 flex items-center justify-center text-zinc-900 dark:text-white mb-4">
              <Icons.Sparkles className="w-5 h-5 stroke-[1.5]" />
            </div>
            <h3 className="text-base font-semibold text-zinc-900 dark:text-white mb-2">Cloud Native Backend</h3>
            <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
              Powered by MongoDB Atlas with dedicated database scoping, Upstash Redis REST, and Brevo transactional email delivery.
            </p>
          </div>

          <div className="p-6 rounded-2xl border border-black/[0.06] dark:border-white/[0.07] bg-white dark:bg-[#0c0d14] shadow-xs hover:border-black/15 dark:hover:border-white/15 transition-all">
            <div className="w-10 h-10 rounded-xl bg-black/5 dark:bg-white/5 flex items-center justify-center text-zinc-900 dark:text-white mb-4">
              <Icons.Clock className="w-5 h-5 stroke-[1.5]" />
            </div>
            <h3 className="text-base font-semibold text-zinc-900 dark:text-white mb-2">Activity Audit Trail</h3>
            <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
              Every action from card creation to column reordering is recorded with timestamps, user avatars, and undo tracking.
            </p>
          </div>

        </div>
      </section>

      {/* ── FAQ Section ─────────────────────────────────────────────────── */}
      <section id="faq" className="py-16 px-6 max-w-3xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="font-editorial text-3xl sm:text-4xl font-normal text-zinc-950 dark:text-white">
            Frequently Asked Questions
          </h2>
        </div>

        <div className="rounded-2xl border border-black/[0.06] dark:border-white/[0.07] bg-white dark:bg-[#0c0d14] p-6 sm:p-8 shadow-xs">
          <FaqItem
            question="How does real-time synchronization work without polling?"
            answer="LabCo establishes a lightweight WebSocket connection upon opening any board. Whenever any collaborator modifies a card or column, the backend verifies authorization and broadcasts the delta event in under 10ms directly to connected clients."
          />
          <FaqItem
            question="Can I invite external clients as view-only members?"
            answer="Yes. Board owners can invite team members with specific roles ('editor' or 'viewer'). Viewers can inspect tasks, check progress, and participate in discussions without altering board structure."
          />
          <FaqItem
            question="Is data separated if using a shared MongoDB Atlas cluster?"
            answer="Yes. All collections and operations are strictly scoped to the dedicated 'labco' database namespace, ensuring complete data isolation from any other projects hosted on your cluster."
          />
          <FaqItem
            question="Does LabCo support both dark and light modes?"
            answer="Yes. Every view, modal, card, and sidebar is styled with high-contrast, uniform color tokens supporting instant toggling between luxury obsidian dark mode and crisp studio light mode."
          />
        </div>
      </section>

      {/* ── Editorial CTA Section ───────────────────────────────────────── */}
      <section className="py-20 px-6 max-w-4xl mx-auto text-center">
        <h2 className="font-editorial text-4xl sm:text-6xl font-normal text-zinc-950 dark:text-white mb-6">
          Ready to bring clarity to your team's velocity?
        </h2>
        <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-400 max-w-xl mx-auto mb-9">
          Join high-velocity engineering and design teams shipping projects with instant multi-user synchronization.
        </p>
        <Link
          to="/register"
          className="inline-flex items-center gap-2 px-7 py-3.5 bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 font-medium text-sm rounded-xl hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-all shadow-lg active:scale-95"
        >
          <span>Create your first board</span>
          <Icons.ArrowUpRight className="w-4 h-4" />
        </Link>
      </section>

      {/* ── Sleek Minimalist Footer ─────────────────────────────────────── */}
      <footer className="border-t border-black/[0.06] dark:border-white/[0.07] py-8 text-xs text-zinc-500 text-center">
        <div className="max-w-5xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <Logo size="xs" showText={true} />
            <span className="text-zinc-400">·</span>
            <span className="text-zinc-600 dark:text-zinc-400">Real-time collaborative workspace</span>
          </div>
          <div className="flex items-center gap-5 text-zinc-500">
            <a href="https://github.com/Shridharrrr/labco" target="_blank" rel="noreferrer" className="hover:text-black dark:hover:text-white transition-colors">GitHub</a>
            <Link to="/login" className="hover:text-black dark:hover:text-white transition-colors">Log in</Link>
            <Link to="/register" className="hover:text-black dark:hover:text-white transition-colors">Register</Link>
          </div>
        </div>
      </footer>

    </div>
  );
}
