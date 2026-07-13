import { Link } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';

// --- Custom Hooks ---

function useInView(options = { threshold: 0.1, triggerOnce: true }) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setInView(true);
        if (options.triggerOnce) observer.disconnect();
      } else {
        if (!options.triggerOnce) setInView(false);
      }
    }, options);

    observer.observe(el);
    return () => observer.disconnect();
  }, [options.threshold, options.triggerOnce]);

  return [ref, inView];
}

// --- Icons (Lucide-inspired) ---

const Icons = {
  Lightning: (props) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" /></svg>,
  Moon: (props) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" /></svg>,
  Kanban: (props) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><path d="M8 7v7M16 7v4M12 7v10" /></svg>,
  Bell: (props) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></svg>,
  Command: (props) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M18 3a3 3 0 0 0-3 3v12a3 3 0 0 0 3 3 3 3 0 0 0 3-3 3 3 0 0 0-3-3H6a3 3 0 0 0-3 3 3 3 0 0 0 3 3 3 3 0 0 0 3-3V6a3 3 0 0 0-3-3 3 3 0 0 0-3 3 3 3 0 0 0 3 3h12a3 3 0 0 0 3-3 3 3 0 0 0-3-3z" /></svg>,
  Shield: (props) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>,
  Search: (props) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>,
  Home: (props) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>,
  Inbox: (props) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><polyline points="22 12 16 12 14 15 10 15 8 12 2 12" /><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" /></svg>,
  Activity: (props) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>,
  Github: (props) => <svg viewBox="0 0 24 24" fill="currentColor" {...props}><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/></svg>,
};

// --- Components ---

function FadeIn({ children, delay = 0, direction = 'up', className = '' }) {
  const [ref, inView] = useInView();
  
  const getTranslate = () => {
    if (direction === 'up') return 'translate-y-12';
    if (direction === 'down') return '-translate-y-12';
    if (direction === 'left') return 'translate-x-12';
    if (direction === 'right') return '-translate-x-12';
    return 'translate-y-0';
  };

  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={`transition-all duration-1000 ease-[cubic-bezier(0.16,1,0.3,1)] ${
        inView ? 'opacity-100 translate-y-0 translate-x-0 blur-0' : `opacity-0 blur-sm ${getTranslate()}`
      } ${className}`}
    >
      {children}
    </div>
  );
}

function GridBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
    </div>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#050505] text-white selection:bg-brand-500/30 font-sans overflow-x-hidden">
      
      {/* Navigation */}
      <nav className="fixed top-0 inset-x-0 z-50 bg-[#050505]/60 backdrop-blur-xl border-b border-white/[0.04] transition-all">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2 group cursor-pointer">
            <div className="w-7 h-7 rounded-lg bg-white flex items-center justify-center font-bold text-black text-xs shadow-[0_0_15px_rgba(255,255,255,0.2)] group-hover:shadow-[0_0_20px_rgba(255,255,255,0.4)] transition-all">
              <Icons.Kanban className="w-4 h-4" />
            </div>
            <span className="font-bold text-[15px] tracking-tight text-white/90 group-hover:text-white transition-colors">LabCo</span>
          </div>
          <div className="flex items-center gap-5">
            <Link to="/login" className="text-[13px] font-medium text-white/50 hover:text-white transition-colors">
              Log in
            </Link>
            <Link to="/register" className="text-[12px] font-semibold bg-white text-black px-4 py-1.5 rounded-full hover:bg-white/90 hover:scale-105 transition-all active:scale-95 shadow-[0_0_20px_rgba(255,255,255,0.15)] flex items-center gap-1.5">
              Sign Up <Icons.Lightning className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="pt-40 pb-20 px-6 max-w-7xl mx-auto relative flex flex-col items-center text-center z-10">
        <GridBackground />

        {/* Ambient Top Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-brand-500/20 blur-[150px] rounded-full pointer-events-none" />

        <FadeIn delay={100} className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.03] border border-white/[0.08] text-white/70 text-xs font-medium mb-8 backdrop-blur-md hover:bg-white/[0.08] hover:border-white/[0.15] transition-all cursor-pointer group shadow-xl">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-500"></span>
            </span>
            Introducing LabCo 2.0 
            <span className="text-white/30 group-hover:text-white group-hover:translate-x-0.5 transition-all">-&gt;</span>
          </div>
        </FadeIn>

        <FadeIn delay={200} className="relative z-10">
          <h1 className="text-6xl md:text-[80px] font-extrabold tracking-tighter max-w-4xl mx-auto leading-[1.05] mb-8 bg-clip-text text-transparent bg-gradient-to-b from-white to-white/50">
            Think, plan, and build. <br className="hidden md:block"/> All in one place.
          </h1>
        </FadeIn>
        
        <FadeIn delay={300} className="relative z-10">
          <p className="text-lg md:text-xl text-white/40 max-w-2xl mx-auto mb-10 leading-relaxed font-light tracking-wide">
            LabCo is the connected workspace where better, faster work happens. 
            Manage your kanban boards, collaborate in real-time, and ship products faster.
          </p>
        </FadeIn>

        <FadeIn delay={400} className="flex flex-col sm:flex-row items-center gap-4 w-full justify-center relative z-10">
          <Link to="/register" className="w-full sm:w-auto px-8 py-3.5 bg-white text-black font-semibold rounded-full transition-all shadow-[0_0_30px_rgba(255,255,255,0.15)] hover:shadow-[0_0_40px_rgba(255,255,255,0.3)] hover:scale-105 active:scale-95 flex items-center justify-center gap-2 text-sm">
            Start building for free
          </Link>
          <a href="#features" className="w-full sm:w-auto px-8 py-3.5 bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.08] text-white/80 font-medium rounded-full transition-all active:scale-95 flex items-center justify-center gap-2 text-sm">
            <Icons.Command className="w-4 h-4" /> Explore Features
          </a>
        </FadeIn>

        {/* Detailed Animated Mockup */}
        <FadeIn delay={600} direction="up" className="mt-32 w-full max-w-[1100px] relative perspective-[2000px] z-10">
          <div className="absolute -inset-1 bg-gradient-to-b from-brand-500/20 via-transparent to-transparent rounded-[2rem] blur-2xl opacity-50" />
          
          <div className="relative bg-[#0a0a0a] border border-white/[0.1] rounded-[2rem] shadow-[0_0_80px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col md:flex-row h-[650px] transform md:rotate-x-[2deg] md:scale-[0.98] hover:scale-100 hover:rotate-x-0 transition-all duration-1000 ease-[cubic-bezier(0.16,1,0.3,1)] ring-1 ring-white/[0.05]">
            
            {/* Vercel/Linear Style Top Bar Mock (Mac-like) */}
            <div className="absolute top-0 inset-x-0 h-10 border-b border-white/[0.05] bg-[#0a0a0a]/80 backdrop-blur flex items-center px-4 z-30 gap-2">
              <div className="w-3 h-3 rounded-full bg-white/10" />
              <div className="w-3 h-3 rounded-full bg-white/10" />
              <div className="w-3 h-3 rounded-full bg-white/10" />
              <div className="mx-auto w-48 h-5 bg-white/[0.03] rounded-md border border-white/[0.05] flex items-center justify-center">
                <div className="w-24 h-2 bg-white/20 rounded-sm" />
              </div>
            </div>

            {/* Sidebar Mock */}
            <div className="hidden md:flex flex-col w-64 bg-[#0a0a0a] border-r border-white/[0.05] pt-14 p-4 relative z-20">
              <div className="flex items-center gap-3 mb-8 px-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center shadow-lg shadow-brand-500/20 text-white">
                  <Icons.Kanban className="w-4 h-4" />
                </div>
                <div>
                  <div className="w-20 h-3 bg-white/80 rounded mb-1.5" />
                  <div className="w-12 h-2 bg-white/30 rounded" />
                </div>
              </div>

              <div className="space-y-1 mb-8">
                <div className="w-full h-8 bg-white/[0.04] rounded-md flex items-center px-3 gap-3 text-white">
                   <Icons.Home className="w-4 h-4 opacity-70" />
                   <div className="w-16 h-2.5 bg-white/70 rounded" />
                </div>
                <div className="w-full h-8 bg-transparent hover:bg-white/[0.02] rounded-md flex items-center px-3 gap-3 text-white/40">
                   <Icons.Inbox className="w-4 h-4" />
                   <div className="w-20 h-2.5 bg-white/30 rounded" />
                </div>
                <div className="w-full h-8 bg-transparent hover:bg-white/[0.02] rounded-md flex items-center px-3 gap-3 text-white/40">
                   <Icons.Activity className="w-4 h-4" />
                   <div className="w-14 h-2.5 bg-white/30 rounded" />
                </div>
              </div>

              <div className="px-3 mb-2">
                <div className="w-16 h-2 bg-white/20 rounded uppercase" />
              </div>
              <div className="space-y-1">
                {[1,2,3].map(i => (
                  <div key={i} className="w-full h-8 bg-transparent flex items-center px-3 gap-3 text-white/40">
                    <div className="w-2 h-2 rounded-full bg-brand-500/50" />
                    <div className="w-24 h-2.5 bg-white/20 rounded" />
                  </div>
                ))}
              </div>
            </div>

            {/* Main Content Mock */}
            <div className="flex-1 pt-14 p-8 flex flex-col bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white/[0.02] via-transparent to-transparent relative z-10">
              
              <div className="flex justify-between items-start mb-10">
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-48 h-8 bg-white/90 rounded-md" />
                    <div className="px-2 py-1 bg-brand-500/10 rounded border border-brand-500/20 text-brand-400 flex items-center gap-1">
                      <Icons.Lightning className="w-3 h-3" /> <div className="w-10 h-2 bg-brand-400/50 rounded" />
                    </div>
                  </div>
                  <div className="w-72 h-3 bg-white/30 rounded" />
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex -space-x-2">
                    {[1,2,3].map(i => (
                      <div key={i} className="w-8 h-8 rounded-full border-2 border-[#0a0a0a] bg-gradient-to-br from-gray-700 to-gray-900 shadow-sm relative z-10" />
                    ))}
                  </div>
                  <div className="w-8 h-8 rounded-md bg-white/[0.05] border border-white/[0.1] flex items-center justify-center">
                    <Icons.Search className="w-4 h-4 text-white/50" />
                  </div>
                </div>
              </div>

              {/* Kanban columns mock */}
              <div className="flex-1 flex gap-5 overflow-hidden pb-4">
                {/* Column 1 */}
                <div className="w-72 shrink-0 flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-4 bg-white/50 rounded" />
                      <div className="w-5 h-4 bg-white/10 rounded flex items-center justify-center text-[10px] text-white/50">3</div>
                    </div>
                  </div>
                  
                  {/* Card 1 */}
                  <div className="w-full bg-[#111111] border border-white/[0.08] rounded-xl p-4 hover:border-white/[0.2] transition-colors cursor-pointer group shadow-lg">
                    <div className="w-16 h-4 bg-rose-500/20 rounded mb-3 flex items-center px-1"><div className="w-8 h-2 bg-rose-500/50 rounded" /></div>
                    <div className="w-full h-3.5 bg-white/70 rounded mb-2" />
                    <div className="w-3/4 h-3.5 bg-white/70 rounded mb-5" />
                    <div className="flex justify-between items-center border-t border-white/[0.04] pt-3">
                      <div className="w-10 h-3 bg-white/20 rounded" />
                      <div className="w-5 h-5 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500" />
                    </div>
                  </div>

                  {/* Card 2 */}
                  <div className="w-full bg-[#111111] border border-white/[0.08] rounded-xl p-4 opacity-80">
                    <div className="w-full h-3.5 bg-white/60 rounded mb-2" />
                    <div className="w-1/2 h-3.5 bg-white/60 rounded" />
                  </div>
                </div>

                {/* Column 2 */}
                <div className="w-72 shrink-0 flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-amber-500" />
                      <div className="w-20 h-4 bg-white/50 rounded" />
                      <div className="w-5 h-4 bg-white/10 rounded flex items-center justify-center text-[10px] text-white/50">1</div>
                    </div>
                  </div>
                  
                  {/* Active/Glowing Card */}
                  <div className="w-full bg-[#161616] border border-brand-500/40 rounded-xl p-4 shadow-[0_0_30px_rgba(99,102,241,0.15)] relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-400 to-purple-500" />
                    <div className="w-16 h-4 bg-brand-500/20 rounded mb-3 mt-1 flex items-center px-1"><div className="w-10 h-2 bg-brand-400/60 rounded" /></div>
                    <div className="w-full h-4 bg-white rounded mb-2" />
                    <div className="w-4/5 h-4 bg-white rounded mb-5" />
                    
                    <div className="flex gap-2 mb-4">
                      <div className="w-12 h-1.5 bg-emerald-500/30 rounded overflow-hidden"><div className="w-1/2 h-full bg-emerald-500 rounded" /></div>
                    </div>

                    <div className="flex justify-between items-center pt-3 border-t border-white/[0.06]">
                      <div className="w-16 h-3 bg-white/30 rounded" />
                      <div className="flex -space-x-1">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 border-2 border-[#161616]" />
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-rose-400 to-orange-500 border-2 border-[#161616]" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Column 3 */}
                <div className="w-72 shrink-0 flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-emerald-500" />
                      <div className="w-20 h-4 bg-white/50 rounded" />
                      <div className="w-5 h-4 bg-white/10 rounded flex items-center justify-center text-[10px] text-white/50">2</div>
                    </div>
                  </div>
                  <div className="w-full bg-[#111111] border border-white/[0.04] rounded-xl p-4 opacity-50 border-dashed">
                    <div className="w-full h-3 bg-white/20 rounded mb-2" />
                    <div className="w-2/3 h-3 bg-white/20 rounded" />
                  </div>
                </div>
              </div>
            </div>

            {/* Fake Animated Cursor */}
            <div className="absolute top-1/2 left-1/3 w-6 h-6 z-50 pointer-events-none drop-shadow-2xl" 
                 style={{ animation: 'moveCursor 6s infinite cubic-bezier(0.25, 1, 0.5, 1)' }}>
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full text-white">
                <path d="M4 4L11.3857 21.2332C11.5367 21.5857 12.0294 21.6111 12.2173 21.2764L15.426 15.5564L21.3653 12.5852C21.7144 12.4106 21.7067 11.9056 21.3522 11.7417L4 4Z" fill="currentColor" stroke="black" strokeWidth="1.5" strokeLinejoin="round"/>
              </svg>
            </div>
            
            <style>{`
              @keyframes moveCursor {
                0% { transform: translate(0, 0); opacity: 0; }
                10% { opacity: 1; }
                20% { transform: translate(300px, -50px); }
                25% { transform: translate(300px, -50px) scale(0.9); }
                30% { transform: translate(300px, -50px) scale(1); }
                45% { transform: translate(150px, 120px); }
                70% { transform: translate(450px, 60px); }
                85% { opacity: 1; }
                100% { transform: translate(500px, 150px); opacity: 0; }
              }
            `}</style>
          </div>
        </FadeIn>
      </main>

      {/* Feature grid with Vercel/Linear vibes */}
      <section id="features" className="py-32 bg-[#050505] relative z-10 overflow-hidden border-t border-white/[0.04]">
        {/* Subtle background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-brand-500/5 blur-[200px] rounded-full pointer-events-none" />
        
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <FadeIn className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-white mb-6">Designed for velocity.</h2>
            <p className="text-lg text-white/40 max-w-2xl mx-auto leading-relaxed font-light tracking-wide">No clutter. Just powerful primitives designed to adapt to your team's workflow and scale with your ambition.</p>
          </FadeIn>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              { title: "Real-time Sync", desc: "Collaborate instantly. Changes push to all users in milliseconds without refreshing. See who is online.", icon: <Icons.Lightning className="w-5 h-5" /> },
              { title: "Dark Mode First", desc: "A gorgeous, high-contrast interface designed to reduce eye strain for late-night shipping and intense deep work.", icon: <Icons.Moon className="w-5 h-5" /> },
              { title: "Powerful Boards", desc: "Customize workflows with limitless kanban boards, covers, checklists, sub-tasks, and deep task assignments.", icon: <Icons.Kanban className="w-5 h-5" /> },
              { title: "Instant Notifications", desc: "Stay in the loop with a global notification system that alerts you when you're tagged or assigned a critical task.", icon: <Icons.Bell className="w-5 h-5" /> },
              { title: "Keyboard Shortcuts", desc: "Navigate the entire application without touching your mouse. Built for power users who want to move at the speed of thought.", icon: <Icons.Command className="w-5 h-5" /> },
              { title: "Enterprise Security", desc: "Bank-grade encryption for all your project data. Role-based access control ensures data stays in the right hands.", icon: <Icons.Shield className="w-5 h-5" /> }
            ].map((f, i) => (
              <FadeIn key={i} delay={i * 100} direction="up" className="h-full">
                <div className="relative group h-full rounded-2xl bg-[#0a0a0a] border border-white/[0.08] p-8 hover:bg-white/[0.02] transition-all duration-500 overflow-hidden flex flex-col">
                  {/* Subtle top inner glow on hover */}
                  <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-brand-500/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  
                  <div className="w-12 h-12 rounded-xl bg-white/[0.03] border border-white/[0.08] flex items-center justify-center mb-6 text-white/60 group-hover:bg-brand-500/10 group-hover:text-brand-400 group-hover:border-brand-500/30 group-hover:scale-110 transition-all duration-300 shadow-lg">
                    {f.icon}
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-3 tracking-tight">{f.title}</h3>
                  <p className="text-sm text-white/40 leading-relaxed font-light">{f.desc}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* Developer Integrations Section */}
      <section className="py-24 border-t border-white/[0.04] bg-[#050505] relative z-10 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <FadeIn>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.03] border border-white/[0.08] text-white/60 text-xs font-medium mb-6">
              <Icons.Github className="w-3.5 h-3.5" /> Built for Developers
            </div>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-white mb-6">Integrates with your stack</h2>
            <p className="text-white/40 mb-16 max-w-xl mx-auto font-light">Connect LabCo with the tools you already use. GitHub, Slack, Figma, and more.</p>
          </FadeIn>
          
          <FadeIn delay={200} className="relative h-40 max-w-3xl mx-auto">
            {/* Connecting lines */}
            <div className="absolute top-1/2 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/[0.15] to-transparent -translate-y-1/2" />
            
            {/* Floating Nodes */}
            <div className="absolute top-1/2 left-[10%] -translate-y-1/2 w-16 h-16 rounded-2xl bg-[#0a0a0a] border border-white/[0.08] flex items-center justify-center shadow-2xl z-10 hover:border-brand-500/50 hover:scale-110 transition-all cursor-pointer group">
              <Icons.Github className="w-8 h-8 text-white/50 group-hover:text-white transition-colors" />
            </div>
            
            <div className="absolute top-1/2 left-[30%] -translate-y-1/2 w-12 h-12 rounded-xl bg-[#0a0a0a] border border-white/[0.08] flex items-center justify-center shadow-2xl z-10 hover:border-brand-500/50 hover:scale-110 transition-all cursor-pointer text-white/50 hover:text-white font-bold text-xl">
              F
            </div>

            {/* Central Node */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 rounded-[2rem] bg-gradient-to-br from-brand-500 to-purple-600 p-[1px] shadow-[0_0_50px_rgba(99,102,241,0.3)] z-20">
              <div className="w-full h-full bg-[#050505] rounded-[2rem] flex items-center justify-center">
                <Icons.Kanban className="w-10 h-10 text-brand-400" />
              </div>
            </div>

            <div className="absolute top-1/2 right-[30%] -translate-y-1/2 w-12 h-12 rounded-xl bg-[#0a0a0a] border border-white/[0.08] flex items-center justify-center shadow-2xl z-10 hover:border-brand-500/50 hover:scale-110 transition-all cursor-pointer text-white/50 hover:text-white font-bold text-xl">
              S
            </div>

            <div className="absolute top-1/2 right-[10%] -translate-y-1/2 w-16 h-16 rounded-2xl bg-[#0a0a0a] border border-white/[0.08] flex items-center justify-center shadow-2xl z-10 hover:border-brand-500/50 hover:scale-110 transition-all cursor-pointer text-white/50 hover:text-white font-bold text-xl">
              <Icons.Activity className="w-8 h-8" />
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-32 border-t border-white/[0.04] bg-[#0a0a0a] relative overflow-hidden z-10">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-px bg-gradient-to-r from-transparent via-brand-500/50 to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-brand-900/20 via-[#0a0a0a] to-[#0a0a0a]" />
        
        <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
          <FadeIn>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-white mb-6">Ready to align your team?</h2>
            <p className="text-lg text-white/50 mb-10 max-w-2xl mx-auto font-light">Join thousands of engineers already using LabCo to manage their work and ship faster.</p>
            <Link to="/register" className="inline-flex px-8 py-4 bg-white text-black font-semibold rounded-full transition-all hover:bg-white/90 hover:scale-105 active:scale-95 shadow-[0_0_30px_rgba(255,255,255,0.2)] hover:shadow-[0_0_40px_rgba(255,255,255,0.3)] items-center gap-2 text-sm">
              Get Started for Free <span className="opacity-50">&rarr;</span>
            </Link>
          </FadeIn>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="py-12 border-t border-white/[0.04] bg-[#050505] text-center z-10 relative">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2 opacity-50 hover:opacity-100 transition-opacity cursor-pointer">
            <div className="w-6 h-6 rounded bg-white flex items-center justify-center font-bold text-black text-[10px]">
              <Icons.Kanban className="w-3 h-3" />
            </div>
            <span className="font-bold text-sm tracking-tight text-white">LabCo</span>
          </div>
          <p className="text-xs text-white/30">&copy; {new Date().getFullYear()} LabCo Inc. All rights reserved.</p>
          <div className="flex gap-6 text-xs text-white/40">
            <a href="#" className="hover:text-white transition-colors">Twitter</a>
            <a href="#" className="hover:text-white transition-colors">GitHub</a>
            <a href="#" className="hover:text-white transition-colors">Changelog</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
