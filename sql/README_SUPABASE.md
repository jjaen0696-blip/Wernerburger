Instrucciones rápidas para desplegar el esquema y los datos en Supabase

1) Accede al proyecto en Supabase y abre la sección "SQL" → "Editor SQL".
2) Copia y pega el contenido de `sql/001_schema.sql` y ejecútalo. Esto creará las tablas, tipos y la función `process_order_deduction`.
3) Luego copia y ejecuta `sql/002_seed.sql` para poblar datos de ejemplo (sucursales, ingredientes, producto y receta).
4) En producción usa Supabase Auth para gestionar `users`; los registros en la tabla `users` del seed son sólo ejemplares.
5) Para procesar la deducción cuando un pedido sea confirmado, llama a la función:

   select process_order_deduction('ORDER_UUID');

   Si la función lanza una excepción, indica que hay ingredientes con stock insuficiente.

6) Siguientes pasos recomendados:
   - Crear funciones/trigger que ejecuten `process_order_deduction` cuando el `order.status` pase a un estado concreto (ej. 'accepted' o 'ready').
   - Añadir vistas y funciones que calculen indicadores (ventas por sucursal, top productos, ticket promedio).
   - Configurar políticas RLS y conectar Supabase Auth.
