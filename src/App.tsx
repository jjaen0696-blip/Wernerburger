import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { CartProvider } from './context/CartContext';
import Footer from './components/Footer';
import Home from './pages/Home';
import Menu from './pages/Menu';
import Kitchen from './pages/Kitchen';
import Delivery from './pages/Delivery';
import Admin from './pages/Admin';
import POS from './pages/POS';
import Dashboard from './pages/Dashboard';

type Page = 'home' | 'menu' | 'kitchen' | 'delivery' | 'admin' | 'pos' | 'dashboard';
type UserRole = 'admin' | 'manager' | 'kitchen' | 'delivery';
type UserSession = { id?: string; username: string; branch_id?: string | null; role?: UserRole };

const API_BASE = import.meta.env.VITE_API_BASE || (typeof window !== 'undefined' && window.location.hostname === 'localhost' ? 'http://127.0.0.1:5174' : 'https://wernerburger.onrender.com');
const api = (path: string) => `${API_BASE}${path}`;

function App() {
  const [page, setPage] = useState<Page>('home');
  const [loginOpen, setLoginOpen] = useState(false);
  const [loginName, setLoginName] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [user, setUser] = useState<UserSession | null>(() => {
    if (typeof window === 'undefined') return null;
    try {
      return JSON.parse(localStorage.getItem('werner-user') || 'null');
    } catch {
      return null;
    }
  });

  const getPageForRole = (role?: UserRole) => {
    switch (role) {
      case 'manager':
        return 'pos' as Page;
      case 'kitchen':
        return 'kitchen' as Page;
      case 'delivery':
        return 'delivery' as Page;
      case 'admin':
      default:
        // show inventory panel first for admins to prioritize stock control
        return 'dashboard' as Page;
    }
  };

  useEffect(() => {
    if (user) {
      localStorage.setItem('werner-user', JSON.stringify(user));
      if (user.branch_id) localStorage.setItem('werner-branch', user.branch_id);
      setPage(getPageForRole(user.role));
    } else {
      localStorage.removeItem('werner-user');
      localStorage.removeItem('werner-branch');
    }
  }, [user]);

  const navigate = (p: Page) => {
    setPage(p);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLoginSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      const response = await fetch(api('/login'), {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ username: loginName.trim(), password: loginPassword }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Usuario o contraseña incorrectos');

      setUser({ id: data.id, username: data.username, branch_id: data.branch_id || null, role: data.role || 'admin' });
      setLoginOpen(false);
      setLoginName('');
      setLoginPassword('');
      setPage(getPageForRole(data.role || 'admin'));
    } catch (error: any) {
      alert(error.message || 'No se pudo iniciar sesión');
    }
  };

  return (
    <CartProvider>
      <div className="min-h-screen bg-transparent font-sans antialiased text-white">
        {/* Botón Login fijo renderizado como portal en document.body para garantizar position:fixed estable */}
        {typeof document !== 'undefined' && !user && createPortal(
          <button
            type="button"
            onClick={() => setLoginOpen(true)}
            aria-label="Abrir login"
            className="fixed top-4 right-4 z-[9999] flex items-center gap-2 rounded-full bg-amber-500/95 px-3 py-2 text-sm font-black text-stone-950 shadow-lg"
          >
            Login
          </button>,
          document.body
        )}

        {user && (
          <div className="fixed top-5 right-5 z-[70] flex items-center gap-3">
            <span className="rounded-full border border-amber-400/20 bg-amber-400/10 px-3 py-1 text-sm text-amber-100">{user.username}</span>
            <button
              type="button"
              onClick={() => { setUser(null); setPage('home'); setLoginOpen(false); }}
              className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm text-white transition hover:bg-white/10"
            >
              Logout
            </button>
          </div>
        )}

        {loginOpen && (
          <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/80 p-4">
            <div className="w-full max-w-md rounded-[2rem] border border-amber-400/20 bg-[#080706]/95 p-6 shadow-[0_30px_80px_rgba(0,0,0,0.65)] backdrop-blur-xl">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <p className="text-sm uppercase tracking-[0.35em] text-amber-300/80">Bienvenido</p>
                  <h2 className="text-2xl font-black text-white">Inicia sesión</h2>
                </div>
                <button
                  type="button"
                  onClick={() => setLoginOpen(false)}
                  className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm text-white transition hover:bg-white/10"
                >
                  Cerrar
                </button>
              </div>
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <label className="block text-sm text-gray-300">
                  Usuario
                  <input
                    value={loginName}
                    onChange={(e) => setLoginName(e.target.value)}
                    type="text"
                    required
                    placeholder="Tu usuario"
                    className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition focus:border-amber-400/60 focus:bg-white/10"
                  />
                </label>
                <label className="block text-sm text-gray-300">
                  Contraseña
                  <input
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    type="password"
                    required
                    placeholder="******"
                    className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition focus:border-amber-400/60 focus:bg-white/10"
                  />
                </label>
                <button
                  type="submit"
                  className="w-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-3 text-sm font-black text-stone-950 transition hover:brightness-110"
                >
                  Entrar
                </button>
              </form>
            </div>
          </div>
        )}

        <main className="relative overflow-x-hidden">
          {page === 'home' ? <Home onNavigate={navigate} />
            : page === 'menu' ? <Menu />
            : page === 'kitchen' ? <Kitchen onNavigate={navigate} />
            : page === 'delivery' ? <Delivery />
            : page === 'admin' ? <Admin currentUser={user} />
            : page === 'dashboard' ? <Dashboard currentUser={user} />
            : <POS currentUser={user} />}
        </main>
        {(page === 'home' || page === 'menu') && <Footer />}
      </div>
    </CartProvider>
  );
}

export default App;
