# 🏗️ FLUJO ESTRUCTURAL - WERNERBURGER PLATFORM

## 📊 ARQUITECTURA GENERAL

```
┌─────────────────────────────────────────────────────────────────────┐
│                        🌐 CLIENTE (Browser)                          │
│  ┌──────────────┬──────────────┬──────────────┬──────────────────┐   │
│  │   Menu      │   Admin      │   Kitchen    │   Delivery       │   │
│  │  (Público)  │  (Privado)   │  (Real-time) │  (Real-time)     │   │
│  └──────────────┴──────────────┴──────────────┴──────────────────┘   │
│         ↓               ↓               ↓              ↓              │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │          React + TypeScript + Framer Motion                 │    │
│  │  • useAuth (Context API) - Gestión de autenticación         │    │
│  │  • useCart (Context API) - Estado del carrito              │    │
│  │  • Real-time Subscriptions - WebSockets                    │    │
│  └─────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│                    🔐 SUPABASE (Backend)                             │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │  PostgreSQL Database + Auth + Real-time + Storage            │   │
│  └──────────────────────────────────────────────────────────────┘   │
│         ↓                ↓                 ↓                ↓        │
│  ┌──────────────┬──────────────┬──────────────┬──────────────┐      │
│  │ Tables       │ Auth System  │ Real-time    │ Storage      │      │
│  │              │              │ Subscriptions│ (Imágenes)   │      │
│  └──────────────┴──────────────┴──────────────┴──────────────┘      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 📋 ESTRUCTURA DE BASE DE DATOS

### Nivel 1: AUTENTICACIÓN Y USUARIOS
```
┌─────────────────────────────────────────────────┐
│ auth.users (Supabase Built-in)                  │
├─────────────────────────────────────────────────┤
│ • id (UUID) - PK                                │
│ • email (TEXT) - Único                          │
│ • encrypted_password (TEXT)                     │
│ • created_at, updated_at                        │
└─────────────────────────────────────────────────┘
          ↓ Relación
┌─────────────────────────────────────────────────┐
│ public.users (Tabla Custom)                     │
├─────────────────────────────────────────────────┤
│ • id (UUID) - FK auth.users.id - PK             │
│ • username (TEXT) - Único - Índice              │
│ • email (TEXT)                                  │
│ • role (TEXT) - admin|cocina|delivery           │
│ • branch_id (UUID) - FK branches.id             │
│ • created_at, updated_at                        │
└─────────────────────────────────────────────────┘
```

### Nivel 2: ESTRUCTURA ORGANIZACIONAL
```
┌─────────────────────────────────────────────────┐
│ public.branches (Sucursales/Locales)            │
├─────────────────────────────────────────────────┤
│ • id (UUID) - PK                                │
│ • name (TEXT) - Nombre de sucursal              │
│ • address (TEXT) - Dirección                    │
│ • phone (TEXT) - Teléfono                       │
│ • created_at, updated_at                        │
└─────────────────────────────────────────────────┘
          ↑ (FK)
          │
          ├─→ public.users (branch_id)
          │
          └─→ public.orders (branch_id)
```

### Nivel 3: MENÚ Y PRODUCTOS
```
┌─────────────────────────────────────────────────┐
│ public.categories (Categorías de Menú)          │
├─────────────────────────────────────────────────┤
│ • id (UUID) - PK                                │
│ • name (TEXT) - Nombre de categoría             │
│ • icon (TEXT) - Emoji (🍔, 🌭, etc)            │
│ • description (TEXT)                            │
│ • display_order (INT) - Orden de visualización  │
│ • created_at, updated_at                        │
│ • Índice: display_order, name                   │
└─────────────────────────────────────────────────┘
          ↓ (FK)
┌─────────────────────────────────────────────────┐
│ public.products (Productos del Menú)            │
├─────────────────────────────────────────────────┤
│ • id (TEXT) - PK                                │
│ • name (TEXT)                                   │
│ • description (TEXT)                            │
│ • price (DECIMAL 10,2)                          │
│ • category_id (UUID) - FK categories.id         │
│ • image_url (TEXT) - URL en Supabase Storage    │
│ • available (BOOLEAN) - Disponible en menú      │
│ • display_order (INT) - Orden visual             │
│ • created_at, updated_at (triggers auto)        │
│ • Índices: category_id, available, display_order│
└─────────────────────────────────────────────────┘
```

### Nivel 4: ÓRDENES
```
┌─────────────────────────────────────────────────┐
│ public.orders (Órdenes Principales)             │
├─────────────────────────────────────────────────┤
│ • id (BIGSERIAL) - PK                           │
│ • order_number (TEXT) - ÚNICO ORD-YYYYMMDD...  │
│ • branch_id (UUID) - FK branches.id             │
│ • customer_name (TEXT)                          │
│ • customer_phone (TEXT)                         │
│ • customer_address (TEXT) - Para delivery       │
│ • delivery_type (TEXT) - local|delivery         │
│ • payment_method (TEXT) - efectivo|yappy|tarjeta│
│ • status (TEXT) - pending|accepted|preparing    │
│          |ready|assigned|delivering|completed   │
│ • total_amount (DECIMAL 10,2)                   │
│ • notes (TEXT) - Notas especiales               │
│ • assigned_to (UUID) - FK users.id (Delivery)   │
│ • created_at, updated_at (triggers)             │
│ • completed_at (TIMESTAMP) - Cuando se completó│
│ • Índices: branch_id, status, assigned_to,      │
│   delivery_type, created_at DESC                │
└─────────────────────────────────────────────────┘
          ↓ (1:Many)
