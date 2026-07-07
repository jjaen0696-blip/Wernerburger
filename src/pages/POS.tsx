import { useEffect, useState, type FormEvent } from 'react';

const API_BASE = import.meta.env.VITE_API_BASE || (import.meta.env.DEV ? 'http://127.0.0.1:5174' : 'https://wernerburger.onrender.com');
const api = (path: string) => `${API_BASE}${path}`;

interface POSProps {
  currentUser?: { role?: 'admin' | 'manager' | 'kitchen' | 'delivery' } | null;
}

export default function POS({ currentUser }: POSProps) {
  const isManager = currentUser?.role === 'manager';
  const [products, setProducts] = useState<any[]>([]);
  const [cart, setCart] = useState<{ product: any; qty: number }[]>([]);
  const [branchId, setBranchId] = useState<string>('');
  const [branches, setBranches] = useState<any[]>([]);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'efectivo' | 'yappy'>('efectivo');
  const [manualPrice, setManualPrice] = useState('');
  const [status, setStatus] = useState('');

  useEffect(() => {
    fetch(api('/products')).then(r => r.json()).then((data) => {
      const list = Array.isArray(data) ? data : [];
      setProducts(list);
      if (list[0]) setSelectedProductId(list[0].id);
    }).catch(() => setProducts([]));
    fetch(api('/branches')).then(r => r.json()).then((b: any[]) => {
      const list = Array.isArray(b) ? b : [];
      setBranches(list);
      if (list[0]) setBranchId(list[0].id);
    }).catch(() => {});
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

  async function handleManagerSale(e: FormEvent) {
    e.preventDefault();
    if (!branchId) {
      setStatus('Selecciona una sucursal');
      return;
    }
    const product = products.find((item) => item.id === selectedProductId);
    if (!product) {
      setStatus('Selecciona un producto');
      return;
    }
    const price = Number(manualPrice || product.price || 0);
    const payload = {
      branch_id: branchId,
      customer_name: customerName.trim() || 'Cliente local',
      phone: '',
      delivery_type: 'local',
      payment_method: paymentMethod,
      total: price,
      items: [{ product_id: product.id, quantity: 1, unit_price: price }],
    };
    const res = await fetch(api('/orders'), {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setStatus(data.error || 'No se pudo registrar la venta');
      return;
    }
    setStatus(`Venta registrada: ${product.name} • ${customerName.trim() || 'Cliente local'}`);
    setCustomerName('');
    setManualPrice('');
    setPaymentMethod('efectivo');
  }

  return (
    <div className="min-h-screen pb-16 bg-black">
      <div className="max-w-6xl mx-auto px-4">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-3xl font-black text-amber-200">{isManager ? 'Registro de ventas local' : 'POS — Registrar Venta Local'}</h1>
          {isManager && <span className="rounded-full border border-amber-400/20 bg-amber-400/10 px-3 py-1 text-sm text-amber-100">Solo ventas</span>}
        </div>

        {isManager ? (
          <form onSubmit={handleManagerSale} className="rounded-[24px] border border-white/10 bg-white/5 p-6 shadow-[0_20px_70px_rgba(0,0,0,0.35)] backdrop-blur-xl">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="text-sm text-gray-300">
                Sucursal
                <select value={branchId} onChange={(e) => setBranchId(e.target.value)} className="mt-2 w-full rounded-2xl border border-white/10 bg-black/40 px-3 py-3 text-white">
                  {branches.map((branch) => <option key={branch.id} value={branch.id}>{branch.name}</option>)}
                </select>
              </label>
              <label className="text-sm text-gray-300">
                Producto vendido
                <select value={selectedProductId} onChange={(e) => setSelectedProductId(e.target.value)} className="mt-2 w-full rounded-2xl border border-white/10 bg-black/40 px-3 py-3 text-white">
                  {products.map((product) => <option key={product.id} value={product.id}>{product.name}</option>)}
                </select>
              </label>
              <label className="text-sm text-gray-300">
                Precio
                <input value={manualPrice} onChange={(e) => setManualPrice(e.target.value)} type="number" min="0" step="0.01" placeholder="0.00" className="mt-2 w-full rounded-2xl border border-white/10 bg-black/40 px-3 py-3 text-white" />
              </label>
              <label className="text-sm text-gray-300">
                Nombre de la persona
                <input value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Cliente" className="mt-2 w-full rounded-2xl border border-white/10 bg-black/40 px-3 py-3 text-white" />
              </label>
              <label className="text-sm text-gray-300 md:col-span-2">
                Método de pago
                <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value as 'efectivo' | 'yappy')} className="mt-2 w-full rounded-2xl border border-white/10 bg-black/40 px-3 py-3 text-white">
                  <option value="efectivo">Efectivo</option>
                  <option value="yappy">Yappy</option>
                </select>
              </label>
            </div>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <button type="submit" className="rounded-full bg-emerald-500 px-5 py-3 font-black text-stone-900">Registrar venta</button>
              {status && <span className="text-sm text-amber-200">{status}</span>}
            </div>
          </form>
        ) : (
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
        )}
      </div>
    </div>
  );
}
