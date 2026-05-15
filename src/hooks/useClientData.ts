import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Client, Session, AiInsight } from '@/types';

interface ClientData {
  client: Client | null;
  sessions: Session[];
  insights: AiInsight[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useClientData(clientId: string): ClientData {
  const [client, setClient] = useState<Client | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [insights, setInsights] = useState<AiInsight[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!clientId) return;
    load();
  }, [clientId, tick]);

  const load = async () => {
    setLoading(true);
    setError(null);

    const [clientRes, sessionsRes, insightsRes] = await Promise.all([
      supabase.from('clients').select('*').eq('id', clientId).single(),
      supabase.from('sessions').select('*, session_exercises(*)').eq('client_id', clientId).order('started_at', { ascending: false }),
      supabase.from('ai_insights').select('*').eq('client_id', clientId).order('generated_at', { ascending: false }),
    ]);

    if (clientRes.error) { setError('Could not load client.'); setLoading(false); return; }

    setClient(clientRes.data as Client);
    setSessions((sessionsRes.data ?? []) as Session[]);
    setInsights((insightsRes.data ?? []) as AiInsight[]);
    setLoading(false);
  };

  return { client, sessions, insights, loading, error, refetch: () => setTick(t => t + 1) };
}
