-- Hosted tournaments tables often omit settings (place_bid reads min_bid_increment).

alter table public.tournaments
  add column if not exists settings jsonb not null default '{"min_bid_increment": 1000}'::jsonb;

update public.tournaments
set settings = '{"min_bid_increment": 1000}'::jsonb
where settings is null;
