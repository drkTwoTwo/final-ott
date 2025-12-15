// Authentication utilities for Edge Functions

import { createAdminClient } from './supabase.ts';

export async function isAdmin(userId: string): Promise<boolean> {
  const supabase = createAdminClient();
  
  const { data, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .eq('role', 'admin')
    .single();

  if (error || !data) {
    return false;
  }

  return true;
}

export async function getUserFromRequest(
  req: Request
): Promise<{ userId: string | null; token: string | null }> {
  const authHeader = req.headers.get('Authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { userId: null, token: null };
  }

  const token = authHeader.replace('Bearer ', '');
  const supabase = createAdminClient();
  
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);

  if (error || !user) {
    return { userId: null, token: null };
  }

  return { userId: user.id, token };
}


