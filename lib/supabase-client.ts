'use client';

import { createClient, SupabaseClient } from '@supabase/supabase-js';

function getEnvVar(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return value;
}

let client: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
  if (!client) {
    const url = getEnvVar('NEXT_PUBLIC_SUPABASE_URL');
    const anonKey = getEnvVar('NEXT_PUBLIC_SUPABASE_ANON_KEY');
    client = createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
  }
  return client;
}

export const supabase = getSupabaseClient();