┌─────────────────────────────────────────────────┐
│ public.order_items (Items de la Orden)          │
├─────────────────────────────────────────────────┤
│ • id (BIGSERIAL) - PK                           │
│ • order_id (BIGINT) - FK orders.id CASCADE      │
│ • product_name (TEXT) - Snapshot del nombre     │
│ • product_id (TEXT) - FK products.id (opcional) │
│ • quantity (INT) - Cantidad                     │
│ • unit_price (DECIMAL 10,2) - Precio unitario   │
│ • subtotal (DECIMAL 10,2) - Calcula al insertar │
│ • notes (TEXT) - Notas del item                 │
│ • created_at (TIMESTAMP)                        │
│ • Índices: order_id                             │
└─────────────────────────────────────────────────┘
```

### Vistas
```
┌─────────────────────────────────────────────────┐
│ public.orders_with_items (Vista)                │
├─────────────────────────────────────────────────┤
│ Combina orders + order_items en JSON            │
│ SELECT order.*, json_agg(order_items)           │
│ Usada por: Kitchen.tsx, Delivery.tsx            │
└─────────────────────────────────────────────────┘
```

---

## 🔐 SISTEMA DE AUTENTICACIÓN Y ROLES

```
┌──────────────────────────────────────────────────┐
│ FLUJO DE LOGIN                                   │
└──────────────────────────────────────────────────┘

1. Usuario ingresa: username + password
                    ↓
2. Menu.tsx → LoginForm captura datos
                    ↓
3. AuthContext.signIn() ejecuta:
   • SELECT * FROM users WHERE username = ?
   • Obtiene email del usuario
                    ↓
4. supabase.auth.signInWithPassword(email, password)
                    ↓
5. Supabase devuelve: user + session + token JWT
                    ↓
6. fetchUserRole(userId) ejecuta:
   • SELECT role, branch_id FROM users WHERE id = ?
                    ↓
7. AuthContext guarda:
   • user (de Supabase Auth)
   • role (admin|cocina|delivery)
   • branchId (UUID)
                    ↓
8. App.tsx useEffect verifica role
   • role === 'admin' → setPage('dashboard')
   • role === 'cocina' → setPage('kitchen')
   • role === 'delivery' → setPage('delivery')
                    ↓
9. ✅ Usuario logueado y redirigido
```

### Matriz de Permisos
```
┌─────────────────┬──────────┬──────────┬──────────────┐
│ Recurso          │ Admin    │ Cocina   │ Delivery     │
├─────────────────┼──────────┼──────────┼──────────────┤
│ Dashboard       │ CRUD     │ ❌       │ ❌           │
│ Menú (Admin)    │ CRUD     │ ❌       │ ❌           │
│ Órdenes (lectura)│ READ ✅  │ READ ✅  │ READ ✅      │
│ Kitchen View    │ ❌       │ WRITE ✅ │ ❌           │
│ Delivery View   │ ❌       │ ❌       │ WRITE ✅     │
│ Usuarios        │ CRUD     │ ❌       │ ❌           │
│ Reportes        │ READ ✅  │ ❌       │ ❌           │
└─────────────────┴──────────┴──────────┴──────────────┘
```

---

## 🛒 FLUJO DE CREACIÓN DE ORDEN

```
PASO 1: USUARIO NAVEGA MENÚ
┌─────────────────────────────────────────┐
│ Menu.tsx                                 │
│ • Carga productos de Supabase            │
│ • Muestra categorías                     │
│ • Permite búsqueda                       │
└─────────────────────────────────────────┘
           ↓
PASO 2: AGREGAR AL CARRITO
┌─────────────────────────────────────────┐
│ useCart() Context                        │
│ • cart: [{item, quantity}]               │
│ • total: number                          │
│ • itemCount: number                      │
└─────────────────────────────────────────┘
           ↓
