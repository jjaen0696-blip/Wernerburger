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
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 opacity-95" />
        <div className="relative w-full max-w-6xl overflow-hidden rounded-[2rem] border border-white/10 bg-slate-950/80 shadow-2xl shadow-slate-950/40 backdrop-blur-xl">
          <div className="absolute -left-16 top-12 h-48 w-48 rounded-full bg-amber-400/10 blur-3xl" />
          <div className="absolute -right-16 bottom-12 h-64 w-64 rounded-full bg-violet-500/10 blur-3xl" />
          <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="relative flex flex-col justify-center px-8 py-12 sm:px-12 sm:py-16 lg:px-14 lg:py-20">
              <div className="rounded-[1.75rem] border border-white/10 bg-slate-950/80 p-8 shadow-[0_30px_80px_-40px_rgba(15,23,42,0.9)] backdrop-blur-xl">
                <span className="inline-flex rounded-full bg-amber-400/10 px-3 py-1 text-sm font-semibold uppercase tracking-[0.24em] text-amber-300">
                  Acceso seguro
                </span>
                <h2 className="mt-6 text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                  Panel administrativo
                </h2>
                <p className="mt-4 max-w-xl text-sm leading-7 text-slate-300 sm:text-base">
                  Ingresa con tu cuenta administrativa para gestionar pedidos, inventario y notificaciones desde un espacio seguro y con estilo profesional.
                </p>
                <div className="mt-8 grid gap-4 text-sm text-slate-400">
                  <div className="rounded-3xl bg-white/5 p-4">
                    <p className="font-semibold text-white">Diseño profesional</p>
                    <p className="mt-1 text-slate-400">Tarjeta amplia, contrastes suaves y un bloque destacado para foco visual.</p>
                  </div>
                  <div className="rounded-3xl bg-white/5 p-4">
                    <p className="font-semibold text-white">Fondo degradado</p>
                    <p className="mt-1 text-slate-400">Un degradado oscuro con destellos cálidos realza el ingreso sin saturar la pantalla.</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="relative flex items-center px-8 py-12 sm:px-12 sm:py-16 lg:px-14 lg:py-20">
              <div className="w-full rounded-[1.75rem] border border-white/10 bg-slate-900/95 p-8 shadow-2xl shadow-slate-950/40">
                <div className="mb-8 flex items-center justify-between gap-4">
                  <button
                    type="button"
                    onClick={onBack}
                    className="rounded-full border border-slate-700 bg-slate-900/95 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:bg-slate-800"
                  >
                    Volver al inicio
                  </button>
                  <div>
                    <p className="text-xs uppercase tracking-[0.28em] text-amber-300/90">Inicio de sesión</p>
                    <h3 className="mt-3 text-3xl font-semibold text-white">Accede a tu cuenta</h3>
                    <p className="mt-3 text-sm text-slate-400">Utiliza el e-mail y la contraseña de tu usuario administrativo.</p>
                  </div>
                </div>
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
        </div>
      </div>
    </div>
  );
}
