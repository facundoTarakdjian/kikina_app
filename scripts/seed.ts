// tsx v4 carga .env.local automáticamente; no se necesita dotenv.config()
import { createClient } from '@supabase/supabase-js'
import { z } from 'zod'
import type { Database } from '../src/types/database'
import preguntasRaw from '../supabase/seed-data/preguntas_kikina.json'
import discrecionRaw from '../supabase/seed-data/discrecion_base.json'

// ─── schemas zod ─────────────────────────────────────────────────────────────
const CATEGORIAS = ['gustos', 'dilemas', 'divertidas', 'profundas', 'pasado', 'futuro', 'nosotros', 'amor', 'picante'] as const
const PreguntaSchema = z.object({
  id: z.number().int().positive(),
  pregunta: z.string().min(1),
  categoria: z.enum(CATEGORIAS),
  origen: z.string().min(1),
})

const DadoFaceSchema = z.object({
  nivel_min: z.number().int().min(1).max(4),
  texto: z.string().min(1),
})
const DadosSchema = z.object({
  accion: z.array(DadoFaceSchema),
  zona:   z.array(DadoFaceSchema),
  modo:   z.array(DadoFaceSchema),
})

const CartaSchema = z.object({
  id:    z.number().int().positive(),
  nivel: z.number().int().min(1).max(4),
  tipo:  z.enum(['verdad', 'reto']),
  texto: z.string().min(1),
})

const IdeaSchema = z.object({
  id:    z.number().int().positive(),
  nivel: z.number().int().min(1).max(4),
  texto: z.string().min(1),
})

const DiscrecionSchema = z.object({
  dados:       DadosSchema,
  cartas:      z.array(CartaSchema),
  lo_probamos: z.array(IdeaSchema),
})

type Json = Database['public']['Tables']['games']['Row']['config']

// ─── helpers ──────────────────────────────────────────────────────────────────
function chunk<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = []
  for (let i = 0; i < arr.length; i += size) chunks.push(arr.slice(i, i + size))
  return chunks
}

