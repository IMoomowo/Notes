import { supabase } from './supabaseClient'


export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
  return true
}

export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser()
  return user
}


export async function getSession() {
  const { data: { session } } = await supabase.auth.getSession()
  return session
}

