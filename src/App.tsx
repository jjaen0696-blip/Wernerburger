import { useState } from 'react';

export default function App() {
  const [page, setPage] = useState<'home' | 'admin' | 'kitchen'>('home');

  return (
    <div className="min-h-screen bg-[#0f0a0b]">
      <div className="text-center p-12">
        <h1 className="text-4xl font-bold text-white mb-4">Wernerburger</h1>
        <p className="text-white/60 mb-8">Pedidos de comida rápida</p>
        <div className="flex justify-center gap-4">
          <button onClick={() => setPage('home')} className="px-4 py-2 bg-gold text-ink rounded-lg font-bold">Home</button>
          <button onClick={() => setPage('admin')} className="px-4 py-2 bg-gold text-ink rounded-lg font-bold">Admin</button>
          <button onClick={() => setPage('kitchen')} className="px-4 py-2 bg-gold text-ink rounded-lg font-bold">Kitchen</button>
        </div>
        <div className="mt-12 text-white/60">
          <p>Current page: {page}</p>
        </div>
      </div>
    </div>
  );
}
