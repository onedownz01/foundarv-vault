import { createClient } from '@supabase/supabase-js'
import { createClientComponentClient, createServerComponentClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Client-side Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Server-side Supabase client
export const createServerClient = () => {
  const cookieStore = cookies()
  return createServerComponentClient({ cookies: () => cookieStore })
}

// Client component Supabase client
export const createClientClient = () => {
  return createClientComponentClient()
}

// Admin client for server-side operations
export const supabaseAdmin = createClient(
  supabaseUrl,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

// Database types
export interface User {
  id: string
  phone: string
  email: string
  foundarv_id: string
  user_type: 'individual' | 'founder'
  created_at: string
  updated_at: string
}

export interface Folder {
  id: string
  user_id: string
  name: string
  parent_id?: string
  folder_type: 'custom' | 'founder'
  created_at: string
  updated_at: string
}

export interface File {
  id: string
  user_id: string
  folder_id?: string
  original_name: string
  display_name: string
  file_type: string
  file_size: number
  mime_type: string
  storage_path: string
  encrypted_key: string
  ai_generated_name: boolean
  tags?: string[]
  metadata?: Record<string, any>
  created_at: string
  updated_at: string
}

export interface Share {
  id: string
  file_id?: string
  folder_id?: string
  shared_by: string
  shared_with_foundarv_id?: string
  shared_with_email?: string
  permission: 'view' | 'upload' | 'full'
  expires_at?: string
  access_token: string
  created_at: string
}

export interface AuditLog {
  id: string
  user_id?: string
  action: string
  resource_type: string
  resource_id?: string
  details?: Record<string, any>
  ip_address?: string
  user_agent?: string
  created_at: string
}

export interface WhatsAppSession {
  id: string
  phone_number: string
  user_id: string
  session_data: Record<string, any>
  created_at: string
  updated_at: string
}
