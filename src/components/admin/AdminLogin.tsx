import { useActionState } from 'react'
import { supabase } from '../../lib/supabase'

interface Props {
  onSuccess: () => void
}

type LoginState = { error: string | null }

export default function AdminLogin({ onSuccess }: Props) {
  const [state, action, isPending] = useActionState<LoginState, FormData>(
    async (_prev, formData) => {
      const email = formData.get('email') as string
      const password = formData.get('password') as string

      const { error } = await supabase.auth.signInWithPassword({ email, password })

      if (error) return { error: 'Credenciales incorrectas.' }

      onSuccess()
      return { error: null }
    },
    { error: null },
  )

  return (
    <div className="min-h-screen bg-bg-deep flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <a href="/" className="font-heading text-5xl text-cream tracking-widest hover:text-accent transition-colors">MÍTICO</a>
          <p className="text-muted text-sm mt-1 font-body">Panel de administración</p>
        </div>

        <form action={action} className="bg-bg-card rounded-2xl p-8 flex flex-col gap-5 border border-white/5">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="email" className="text-cream/70 text-xs font-body uppercase tracking-wider">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              className="bg-bg-deep border border-white/10 rounded-lg px-4 py-3 text-cream font-body text-sm outline-none focus:border-accent transition-colors placeholder:text-muted"
              placeholder="admin@mitico.bar"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="password" className="text-cream/70 text-xs font-body uppercase tracking-wider">
              Contraseña
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className="bg-bg-deep border border-white/10 rounded-lg px-4 py-3 text-cream font-body text-sm outline-none focus:border-accent transition-colors placeholder:text-muted"
              placeholder="••••••••"
            />
          </div>

          {state.error && (
            <p className="text-red-400 text-xs font-body text-center">{state.error}</p>
          )}

          <button
            type="submit"
            disabled={isPending}
            className="bg-accent hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed text-white font-body font-semibold rounded-lg py-3 transition-colors text-sm mt-1"
          >
            {isPending ? 'Ingresando…' : 'Ingresar'}
          </button>
        </form>
      </div>
    </div>
  )
}
