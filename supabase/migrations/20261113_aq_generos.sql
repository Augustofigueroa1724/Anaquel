-- Catálogo común de géneros (como place_types en Fifth Square): lo ven todos, cualquiera con
-- sesión añade, sin duplicados (sin distinguir mayúsculas) y se borra solo si nadie lo usa.
-- Los géneros base viven en la app (GENEROS_BASE); aquí solo los que añaden los usuarios.
create table if not exists public.aq_generos (
  nombre text primary key check (char_length(btrim(nombre)) between 2 and 30),
  creado_por uuid default auth.uid() references auth.users(id) on delete set null,
  creado timestamptz not null default now()
);
create unique index if not exists aq_generos_unico on public.aq_generos (lower(btrim(nombre)));
alter table public.aq_generos enable row level security;
create policy aq_generos_ver on public.aq_generos for select to anon, authenticated using (true);
create policy aq_generos_alta on public.aq_generos for insert to authenticated with check (creado_por = (select auth.uid()));

-- Borrar un género del catálogo solo si ningún libro de nadie lo usa.
create or replace function public.aq_borra_genero(g text)
returns boolean language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null then raise exception 'sin sesión'; end if;
  if exists (select 1 from public.aq_libros where lower(datos->>'genero') = lower(btrim(g))) then
    return false;
  end if;
  delete from public.aq_generos where lower(nombre) = lower(btrim(g));
  return true;
end;
$$;
revoke all on function public.aq_borra_genero(text) from public, anon;
grant execute on function public.aq_borra_genero(text) to authenticated;
