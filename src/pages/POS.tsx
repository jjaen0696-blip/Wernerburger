import { useEffect, useState } from 'react';

const API_BASE = import.meta.env.VITE_API_BASE || 'https://wernerburger.onrender.com';
const api = (path: string) => `${API_BASE}${path}`;

export default function POS() {
  const [products, setProducts] = useState<any[]>([]);
  const [cart, setCart] = useState<{ product: any; qty: number }[]>([]);
  const [branchId, setBranchId] = useState<string>('');

  useEffect(() => {
    fetch(api('/products')).then(r => r.json()).then(setProducts).catch(() => setProducts([]));
    // Attempt to pick a branch automatically (first)
    fetch(api('/branches')).then(r => r.json()).then((b: any[]) => { if (b && b[0]) setBranchId(b[0].id); }).catch(() => {});
  }, []);

  function add(product: any) {
    setCart((c) => {
      const found = c.find(x => x.product.id === product.id);
      if (found) return c.map(x => x.product.id === product.id ? { ...x, qty: x.qty + 1 } : x);
      return [...c, { product, qty: 1 }];
    });
  }

  async function checkout() {
    if (!branchId) return alert('Selecciona sucursal');
    const order = {
      branch_id: branchId,
      customer_name: 'Local',
      phone: '',
      delivery_type: 'local',
      payment_method: 'efectivo',
      total: cart.reduce((s, i) => s + i.product.price * i.qty, 0),
      items: cart.map(i => ({ product_id: i.product.id, quantity: i.qty, unit_price: i.product.price }))
    };
    const res = await fetch(api('/orders'), {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(order)
    });
    if (!res.ok) return alert('Error al registrar venta');
    alert('Venta registrada');
    setCart([]);
  }

  return (
    <div className="min-h-screen pt-24 pb-16 bg-black">
      <div className="max-w-6xl mx-auto px-4">
        <h1 className="text-3xl font-black text-amber-200 mb-6">POS — Registrar Venta Local</h1>

        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h2 className="text-lg font-semibold text-white mb-3">Productos</h2>
            <div className="grid gap-3">
              {products.map(p => (
                <div key={p.id} className="p-3 rounded-lg bg-white/5 flex justify-between items-center">
                  <div>
                    <div className="font-semibold text-white">{p.name}</div>
                    <div className="text-sm text-gray-400">${p.price.toFixed(2)}</div>
                  </div>
                  <button onClick={() => add(p)} className="rounded-full bg-amber-500 px-3 py-2 font-black text-stone-900">Añadir</button>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-white mb-3">Carrito</h2>
            <div className="p-4 rounded-lg bg-white/5">
              {cart.length === 0 ? <div className="text-gray-400">Carrito vacío</div> : (
                <div className="space-y-2">
                  {cart.map(i => (
                    <div key={i.product.id} className="flex justify-between">
                      <div className="text-white">{i.product.name} x{i.qty}</div>
                      <div className="text-amber-200">${(i.product.price * i.qty).toFixed(2)}</div>
                    </div>
                  ))}
                  <div className="mt-3 font-bold text-white">Total: ${cart.reduce((s, i) => s + i.product.price * i.qty, 0).toFixed(2)}</div>
                  <div className="mt-3 flex gap-2">
                    <button onClick={checkout} className="rounded-full bg-emerald-500 px-4 py-2 font-black">Registrar Venta</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
