-- Trigger que ejecuta `process_order_deduction` cuando un pedido cambia a 'accepted'
create table order_errors (
  id uuid primary key default gen_random_uuid(),
  order_id uuid,
  error_text text,
  created_at timestamptz default now()
);

create or replace function fn_order_after_update() returns trigger as $$
begin
  -- Si el estado cambió a 'accepted', intentamos deducir inventario
  if (tg_op = 'UPDATE') then
    if (new.status = 'accepted' and old.status <> new.status) then
      begin
        perform process_order_deduction(new.id);
      exception when others then
        -- Guardar el error y resetear a pending para revisión
        insert into order_errors(order_id, error_text) values (new.id, sqlerrm);
        update orders set status = 'pending' where id = new.id;
      end;
    end if;
  end if;
  return new;
end;
$$ language plpgsql;

create trigger trg_order_after_update
after update on orders
for each row
execute procedure fn_order_after_update();
