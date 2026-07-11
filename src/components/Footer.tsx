import { Instagram, Facebook, Twitter, MapPin, Phone, Mail, Clock } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="mt-16 border-t border-white/6 pt-16 text-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-12 grid grid-cols-1 gap-10 md:grid-cols-4">
          <div className="md:col-span-1">
            <div className="mb-4 flex items-center gap-3">
              <div className="relative flex h-12 w-12 items-center justify-center rounded-full border border-amber-400/40 bg-black/20 shadow-[0_6px_24px_rgba(245,158,11,0.18)] overflow-hidden">
                <img
                  src="/werner-favicon.png"
                  alt="Werner Burger logo"
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="leading-tight">
                <div className="text-sm font-black tracking-[0.25em] text-amber-300 uppercase italic">WERNER BURGER</div>
              </div>
            </div>
            <p className="mb-4 text-sm leading-relaxed text-gray-400">
              Sabores callejeros elevados a una experiencia premium.
            </p>
            <div className="flex gap-3">
              {[Instagram, Facebook, Twitter].map((Icon, i) => (
                <a key={i} href="#" className="flex h-9 w-9 items-center justify-center rounded-full border border-white/6 bg-white/2 text-gray-200 transition-all hover:-translate-y-0.5 hover:border-amber-400/40 hover:bg-amber-500/12 hover:text-amber-200">
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          <div>
            <h4 className="mb-4 text-sm font-black tracking-[0.3em] text-amber-400 uppercase">MENÚ</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              {['Hamburguesas', 'Hot Dogs', 'Salchipapas', 'Pepitos', 'Arepas', 'Extras'].map(l => (
                <li key={l}><a href="#" className="transition-colors hover:text-white">{l}</a></li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="mb-4 text-sm font-black tracking-[0.3em] text-amber-400 uppercase">EMPRESA</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              {['Sobre Nosotros', 'Sucursales', 'Trabaja con Nosotros', 'Términos', 'Privacidad'].map(l => (
                <li key={l}><a href="#" className="transition-colors hover:text-white">{l}</a></li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="mb-4 text-sm font-black tracking-[0.3em] text-amber-400 uppercase">CONTACTO</h4>
            <ul className="space-y-3 text-sm text-gray-400">
              <li className="flex items-start gap-2"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" /><span>Av. Principal, Local 45, Caracas</span></li>
              <li className="flex items-center gap-2"><Phone className="h-4 w-4 shrink-0 text-amber-400" /><span>+58 212-555-0199</span></li>
              <li className="flex items-center gap-2"><Mail className="h-4 w-4 shrink-0 text-amber-400" /><span>hola@wernerburger.com</span></li>
              <li className="flex items-start gap-2"><Clock className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" /><span>Lun-Dom: 11:00 AM - 11:00 PM</span></li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col items-center justify-between gap-3 border-t border-white/10 pt-6 md:flex-row">
          <p className="text-xs text-gray-500">© 2025 WERNER BURGER. Todos los derechos reservados.</p>
          <div className="flex gap-5 text-xs text-gray-500">
            <a href="#" className="transition-colors hover:text-white">Términos</a>
            <a href="#" className="transition-colors hover:text-white">Privacidad</a>
            <a href="#" className="transition-colors hover:text-white">Cookies</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
