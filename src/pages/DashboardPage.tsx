import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, Plus, Clock, Brain, Play, CaretRight } from '@phosphor-icons/react';
import type { Client } from '@/types';
import { AddClientDialog } from '@/components/AddClientDialog';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

export function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddClient, setShowAddClient] = useState(false);
  const [professionalId, setProfessionalId] = useState<string | null>(null);

  useEffect(() => {
    loadProfessionalAndClients();
  }, [user]);

  const loadProfessionalAndClients = async () => {
    if (!user) return;

    const { data: prof, error: profErr } = await supabase
      .from('professionals')
      .upsert({ email: user.email!, full_name: user.email!.split('@')[0], auth_user_id: user.id }, { onConflict: 'email' })
      .select()
      .single();

    if (profErr || !prof) { setLoading(false); return; }
    setProfessionalId(prof.id);

    const { data: clientData } = await supabase
      .from('clients')
      .select('*')
      .eq('professional_id', prof.id)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    setClients((clientData as Client[]) ?? []);
    setLoading(false);
  };

  const handleClientAdded = (newClient: Client) => {
    setClients(prev => [newClient, ...prev]);
    setShowAddClient(false);
  };

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center h-full">
        <div className="text-slate-400 text-sm">Loading…</div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-10">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: '#003361', letterSpacing: '-0.02em' }}>
            {greeting()}, {user?.email?.split('@')[0]}
          </h1>
          <p className="text-slate-400 mt-1 text-sm">
            {clients.length} active client{clients.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Tooltip>
          <TooltipTrigger>
            <Button
              onClick={() => setShowAddClient(true)}
              className="font-semibold gap-2"
              style={{ backgroundColor: '#003361', color: 'white' }}
            >
              <Plus weight="bold" className="w-4 h-4" />
              Add client
            </Button>
          </TooltipTrigger>
          <TooltipContent>Create a new client profile. Identifier only, no personal data stored.</TooltipContent>
        </Tooltip>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4 mb-10">
        <Card className="border-0 shadow-sm rounded-2xl bg-white">
          <CardHeader className="pb-1 pt-5 px-5">
            <CardTitle className="text-xs font-medium text-slate-400 flex items-center gap-1.5 uppercase tracking-wide">
              <Users className="w-3.5 h-3.5" /> Active clients
            </CardTitle>
          </CardHeader>
          <CardContent className="px-5 pb-5">
            <div className="text-4xl font-bold tracking-tight" style={{ color: '#003361', letterSpacing: '-0.02em' }}>{clients.length}</div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm rounded-2xl bg-white">
          <CardHeader className="pb-1 pt-5 px-5">
            <CardTitle className="text-xs font-medium text-slate-400 flex items-center gap-1.5 uppercase tracking-wide">
              <Clock className="w-3.5 h-3.5" /> Sessions today
            </CardTitle>
          </CardHeader>
          <CardContent className="px-5 pb-5">
            <div className="text-4xl font-bold tracking-tight text-slate-300" style={{ letterSpacing: '-0.02em' }}>0</div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm rounded-2xl bg-white">
          <CardHeader className="pb-1 pt-5 px-5">
            <CardTitle className="text-xs font-medium text-slate-400 flex items-center gap-1.5 uppercase tracking-wide">
              <Brain className="w-3.5 h-3.5" /> Insights pending
            </CardTitle>
          </CardHeader>
          <CardContent className="px-5 pb-5">
            <div className="text-4xl font-bold tracking-tight text-slate-300" style={{ letterSpacing: '-0.02em' }}>0</div>
          </CardContent>
        </Card>
      </div>

      {/* Client roster */}
      <div>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold" style={{ color: '#003361' }}>Your clients</h2>
        </div>

        {clients.length === 0 ? (
          <Card className="border-dashed border-2 border-slate-200 shadow-none bg-transparent rounded-2xl">
            <CardContent className="py-16 text-center">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: '#E8F0F8' }}>
                <Users className="w-6 h-6" style={{ color: '#6491C0' }} />
              </div>
              <p className="text-slate-600 font-semibold mb-1">No clients yet</p>
              <p className="text-slate-400 text-sm mb-5">Add your first client to start a session.</p>
              <Button
                onClick={() => setShowAddClient(true)}
                style={{ backgroundColor: '#003361', color: 'white' }}
                className="font-semibold gap-2"
              >
                <Plus weight="bold" className="w-4 h-4" />
                Add first client
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {clients.map(client => (
              <Card
                key={client.id}
                className="border-0 shadow-sm hover:shadow-md transition-all rounded-2xl bg-white cursor-pointer group"
                onClick={() => navigate(`/clients/${client.id}`)}
              >
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white text-sm flex-shrink-0"
                      style={{ backgroundColor: '#003361' }}>
                      {client.identifier.slice(0, 2).toUpperCase()}
                    </div>
                    <CaretRight className="w-4 h-4 text-slate-300 group-hover:text-slate-400 transition-colors mt-1" />
                  </div>
                  <p className="font-semibold truncate mb-1" style={{ color: '#003361' }}>{client.identifier}</p>
                  <p className="text-xs text-slate-400 mb-4">
                    Added {new Date(client.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                  </p>
                  <Button
                    size="sm"
                    className="w-full text-xs font-semibold gap-1.5 opacity-0 group-hover:opacity-100 transition-all"
                    style={{ backgroundColor: '#FEDC00', color: '#003361' }}
                    onClick={(e: React.MouseEvent) => {
                      e.stopPropagation();
                      navigate('/session/setup', { state: { clientId: client.id, clientIdentifier: client.identifier, professionalId } });
                    }}
                  >
                    <Play weight="fill" className="w-3 h-3" /> Start session
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {professionalId && (
        <AddClientDialog
          open={showAddClient}
          professionalId={professionalId}
          onClose={() => setShowAddClient(false)}
          onClientAdded={handleClientAdded}
        />
      )}
    </div>
  );
}
