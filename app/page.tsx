import { redirect } from 'next/navigation'
import { isSupabaseConfigured } from '@/lib/items'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  if (!isSupabaseConfigured()) {
    redirect('/login')
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  redirect(user ? '/tracker' : '/login')
}
