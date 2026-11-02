-- =========================================================
-- 0002_question_draws_rls.sql — Políticas RLS para question_draws
-- La tabla ya tiene RLS habilitado pero le faltaban las políticas.
-- =========================================================

-- Lectura: ambos miembros de la pareja ven todos los draws del couple
create policy draws_read on public.question_draws
  for select to authenticated
  using (couple_id = public.my_couple_id());

-- Inserción: solo tu propio draw, con tu couple_id
create policy draws_insert on public.question_draws
  for insert to authenticated
  with check (couple_id = public.my_couple_id() and drawn_by = auth.uid());

-- Borrado (reinicio de filtro): cualquier miembro de la pareja puede borrar draws del couple
create policy draws_delete on public.question_draws
  for delete to authenticated
  using (couple_id = public.my_couple_id());
