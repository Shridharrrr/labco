import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import * as authService from '../../services/authService';
import useAuthStore from '../../store/authSlice';
import Spinner from '../ui/Spinner';

export default function LoginForm() {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
    <div className="min-h-screen flex items-center justify-center bg-[#0f0e17] px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center font-bold text-white text-lg shadow-lg shadow-brand-500/30">
              L
            </div>
            <span className="text-2xl font-bold text-white tracking-tight">LabCo</span>
          </div>
          <p className="text-white/50 text-sm">Sign in to your workspace</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white/5 border border-white/10 rounded-2xl p-8 shadow-2xl backdrop-blur-md"
        >
          <h1 className="text-xl font-semibold text-white mb-6">Welcome back</h1>

          {error && (
            <div className="mb-4 px-4 py-3 bg-red-500/15 border border-red-500/30 rounded-xl text-red-400 text-sm">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-white/60 mb-1.5">Email</label>
              <input
                id="login-email"
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="you@example.com"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5
                  text-white placeholder-white/25 text-sm outline-none
                  focus:border-brand-500 focus:ring-1 focus:ring-brand-500/50 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-white/60 mb-1.5">Password</label>
              <input
                id="login-password"
                type="password"
                required
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="••••••••"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5
                  text-white placeholder-white/25 text-sm outline-none
                  focus:border-brand-500 focus:ring-1 focus:ring-brand-500/50 transition-all"
              />
            </div>
          </div>

          <button
            id="login-submit"
            type="submit"
            disabled={loading}
            className="mt-6 w-full flex items-center justify-center gap-2 py-2.5
              bg-gradient-to-r from-brand-600 to-brand-500 text-white font-semibold
              rounded-xl hover:from-brand-500 hover:to-brand-400 transition-all
              shadow-lg shadow-brand-500/25 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? <Spinner size="sm" /> : 'Sign in'}
          </button>

          <p className="mt-5 text-center text-sm text-white/40">
            No account?{' '}
            <Link to="/register" className="text-brand-400 hover:text-brand-300 font-medium transition-colors">
              Create one
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