// ─── main ─────────────────────────────────────────────────────────────────────
async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    console.error('Falta NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env.local')
    process.exit(1)
  }
  const admin = createClient<Database>(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  async function getCount(table: string, filter?: { column: string; isNull: boolean }): Promise<number> {
    let q = admin.from(table as 'questions').select('*', { count: 'exact', head: true })
    if (filter?.isNull) q = q.is(filter.column, null)
    const { count, error } = await q
    if (error) throw error
    return count ?? 0
  }

  // validar JSON
  console.log('Validando JSON de seed-data...')
  const preguntas = z.array(PreguntaSchema).parse(preguntasRaw)
  const discrecion = DiscrecionSchema.parse(discrecionRaw)
  console.log(`  preguntas: ${preguntas.length}`)
  const dadosTotal = discrecion.dados.accion.length + discrecion.dados.zona.length + discrecion.dados.modo.length
  console.log(`  dados: accion=${discrecion.dados.accion.length} zona=${discrecion.dados.zona.length} modo=${discrecion.dados.modo.length} (total ${dadosTotal})`)
  console.log(`  cartas: ${discrecion.cartas.length}`)
  console.log(`  ideas (lo_probamos): ${discrecion.lo_probamos.length}`)

  // ── 1. pareja ────────────────────────────────────────────────────────────────
  console.log('\n[1/6] Pareja...')
  let coupleId: string
  const { data: existingCouples, error: coupleReadErr } = await admin.from('couples').select('id').limit(1)
  if (coupleReadErr) throw coupleReadErr

  if (existingCouples && existingCouples.length > 0) {
    coupleId = existingCouples[0].id
    console.log(`  ya existe: ${coupleId}`)
  } else {
    const { data, error } = await admin
      .from('couples')
      .insert({ name: 'Kikiña', met_on: '2024-11-16', together_on: '2025-05-25' })
      .select('id')
      .single()
    if (error) throw error
    coupleId = data.id
    console.log(`  creada: ${coupleId}`)
  }

  // ── 2. usuarios de Auth ───────────────────────────────────────────────────────
  console.log('\n[2/6] Buscando usuarios en Auth...')
  const facuEmail = process.env.FACU_EMAIL
  const kikiEmail = process.env.KIKI_EMAIL
  if (!facuEmail || !kikiEmail) {
    console.error('Falta FACU_EMAIL o KIKI_EMAIL en .env.local')
    process.exit(1)
  }
  const { data: { users }, error: usersErr } = await admin.auth.admin.listUsers({ perPage: 50 })
  if (usersErr) throw usersErr

  const facuUser = users.find(u => u.email === facuEmail)
  const kikiUser  = users.find(u => u.email === kikiEmail)
  if (!facuUser) { console.error(`  No encontré ${facuEmail} en Auth. Crealo en el dashboard.`); process.exit(1) }
  if (!kikiUser)  { console.error(`  No encontré ${kikiEmail} en Auth. Crealo en el dashboard.`);  process.exit(1) }
  console.log('  Facu y Kiki encontrados.')

  // ── 3. perfiles ───────────────────────────────────────────────────────────────
  console.log('\n[3/6] Perfiles...')
  // colores: tokens --facu y --kiki de DESIGN.md §3 (tema claro)
  const { error: profilesErr } = await admin.from('profiles').upsert([
    { id: facuUser.id, couple_id: coupleId, display_name: 'Facu', email: facuEmail, color: '#3F5A73' },
    { id: kikiUser.id,  couple_id: coupleId, display_name: 'Kiki', email: kikiEmail,  color: '#A9512D' },
  ], { onConflict: 'id' })
  if (profilesErr) throw profilesErr
  console.log('  OK.')

  // ── 4. juegos base ────────────────────────────────────────────────────────────
  console.log('\n[4/6] Juegos base...')
  const games = [
    { couple_id: coupleId, slug: 'scrabble',      name: 'Scrabble',       emoji: '🔤', scorer: 'scrabble',    config: {} as Json,                                              is_builtin: true, position: 0 },
    { couple_id: coupleId, slug: 'truco',          name: 'Truco',          emoji: '🃏', scorer: 'truco',       config: { target: 30, flor: false } as Json,                     is_builtin: true, position: 1 },
    { couple_id: coupleId, slug: 'chinchon',       name: 'Chinchón',       emoji: '🂡', scorer: 'chinchon',    config: { limit: 101, cut_bonus: -10, reenganche: false } as Json, is_builtin: true, position: 2 },
    { couple_id: coupleId, slug: 'codigo-secreto', name: 'Código Secreto', emoji: '🕵️', scorer: 'winner_only', config: {} as Json,                                              is_builtin: true, position: 3 },
    { couple_id: coupleId, slug: 'auto-amarillo',  name: 'Auto amarillo',  emoji: '🚕', scorer: 'counter',     config: {} as Json,                                              is_builtin: true, position: 4 },
  ]
  const { error: gamesErr } = await admin.from('games').upsert(games, { onConflict: 'couple_id,slug' })
  if (gamesErr) throw gamesErr
  console.log('  OK.')

  // ── 5. preguntas ──────────────────────────────────────────────────────────────
  console.log('\n[5/6] Preguntas...')
  const preguntaCount = await getCount('questions')
  if (preguntaCount >= preguntas.length) {
    console.log(`  ya cargadas (${preguntaCount}), salteando.`)
  } else {
    const rows = preguntas.map(p => ({ id: p.id, text: p.pregunta, category: p.categoria, source: p.origen, active: true }))
    for (const batch of chunk(rows, 100)) {
      const { error } = await admin.from('questions').upsert(batch, { onConflict: 'id' })
      if (error) throw error
    }
    console.log(`  ${preguntas.length} preguntas cargadas.`)
  }

  // ── 6. Discreción (couple_id null = base global) ──────────────────────────────
  console.log('\n[6/6] Discreción...')

  // caras de dados
  const dadoCount = await getCount('discretion_dice_faces', { column: 'couple_id', isNull: true })
  if (dadoCount >= dadosTotal) {
    console.log(`  caras de dados: ya cargadas (${dadoCount}), salteando.`)
  } else {
    const dieRows = (Object.entries(discrecion.dados) as [string, typeof discrecion.dados.accion][])
      .flatMap(([die, faces]) =>
        faces.map(f => ({
          couple_id: null as null,
          die:       die as 'accion' | 'zona' | 'modo',
          min_level: f.nivel_min as 1 | 2 | 3 | 4,
          text:      f.texto,
        }))
      )
    const { error } = await admin.from('discretion_dice_faces').insert(dieRows)
    if (error) throw error
    console.log(`  ${dieRows.length} caras de dados cargadas.`)
  }

  // cartas
  const cartaCount = await getCount('discretion_cards', { column: 'couple_id', isNull: true })
  if (cartaCount >= discrecion.cartas.length) {
    console.log(`  cartas: ya cargadas (${cartaCount}), salteando.`)
  } else {
    const cartaRows = discrecion.cartas.map(c => ({
      couple_id: null as null,
      level:     c.nivel as 1 | 2 | 3 | 4,
      kind:      c.tipo as 'verdad' | 'reto',
      text:      c.texto,
    }))
    for (const batch of chunk(cartaRows, 100)) {
      const { error } = await admin.from('discretion_cards').insert(batch)
      if (error) throw error
    }
    console.log(`  ${cartaRows.length} cartas cargadas.`)
  }

  // ideas
  const ideaCount = await getCount('discretion_ideas', { column: 'couple_id', isNull: true })
  if (ideaCount >= discrecion.lo_probamos.length) {
    console.log(`  ideas: ya cargadas (${ideaCount}), salteando.`)
  } else {
    const ideaRows = discrecion.lo_probamos.map(i => ({
      couple_id: null as null,
      level:     i.nivel as 1 | 2 | 3 | 4,
      text:      i.texto,
    }))
    const { error } = await admin.from('discretion_ideas').insert(ideaRows)
    if (error) throw error
    console.log(`  ${ideaRows.length} ideas cargadas.`)
  }

  // ── conteos finales ────────────────────────────────────────────────────────────
  console.log('\n─── Conteos finales ─────────────────────────────────────────────')
  const [couplesR, profilesR, gamesR, questionsR, diceR, cardsR, ideasR] = await Promise.all([
    admin.from('couples').select('*', { count: 'exact', head: true }),
    admin.from('profiles').select('*', { count: 'exact', head: true }),
    admin.from('games').select('*', { count: 'exact', head: true }),
    admin.from('questions').select('*', { count: 'exact', head: true }),
    admin.from('discretion_dice_faces').select('*', { count: 'exact', head: true }).is('couple_id', null),
    admin.from('discretion_cards').select('*', { count: 'exact', head: true }).is('couple_id', null),
    admin.from('discretion_ideas').select('*', { count: 'exact', head: true }).is('couple_id', null),
  ])
  const expected = { couples: 1, profiles: 2, games: 5, questions: 400, dice: 60, cards: 200, ideas: 80 }
  const actual   = {
    couples:   couplesR.count ?? -1,
    profiles:  profilesR.count ?? -1,
    games:     gamesR.count ?? -1,
    questions: questionsR.count ?? -1,
    dice:      diceR.count ?? -1,
    cards:     cardsR.count ?? -1,
    ideas:     ideasR.count ?? -1,
  }
  let ok = true
  for (const [k, exp] of Object.entries(expected) as [keyof typeof expected, number][]) {
    const act = actual[k]
    if (act !== exp) ok = false
    console.log(`  ${act === exp ? '✓' : '✗'} ${k}: ${act} (esperado ${exp})`)
  }
  console.log(ok ? '\n✓ Seed completado correctamente.' : '\n✗ Hay diferencias en los conteos.')
  process.exit(ok ? 0 : 1)
}

main().catch(err => { console.error(err); process.exit(1) })
