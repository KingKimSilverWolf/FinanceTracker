'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { UserPlus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { useAuth } from '@/lib/contexts/auth-context';
import { acceptGroupInvitation } from '@/lib/firebase/groups';

export function JoinGroupDialog() {
  const router = useRouter();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [inviteCode, setInviteCode] = useState('');
  const [joining, setJoining] = useState(false);

  async function handleJoinGroup() {
    if (!user || !inviteCode.trim()) {
      toast.error('Please enter an invite code');
      return;
    }

    try {
      setJoining(true);

      const result = await acceptGroupInvitation(
        inviteCode.trim().toUpperCase(),
        user.uid,
        user.email || '',
        user.displayName || user.email || 'Anonymous',
        user.photoURL || null
      );

      if (result.success) {
        toast.success('Successfully joined the group!');
        setOpen(false);
        setInviteCode('');
        router.push(`/dashboard/groups/${result.groupId}`);
      } else {
        toast.error(result.error || 'Failed to join group');
      }
    } catch (error) {
      console.error('Error joining group:', error);
      toast.error('Failed to join group. Please try again.');
    } finally {
      setJoining(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <UserPlus className="mr-2 h-4 w-4" />
          Join Group
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Join a Group</DialogTitle>
          <DialogDescription>
            Enter the invite code you received to join an existing group.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="invite-code">Invite Code</Label>
            <Input
              id="invite-code"
              placeholder="e.g., B88CCTUO"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
              className="font-mono text-lg tracking-wider text-center uppercase"
              maxLength={8}
              disabled={joining}
            />
            <p className="text-xs text-muted-foreground">
              Enter the 8-character code shared with you
            </p>
          </div>

          <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
            <p className="text-sm">
              <strong>💡 Tip:</strong> You can also join by clicking the invite link directly.
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={joining}>
            Cancel
          </Button>
          <Button onClick={handleJoinGroup} disabled={joining || !inviteCode.trim()}>
            {joining ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Joining...
              </>
            ) : (
              'Join Group'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