PASO 3: HACER CLICK EN CARRITO FLOTANTE
┌─────────────────────────────────────────┐
│ Modal de Checkout Abre                   │
│ Muestra resumen de items                 │
└─────────────────────────────────────────┘
           ↓
PASO 4: SELECCIONAR TIPO DE ENTREGA
┌─────────────────────────────────────────┐
│ Opciones:                                │
│ ○ Recoger en tienda (local)             │
│ ○ Entregar a domicilio (delivery)        │
│                                          │
│ Si delivery: Solicita dirección/ubicación│
└─────────────────────────────────────────┘
           ↓
PASO 5: COMPLETAR INFORMACIÓN
┌─────────────────────────────────────────┐
│ Campos requeridos:                       │
│ • customer_name (Nombre)                 │
│ • customer_phone (Teléfono)              │
│ • customer_address (Dirección - si aplica)│
│ • delivery_type (local|delivery)         │
│ • payment_method (efectivo|yappy)        │
└─────────────────────────────────────────┘
           ↓
PASO 6: VALIDACIÓN Y GUARDADO
┌─────────────────────────────────────────┐
│ handlePlaceOrder() ejecuta:              │
│                                          │
│ 1. Valida todos los campos               │
│ 2. Obtiene branch_id de Auth             │
│ 3. Inserta en orders table:              │
│    INSERT INTO orders VALUES (...)       │
│    → Retorna order_id y order_number     │
│                                          │
│ 4. Itera cada item del carrito           │
│ 5. Inserta en order_items table:         │
│    INSERT INTO order_items VALUES (...)  │
│    → Un registro por item                │
│                                          │
│ 6. Limpia el carrito: clearCart()        │
│ 7. Muestra confirmación:                 │
│    "✅ Orden ORD-202607110001 creada"   │
└─────────────────────────────────────────┘
           ↓
PASO 7: REAL-TIME SYNC
┌─────────────────────────────────────────┐
│ Supabase Real-time dispara eventos:      │
│ • INSERT en orders → Cocina recibe       │
│ • INSERT en order_items → Cocina recibe  │
│                                          │
│ Kitchen.tsx actualiza automáticamente:   │
│ • Nueva orden en columna "Pending"       │
│ • Muestra customer_name, items, total    │
└─────────────────────────────────────────┘
```

---

## 👨‍🍳 FLUJO DE COCINA (Kitchen Staff)

```
┌──────────────────────────────────────────────────┐
│ KITCHEN.TSX - INTERFAZ REAL-TIME                 │
└──────────────────────────────────────────────────┘

CARGA INICIAL:
┌─────────────────────────────────────────────────┐
│ useEffect → supabase.channel('orders')           │
│ • Subscribe a cambios en orders table            │
│ • Query: WHERE branch_id = ? AND delivery_type  │
│   = 'local'                                       │
│ • Carga estado actual de órdenes                 │
└─────────────────────────────────────────────────┘
           ↓
VISUALIZACIÓN (3 Columnas Kanban):
┌──────────────────┬──────────────────┬──────────────────┐
│  📋 PENDIENTE    │  🔥 PREPARANDO   │  ✅ LISTO        │
│  (Pending)       │  (Preparing)     │  (Ready)         │
├──────────────────┼──────────────────┼──────────────────┤
│ • Nueva orden    │ • Moviéndola     │ • Esperando que   │
│   ORD-001000     │                  │   vengan a recoger│
│ • Juan Pérez     │ • ORD-001002     │                  │
│ • Items:         │ • Carlos López   │ • ORD-001001     │
│   - Burger x2    │ • Items:         │ • María González │
│   - Papas x1     │   - Arepa x3     │                  │
│ • Total: $45.50  │   - Refresco x1  │ • María está aquí│
│                  │ • Total: $38.00  │   → COMPLETED    │
│ 🔵 ACEPTAR       │                  │                  │
│ 🔴 PREPARANDO    │ 🟢 LISTO         │                  │
└──────────────────┴──────────────────┴──────────────────┘
           ↓
ACCIONES (Click en botones):
┌─────────────────────────────────────────────────┐
│ ACEPTAR (Pending → Accepted)                    │
│ ↓ supabase.from('orders').update({status:       │
│   'accepted'}).eq('id', orderId)                │
│ ↓ Orden se mantiene en Pending (visual)         │
│ ↓ Backend registra que staff vio la orden       │
│                                                  │
│ PREPARANDO (Accepted → Preparing)               │
│ ↓ Update status = 'preparing'                   │
│ ↓ Orden se mueve a columna central              │
│                                                  │
│ LISTO (Preparing → Ready)                       │
│ ↓ Update status = 'ready'                       │
│ ↓ Orden se mueve a columna derecha              │
│ ↓ Cliente puede recoger                         │
│                                                  │
│ COMPLETAR (Ready → Completed)                   │
│ ↓ Update status = 'completed'                   │
│ ↓ completed_at = NOW()                          │
│ ↓ Desaparece de la interfaz                     │
└─────────────────────────────────────────────────┘
           ↓
