# Backend minimal para Werner Burguer

Este backend es un scaffold mínimo que usa `@supabase/supabase-js` para conectar con la base de datos de Supabase.

Variables de entorno requeridas:

- `SUPABASE_URL`
- `SUPABASE_KEY`

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
 - Crear un servicio en Render que apunte al directorio `server/` y configure `SUPABASE_URL` y `SUPABASE_KEY` como secrets.
 - Configurar Vercel para desplegar el frontend y establecer `API_BASE` si necesitas un dominio del backend.
