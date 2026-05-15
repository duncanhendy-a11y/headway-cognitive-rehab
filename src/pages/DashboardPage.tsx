import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, Plus, Clock, Brain } from 'lucide-react';
import type { Client } from '@/types';
import { AddClientDialog } from '@/components/AddClientDialog';

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

    // Upsert professional record on first login
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
        <div className="text-headway-navy">Loading…</div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-headway-navy">
            {greeting()}, {user?.email?.split('@')[0]}
          </h1>
          <p className="text-gray-500 mt-1">
            {clients.length} active client{clients.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Button
          onClick={() => setShowAddClient(true)}
          className="font-bold"
          style={{ backgroundColor: '#003361', color: 'white' }}
        >
          <Plus className="w-4 h-4 mr-2" />
          Add client
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <Users className="w-4 h-4" /> Active clients
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-headway-navy">{clients.length}</div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <Clock className="w-4 h-4" /> Sessions today
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-headway-navy">—</div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <Brain className="w-4 h-4" /> Insights pending
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-headway-navy">—</div>
          </CardContent>
        </Card>
      </div>

      {/* Client roster */}
      <div>
        <h2 className="text-lg font-bold text-headway-navy mb-4">Your clients</h2>

        {clients.length === 0 ? (
          <Card className="border-dashed border-2 border-gray-200 shadow-none">
            <CardContent className="py-16 text-center">
              <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 font-medium mb-1">No clients yet</p>
              <p className="text-gray-400 text-sm mb-5">
                Add your first client to start a session.
              </p>
              <Button
                onClick={() => setShowAddClient(true)}
                style={{ backgroundColor: '#003361', color: 'white' }}
                className="font-bold"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add first client
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {clients.map(client => (
              <Card
                key={client.id}
                className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer group"
                onClick={() => navigate(`/clients/${client.id}`)}
              >
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white text-sm flex-shrink-0"
                      style={{ backgroundColor: '#6491C0' }}>
                      {client.identifier.slice(0, 2).toUpperCase()}
                    </div>
                    <Badge variant="outline" className="text-xs text-gray-400 border-gray-200">
                      Active
                    </Badge>
                  </div>
                  <p className="font-semibold text-headway-navy truncate">{client.identifier}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Added {new Date(client.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                  </p>
                  <Button
                    size="sm"
                    className="w-full mt-4 text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ backgroundColor: '#FEDC00', color: '#003361' }}
                    onClick={(e: React.MouseEvent) => {
                      e.stopPropagation();
                      navigate('/session/setup', { state: { clientId: client.id, clientIdentifier: client.identifier, professionalId } });
                    }}
                  >
                    Start session
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
