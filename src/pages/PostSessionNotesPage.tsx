import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { sessionStore } from '@/lib/sessionStore';
import { supabase } from '@/lib/supabase';

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
    await supabase
      .from('sessions')
      .update({
        notes: withNotes ?? null,
        completed_at: new Date().toISOString(),
      })
      .eq('id', session.sessionId);
    const id = session.sessionId;
    sessionStore.clear();
    setSaving(false);
    navigate(`/session/${id}/report`);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8" style={{ backgroundColor: '#F4F6F9' }}>
      <div className="w-full max-w-lg">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-headway-navy">Session notes</h1>
          <p className="text-sm text-gray-400 mt-1">
            Record your observations for {session.clientIdentifier}'s session.
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Note any observations, behaviours, or responses during the session…"
            rows={9}
            className="w-full resize-none text-sm text-gray-700 focus:outline-none leading-relaxed placeholder:text-gray-300"
            autoFocus
          />
        </div>

        <div className="space-y-3">
          <button
            onClick={() => closeSession(notes.trim() || null)}
            disabled={saving}
            className="w-full py-4 rounded-xl font-bold text-base transition-colors"
            style={{ backgroundColor: '#003361', color: 'white' }}
          >
            {saving ? 'Saving…' : 'Save & view report'}
          </button>
          <button
            onClick={() => closeSession(null)}
            disabled={saving}
            className="w-full py-3 rounded-xl text-gray-400 text-sm hover:text-gray-600 transition-colors"
          >
            Skip notes
          </button>
        </div>
      </div>
    </div>
  );
}
