interface NavbarProps {
  onNavigate: (page: 'home' | 'menu' | 'kitchen' | 'delivery' | 'admin' | 'pos' | 'dashboard') => void;
}

export default function Navbar({ onNavigate }: NavbarProps) {
  const items: Array<{ key: NavbarProps['onNavigate'] extends (page: infer T) => void ? T : never; label: string }> = [
    { key: 'home', label: 'Inicio' },
    { key: 'menu', label: 'Menú' },
    { key: 'kitchen', label: 'Cocina' },
    { key: 'delivery', label: 'Delivery' },
    { key: 'admin', label: 'Admin' },
    { key: 'pos', label: 'POS' },
    { key: 'dashboard', label: 'Dashboard' },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-amber-600/10 bg-gradient-to-r from-zinc-900/95 to-black/80 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-3">
          <button onClick={() => onNavigate('home')} className="flex items-center gap-3 whitespace-nowrap text-left">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-500 font-extrabold text-black">
              W
            </div>
            <div>
              <div className="text-sm font-black tracking-wide text-white">Werner Burger</div>
              <div className="text-[10px] uppercase tracking-[0.25em] text-amber-200">En todo Panamá</div>
            </div>
          </button>

          <div className="flex items-center gap-2 overflow-x-auto">
            {items.map((item) => (
              <button
                key={item.key}
                onClick={() => onNavigate(item.key)}
                className="rounded-full px-3 py-2 text-sm font-semibold text-amber-100 transition hover:bg-white/10 hover:text-white"
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
}
