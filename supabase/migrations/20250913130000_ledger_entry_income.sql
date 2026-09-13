-- Finance: ensure ledger_entry_type exists and includes income (for DBs that skipped initial_schema).

do $$
begin
  create type public.ledger_entry_type as enum (
    'opening_balance',
    'bid',
    'adjustment',
    'expense',
    'refund',
    'income'
  );
exception
  when duplicate_object then
    begin
      alter type public.ledger_entry_type add value 'income';
    exception
      when duplicate_object then null;
    end;
end $$;

-- If financial_ledger.entry_type is text/varchar, cast it to the enum.
do $$
declare
  v_udt text;
begin
  select c.udt_name
  into v_udt
  from information_schema.columns c
  where c.table_schema = 'public'
    and c.table_name = 'financial_ledger'
    and c.column_name = 'entry_type';

  if v_udt is null then
    return;
  end if;

  if v_udt in ('text', 'varchar') then
    alter table public.financial_ledger
      alter column entry_type type public.ledger_entry_type
      using entry_type::text::public.ledger_entry_type;
  end if;
end $$;
