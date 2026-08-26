import { create } from 'zustand'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabaseClient'

export interface AuthResult {
  error: string | null
  needsEmailConfirmation?: boolean
}

interface AuthState {
  session: Session | null
  user: User | null
  initialized: boolean
  signUp: (email: string, password: string) => Promise<AuthResult>
  signIn: (email: string, password: string) => Promise<AuthResult>
  signOut: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => {
  supabase.auth.getSession().then(({ data }) => {
    set({ session: data.session, user: data.session?.user ?? null, initialized: true })
  })

  supabase.auth.onAuthStateChange((_event, session) => {
    set({ session, user: session?.user ?? null, initialized: true })
  })

  return {
    session: null,
    user: null,
    initialized: false,

    signUp: async (email, password) => {
      const { data, error } = await supabase.auth.signUp({ email, password })
      if (error) return { error: error.message }
      return { error: null, needsEmailConfirmation: !data.session }
    },

    signIn: async (email, password) => {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      return { error: error?.message ?? null }
    },

    signOut: async () => {
      await supabase.auth.signOut()
    },
  }
})
