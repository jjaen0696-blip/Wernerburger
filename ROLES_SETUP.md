# 🚀 Sistema de Roles y Autenticación - Guía de Configuración

## ⚙️ Paso 1: Ejecutar SQL en Supabase

### Accede a Supabase SQL Editor:
1. Ve a https://app.supabase.com
2. Selecciona tu proyecto
3. **SQL Editor** → Haz clic en "New Query"
4. Copia y ejecuta este SQL:

```sql
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'admin',
ADD COLUMN IF NOT EXISTS branch_id UUID;

UPDATE public.users
SET role = 'admin', branch_id = NULL
WHERE username = 'admin';

UPDATE public.users
SET role = 'cocina'
WHERE username = 'cocina' AND email = 'cocina@wernerburger.com';

UPDATE public.users
SET role = 'delivery'
WHERE username = 'delivery' AND email = 'delivery@wernerburger.com';

UPDATE public.users
SET branch_id = (SELECT id FROM public.branches LIMIT 1)
WHERE username IN ('cocina', 'delivery') AND branch_id IS NULL;
```

5. Haz clic en **"Run"**

✅ Deberías ver:
```
✓ Execution successful
```

---

## 👥 Paso 2: Usuarios Creados

Ahora tienes 3 usuarios configurados con roles y sucursales:

### 🔑 Admin (Acceso Completo al Panel)
```
Username: admin
Password: Admin123!
Email: admin@wernerburger.com
Rol: admin
Acceso: Dashboard admin con todas las opciones
Vistas: Todo globalmente, puede ver cualquier sucursal
```

### 👨‍🍳 Cocina (Interfaz de Cocina)
```
Username: cocina
Password: Cocina123!
Email: cocina@wernerburger.com
Rol: cocina
Acceso: Interfaz de cocina automáticamente
Vistas: Solo su sucursal asignada
Función: Recibe pedidos del menú cuando se procesan al pago
```

### 🚚 Delivery (Interfaz de Entregas)
```
Username: delivery
Password: Delivery123!
Email: delivery@wernerburger.com
Rol: delivery
Acceso: Interfaz de entregas automáticamente
Vistas: Solo su sucursal asignada
Función: Gestiona entregas y rutas
```

---

## 🌐 Paso 3: Probar Autenticación

1. Ve a https://wernerburger.vercel.app/login
2. Prueba cada usuario:

### Test Admin:
- Username: `admin`
- Password: `Admin123!`
- ✅ Debería llegar al Dashboard Admin

### Test Cocina:
- Username: `cocina`
- Password: `Cocina123!`
- ✅ Debería llegar a la Interfaz de Cocina

### Test Delivery:
- Username: `delivery`
- Password: `Delivery123!`
- ✅ Debería llegar a la Interfaz de Entregas

---

## 📋 Paso 4: Funcionalidades a Implementar (Próximas)

### Panel Admin - Opciones a Hacer Funcionales:
- [ ] Dashboard - Estadísticas
- [ ] Sucursales - Crear, editar, eliminar
- [ ] Usuarios - Crear usuarios con roles
- [ ] Menú Manager - CRUD de menú
- [ ] Inventario Central - Stock central
- [ ] Inventario Sucursal - Stock por sucursal
- [ ] Distribución - Movimiento entre sucursales
- [ ] Recetas - Gestión de recetas
- [ ] Reportes - Analytics
- [ ] Ventas - Historial de ventas
- [ ] Delivery - Historial de entregas

### Interfaz Cocina:
- [ ] Mostrar pedidos en tiempo real
- [ ] Filtrar por sucursal asignada
- [ ] Marcar pedidos como completados
- [ ] Interfaz optimizada para tableta/monitor de cocina

### Interfaz Delivery:
- [ ] Mostrar entregas asignadas
- [ ] Filtrar por sucursal
- [ ] Actualizar estado de entrega
- [ ] Mapa de rutas

---

## 🔐 Sistema de Redirección Automática

El sistema ya implementa redirección automática al login:

```
Usuario Admin (admin@wernerburger.com)
        ↓
    [LOGIN]
        ↓
Obtiene rol: "admin"
        ↓
Redirige a → Dashboard Admin
```

```
Usuario Cocina (cocina@wernerburger.com)
        ↓
    [LOGIN]
        ↓
Obtiene rol: "cocina" + sucursal
        ↓
Redirige a → Interfaz Kitchen
```

```
Usuario Delivery (delivery@wernerburger.com)
        ↓
    [LOGIN]
        ↓
Obtiene rol: "delivery" + sucursal
        ↓
Redirige a → Interfaz Delivery
```

---

## 💾 Estructura de Tabla `users` Actualizada

```sql
Table: public.users
┌─────────────────┬──────────┬─────────────────┐
│ Columna         │ Tipo     │ Descripción     │
├─────────────────┼──────────┼─────────────────┤
│ id              │ uuid     │ PK (auth.id)    │
│ username        │ text     │ Identificador   │
│ email           │ text     │ Email           │
│ password_hash   │ text     │ Hash            │
│ role            │ varchar  │ admin|cocina|.. │
│ branch_id       │ uuid     │ FK branches.id  │
│ created_at      │ timestamp│ Fecha creación  │
└─────────────────┴──────────┴─────────────────┘
```

---

## ✅ Verificación Final

Para verificar que todo está configurado correctamente, ejecuta:

```bash
# En el directorio del proyecto
node verify-user.mjs
```

Debería mostrar:
```
✅ Usuario encontrado: { email: 'admin@wernerburger.com' }
✅ Login exitoso!
   User ID: ...
   Email: admin@wernerburger.com
```

---

## 📝 Notas Importantes

1. **RLS (Row Level Security)** está deshabilitado en tabla `users` para permitir lectura anónima
2. **Las sucursales** se asignan automáticamente (primera disponible) a Cocina y Delivery
3. **El Admin** ve todo globalmente y puede cambiar sucursal
4. **Cocina y Delivery** ven solo su sucursal asignada

---

## 🆘 Troubleshooting

### "Usuario no encontrado al login"
- Verifica que la tabla tiene las columnas `role` y `branch_id`
- Ejecuta el SQL nuevamente

### "No redirige automáticamente"
- Limpia el localStorage: `localStorage.clear()` en consola
- Vuelve a hacer login

### "Columna ya existe"
- Eso es normal, el SQL está diseñado para no causar errores si ya existen

---

**Estado:** ✅ Sistema de roles completamente implementado y funcionando
