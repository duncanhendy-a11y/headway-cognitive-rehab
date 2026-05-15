import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { toast } from 'sonner';
import type { Client } from '@/types';

interface Props {
  open: boolean;
  professionalId: string;
  onClose: () => void;
  onClientAdded: (client: Client) => void;
}

export function AddClientDialog({ open, professionalId, onClose, onClientAdded }: Props) {
  const [identifier, setIdentifier] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!identifier.trim()) return;
    setLoading(true);

    const { data, error } = await supabase
      .from('clients')
      .insert({ professional_id: professionalId, identifier: identifier.trim() })
      .select()
      .single();

    setLoading(false);

    if (error || !data) {
      toast.error('Could not add client. Please try again.');
      return;
    }

    setIdentifier('');
    onClientAdded(data as Client);
    toast.success(`${identifier.trim()} added to your client list.`);
  };

  return (
    <Dialog open={open} onOpenChange={(v: boolean) => !v && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-headway-navy">Add a new client</DialogTitle>
          <DialogDescription>
            Enter a name or reference code. No other personal data is stored.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label htmlFor="identifier" className="font-semibold text-headway-navy">
              Client name or reference
            </Label>
            <Input
              id="identifier"
              value={identifier}
              onChange={e => setIdentifier(e.target.value)}
              placeholder="e.g. John S. or REF-001"
              autoFocus
              maxLength={80}
              required
            />
            <p className="text-xs text-gray-400">
              This is the only information stored — no dates of birth, medical history, or contact details.
            </p>
          </div>
          <div className="flex gap-3">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || !identifier.trim()}
              className="flex-1 font-bold"
              style={{ backgroundColor: '#003361', color: 'white' }}
            >
              {loading ? 'Adding…' : 'Add client'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
