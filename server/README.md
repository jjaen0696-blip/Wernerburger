# Backend para Werner Burger

Este backend expone endpoints para productos, sucursales, inventario, órdenes y alertas usando Supabase.

Variables de entorno requeridas:

- `SUPABASE_URL=https://yelkwbdxncitagmnnxat.supabase.co`
- `SUPABASE_SERVICE_ROLE_KEY=tu_clave_service_role`
- `PORT=5174`
 - `CORS_ALLOW_ALL=0` (opcional para depuración — pon `1` temporalmente si necesitas permitir todos los orígenes)

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
 - Desplegar la carpeta `server/` como un servicio web separado en Render.
 - Configurar `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` (o `SUPABASE_KEY`) como variables de entorno.
 - Si la aplicación estaba desplegada previamente como *Static Site* en Render, recrea el servicio como *Web Service* apuntando al directorio `server/` o usa `render.yaml` incluido en la raíz del repo.
   - En el panel de Render: crea un nuevo servicio «Web Service», selecciona el repo, y en *Root Directory* pon `server`.
   - Establece las variables de entorno requeridas (`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`) en la sección de Environment.
   - (Opcional) Usa `CORS_ALLOW_ALL=1` temporalmente para pruebas desde el frontend, pero quítalo en producción.
 - No desplegar el backend como un Static Site en Render.
 - No usar proxies temporales en Vercel; el frontend debe llamar directamente al backend en Render.

Render Web Service recomendado:
 - Root Directory: `server`
 - Build Command: `npm install && npm run build`
 - Start Command: `npm start`
 - Variables de entorno:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY` o `SUPABASE_KEY`
   - `NODE_ENV=production`
   - `PORT=5174` (opcional)
