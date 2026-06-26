import { useState } from 'react';
import { ArrowLeft, Loader2, LogIn, Lock } from 'lucide-react';
import { supabase } from '../lib/supabase';

type Props = {
  onUnlock: () => void;
  onBack: () => void;
};

export default function KitchenLock({ onUnlock, onBack }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError('Credenciales incorrectas. Verifica tu email y contraseña.');
      setLoading(false);
      return;
    }

    onUnlock();
  };

  return (
    <div className="min-h-screen bg-premium flex items-center justify-center px-4 sm:px-6 py-8 text-white">
      <div className="max-w-sm w-full animate-fade-up">
        <div className="flex justify-center mb-7">
          <img
            src="/image.png"
            alt="WernerBurguer logo"
            className="w-20 h-20 rounded-full border-2 border-gold/60 object-cover shadow-glow-gold"
          />
        </div>

        <div className="glass-strong rounded-[28px] p-8 shadow-card">
          <div className="text-center mb-7">
            <div className="w-16 h-16 rounded-2xl bg-gold/10 border border-gold/25 flex items-center justify-center mx-auto mb-4">
              <Lock className="h-7 w-7 text-gold" />
            </div>
            <h1 className="font-display text-2xl font-extrabold text-white uppercase tracking-tight mb-1.5">
              Acceso personal
            </h1>
            <p className="text-sm text-white/50">Inicia sesión para acceder al panel</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-white/80 mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Correo"
                required
                autoComplete="email"
                className="w-full rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-3.5 text-[15px] text-white placeholder-white/30 outline-none transition-all focus:border-gold/50 focus:ring-2 focus:ring-gold/15 min-h-[48px]"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-white/80 mb-2">Contraseña</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder=""
                required
                autoComplete="current-password"
                className="w-full rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-3.5 text-[15px] text-white placeholder-white/30 outline-none transition-all focus:border-gold/50 focus:ring-2 focus:ring-gold/15 min-h-[48px]"
              />
            </div>

            {error && (
              <p className="text-sm text-red-200 font-semibold text-center rounded-2xl border border-brand-light/40 bg-brand/15 px-4 py-3">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 rounded-2xl bg-yellow-cta py-4 text-ink font-extrabold uppercase tracking-wide shadow-glow-gold transition-all hover:brightness-105 active:scale-95 disabled:opacity-60 disabled:active:scale-100 min-h-[50px]"
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  <LogIn className="h-5 w-5" />
                  Entrar
                </>
              )}
            </button>
          </form>

          <button
            onClick={onBack}
            className="w-full flex items-center justify-center gap-2 mt-4 py-3 text-sm text-white/55 hover:text-white transition-colors font-semibold"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver al inicio
          </button>
        </div>
      </div>
    </div>
  );
}
