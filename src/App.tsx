import { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { CartProvider } from './context/CartContext';
import Footer from './components/Footer';
import Home from './pages/Home';
import Menu from './pages/Menu';
import Kitchen from './pages/Kitchen';
import Delivery from './pages/Delivery';
import Admin from './pages/Admin';
import POS from './pages/POS';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import PrivateRoute from './components/PrivateRoute';

type Page = 'home' | 'menu' | 'kitchen' | 'delivery' | 'login' | 'admin' | 'pos' | 'dashboard';

function AppContent() {
  const [page, setPage] = useState<Page>('home');
  const { user, signOut } = useAuth();

  const navigate = (p: Page) => {
    setPage(p);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <CartProvider>
      <div className="min-h-screen bg-transparent font-sans antialiased text-white">
        {user && (
          <div style={{ top: 'calc(env(safe-area-inset-top, 1.5rem))', right: 'calc(env(safe-area-inset-right, 1.5rem))' }} className="fixed z-50 flex items-center gap-3 rounded-full bg-black/70 p-2 shadow-lg backdrop-blur-md">
            <span className="text-sm text-white">{user.user_metadata?.username ?? user.email ?? 'Admin'}</span>
            <button onClick={async () => { await signOut(); setPage('home'); }} className="rounded-full bg-amber-500 px-3 py-1 text-sm font-black text-stone-900">Cerrar</button>
          </div>
        )}

        <main className="relative overflow-x-hidden">
          {page === 'home' ? <Home onNavigate={navigate} onLogin={() => setPage('login')} />
            : page === 'menu' ? <Menu />
            : page === 'kitchen' ? <Kitchen onNavigate={navigate} />
            : page === 'delivery' ? <Delivery />
            : page === 'login' ? <Login onSuccess={() => setPage('dashboard')} onBack={() => setPage('home')} />
            : page === 'admin' ? (
              <PrivateRoute onUnauthorized={() => setPage('login')} allowedRoles={['admin', 'manager', 'kitchen', 'delivery']}>
                <Admin />
              </PrivateRoute>
            ) : page === 'dashboard' ? (
              <PrivateRoute onUnauthorized={() => setPage('login')} allowedRoles={['admin', 'manager']}>
                <Dashboard />
              </PrivateRoute>
            ) : page === 'pos' ? <POS />
            : null}
        </main>
        {(page === 'home' || page === 'menu') && <Footer />}
      </div>
    </CartProvider>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
