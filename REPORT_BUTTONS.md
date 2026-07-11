Reporte rápido: botones y acciones detectadas

Resumen:
- Escaneo realizado en `src/` para detectar botones sin `onClick` o acciones faltantes.

Estado por archivo (no exhaustivo):

OK / Implementados (tienen handlers o son submit dentro de forms):
- `src/admin/MenuManager.tsx` — CRUD productos:Agregar, Editar, Eliminar, Subida de imagen.
- `src/admin/ResetDatos.tsx` — selección y borrado con confirmación (usa RPC o fallback).
- `src/admin/VentasLocal.tsx` — POS local: agregar ítems, registrar venta, eliminar venta.
- `src/pages/Menu.tsx` — checkout y `placeOrder` (ahora delega a `CartContext`).
- Formularios en `src/pages/Admin.tsx` — crear usuario/sucursal/ingrediente/compra/ajuste (submit handlers presentes).

Needs Work / Botones sin handler visible (revisar y enlazar):
- `src/pages/Dashboard.tsx`
  - `Bell` (icon button sin acción) — debe abrir panel de notificaciones.
  - `Agregar stock` (botón sin handler) — debe abrir modal de ajuste o navegar a formulario de entrada.
  - Filtros de reportes (botones: Hoy/Semana/Mes/Personalizado) — deben cambiar filtros y refrescar datos (export PDF/Excel/CSV también).
- `src/admin/ui.tsx` — componentes de UI listos (PrimaryButton, Modal, etc.). Validar que se usen donde corresponda.
- `src/admin/Kitchen.tsx` y `src/pages/Kitchen.tsx` — revisar botones de kanban (aceptar, preparar, pausar, listo, entregar, cancelar).
- `src/pages/Delivery.tsx` — acciones para asignar repartidor, marcar salida/entregado, tiempos.
- `src/views/Menu.tsx` y `src/components/ProductCardPremium.tsx` — revisar handlers y eliminar fallback a `src/data/menuData.ts`.
- `src/data/menuData.ts` — archivo de datos estáticos: debe dejar de ser fuente primaria; migrar a Supabase.

Acciones sugeridas (prioridad):
1. Reemplazar definitivamente `src/data/menuData.ts` por consultas a `products`/`menu_items` de Supabase y eliminar fallback.
2. Implementar notificaciones en `Dashboard` (abrir modal/panel, consumir `audits` o `alerts` desde Supabase).
3. Implementar `Agregar stock` en `Dashboard` (abrir modal reutilizable que haga POST a `/purchases` o `/inventory/adjust`).
4. Implementar filtros de reportes y export (llamadas API y generación/descarga de PDF/Excel).
5. Revisar `Kitchen` y `Delivery` y asegurar que cada botón ejecuta la acción con `supabase.from(...).update(...)` y que hay auditoría.
6. Hacer barrido final para identificar botones visibles sin acción y priorizarlos por impacto.

Siguiente paso propuesto:
- Implemento los items 2 y 3 (Dashboard): notificaciones + "Agregar stock" modal y filtros básicos. Esto hará que los botones en `Dashboard` sean funcionales y pruebe conexión con Supabase.

Si estás de acuerdo responda OK y comienzo aplicando los cambios para `Dashboard`.
