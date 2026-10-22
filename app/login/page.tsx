import { AuthForm } from '@/components/auth/AuthForm'
import { signIn } from '@/lib/actions/auth'
import { isSupabaseConfigured } from '@/lib/items'

export const dynamic = 'force-dynamic'

export default function LoginPage() {
  return (
    <AuthForm
      mode="login"
      action={signIn}
      configured={isSupabaseConfigured()}
    />
  )
}
