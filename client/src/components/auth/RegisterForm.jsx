import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import * as authService from '../../services/authService';
import useAuthStore from '../../store/authSlice';
import Spinner from '../ui/Spinner';

export default function RegisterForm() {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await authService.register(form);
      setAuth({ user: data.user, accessToken: data.accessToken });
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-[#09090b]">
      {/* Left — Branding Panel */}
      <div className="hidden lg:flex w-[480px] flex-col justify-between p-10
        bg-gradient-to-br from-[#0f0f12] to-[#111114] border-r border-white/[0.06] relative overflow-hidden">
        {/* Background glow */}
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-brand-600/8 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-brand-500/5 rounded-full blur-3xl" />
        
        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-brand-600 flex items-center justify-center font-bold text-white text-sm">
            L
          </div>
          <span className="text-xl font-bold text-white tracking-tight">LabCo</span>
        </div>

        {/* Feature highlights */}
        <div className="relative z-10 space-y-8">
          <div>
            <h2 className="text-[28px] font-bold text-white leading-tight">
              Start building<br />your workspace.
            </h2>
            <p className="text-white/40 text-sm mt-3 leading-relaxed max-w-xs">
              Free to start. Create boards, invite your team, and ship together in real-time.
            </p>
          </div>

          <div className="space-y-3">
            {[
              { icon: '🚀', text: 'Get started in seconds' },
              { icon: '🔒', text: 'Secure by default' },
              { icon: '♾️', text: 'Unlimited boards & members' },
            ].map((f) => (
              <div key={f.text} className="flex items-center gap-3 text-sm text-white/50">
                <div className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-base">
                  {f.icon}
                </div>
                {f.text}
              </div>
            ))}
          </div>
        </div>

        <p className="relative z-10 text-[11px] text-white/20">© 2026 LabCo. All rights reserved.</p>
      </div>

      {/* Right — Register Form */}
      <div className="flex-1 flex items-center justify-center px-6">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="inline-flex items-center gap-2.5 mb-3">
              <div className="w-9 h-9 rounded-lg bg-brand-600 flex items-center justify-center font-bold text-white text-sm">
                L
              </div>
              <span className="text-xl font-bold text-white tracking-tight">LabCo</span>
            </div>
          </div>

          <div className="mb-8">
            <h1 className="text-2xl font-bold text-white">Create account</h1>
            <p className="text-white/40 text-sm mt-1.5">Create your free workspace</p>
          </div>

          {error && (
            <div className="mb-5 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm flex items-center gap-2">
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-[13px] font-medium text-white/60 mb-2">Name</label>
              <input
                id="register-name"
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Your name"
                className="w-full bg-[#111114] border border-white/[0.10] rounded-lg px-4 py-2.5
                  text-white placeholder-white/20 text-sm outline-none
                  focus:border-brand-500 focus:ring-1 focus:ring-brand-500/30 transition-all"
              />
            </div>
            <div>
              <label className="block text-[13px] font-medium text-white/60 mb-2">Email</label>
              <input
                id="register-email"
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="you@example.com"
                className="w-full bg-[#111114] border border-white/[0.10] rounded-lg px-4 py-2.5
                  text-white placeholder-white/20 text-sm outline-none
                  focus:border-brand-500 focus:ring-1 focus:ring-brand-500/30 transition-all"
              />
            </div>
            <div>
              <label className="block text-[13px] font-medium text-white/60 mb-2">Password</label>
              <input
                id="register-password"
                type="password"
                required
                minLength={6}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="Min. 6 characters"
                className="w-full bg-[#111114] border border-white/[0.10] rounded-lg px-4 py-2.5
                  text-white placeholder-white/20 text-sm outline-none
                  focus:border-brand-500 focus:ring-1 focus:ring-brand-500/30 transition-all"
              />
            </div>

            <button
              id="register-submit"
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2.5 mt-1
                bg-brand-600 hover:bg-brand-500 text-white font-semibold text-sm
                rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? <Spinner size="sm" /> : 'Create account'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-white/35">
            Already have an account?{' '}
            <Link to="/login" className="text-brand-400 hover:text-brand-300 font-medium transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
