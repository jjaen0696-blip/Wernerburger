import { useEffect, useState, useCallback } from 'react';
import { ArrowRight, Clock } from 'lucide-react';
import { supabase, type Location } from '../lib/supabase';
import { type Movement, type MovementType, MOVEMENT_LABEL, MOVEMENT_TONE, fmtQty } from '../lib/inventory';
import { Pill, EmptyState } from './ui';

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'recién';
  if (mins < 60) return `hace ${mins} min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `hace ${hrs}h`;
  return new Date(dateStr).toLocaleDateString('es');
}

type Props = {
  types?: MovementType[];
  locationId?: string | null; // si se pasa, filtra a movimientos de esa sucursal
  limit?: number;
  title?: string;
  compact?: boolean;
};

export default function MovementsList({ types, locationId, limit = 15, title, compact }: Props) {
  const [rows, setRows] = useState<Movement[]>([]);
  const [locs, setLocs] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    let q = supabase.from('inv_movements').select('*').order('created_at', { ascending: false }).limit(limit);
    if (types && types.length) q = q.in('type', types);
    if (locationId) q = q.or(`location_id.eq.${locationId},from_location_id.eq.${locationId},to_location_id.eq.${locationId}`);
    const { data } = await q;
    setRows(data ?? []);
    setLoading(false);
  }, [types, locationId, limit]);

  useEffect(() => {
    supabase.from('locations').select('id,name').then(({ data }: any) => {
      const m: Record<string, string> = {};
      (data ?? []).forEach((l: Pick<Location, 'id' | 'name'>) => { m[l.id] = l.name; });
      setLocs(m);
    });
  }, []);

  useEffect(() => {
    load();
    const ch = supabase.channel(`mv-${title ?? 'list'}-${locationId ?? 'all'}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'inv_movements' }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [load, title, locationId]);

  const place = (id: string | null) => (id ? (locs[id] ?? 'Sucursal') : 'Central');

  return (
    <div>
      {title && <h3 className="mb-3 flex items-center gap-2 font-display text-sm font-extrabold uppercase tracking-wide text-white/70"><Clock className="h-4 w-4 text-gold" /> {title}</h3>}
      {loading ? (
        <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="skeleton h-12 rounded-xl" />)}</div>
      ) : rows.length === 0 ? (
        <EmptyState title="Sin movimientos" subtitle="Aquí aparecerán los movimientos recientes." />
      ) : (
        <div className="overflow-hidden rounded-[18px] border border-white/10 bg-ink-800/70">
          {rows.map((m, i) => (
            <div key={m.id} className={`flex flex-wrap items-center gap-x-3 gap-y-1 px-3.5 py-2.5 ${i > 0 ? 'border-t border-white/[0.06]' : ''}`}>
              <Pill tone={MOVEMENT_TONE[m.type]} className="shrink-0">{MOVEMENT_LABEL[m.type]}</Pill>
              <span className="min-w-0 flex-1 truncate text-sm font-bold text-white">{m.product_name}</span>
              <span className="text-sm font-black text-gold">{Number(m.qty) < 0 ? '' : '+'}{fmtQty(m.qty)}</span>
              {!compact && (m.from_location_id || m.to_location_id) && (
                <span className="flex items-center gap-1 text-[11px] text-white/45">
                  {place(m.from_location_id)} <ArrowRight className="h-3 w-3" /> {place(m.to_location_id)}
                </span>
              )}
              {!compact && !m.from_location_id && !m.to_location_id && (
                <span className="text-[11px] text-white/45">{place(m.location_id)}</span>
              )}
              <span className="text-[11px] text-white/30">{timeAgo(m.created_at)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