REAL-TIME UPDATES:
┌─────────────────────────────────────────────────┐
│ Si otro cocina actualiza una orden:              │
│ • supabase.channel emite evento                  │
│ • Kitchen.tsx recibe evento en tiempo real       │
│ • Pantalla se actualiza automáticamente          │
│ • No necesita refrescar                          │
└─────────────────────────────────────────────────┘
```

---

## 🚚 FLUJO DE DELIVERY

```
┌──────────────────────────────────────────────────┐
│ DELIVERY.TSX - INTERFAZ REAL-TIME                │
└──────────────────────────────────────────────────┘

SIMILAR A KITCHEN PERO FILTRA:
┌─────────────────────────────────────────────────┐
│ Query: WHERE branch_id = ? AND delivery_type    │
│         = 'delivery'                             │
│                                                  │
│ Muestra solo órdenes para DELIVERY               │
│ (no órdenes para recoger en tienda)              │
└─────────────────────────────────────────────────┘
           ↓
VISUALIZACIÓN (3 Columnas):
┌──────────────────┬──────────────────┬──────────────────┐
│  🚚 LISTA PARA   │  📍 EN TRÁNSITO  │  ✅ COMPLETADA   │
│     ENTREGAR     │                  │                  │
│  (Ready)         │  (Delivering)    │  (Completed)     │
├──────────────────┼──────────────────┼──────────────────┤
│ • ORD-001001     │ • ORD-001005     │ • ORD-001002     │
│ • María González │ • Pedro Ruiz     │ • Lucia Martín   │
│ • 📍 Calle 5 #123│ • En camino...   │ • Entregado a las│
│ • ☎️ 6789-1234   │ • ETA: 15 min    │   3:45 PM        │
│ • Total: $62.75  │ • Total: $89.99  │                  │
│                  │                  │ • ORD-001003     │
│ 👤 ASIGNAR A MI  │ 📍 VER RUTA      │ • Entregado a las│
│ 🚗 SALGO         │ ✅ COMPLETAR     │   4:10 PM        │
└──────────────────┴──────────────────┴──────────────────┘
           ↓
ACCIONES ESPECÍFICAS:
┌─────────────────────────────────────────────────┐
│ ASIGNAR A MI (Ready → Assigned)                 │
│ ↓ Update status = 'assigned', assigned_to = mi_ │
│   user_id                                        │
│ ↓ Orden se asigna a este delivery               │
│ ↓ Otros delivery ven que ya está asignada       │
│                                                  │
│ SALGO (Assigned → Delivering)                   │
│ ↓ Update status = 'delivering'                  │
│ ↓ Orden se mueve a columna "En Tránsito"        │
│ ↓ Sistema registra que salió a entregar         │
│                                                  │
│ COMPLETAR (Delivering → Completed)              │
│ ↓ Update status = 'completed'                   │
│ ↓ completed_at = NOW()                          │
│ ↓ Orden se archiva (desaparece de listas)       │
│ ↓ Cliente ha recibido la orden                  │
└─────────────────────────────────────────────────┘
           ↓
INFORMACIÓN DISPONIBLE:
┌─────────────────────────────────────────────────┐
│ • customer_name - Nombre del cliente             │
│ • customer_phone - Teléfono (clickeable tel:)   │
│ • customer_address - Dirección/ubicación        │
│ • items - Lista completa de productos           │
│ • total_amount - Total a cobrar                 │
│ • payment_method - Efectivo, Yappy, etc         │
│ • notes - Instrucciones especiales               │
└─────────────────────────────────────────────────┘
```

---

## 👨‍💼 FLUJO DE ADMIN - PANEL DE MENÚ

```
┌──────────────────────────────────────────────────┐
│ ADMIN PANEL → MENÚ MANAGER                       │
└──────────────────────────────────────────────────┘

CARGA:
┌─────────────────────────────────────────────────┐
│ useEffect al montar:                            │
│ 1. SELECT * FROM categories ORDER BY display_order
│ 2. SELECT * FROM products ORDER BY display_order │
│ ↓                                                │
│ Organiza por categoría en la UI                 │
└─────────────────────────────────────────────────┘
           ↓
