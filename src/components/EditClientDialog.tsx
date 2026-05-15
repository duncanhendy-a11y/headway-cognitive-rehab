import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import type { Client } from '@/types';

interface Props {
  open: boolean;
  client: Client;
  onClose: () => void;
  onUpdated: () => void;
}

export function EditClientDialog({ open, client, onClose, onUpdated }: Props) {
  const [identifier, setIdentifier] = useState(client.identifier);
  const [loading, setLoading] = useState(false);
  const [deactivating, setDeactivating] = useState(false);
  const navigate = useNavigate();

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!identifier.trim()) return;
    setLoading(true);

    const { error } = await supabase
      .from('clients')
      .update({ identifier: identifier.trim() })
      .eq('id', client.id);

    setLoading(false);
    if (error) { toast.error('Could not update client.'); return; }
    toast.success('Client updated.');
    onUpdated();
    onClose();
  };

  const handleDeactivate = async () => {
    if (!confirm(`Remove ${client.identifier} from your client list? Their session data will be kept.`)) return;
    setDeactivating(true);

    const { error } = await supabase
      .from('clients')
      .update({ is_active: false })
      .eq('id', client.id);

    setDeactivating(false);
    if (error) { toast.error('Could not remove client.'); return; }
    toast.success(`${client.identifier} removed from your client list.`);
    onClose();
    navigate('/dashboard');
  };

  return (
    <Dialog open={open} onOpenChange={(v: boolean) => !v && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-headway-navy">Edit client</DialogTitle>
          <DialogDescription>Update the name or reference for this client.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSave} className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label htmlFor="edit-identifier" className="font-semibold text-headway-navy">
              Client name or reference
            </Label>
            <Input
              id="edit-identifier"
              value={identifier}
              onChange={e => setIdentifier(e.target.value)}
              maxLength={80}
              required
              autoFocus
            />
          </div>
          <div className="flex gap-3">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
            <Button
              type="submit"
              disabled={loading || !identifier.trim()}
              className="flex-1 font-bold"
              style={{ backgroundColor: '#003361', color: 'white' }}
            >
              {loading ? 'Saving…' : 'Save'}
            </Button>
          </div>
        </form>

        <Separator className="my-2" />

        <div>
          <p className="text-xs text-gray-400 mb-3">
            Removing a client hides them from your dashboard. Their session history is preserved.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDeactivate}
            disabled={deactivating}
            className="w-full text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600"
          >
            {deactivating ? 'Removing…' : 'Remove from client list'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
