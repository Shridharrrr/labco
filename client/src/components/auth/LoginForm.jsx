import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import * as authService from '../../services/authService';
import useAuthStore from '../../store/authSlice';
import Spinner from '../ui/Spinner';

// Premium Inline SVG Icons
const ZapIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
  </svg>
);

const UsersIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const ChartIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <line x1="18" y1="20" x2="18" y2="10" />
    <line x1="12" y1="20" x2="12" y2="4" />
    <line x1="6" y1="20" x2="6" y2="14" />
  </svg>
);

const MailIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <rect width="20" height="16" x="2" y="4" rx="2" />
    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
  </svg>
);

const LockIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

const EyeIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const EyeOffIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
    <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
    <path d="M6.61 6.61A13.52 13.52 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
    <line x1="2" y1="2" x2="22" y2="22" />
  </svg>
);

export default function LoginForm() {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await authService.login(form);
      setAuth({ user: data.user, accessToken: data.accessToken });
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-[#09090b] relative overflow-hidden">
      {/* Background Grids & Glows */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff01_1px,transparent_1px),linear-gradient(to_bottom,#ffffff01_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Left - Branding Panel */}
      <div className="hidden lg:flex w-[480px] flex-col justify-between p-10 pr-16
        bg-gradient-to-br from-[#0c0c0f] to-[#121217] border-r border-white/[0.04] relative overflow-hidden shrink-0">
        
        {/* Subtle branding background grid */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff02_1px,transparent_1px),linear-gradient(to_bottom,#ffffff02_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none" />
        
        {/* Decorative sloped divider */}
        <div className="absolute top-0 right-0 bottom-0 w-24 bg-[#09090b] translate-x-12 -skew-x-[6deg] origin-top-right border-l border-white/[0.08] pointer-events-none" />
        {/* Sloped border glow line */}
        <div className="absolute top-0 right-0 bottom-0 w-[1px] bg-gradient-to-b from-brand-500/0 via-brand-500/25 to-brand-500/0 translate-x-[36px] -skew-x-[6deg] origin-top pointer-events-none" />

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-black border border-white/[0.08] flex items-center justify-center font-bold text-white text-sm">
            L
          </div>
          <span className="text-xl font-bold text-white tracking-tight">LabCo</span>
        </div>

        {/* Feature highlights */}
        <div className="relative z-10 space-y-8">
          <div>
            <h2 className="text-[28px] font-bold text-white leading-tight">
              Manage boards<br />with clarity.
            </h2>
            <p className="text-white/40 text-sm mt-3 leading-relaxed max-w-xs">
              Kanban boards, real-time collaboration, and task tracking. Built for teams that ship fast.
            </p>
          </div>

          <div className="space-y-4">
            {[
              {
                icon: <ZapIcon className="w-5 h-5 text-brand-400" />,
                title: 'Real-time board sync',
                desc: 'Instant updates across all users and columns.'
              },
              {
                icon: <UsersIcon className="w-5 h-5 text-brand-400" />,
                title: 'Team collaboration',
                desc: 'Invite colleagues, comment on tasks, and delegate.'
              },
              {
                icon: <ChartIcon className="w-5 h-5 text-brand-400" />,
                title: 'Task analytics & timelines',
                desc: 'Visualize progress with timelines and statistics.'
              },
            ].map((f, i) => (
              <div key={i} className="flex gap-4 items-start text-sm">
                <div className="w-10 h-10 rounded-lg bg-white/[0.03] border border-white/[0.06] flex items-center justify-center shrink-0 shadow-inner">
                  {f.icon}
                </div>
                <div className="space-y-1">
                  <h4 className="font-semibold text-white/80">{f.title}</h4>
                  <p className="text-xs text-white/40 leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="relative z-10 text-[11px] text-white/20">© 2026 LabCo. All rights reserved.</p>
      </div>

      {/* Right - Login Form */}
      <div className="flex-1 flex items-center justify-center px-6 relative z-10">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="inline-flex items-center gap-2.5 mb-3">
              <div className="w-9 h-9 rounded-lg bg-black border border-white/[0.08] flex items-center justify-center font-bold text-white text-sm">
                L
              </div>
              <span className="text-xl font-bold text-white tracking-tight">LabCo</span>
            </div>
          </div>

          <div className="mb-8">
            <h1 className="text-2xl font-bold text-white bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">Welcome back</h1>
            <p className="text-white/40 text-sm mt-1.5 font-medium">Sign in to your workspace</p>
          </div>

          {error && (
            <div className="mb-5 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm flex items-center gap-2">
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-[13px] font-medium text-white/60 mb-2">Email</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-white/30">
                  <MailIcon className="w-4 h-4" />
                </div>
                <input
                  id="login-email"
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="you@example.com"
                  className="w-full bg-white/[0.02] border border-white/[0.08] hover:border-white/[0.12] rounded-lg pl-10 pr-4 py-2.5
                    text-white placeholder-white/20 text-sm outline-none focus:bg-white/[0.04]
                    focus:border-brand-500 focus:ring-1 focus:ring-brand-500/30 transition-all duration-200"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-[13px] font-medium text-white/60 mb-2">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-white/30">
                  <LockIcon className="w-4 h-4" />
                </div>
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="••••••••"
                  className="w-full bg-white/[0.02] border border-white/[0.08] hover:border-white/[0.12] rounded-lg pl-10 pr-10 py-2.5
                    text-white placeholder-white/20 text-sm outline-none focus:bg-white/[0.04]
                    focus:border-brand-500 focus:ring-1 focus:ring-brand-500/30 transition-all duration-200"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-white/35 hover:text-white/60 focus:outline-none"
                >
                  {showPassword ? <EyeOffIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              id="login-submit"
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2.5 mt-2
                bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm rounded-lg
                transition-all duration-150 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? <Spinner size="sm" /> : 'Sign in'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-white/35 font-medium">
            No account?{' '}
            <Link to="/register" className="text-brand-400 hover:text-brand-300 font-semibold transition-colors">
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
