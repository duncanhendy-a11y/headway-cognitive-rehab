import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import type { Professional } from '@/types';

export function useProfessional() {
  const { user } = useAuth();
  const [professional, setProfessional] = useState<Professional | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    load();
  }, [user?.id]);

  async function load() {
    if (!user) return;
    const { data } = await supabase
      .from('professionals')
      .upsert(
        {
          auth_user_id: user.id,
          email: user.email ?? '',
          full_name: user.user_metadata?.full_name ?? user.email ?? 'Professional',
        },
        { onConflict: 'auth_user_id' }
      )
      .select()
      .single();
    if (data) setProfessional(data as Professional);
    setLoading(false);
  }

  return { professional, loading };
}
