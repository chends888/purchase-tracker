import { redirect } from 'next/navigation'
import { TrackerBoard } from '@/components/tracker/TrackerBoard'
import { isSupabaseConfigured, rowToItem } from '@/lib/items'
import { createClient } from '@/lib/supabase/server'
import type { ItemRow, PurchaseItem } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function TrackerPage() {
  if (!isSupabaseConfigured()) {
    redirect('/login')
  }

  let items: PurchaseItem[] = []
  let userEmail: string | null = null
  let loadError: string | null = null

  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      redirect('/login')
    }

    userEmail = user.email ?? null

    const { data, error } = await supabase
      .from('items')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      loadError = error.message
    } else {
      items = ((data ?? []) as ItemRow[]).map(rowToItem)
    }
  } catch (err) {
    loadError =
      err instanceof Error
        ? err.message
        : 'Could not load items. Check your Supabase configuration.'
  }

  return (
    <TrackerBoard
      initialItems={items}
      userEmail={userEmail}
      loadError={loadError}
    />
  )
}
