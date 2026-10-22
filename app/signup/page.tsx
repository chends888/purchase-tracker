import { AuthForm } from '@/components/auth/AuthForm'
import { signUp } from '@/lib/actions/auth'
import { isSupabaseConfigured } from '@/lib/items'

export const dynamic = 'force-dynamic'

export default function SignupPage() {
  return (
    <AuthForm
      mode="signup"
      action={signUp}
      configured={isSupabaseConfigured()}
    />
  )
}