VISUALIZACIÓN:
┌─────────────────────────────────────────────────┐
│ Para cada categoría:                            │
│ 🍔 HAMBURGUESAS                         (3)     │
│ ├─ [Imagen] Hamburguesa Clásica                 │
│ │  $6.50 ✓ Disponible                           │
│ │  [Editar] [Eliminar]                          │
│ ├─ [Imagen] Hamburguesa Queso                   │
│ │  $8.00 ✓ Disponible                           │
│ │  [Editar] [Eliminar]                          │
│ └─ [Imagen] Hamburguesa Bacon                   │
│    $7.50 ✓ Disponible                           │
│    [Editar] [Eliminar]                          │
│                                                  │
│ [+ Agregar Producto]                            │
└─────────────────────────────────────────────────┘
           ↓
CREAR PRODUCTO:
┌─────────────────────────────────────────────────┐
│ Click [+ Agregar Producto]                      │
│ ↓ Modal se abre                                 │
│                                                  │
│ Nombre: _____________ (requerido)               │
│ Descripción: __________ (opcional)              │
│ Precio: _____________ (requerido)               │
│ Categoría: [Dropdown] (requerido)               │
│                                                  │
│ Imagen:                                         │
│ [Área de drag & drop para subir imagen]         │
│ └─ Sube a: Supabase Storage/products/...        │
│ └─ Retorna URL pública                          │
│                                                  │
│ ☑ Disponible en menú                            │
│                                                  │
│ [Cancelar] [Crear]                              │
│                                                  │
│ ↓ INSERT INTO products VALUES (...)             │
│ ↓ Supabase real-time notifica cambio            │
│ ↓ Menu.tsx recibe actualización automática      │
│ ↓ Éxito: "Producto creado"                      │
└─────────────────────────────────────────────────┘
           ↓
EDITAR PRODUCTO:
┌─────────────────────────────────────────────────┐
│ Click [Editar] en un producto                   │
│ ↓ Modal se abre con datos precargados            │
│ ↓ Usuario modifica campos                        │
│ ↓ Click [Actualizar]                            │
│ ↓ UPDATE products SET ... WHERE id = ?           │
│ ↓ La imagen se puede cambiar                    │
│ ↓ Éxito: "Producto actualizado"                 │
└─────────────────────────────────────────────────┘
           ↓
ELIMINAR PRODUCTO:
┌─────────────────────────────────────────────────┐
│ Click [Eliminar] en un producto                 │
│ ↓ Confirmación: "¿Eliminar este producto?"      │
│ ↓ Si confirma:                                  │
│ ↓ DELETE FROM products WHERE id = ?             │
│ ↓ DELETE FROM order_items WHERE product_id = ?  │
│    (CASCADE delete)                             │
│ ↓ Éxito: "Producto eliminado"                   │
└─────────────────────────────────────────────────┘
```

---

## 💾 GESTIÓN DE IMÁGENES

```
┌──────────────────────────────────────────────────┐
│ FLUJO DE UPLOAD DE IMÁGENES                      │
└──────────────────────────────────────────────────┘

PASO 1: USUARIO SELECCIONA ARCHIVO
┌─────────────────────────────────────────────────┐
│ <input type="file" accept="image/*">            │
│ ↓ Usuario elige archivo                        │
│ ↓ Se almacena en state: selectedFile            │
└─────────────────────────────────────────────────┘
           ↓
PASO 2: VALIDACIÓN
┌─────────────────────────────────────────────────┐
│ if (file.type.startsWith('image/')) ✓           │
│ if (file.size < 5MB) ✓                          │
└─────────────────────────────────────────────────┘
           ↓
PASO 3: UPLOAD A SUPABASE STORAGE
┌─────────────────────────────────────────────────┐
│ supabase.storage                                │
│   .from('products')  ← bucket name              │
│   .upload('menu/1720000000.jpg', file)          │
│                                                  │
│ Ruta en storage:                                │
│ └─ yelkwbdxncitagmnnxat                        │
│    └─ products (bucket)                         │
│       └─ menu/                                  │
│          └─ 1720000000.jpg                      │
│                                                  │
│ ✓ Archivo subido                                │
└─────────────────────────────────────────────────┘
           ↓
PASO 4: OBTENER URL PÚBLICA
┌─────────────────────────────────────────────────┐
│ supabase.storage                                │
│   .from('products')                             │
│   .getPublicUrl('menu/1720000000.jpg')          │
│                                                  │
│ Retorna:                                        │
│ https://yelkwbdxncitagmnnxat.supabase.co/      │
│ storage/v1/object/public/products/              │
│ menu/1720000000.jpg                             │
│                                                  │
│ ✓ URL pública listamente accesible              │
└─────────────────────────────────────────────────┘
           ↓
