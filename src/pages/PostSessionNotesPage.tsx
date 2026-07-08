import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { sessionStore } from '@/lib/sessionStore';
import { supabase } from '@/lib/supabase';
import { NotePencil } from '@phosphor-icons/react';

export function PostSessionNotesPage() {
  const navigate = useNavigate();
  const session = sessionStore.get();
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  if (!session) {
    navigate('/dashboard');
    return null;
  }

  const closeSession = async (withNotes: string | null) => {
    setSaving(true);
    const id = session.sessionId;
    await supabase
      .from('sessions')
      .update({
        notes: withNotes ?? null,
        completed_at: new Date().toISOString(),
      })
      .eq('id', id);
    sessionStore.clear();
    navigate(`/session/${id}/report`);
    fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-session-insights`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sessionId: id }),
      }
    );
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8" style={{ backgroundColor: '#F8FAFC' }}>
      <div className="w-full max-w-lg">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: '#EEF3FA' }}>
            <NotePencil weight="duotone" className="w-5 h-5" style={{ color: '#003361' }} />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight" style={{ color: '#003361', letterSpacing: '-0.02em' }}>
              Session notes
            </h1>
            <p className="text-sm text-slate-400">
              {session.clientIdentifier}'s session
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-6 mb-5 border border-slate-100">
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Record your observations, behaviours, or responses from this session…"
            rows={10}
            className="w-full resize-none text-sm text-slate-700 focus:outline-none leading-relaxed placeholder:text-slate-300"
            autoFocus
          />
        </div>

        <div className="space-y-3">
          <button
            onClick={() => closeSession(notes.trim() || null)}
            disabled={saving}
            className="w-full py-4 rounded-xl font-semibold text-sm transition-colors"
            style={{ backgroundColor: '#003361', color: 'white' }}
          >
            {saving ? 'Saving…' : 'Save notes & view report'}
          </button>
          <button
            onClick={() => closeSession(null)}
            disabled={saving}
            className="w-full py-3 rounded-xl text-slate-400 text-sm hover:text-slate-600 transition-colors"
          >
            Skip notes
          </button>
        </div>
      </div>
    </div>
  );
}
