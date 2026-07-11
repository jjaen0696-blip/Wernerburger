// Tipos y utilidades compartidas del módulo de inventario.
import type { Tone } from '../admin/ui';

export type MovementType = 'compra' | 'distribucion' | 'transferencia' | 'ajuste' | 'consumo' | 'correccion';

export type Supplier = {
  id: string;
  name: string;
  contact: string;
  phone: string;
  notes: string;
  is_active: boolean;
  created_at: string;
};

export type Product = {
  id: string;
  name: string;
  category: string;
  code: string | null;
  unit: string;
  central_qty: number;
  min_stock: number;
  avg_cost: number;
  last_cost: number;
  supplier_id: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type BranchStock = {
  id: string;
  product_id: string;
  location_id: string;
  qty: number;
  min_stock: number;
  max_stock: number;
  updated_at: string;
};

export type Movement = {
  id: string;
  type: MovementType;
  product_id: string | null;
  product_name: string;
  location_id: string | null;
  from_location_id: string | null;
  to_location_id: string | null;
  qty: number;
  unit_cost: number | null;
  reason: string;
  ref_id: string | null;
  created_by: string | null;
  created_by_email: string;
  created_at: string;
};

export type StockState = 'disponible' | 'bajo' | 'agotado';

export function stockState(qty: number, min: number): StockState {
  if (qty <= 0) return 'agotado';
  if (qty <= min) return 'bajo';
  return 'disponible';
}

export const STOCK_TONE: Record<StockState, Tone> = {
  disponible: 'green',
  bajo: 'yellow',
  agotado: 'red',
};
export const STOCK_LABEL: Record<StockState, string> = {
  disponible: 'Disponible',
  bajo: 'Stock bajo',
  agotado: 'Agotado',
};

export const UNITS = ['unidad', 'g', 'kg', 'ml', 'l', 'porción', 'rebanada', 'paquete', 'caja', 'docena'];

export const MOVEMENT_LABEL: Record<MovementType, string> = {
  compra: 'Compra',
  distribucion: 'Distribución',
  transferencia: 'Transferencia',
  ajuste: 'Ajuste',
  consumo: 'Consumo por venta',
  correccion: 'Corrección',
};

export const MOVEMENT_TONE: Record<MovementType, Tone> = {
  compra: 'green',
  distribucion: 'gold',
  transferencia: 'gold',
  ajuste: 'yellow',
  consumo: 'red',
  correccion: 'gray',
};

// Formato de cantidad: hasta 3 decimales, sin ceros sobrantes.
export const fmtQty = (n: number | string) => {
  const v = Number(n);
  return Number.isFinite(v) ? v.toLocaleString('es', { maximumFractionDigits: 3 }) : '0';
};
export const fmtMoney = (n: number | string) =>
  '$' + Number(n || 0).toLocaleString('es', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// ===== Exportación CSV (reportes / historial) =====
export function toCSV(headers: string[], rows: (string | number | null)[][]): string {
  const esc = (v: string | number | null) => {
    const s = String(v ?? '');
    return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  };
  return [headers.map(esc).join(','), ...rows.map((r) => r.map(esc).join(','))].join('\n');
}

export function downloadCSV(filename: string, csv: string) {
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