PASO 5: GUARDAR EN DATABASE
┌─────────────────────────────────────────────────┐
│ INSERT INTO products                            │
│ (name, price, image_url, ...)                  │
│ VALUES ('Burger', 6.50,                         │
│   'https://yelk...', ...)                       │
│                                                  │
│ O UPDATE existente con nueva imagen             │
└─────────────────────────────────────────────────┘
           ↓
PASO 6: MOSTRAR EN MENÚ
┌─────────────────────────────────────────────────┐
│ <img src={product.image_url} />                 │
│ ↓ Imagen cargada desde Supabase Storage         │
│ ↓ Visible en:                                   │
│   - Panel Admin (galería)                       │
│   - Menú Cliente (catálogo)                     │
└─────────────────────────────────────────────────┘
```

---

## ⚡ SISTEMA DE REAL-TIME (WebSockets)

```
┌──────────────────────────────────────────────────┐
│ SUPABASE REAL-TIME SUBSCRIPTIONS                 │
└──────────────────────────────────────────────────┘

CONEXIÓN INICIAL:
┌─────────────────────────────────────────────────┐
│ supabase.channel('kitchen-orders')              │
│   .on('postgres_changes',                       │
│     {                                           │
│       event: '*',      ← INSERT|UPDATE|DELETE   │
│       schema: 'public',                         │
│       table: 'orders'                           │
│     },                                          │
│     (payload) => {                              │
│       // Handle cambios en tiempo real          │
│     }                                           │
│   )                                             │
│   .subscribe()                                  │
│                                                  │
│ ✓ Conexión WebSocket abierta                   │
│ ✓ Escuchando cambios en orders table            │
└─────────────────────────────────────────────────┘
           ↓
EVENTO: NUEVA ORDEN
┌─────────────────────────────────────────────────┐
│ Admin crea orden desde menú                     │
│ ↓ INSERT INTO orders VALUES (...)               │
│ ↓ Supabase emite evento:                        │
│   {                                             │
│     event: 'INSERT',                            │
│     new: { id: 1, name: 'Juan', ... },          │
│     old: null                                   │
│   }                                             │
│ ↓ Kitchen.tsx recibe evento                     │
│ ↓ Agrega orden a estado: pendingOrders.push()   │
│ ↓ Pantalla se actualiza automáticamente         │
│   (sin refrescar)                               │
│ ✓ Cocina VE la nueva orden instantáneamente     │
└─────────────────────────────────────────────────┘
           ↓
EVENTO: ACTUALIZACIÓN DE ESTADO
┌─────────────────────────────────────────────────┐
│ Cocina cambió orden de pending a preparing      │
│ ↓ UPDATE orders SET status = 'preparing'        │
│ ↓ Supabase emite evento:                        │
│   {                                             │
│     event: 'UPDATE',                            │
│     new: { id: 1, status: 'preparing', ... },   │
│     old: { id: 1, status: 'pending', ... }      │
│   }                                             │
│ ↓ Kitchen.tsx recibe evento                     │
│ ↓ Mueve orden de columna "Pending" a            │
│   "Preparing"                                   │
│ ✓ Admin en otra pestaña VE cambio al instante  │
└─────────────────────────────────────────────────┘
           ↓
EVENTO: ELIMINAR ORDEN
┌─────────────────────────────────────────────────┐
│ Delete order (rara vez pasa)                    │
│ ↓ DELETE FROM orders WHERE id = 1               │
│ ↓ Supabase emite evento:                        │
│   {                                             │
│     event: 'DELETE',                            │
│     old: { id: 1, name: 'Juan', ... },          │
│     new: null                                   │
│   }                                             │
│ ↓ Kitchen.tsx recibe evento                     │
│ ↓ Remueve orden del estado                      │
│ ✓ Orden desaparece de la pantalla               │
└─────────────────────────────────────────────────┘
           ↓
SINCRONIZACIÓN MÚLTIPLES USUARIOS:
┌─────────────────────────────────────────────────┐
│ 3 cocinas viendo la interfaz simultáneamente:   │
│                                                  │
│ Cocina 1: Cambia orden a "preparing"            │
│ ↓ INSERT cambio en DB                           │
│ ↓ Supabase emite a TODOS los subscriptores      │
│ ↓ Cocina 2 y 3 ven cambio instantáneamente      │
│ ↓ Todas las pantallas sincronizadas              │
│                                                  │
│ RESULTADO:                                      │
│ • No hay conflictos                             │
│ • No hay cambios duplicados                     │
│ • Todos ven los datos correctos                 │
└─────────────────────────────────────────────────┘
```

---

## 📊 COMPONENTES Y SUS DEPENDENCIAS

```
┌─────────────────────────────────────────────────┐
│ App.tsx (Main Router)                           │
├─────────────────────────────────────────────────┤
│ Dependencias:                                   │
│ • AuthContext (useAuth)                         │
│ • AuthProvider (Wrapper)                        │
│ • CartProvider (Wrapper)                        │
│                                                  │
│ Lógica:                                         │
│ - useEffect: Si user.role === 'admin'          │
│   → Mostrar Dashboard                           │
│ - Si role === 'cocina'                         │
│   → Mostrar Kitchen                             │
│ - Si role === 'delivery'                        │
│   → Mostrar Delivery                            │
│ - Si role === null                              │
│   → Mostrar Menu (o Login)                      │
└─────────────────────────────────────────────────┘
            ↓
