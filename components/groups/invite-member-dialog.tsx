'use client';

import { useState, useEffect } from 'react';
import { UserPlus, Copy, Check, Loader2 } from 'lucide-react';
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
import { createGroupInvitation, type GroupInvitation } from '@/lib/firebase/groups';

interface InviteMemberDialogProps {
  groupId: string;
  groupName: string;
}

export function InviteMemberDialog({ groupId, groupName }: InviteMemberDialogProps) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [invitation, setInvitation] = useState<GroupInvitation | null>(null);

  useEffect(() => {
    if (open && !invitation && user) {
      generateInvitation();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  async function generateInvitation() {
    if (!user) return;

    try {
      setLoading(true);
      const inv = await createGroupInvitation(
        groupId,
        groupName,
        user.uid,
        user.displayName || user.email || 'Anonymous',
        7, // 7 days expiry
        null // unlimited uses
      );
      setInvitation(inv);
    } catch (error) {
      console.error('Error creating invitation:', error);
      toast.error('Failed to create invitation');
    } finally {
      setLoading(false);
    }
  }

  const inviteLink = invitation 
    ? `${window.location.origin}/invite/${invitation.inviteCode}`
    : '';

  async function handleCopyLink() {
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      toast.success('Invite link copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy link');
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <UserPlus className="mr-2 h-4 w-4" />
          Invite Member
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Invite Member to {groupName}</DialogTitle>
          <DialogDescription>
            Share this link with anyone you want to add to this group. They&apos;ll need to sign
            in or create an account to join.
          </DialogDescription>
        </DialogHeader>
        
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : invitation ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="invite-link">Invite Link</Label>
              <div className="flex gap-2">
                <Input id="invite-link" value={inviteLink} readOnly className="font-mono text-sm" />
                <Button onClick={handleCopyLink} variant="outline" size="icon">
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="invite-code">Invite Code</Label>
              <div className="flex gap-2">
                <Input 
                  id="invite-code" 
                  value={invitation.inviteCode} 
                  readOnly 
                  className="font-mono text-lg font-semibold tracking-wider text-center" 
                />
              </div>
            </div>

            <div className="rounded-lg bg-muted p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Valid until:</span>
                <span className="font-medium">{invitation.expiresAt.toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Uses:</span>
                <span className="font-medium">
                  {invitation.usageLimit ? `${invitation.usedCount} / ${invitation.usageLimit}` : 'Unlimited'}
                </span>
              </div>
            </div>

            <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
              <p className="text-sm text-foreground">
                <strong>💡 Tip:</strong> Anyone with this link can join your group. Share it only with people you trust.
              </p>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            Failed to generate invitation. Please try again.
          </div>
        )}
        
        <DialogFooter>
          <Button onClick={() => setOpen(false)}>Done</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
