-- Seed inicial con datos de ejemplo (sucursales, roles, usuarios, ingredientes, productos, recetas, inventario)

-- Sucursales
insert into branches (id, name, address) values (gen_random_uuid(), 'Werner Burguer - Centro', 'Av. Principal 123');
insert into branches (id, name, address) values (gen_random_uuid(), 'Werner Burguer - Norte', 'Calle Secundaria 45');

-- Roles mínimos
insert into roles (name, description) values ('super_admin','Acceso total');
insert into roles (name, description) values ('admin','Administrador de sucursal');
insert into roles (name, description) values ('cocina','Usuario cocina');
insert into roles (name, description) values ('delivery','Usuario delivery');
insert into roles (name, description) values ('caja','Usuario caja');
insert into roles (name, description) values ('inventario','Usuario inventario');

-- Usuarios de ejemplo (para desarrollo) — en producción usar Supabase Auth
insert into users (id, email, username, password_hash) values (gen_random_uuid(), 'admin@werner.local', 'admin', 'fisura-placeholder-hash');

-- Ingredientes
insert into ingredients (id, name, category, unit) values (gen_random_uuid(), 'Pan', 'Panadería', 'unidad');
insert into ingredients (id, name, category, unit) values (gen_random_uuid(), 'Carne', 'Proteínas', 'gramos');
insert into ingredients (id, name, category, unit) values (gen_random_uuid(), 'Queso', 'Lácteos', 'unidad');
insert into ingredients (id, name, category, unit) values (gen_random_uuid(), 'Salsa', 'Condimentos', 'gramos');
insert into ingredients (id, name, category, unit) values (gen_random_uuid(), 'Lechuga', 'Vegetales', 'gramos');
insert into ingredients (id, name, category, unit) values (gen_random_uuid(), 'Tomate', 'Vegetales', 'rodajas');

-- Productos
insert into products (id, name, sku, price, description) values (gen_random_uuid(), 'Hamburguesa Clásica', 'HB-CLASSIC', 7.50, 'Pan, carne, queso, salsa y vegetales');

-- Crear receta para Hamburguesa Clásica
with prod as (select id from products where sku='HB-CLASSIC' limit 1)
insert into recipes (id, product_id) select gen_random_uuid(), id from prod returning id into temp_recipe;

-- Nota: para facilitar el seed, recuperamos ids manualmente con subselects
insert into recipe_items (id, recipe_id, ingredient_id, quantity, unit)
select gen_random_uuid(), r.id,
  (select i.id from ingredients i where i.name = 'Pan' limit 1), 1, 'unidad'
from recipes r join products p on p.id = r.product_id where p.sku = 'HB-CLASSIC';

insert into recipe_items (id, recipe_id, ingredient_id, quantity, unit)
select gen_random_uuid(), r.id,
  (select i.id from ingredients i where i.name = 'Carne' limit 1), 150, 'gramos'
from recipes r join products p on p.id = r.product_id where p.sku = 'HB-CLASSIC';

insert into recipe_items (id, recipe_id, ingredient_id, quantity, unit)
select gen_random_uuid(), r.id,
  (select i.id from ingredients i where i.name = 'Queso' limit 1), 1, 'unidad'
from recipes r join products p on p.id = r.product_id where p.sku = 'HB-CLASSIC';

insert into recipe_items (id, recipe_id, ingredient_id, quantity, unit)
select gen_random_uuid(), r.id,
  (select i.id from ingredients i where i.name = 'Salsa' limit 1), 20, 'gramos'
from recipes r join products p on p.id = r.product_id where p.sku = 'HB-CLASSIC';

insert into recipe_items (id, recipe_id, ingredient_id, quantity, unit)
select gen_random_uuid(), r.id,
  (select i.id from ingredients i where i.name = 'Lechuga' limit 1), 15, 'gramos'
from recipes r join products p on p.id = r.product_id where p.sku = 'HB-CLASSIC';

-- Inventario inicial para la primera sucursal
insert into inventory (branch_id, ingredient_id, quantity, unit, min_stock)
select b.id, i.id, case when i.name='Carne' then 5000 when i.name='Pan' then 100 when i.name='Queso' then 50 when i.name='Salsa' then 2000 when i.name='Lechuga' then 1000 else 100 end, i.unit, 10
from branches b cross join ingredients i where b.name like 'Werner Burguer - Centro';
