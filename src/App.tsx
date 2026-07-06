import { useState } from 'react';
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

function App() {
  const [page, setPage] = useState<Page>('home');
  const [loginOpen, setLoginOpen] = useState(false);
  const [loginName, setLoginName] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [user, setUser] = useState<{ username: string } | null>(null);

  const navigate = (p: Page) => {
    setPage(p);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLoginSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const validUser = loginName.trim() === 'Fisura' && loginPassword === 'Josecod10';
    if (!validUser) {
      alert('Usuario o contraseña incorrectos. Usa Fisura / Josecod10');
      return;
    }

    setUser({ username: 'Fisura' });
    setLoginOpen(false);
    setLoginName('');
    setLoginPassword('');
    setPage('dashboard');
  };

  return (
    <CartProvider>
      <div className="min-h-screen bg-transparent font-sans antialiased text-white">
        {page === 'home' && (
          <button
            type="button"
            onClick={() => setLoginOpen(true)}
            className="fire-action-button fixed top-5 right-5 z-[70] rounded-full px-5 py-3 text-[12px] font-black uppercase tracking-[0.3em] text-stone-950 transition duration-300 hover:-translate-y-0.5 shadow-[0_10px_30px_rgba(0,0,0,0.35)]"
          >
            Login
          </button>
        )}

        {loginOpen && (
          <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/80 p-4">
            <div className="w-full max-w-md rounded-[2rem] border border-amber-400/20 bg-[#080706]/95 p-6 shadow-[0_30px_80px_rgba(0,0,0,0.65)] backdrop-blur-xl">
              <div className="flex items-center justify-between mb-6">
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
            : page === 'admin' ? <Admin />
            : page === 'dashboard' ? <Dashboard />
            : <POS />}
        </main>
        {(page === 'home' || page === 'menu') && <Footer />}
      </div>
    </CartProvider>
  );
}

export default App;
