export function getPublicEnv() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Mangler NEXT_PUBLIC_SUPABASE_URL eller NEXT_PUBLIC_SUPABASE_ANON_KEY');
  }

  return {
    url: supabaseUrl,
    anonKey: supabaseAnonKey
  };
}

export function getServerEnv() {
  const publicEnv = getPublicEnv();
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const openAiApiKey = process.env.OPENAI_API_KEY;
  const receiptModelName = process.env.OPENAI_RECEIPT_MODEL || 'gpt-5.4-mini';

  if (!supabaseServiceRoleKey) {
    throw new Error('Mangler SUPABASE_SERVICE_ROLE_KEY');
  }

  if (!openAiApiKey) {
    throw new Error('Mangler OPENAI_API_KEY');
  }

  return {
    url: publicEnv.url,
    anonKey: publicEnv.anonKey,
    serviceRoleKey: supabaseServiceRoleKey,
    openAIApiKey: openAiApiKey,
    receiptModel: receiptModelName
  };
}
