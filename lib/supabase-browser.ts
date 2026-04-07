import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { getPublicEnv } from './env';

let savedBrowserClient: SupabaseClient | undefined;

export function getSupabaseBrowserClient() {
  if (savedBrowserClient) {
    return savedBrowserClient;
  }

  const env = getPublicEnv();

  savedBrowserClient = createClient(env.url, env.anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  });

  return savedBrowserClient;
}
