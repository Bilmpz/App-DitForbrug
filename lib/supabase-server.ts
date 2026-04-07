import { createClient } from '@supabase/supabase-js';
import { getServerEnv } from './env';

export function getSupabaseServerClient() {
  const env = getServerEnv();

  return createClient(env.url, env.anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });
}

export function getSupabaseAdminClient() {
  const env = getServerEnv();

  return createClient(env.url, env.serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });
}
