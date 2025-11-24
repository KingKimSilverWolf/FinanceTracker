'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Users, Calendar, UserCheck, Loader2, AlertCircle } from 'lucide-react';
import { useAuth } from '@/lib/contexts/auth-context';
import { getGroupInvitation, acceptGroupInvitation, getGroup, type GroupInvitation, type Group } from '@/lib/firebase/groups';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import Link from 'next/link';

interface InvitePageProps {
  params: {
    code: string;
  };
}

export default function InvitePage({ params }: InvitePageProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [invitation, setInvitation] = useState<GroupInvitation | null>(null);
  const [group, setGroup] = useState<Group | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadInvitation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.code]);

  async function loadInvitation() {
    try {
      setLoading(true);
      setError(null);

      const inv = await getGroupInvitation(params.code);
      
      if (!inv) {
        setError('Invalid or expired invitation code');
        return;
      }

      // Check if invitation is expired
      const now = new Date();
      if (now > inv.expiresAt) {
        setError('This invitation has expired');
        return;
      }

      // Check usage limit
      if (inv.usageLimit !== null && inv.usedCount >= inv.usageLimit) {
        setError('This invitation has reached its usage limit');
        return;
      }

      setInvitation(inv);

      // Load group details
      const grp = await getGroup(inv.groupId);
      if (grp) {
        setGroup(grp);
      }
    } catch (err) {
      console.error('Error loading invitation:', err);
      setError('Failed to load invitation. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleJoinGroup() {
    if (!user || !invitation) return;

    try {
      setJoining(true);

      const result = await acceptGroupInvitation(
        params.code,
        user.uid,
        user.email || '',
        user.displayName || user.email || 'Anonymous',
        user.photoURL || null
      );

      if (result.success) {
        toast.success('Successfully joined the group!');
        router.push(`/dashboard/groups/${result.groupId}`);
      } else {
        toast.error(result.error || 'Failed to join group');
        setError(result.error || 'Failed to join group');
      }
    } catch (err) {
      console.error('Error joining group:', err);
      toast.error('Failed to join group. Please try again.');
      setError('Failed to join group. Please try again.');
    } finally {
      setJoining(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Loading invitation...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !invitation) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              <CardTitle>Invalid Invitation</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </CardContent>
          <CardFooter>
            <Button asChild className="w-full">
              <Link href="/dashboard">Go to Dashboard</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Join {invitation.groupName}</CardTitle>
            <CardDescription>
              You&apos;ve been invited by {invitation.createdByName}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {group && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span>{group.members.length} member{group.members.length !== 1 ? 's' : ''}</span>
                </div>
                {group.description && (
                  <p className="text-sm text-muted-foreground">{group.description}</p>
                )}
              </div>
            )}

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Sign in required</AlertTitle>
              <AlertDescription>
                You need to sign in or create an account to join this group.
              </AlertDescription>
            </Alert>
          </CardContent>
          <CardFooter className="flex gap-2">
            <Button asChild className="flex-1">
              <Link href={`/auth/signin?redirect=/invite/${params.code}`}>Sign In</Link>
            </Button>
            <Button asChild variant="outline" className="flex-1">
              <Link href={`/auth/signup?redirect=/invite/${params.code}`}>Sign Up</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Join {invitation.groupName}</CardTitle>
          <CardDescription>
            You&apos;ve been invited by {invitation.createdByName}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {group && (
            <div className="space-y-3 p-4 border rounded-lg">
              <div>
                <h3 className="font-semibold">{group.name}</h3>
                {group.description && (
                  <p className="text-sm text-muted-foreground mt-1">{group.description}</p>
                )}
              </div>

              <div className="flex flex-wrap gap-3 text-sm">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span>{group.members.length} member{group.members.length !== 1 ? 's' : ''}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>Created {group.createdAt.toLocaleDateString()}</span>
                </div>
              </div>

              <div className="pt-2">
                <p className="text-xs text-muted-foreground mb-2">Current members:</p>
                <div className="flex flex-wrap gap-2">
                  {group.members.slice(0, 5).map((member) => (
                    <Badge key={member.userId} variant="secondary" className="text-xs">
                      {member.displayName || member.email}
                      {member.role === 'admin' && ' 👑'}
                    </Badge>
                  ))}
                  {group.members.length > 5 && (
                    <Badge variant="secondary" className="text-xs">
                      +{group.members.length - 5} more
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="flex items-start gap-2 p-3 bg-muted rounded-lg">
            <UserCheck className="h-4 w-4 text-primary mt-0.5" />
            <div className="text-sm">
              <p className="font-medium">What happens next?</p>
              <p className="text-muted-foreground mt-1">
                You&apos;ll be added as a member and can start tracking expenses with the group.
              </p>
            </div>
          </div>

          <div className="text-xs text-muted-foreground space-y-1">
            <p>Invitation expires: {invitation.expiresAt.toLocaleDateString()}</p>
            {invitation.usageLimit && (
              <p>
                Uses: {invitation.usedCount} / {invitation.usageLimit}
              </p>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex gap-2">
          <Button
            onClick={handleJoinGroup}
            disabled={joining}
            className="flex-1"
          >
            {joining ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Joining...
              </>
            ) : (
              'Join Group'
            )}
          </Button>
          <Button asChild variant="outline">
            <Link href="/dashboard">Cancel</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
