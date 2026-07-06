import { useEffect, useState } from 'react';

export default function Admin() {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [summary, setSummary] = useState<any[]>([]);

  useEffect(() => {
    fetch('/alerts').then(r => r.json()).then(setAlerts).catch(() => setAlerts([]));
    fetch('/reports/sales-summary').then(r => r.json()).then(setSummary).catch(() => setSummary([]));
  }, []);

  return (
    <div className="min-h-[60vh] p-4 bg-transparent">
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="p-4 bg-white/5 rounded-lg">
          <div className="text-sm text-gray-300">Ventas hoy</div>
          <div className="text-2xl font-bold text-amber-200">$0.00</div>
        </div>
        <div className="p-4 bg-white/5 rounded-lg">
          <div className="text-sm text-gray-300">Productos bajos</div>
          <div className="text-2xl font-bold text-amber-200">{alerts.length}</div>
        </div>
        <div className="p-4 bg-white/5 rounded-lg">
          <div className="text-sm text-gray-300">Órdenes hoy</div>
          <div className="text-2xl font-bold text-amber-200">{summary.reduce((a,b)=>a+b.count,0)}</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <section>
          <h2 className="text-lg font-semibold text-white mb-3">Alertas de Inventario</h2>
          {alerts.length === 0 ? (
            <div className="p-4 rounded-lg bg-white/5 text-gray-300">No hay alertas</div>
          ) : (
            <div className="space-y-3">
              {alerts.map((a) => (
                <div key={a.ingredient_id} className="p-3 rounded-lg bg-white/5 flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-white">{a.ingredient_name}</div>
                    <div className="text-sm text-gray-400">Sucursal: {a.branch_name}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-amber-200">{a.quantity}</div>
                    <div className="text-xs text-gray-400">min: {a.min_stock}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white mb-3">Resumen de Ventas (por sucursal)</h2>
          {summary.length === 0 ? (
            <div className="p-4 rounded-lg bg-white/5 text-gray-300">Sin datos</div>
          ) : (
            <div className="space-y-3">
              {summary.map((s) => (
                <div key={s.branch_id} className="p-3 rounded-lg bg-white/5 flex justify-between items-center">
                  <div className="text-white">Sucursal: {s.branch_id}</div>
                  <div className="text-right">
                    <div className="font-bold text-amber-200">${s.total.toFixed(2)}</div>
                    <div className="text-xs text-gray-400">Pedidos: {s.count}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
