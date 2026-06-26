import { useState } from 'react';
import { ArrowLeft, Loader2, LogIn } from 'lucide-react';
import WernerLogo from '../components/WernerLogo';
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
    <div className="min-h-screen bg-[#c8102e] flex items-center justify-center px-4 sm:px-6 py-8">
      <div className="max-w-sm w-full">
        <div className="flex justify-center mb-8">
          <WernerLogo size="lg" />
        </div>

        <div className="bg-black/20 rounded-2xl border-2 border-yellow-400/40 p-8 sm:p-8">
          <div className="text-center mb-6">
            <div className="w-20 h-20 sm:w-16 sm:h-16 rounded-full bg-yellow-400/10 border border-yellow-400/30 flex items-center justify-center mx-auto mb-4">
              <LogIn className="w-10 h-10 sm:w-8 sm:h-8 text-yellow-400" />
            </div>
            <h1
              className="text-3xl sm:text-2xl font-black text-white uppercase mb-2"
              style={{
                fontFamily: "'Arial Black', 'Impact', sans-serif",
                textShadow: '2px 2px 0 #000',
              }}
            >
              Acceso Personal
            </h1>
            <p className="text-base sm:text-sm text-white/60">
              Inicia sesión para acceder al panel de cocina
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-base sm:text-sm font-bold text-white mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="personal@wernerburguer.com"
                required
                autoComplete="email"
                className="w-full px-4 py-4 sm:py-3 rounded-xl bg-black/30 border-2 border-yellow-400/40 text-white placeholder-white/30 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20 outline-none transition-all text-base min-h-[48px] sm:min-h-auto"
              />
            </div>
            <div>
              <label className="block text-base sm:text-sm font-bold text-white mb-2">
                Contraseña
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="current-password"
                className="w-full px-4 py-4 sm:py-3 rounded-xl bg-black/30 border-2 border-yellow-400/40 text-white placeholder-white/30 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20 outline-none transition-all text-base min-h-[48px] sm:min-h-auto"
              />
            </div>

            {error && (
              <p className="text-base sm:text-sm text-red-200 font-bold text-center bg-red-500/20 border border-red-400/40 rounded-xl px-4 py-3">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-4 rounded-xl bg-yellow-400 text-black font-black uppercase hover:bg-yellow-300 transition-all active:scale-95 disabled:opacity-60 disabled:active:scale-100 text-base min-h-[48px]"
            >
              {loading ? (
                <Loader2 className="w-6 h-6 sm:w-5 sm:h-5 animate-spin" />
              ) : (
                <>
                  <LogIn className="w-6 h-6 sm:w-5 sm:h-5" />
                  Entrar
                </>
              )}
            </button>
          </form>

          <button
            onClick={onBack}
            className="w-full flex items-center justify-center gap-2 mt-4 py-3 text-base sm:text-sm text-white/60 hover:text-white transition-colors font-bold"
          >
            <ArrowLeft className="w-5 h-5 sm:w-4 sm:h-4" />
            Volver al inicio
          </button>
        </div>
      </div>
    </div>
  );
}
