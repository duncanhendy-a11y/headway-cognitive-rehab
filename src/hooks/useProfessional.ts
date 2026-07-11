import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Professional } from '@/types';

// POC BYPASS — fetches the first professional in the DB instead of upserting
// by auth user ID. Re-enable auth-based upsert when auth is restored.
export function useProfessional() {
  const [professional, setProfessional] = useState<Professional | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('professionals')
      .select('*')
      .limit(1)
      .single()
      .then(({ data }) => {
        if (data) setProfessional(data as Professional);
        setLoading(false);
      });
  }, []);

  return { professional, loading };
}
