import { redirect } from 'next/navigation'
import { TrackerBoard } from '@/components/tracker/TrackerBoard'
import { isSupabaseConfigured, rowToItem } from '@/lib/items'
import { createClient } from '@/lib/supabase/server'
import type { ItemRow, Plan, PurchaseItem } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function TrackerPage() {
  if (!isSupabaseConfigured()) {
    redirect('/login')
  }

  let items: PurchaseItem[] = []
  let userEmail: string | null = null
  let plan: Plan = 'free'
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

    const [itemsResult, profileResult] = await Promise.all([
      supabase
        .from('items')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false }),
      supabase.from('profiles').select('plan').eq('id', user.id).maybeSingle(),
    ])

    if (itemsResult.error) {
      loadError = itemsResult.error.message
    } else {
      items = ((itemsResult.data ?? []) as ItemRow[]).map(rowToItem)
    }

    if (profileResult.error) {
      loadError = loadError ?? profileResult.error.message
    } else if (profileResult.data?.plan === 'pro' || profileResult.data?.plan === 'free') {
      plan = profileResult.data.plan
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
      plan={plan}
      loadError={loadError}
    />
  )
}