┌─────────────┬──────────────┬──────────────┬──────────────┐
│             │              │              │              │
│ Menu.tsx    │ Dashboard.tsx│ Kitchen.tsx  │ Delivery.tsx │
│             │              │              │              │
│ • useCart   │ • Chart      │ • Real-time  │ • Real-time  │
│ • useAuth   │ • Stats      │ • Kanban     │ • Kanban     │
│ • Products  │ • Reports    │ • Actions    │ • Actions    │
│ • Checkout  │              │              │              │
└─────────────┴──────────────┴──────────────┴──────────────┘
            ↓
┌─────────────────────────────────────────────────┐
│ Componentes Compartidos                         │
├─────────────────────────────────────────────────┤
│ • AuthContext - Estado de usuario               │
│ • CartContext - Estado del carrito              │
│ • supabase client - Conexión a backend          │
│ • ProductCardPremium - Tarjeta de producto      │
│ • HeroPremium - Header del menú                 │
└─────────────────────────────────────────────────┘
            ↓
┌─────────────────────────────────────────────────┐
│ Admin Subcomponents                             │
├─────────────────────────────────────────────────┤
│ MenuManager.tsx                                 │
│ • Carga products y categories desde Supabase    │
│ • CRUD para productos                           │
│ • Upload de imágenes                            │
│                                                  │
│ Usuarios.tsx (en desarrollo)                    │
│ • CRUD para usuarios                            │
│ • Gestión de roles                              │
│ • Asignación de sucursal                        │
│                                                  │
│ Otros módulos...                                │
└─────────────────────────────────────────────────┘
```

---

## 🔄 FLUJOS DE DATOS

```
┌─────────────────────────────────────┐
│ DATOS EN REPOSO (Database)          │
├─────────────────────────────────────┤
│ • Productos, categorías             │
│ • Usuarios, roles, permisos          │
│ • Órdenes históricas                │
│ • Sucursales                         │
└─────────────────────────────────────┘
            ↓↑
┌─────────────────────────────────────┐
│ DATOS EN TRÁNSITO (API/Real-time)   │
├─────────────────────────────────────┤
│ • Queries (SELECT)                  │
│ • Mutations (INSERT/UPDATE/DELETE)  │
│ • Subscriptions (WebSocket)         │
│ • Authentication (JWT tokens)       │
└─────────────────────────────────────┘
            ↓↑
┌─────────────────────────────────────┐
│ DATOS EN MEMORIA (Frontend)         │
├─────────────────────────────────────┤
│ • AuthContext (user, role, branch)  │
│ • CartContext (cart items, total)   │
│ • Component state (filters, modals) │
│ • Real-time subscriptions           │
└─────────────────────────────────────┘
            ↓↑
