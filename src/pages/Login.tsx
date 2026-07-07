import { useState, type FormEvent } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface LoginProps { onSuccess?: () => void; }

export default function Login({ onSuccess }: LoginProps) {
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
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl bg-[#080706]/95 p-6 border border-amber-400/10 shadow-lg">
        <h2 className="text-2xl font-black text-white mb-2">Ingreso Administrativo</h2>
        <p className="text-sm text-gray-300 mb-4">Accede con tu cuenta administrativa</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block text-sm text-gray-300">Correo
            <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required className="mt-2 w-full rounded-2xl border border-white/10 bg-black/40 px-3 py-2 text-white" />
          </label>
          <label className="block text-sm text-gray-300">Contraseña
            <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" required className="mt-2 w-full rounded-2xl border border-white/10 bg-black/40 px-3 py-2 text-white" />
          </label>
          {error && <div className="text-sm text-rose-400">{error}</div>}
          <div className="flex items-center justify-between">
            <button type="submit" disabled={loading} className="rounded-full bg-amber-500 px-4 py-2 font-black text-stone-900">{loading ? 'Entrando...' : 'Ingresar'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
