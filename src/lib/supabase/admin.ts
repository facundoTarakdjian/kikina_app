import { createClient } from '@supabase/supabase-js'
import type { Database } from '../../types/database'

// Solo para Route Handlers (/api/*) y scripts/. Nunca importar desde código cliente.
export const adminClient = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } },
)
