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

const API_BASE = import.meta.env.VITE_API_BASE || (typeof window !== 'undefined' && window.location.hostname === 'localhost' ? 'http://127.0.0.1:5174' : 'https://wernerburger.onrender.com');
const api = (path: string) => `${API_BASE}${path}`;

function App() {
  const [page, setPage] = useState<Page>('home');
  const [user, setUser] = useState(null);

  const navigate = (p: Page) => {
    setPage(p);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // login removed: no client-side auth in this build

  const heroMount = typeof document !== 'undefined' ? document.getElementById('hero') : null;

  return (
    <CartProvider>
      <div className="min-h-screen bg-transparent font-sans antialiased text-white">
        {/* Login removed: no client-side auth UI */}

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
