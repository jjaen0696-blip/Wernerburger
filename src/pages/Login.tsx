import { useState, type FormEvent } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface LoginProps {
  onSuccess?: () => void;
  onBack?: () => void;
}

export default function Login({ onSuccess, onBack }: LoginProps) {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await signIn(email.trim(), password);
    setLoading(false);
    if (res.error) {
      setError(res.error.message || 'Credenciales inválidas');
      return;
    }
    if (onSuccess) onSuccess();
  };

  return (
    <div className="min-h-screen bg-slate-950">
      <div className="relative min-h-screen flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800" />
        <div className="relative w-full max-w-md overflow-hidden rounded-[2rem] border border-white/10 bg-slate-900/95 p-8 shadow-[0_40px_120px_-40px_rgba(15,23,42,0.9)] backdrop-blur-xl">
          <div className="mb-8">
            <span className="inline-flex rounded-full bg-amber-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-amber-200">
              Acceso seguro
            </span>
            <h2 className="mt-6 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              Panel administrativo
            </h2>
            <p className="mt-3 text-sm leading-7 text-slate-300">
              Ingresa con tu cuenta administrativa para gestionar pedidos, inventario y notificaciones desde un espacio seguro y con estilo profesional.
            </p>
          </div>
          <button
            type="button"
            onClick={onBack}
            className="mb-6 inline-flex rounded-full border border-slate-700 bg-slate-950/90 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:bg-slate-800"
          >
            Volver al inicio
          </button>
          <form onSubmit={handleSubmit} className="space-y-5">
            <label className="block text-sm font-medium text-slate-300">
              Correo electrónico
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                required
                className="mt-3 w-full rounded-[1.25rem] border border-white/10 bg-slate-950/90 px-4 py-3 text-white outline-none transition focus:border-amber-400/80 focus:ring-2 focus:ring-amber-400/20"
              />
            </label>
            <label className="block text-sm font-medium text-slate-300">
              Contraseña
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type="password"
                required
                className="mt-3 w-full rounded-[1.25rem] border border-white/10 bg-slate-950/90 px-4 py-3 text-white outline-none transition focus:border-amber-400/80 focus:ring-2 focus:ring-amber-400/20"
              />
            </label>
            {error && <div className="rounded-2xl border border-rose-400/10 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">{error}</div>}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-[1.5rem] bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500 px-5 py-3 text-base font-black uppercase tracking-[0.12em] text-slate-950 shadow-[0_20px_50px_-20px_rgba(249,115,22,0.75)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? 'Verificando...' : 'Ingresar ahora'}
            </button>
          </form>
          <p className="mt-6 text-center text-xs text-slate-500">Acceso exclusivo para personal autorizado. No compartas tus credenciales.</p>
        </div>
      </div>
    </div>
  );
}
