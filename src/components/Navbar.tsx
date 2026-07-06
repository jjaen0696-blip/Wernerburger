interface NavbarProps {
  onNavigate: (page: 'home' | 'menu' | 'kitchen' | 'delivery' | 'admin' | 'pos' | 'dashboard') => void;
}

export default function Navbar({ onNavigate }: NavbarProps) {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-zinc-900/95 to-black/80 backdrop-blur-md border-b border-amber-600/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <button onClick={() => onNavigate('home')} className="flex items-center gap-3 group">
            <div className="flex items-center gap-3 text-left whitespace-nowrap">
              <div className="w-10 h-10 rounded-full bg-amber-500 flex items-center justify-center text-black font-extrabold">W</div>
              <div>
                <div className="text-white font-black tracking-wide">Werner Burger</div>
                <div className="text-amber-200 text-xs uppercase tracking-wider">En todo Panamá</div>
              </div>
            </div>
          </button>

          <div className="flex items-center gap-3">
            <button onClick={() => onNavigate('home')} className="text-sm text-amber-200 px-3 py-2 rounded-md hover:bg-white/5">Inicio</button>
          </div>
        </div>
      </div>
    </nav>
  );
}
