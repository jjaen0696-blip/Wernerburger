import { useState, type FormEvent } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface LoginProps {
  onSuccess?: () => void;
  onBack?: () => void;
}

export default function Login({ onSuccess, onBack }: LoginProps) {
  const { signIn } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await signIn(username.trim(), password);
    setLoading(false);
    if (res.error) {
      setError(res.error.message || 'Credenciales inválidas');
      return;
    }
    if (onSuccess) onSuccess();
  };

  return (
    <div className="min-h-screen bg-[#130202]">
      <div className="relative min-h-screen flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        <div className="absolute inset-0 bg-gradient-to-br from-[#130202] via-[#330a0a] to-[#170606]" />
        <div className="relative w-full max-w-md overflow-hidden rounded-[2rem] border border-[#5b110d]/20 bg-[#1b0b0b]/95 p-8 shadow-[0_40px_120px_-40px_rgba(15,10,10,0.95)] backdrop-blur-xl">
          <button
            type="button"
            onClick={onBack}
            className="absolute right-5 top-5 inline-flex h-11 w-11 items-center justify-center rounded-full border border-[#4f0e0b] bg-[#160606]/90 text-[#e9dcc6] transition hover:bg-[#2d0c0c]"
            aria-label="Volver al inicio"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
              <path d="M3.75 11.25 12 3.75l8.25 7.5v8.25a.75.75 0 0 1-.75.75h-4.5v-5.25a.75.75 0 0 0-.75-.75h-3a.75.75 0 0 0-.75.75V21H4.5a.75.75 0 0 1-.75-.75V11.25Zm4.5 8.25h3V13.5h3.75v6h3V11.25L12 5.25 8.25 11.25v8.25Z" />
            </svg>
          </button>
          <div className="mb-8">
            <span className="inline-flex rounded-full bg-[#9c7218]/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-[#e3b961]">
              Acceso seguro
            </span>
            <h2 className="mt-6 text-3xl font-semibold tracking-tight text-[#f8e6c1] sm:text-4xl">
              Panel administrativo
            </h2>
            <p className="mt-3 text-sm leading-7 text-[#d3b88a]">
              Ingresa con tu cuenta administrativa para gestionar pedidos, inventario y notificaciones desde un espacio seguro y con estilo profesional.
            </p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-5">
            <label className="block text-sm font-medium text-[#d8c49a]">
              Usuario
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                type="text"
                required
                className="mt-3 w-full rounded-[1.25rem] border border-[#5f120f]/20 bg-[#180909]/90 px-4 py-3 text-[#f4e7cd] outline-none transition focus:border-[#c09225]/80 focus:ring-2 focus:ring-[#c09225]/20"
              />
            </label>
            <label className="block text-sm font-medium text-[#d8c49a]">
              Contraseña
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type="password"
                required
                className="mt-3 w-full rounded-[1.25rem] border border-[#5f120f]/20 bg-[#180909]/90 px-4 py-3 text-[#f4e7cd] outline-none transition focus:border-[#c09225]/80 focus:ring-2 focus:ring-[#c09225]/20"
              />
            </label>
            {error && <div className="rounded-2xl border border-[#c04a4a]/20 bg-[#7a1919]/15 px-4 py-3 text-sm text-[#f8d4cf]">{error}</div>}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-[1.5rem] bg-gradient-to-r from-[#b88614] via-[#7f4c07] to-[#4f1d0d] px-5 py-3 text-base font-black uppercase tracking-[0.12em] text-[#120202] shadow-[0_20px_50px_-20px_rgba(184,134,20,0.75)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? 'Verificando...' : 'Ingresar ahora'}
            </button>
          </form>
          <p className="mt-6 text-center text-xs text-[#bda67d]">Acceso exclusivo para personal autorizado. No compartas tus credenciales.</p>
        </div>
      </div>
    </div>
  );
}
