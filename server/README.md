# Backend para Werner Burger

Este backend expone endpoints para productos, sucursales, inventario, órdenes y alertas usando Supabase.

Variables de entorno requeridas:

- `SUPABASE_URL=https://yelkwbdxncitagmnnxat.supabase.co`
- `SUPABASE_SERVICE_ROLE_KEY=tu_clave_service_role`
- `PORT=5174`

Desarrollo:

```bash
cd server
npm install
npm run dev
```

Endpoints básicos:
- `GET /health`
- `GET /products`
- `GET /ingredients`
- `GET /inventory/:branchId`
- `POST /purchases` (payload: purchase + items)
- `POST /orders` (payload: order + items) — marca el pedido como `accepted` para activar la deducción en la BD

Otros endpoints:
- `GET /alerts`
- `GET /branches`
- `GET /roles`, `POST /roles`
- `GET /users`, `POST /users`, `POST /users/:id/roles`
- `GET /reports/sales-summary` (query params: from, to)

Despliegue recomendado:
 - Desplegar la carpeta `server/` en Vercel como un proyecto separado o en Render.
 - Configurar `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` como secrets/variables de entorno.
 - Si el frontend está en Vercel, usar el dominio del backend en un archivo de configuración o proxy.
