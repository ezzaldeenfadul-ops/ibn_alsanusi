import { createClient } from '@supabase/supabase-js';

export const SUPABASE_PROJECT_ID = 'ieumoqfkxpydyqsgwqvf';
export const SUPABASE_PROJECT_NAME = 'ibnalsanusi';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || `https://${SUPABASE_PROJECT_ID}.supabase.co`;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_PJhcIDVOkEJwMnpks2KvXQ_0kVV1Fsy';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});
