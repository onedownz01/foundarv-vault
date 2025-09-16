import { supabase, supabaseAdmin, User } from './supabase'
import { createServerClient } from './supabase'
import { cookies } from 'next/headers'

export interface AuthUser extends User {
  foundarv_id: string
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    const supabase = createServerClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error || !user) {
      return null
    }

    // Get user data from our users table
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single()

    if (userError || !userData) {
      return null
    }

    return userData as AuthUser
  } catch (error) {
    console.error('Error getting current user:', error)
    return null
  }
}

export async function signInWithPhone(phone: string, password: string) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      phone,
      password,
    })

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    return { data: null, error }
  }
}

export async function signInWithEmail(email: string, password: string) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    return { data: null, error }
  }
}

export async function signUpWithPhone(phone: string, password: string, email: string, userType: 'individual' | 'founder' = 'individual') {
  try {
    // First create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      phone,
      password,
      options: {
        data: {
          email,
          user_type: userType
        }
      }
    })

    if (authError) throw authError

    // Then create user record in our users table
    if (authData.user) {
      const { error: userError } = await supabaseAdmin
        .from('users')
        .insert({
          id: authData.user.id,
          phone,
          email,
          user_type: userType
        })

      if (userError) throw userError
    }

    return { data: authData, error: null }
  } catch (error) {
    return { data: null, error }
  }
}

export async function signUpWithEmail(email: string, password: string, phone: string, userType: 'individual' | 'founder' = 'individual') {
  try {
    // First create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          phone,
          user_type: userType
        }
      }
    })

    if (authError) throw authError

    // Then create user record in our users table
    if (authData.user) {
      const { error: userError } = await supabaseAdmin
        .from('users')
        .insert({
          id: authData.user.id,
          phone,
          email,
          user_type: userType
        })

      if (userError) throw userError
    }

    return { data: authData, error: null }
  } catch (error) {
    return { data: null, error }
  }
}

export async function signOut() {
  try {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    return { error: null }
  } catch (error) {
    return { error }
  }
}

export async function resetPassword(email: string) {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email)
    if (error) throw error
    return { error: null }
  } catch (error) {
    return { error }
  }
}

export async function getUserByFoundarvId(foundarvId: string): Promise<User | null> {
  try {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('foundarv_id', foundarvId)
      .single()

    if (error || !data) {
      return null
    }

    return data as User
  } catch (error) {
    console.error('Error getting user by Foundarv ID:', error)
    return null
  }
}
