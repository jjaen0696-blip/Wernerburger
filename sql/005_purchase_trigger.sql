-- Trigger para ejecutar increment_inventory_by_purchase cuando se inserta un purchase_item
create or replace function fn_purchase_item_after_insert() returns trigger as $$
begin
  perform increment_inventory_by_purchase(new.branch_id, new.ingredient_id, new.quantity, new.unit, new.user_id);
  return new;
end;
$$ language plpgsql;

-- Nota: purchase_items no tiene branch_id/user_id directo, así que creamos un trigger en purchases
create or replace function fn_purchase_after_insert() returns trigger as $$
declare
  it record;
begin
  for it in select * from purchase_items where purchase_id = new.id loop
    perform increment_inventory_by_purchase(new.branch_id, it.ingredient_id, it.quantity, it.unit, new.user_id);
  end loop;
  return new;
end;
$$ language plpgsql;

create trigger trg_purchase_after_insert
after insert on purchases
for each row
execute procedure fn_purchase_after_insert();
