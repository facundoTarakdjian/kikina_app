-- =========================================================
-- 0003_drop_redundant_draws_policies.sql
--
-- La migración 0001 ya creaba la policy "question_draws_couple" FOR ALL
-- en el loop de "tablas de la pareja" (using + with check couple_id = my_couple_id()).
-- Esa policy cubre SELECT, INSERT, UPDATE y DELETE, por lo que las tres
-- policies específicas de 0002 (draws_read, draws_insert, draws_delete) son
-- redundantes.
--
-- Por qué no rompieron nada: PostgreSQL combina políticas permisivas con OR.
-- Para INSERT, la expresión efectiva era:
--   (couple_id = my_couple_id())  ← question_draws_couple
--   OR (couple_id = my_couple_id() AND drawn_by = auth.uid())  ← draws_insert
-- → simplifica a (couple_id = my_couple_id()), igual que antes.
-- Para DELETE, same idea. No hubo conflicto.
--
-- Por qué L-20 andó igual: la policy de 0001 era suficiente desde el primer día.
-- =========================================================

drop policy if exists draws_read   on public.question_draws;
drop policy if exists draws_insert on public.question_draws;
drop policy if exists draws_delete on public.question_draws;