┌─────────────────────────────────────┐
│ DATOS EN UI (Rendered)              │
├─────────────────────────────────────┤
│ • Catálogo de productos             │
│ • Carrito visible                   │
│ • Órdenes en Kanban                 │
│ • Formularios, modales              │
└─────────────────────────────────────┘
```

---

## 🛡️ SEGURIDAD

```
┌─────────────────────────────────────┐
│ NIVELES DE SEGURIDAD                │
├─────────────────────────────────────┤
│                                      │
│ 1. AUTENTICACIÓN (Authentication)   │
│    • Supabase Auth con JWT          │
│    • Email + Password               │
│    • Session management             │
│    • Auto-logout after inactivity   │
│                                      │
│ 2. AUTORIZACIÓN (Authorization)     │
│    • Role-based access control      │
│    • Branch-level filtering         │
│    • RLS (Row Level Security)       │
│                                      │
│ 3. DATA VALIDATION                  │
│    • TypeScript types               │
│    • Form validation (frontend)     │
│    • Database constraints           │
│                                      │
│ 4. API SECURITY                     │
│    • JWT token verification         │
│    • CORS enabled                   │
│    • SQL injection prevention       │
│                                      │
│ 5. STORAGE SECURITY                 │
│    • Signed URLs for sensitive data │
│    • Public bucket for images       │
│    • File type validation           │
│                                      │
└─────────────────────────────────────┘
```

---

## 📱 CASOS DE USO

### Caso 1: Cliente Ordena Comida
```
1. Cliente abre app → Ve menú público
2. Busca/filtra productos
3. Agrega items al carrito
4. Clickea carrito flotante
5. Selecciona tipo de entrega
6. Completa datos (nombre, teléfono, etc.)
7. Elige método de pago
8. Confirma orden
9. Recibe confirmación con número
10. Cocina ve orden en tiempo real
```

### Caso 2: Cocina Prepara Orden
```
1. Cocina abre app → Interfaz Kitchen
2. Ve órdenes pendientes
3. Clickea "PREPARANDO"
4. Orden se mueve a columna central
5. Prepara la comida
6. Clickea "LISTO"
7. Orden se mueve a columna derecha
8. Cliente viene a recoger
9. Cocina entrega
10. Clickea "COMPLETAR"
```

### Caso 3: Delivery Entrega Orden
```
1. Delivery abre app → Interfaz Delivery
2. Ve órdenes listas para entregar
3. Clickea "ASIGNAR A MI"
4. Orden le aparece asignada
5. Clickea "SALGO"
6. Va a domicilio del cliente
7. Entrega orden
8. Clickea "COMPLETAR"
9. Orden se archiva
```

### Caso 4: Admin Gestiona Menú
```
1. Admin abre app → Panel Admin
2. Va a "Menú"
3. Ve todas las categorías
4. Clickea "Agregar Producto"
5. Completa formulario
6. Sube imagen (drag & drop)
7. Guarda
8. Producto aparece en menú cliente al instante
9. Puede editar o eliminar en cualquier momento
```

---

## ✅ RESUMEN ARQUITECTÓNICO

```
CAPAS DE LA APLICACIÓN:

┌──────────────────────────────────────────┐
│ 🎨 PRESENTACIÓN                          │
│ React Components + Tailwind CSS          │
└──────────────────────────────────────────┘
          ↓ (HTTP / WebSocket)
┌──────────────────────────────────────────┐
│ 🔧 LÓGICA DE NEGOCIO                     │
│ Context API (Auth, Cart)                 │
│ Real-time Subscriptions                  │
│ Form Validation                          │
└──────────────────────────────────────────┘
          ↓ (REST API / Real-time)
┌──────────────────────────────────────────┐
│ 💾 DATOS & STORAGE                       │
│ Supabase PostgreSQL                      │
│ Supabase Storage (Imágenes)              │
│ Supabase Auth (Usuarios)                 │
│ Real-time Engine (WebSockets)            │
└──────────────────────────────────────────┘
```

---

## 🎯 FLUJO COMPLETO EN UNA SOLA VISTA

```
┌─ CLIENTE ─────────────────────────────────────────────┐
│ 1. Abre app (Menu.tsx)                               │
│ 2. Autentica (AuthContext.signIn)                    │
│ 3. Ve productos de Supabase                          │
│ 4. Agrega al carrito (useCart)                       │
│ 5. Checkout (Modal)                                  │
│ 6. Crea orden (INSERT)                               │
└────────────────────────────────────────────────────────┘
           ↓↓↓
┌─ SUPABASE ────────────────────────────────────────────┐
│ • Valida datos                                       │
│ • Inserta en orders y order_items                    │
│ • Emite real-time event                              │
│ • Guarda image en storage                            │
└────────────────────────────────────────────────────────┘
           ↓↓↓
┌─ COCINA (Kitchen.tsx) ────────────────────────────────┐
│ • Recibe evento real-time                            │
│ • Ve nueva orden en "Pending"                        │
│ • Clickea "PREPARANDO" → "LISTO"                     │
└────────────────────────────────────────────────────────┘
           ↓↓↓
┌─ DELIVERY (Delivery.tsx) ─────────────────────────────┐
│ • Recibe evento real-time                            │
│ • Ve orden en "Ready"                                │
│ • Asigna a sí mismo                                  │
│ • Hace entrega                                       │
│ • Completa                                           │
└────────────────────────────────────────────────────────┘
           ↓↓↓
┌─ ADMIN (Dashboard) ───────────────────────────────────┐
│ • Ve orden en reportes                               │
│ • Ganancia: +$XX                                     │
│ • Estadísticas actualizadas                          │
└────────────────────────────────────────────────────────┘
```

---

Este es el flujo completo de toda tu plataforma Wernerburger. 
Cada parte se comunica en tiempo real vía WebSockets y REST APIs con Supabase.
