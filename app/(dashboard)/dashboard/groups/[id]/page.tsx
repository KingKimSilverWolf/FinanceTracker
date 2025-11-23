'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Users, Trash2, Crown } from 'lucide-react';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { useAuth } from '@/lib/contexts/auth-context';
import { getGroup, isGroupAdmin, deleteGroup, removeGroupMember, Group } from '@/lib/firebase/groups';
import { EditGroupDialog } from '@/components/groups/edit-group-dialog';
import { InviteMemberDialog } from '@/components/groups/invite-member-dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { getInitials } from '@/lib/utils';
import { toast } from 'sonner';

export default function GroupDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [group, setGroup] = useState<Group | null>(null);
  const [loading, setLoading] = useState(true);
  const groupId = params.id as string;

  const loadGroup = useCallback(async () => {
    try {
      setLoading(true);
      const groupData = await getGroup(groupId);
      setGroup(groupData);
    } catch (error) {
      console.error('Error loading group:', error);
      toast.error('Failed to load group');
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  useEffect(() => {
    if (user && groupId) {
      loadGroup();
    }
  }, [user, groupId, loadGroup]);

  async function handleDeleteGroup() {
    if (!group || !user) return;

    const confirmed = confirm(
      `Are you sure you want to delete "${group.name}"? This action cannot be undone.`
    );
    if (!confirmed) return;

    try {
      await deleteGroup(groupId);
      toast.success('Group deleted successfully');
      router.push('/dashboard/groups');
    } catch (error) {
      console.error('Error deleting group:', error);
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error('Failed to delete group');
      }
    }
  }

  async function handleRemoveMember(memberId: string, memberName: string) {
    if (!group || !user) return;

    const confirmed = confirm(
      `Are you sure you want to remove ${memberName} from this group?`
    );
    if (!confirmed) return;

    try {
      await removeGroupMember(groupId, memberId);
      toast.success(`${memberName} removed from group`);
      loadGroup(); // Reload group data
    } catch (error) {
      console.error('Error removing member:', error);
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error('Failed to remove member');
      }
    }
  }

  const isAdmin = group && user ? isGroupAdmin(group, user.uid) : false;

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading group...</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  if (!group) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <Card>
            <CardHeader>
              <CardTitle>Group not found</CardTitle>
              <CardDescription>
                The group you are looking for does not exist or you do not have access to it.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => router.push('/dashboard/groups')}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Groups
              </Button>
            </CardContent>
          </Card>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-6">
            <Button variant="ghost" onClick={() => router.push('/dashboard/groups')} className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Groups
            </Button>
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">{group.name}</h1>
                {group.description && (
                  <p className="text-muted-foreground mt-2">{group.description}</p>
                )}
              </div>
              <div className="flex gap-2">
                {isAdmin && (
                  <>
                    <EditGroupDialog group={group} onUpdate={loadGroup} />
                    <Button variant="destructive" size="sm" onClick={handleDeleteGroup}>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete Group
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {/* Members Card */}
            <Card className="md:col-span-2">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-muted-foreground" />
                    <CardTitle>Members</CardTitle>
                    <Badge variant="secondary">{group.members.length}</Badge>
                  </div>
                  {isAdmin && (
                    <InviteMemberDialog groupId={group.id} groupName={group.name} />
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {group.members.map((member, index) => (
                    <div key={member.userId}>
                      {index > 0 && <Separator className="my-4" />}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarImage src={member.photoURL || undefined} />
                            <AvatarFallback>{getInitials(member.displayName)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-medium">{member.displayName}</p>
                              {member.role === 'admin' && (
                                <Crown className="h-4 w-4 text-primary" />
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">{member.email}</p>
                          </div>
                        </div>
                        {isAdmin && member.userId !== user?.uid && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveMember(member.userId, member.displayName)}
                          >
                            Remove
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats Card */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Total Expenses</p>
                  <p className="text-2xl font-bold">$0.00</p>
                </div>
                <Separator />
                <div>
                  <p className="text-sm text-muted-foreground">Your Balance</p>
                  <p className="text-2xl font-bold">$0.00</p>
                </div>
                <Separator />
                <div>
                  <p className="text-sm text-muted-foreground">Pending Settlements</p>
                  <p className="text-2xl font-bold">0</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Expenses Section (Coming Soon) */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Recent Expenses</CardTitle>
              <CardDescription>Track and split expenses with your group</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Users className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No expenses yet</h3>
                <p className="text-muted-foreground mb-6 max-w-sm">
                  Start adding expenses to track who paid and split the costs among members.
                </p>
                <Button disabled>Add Expense (Coming Soon)</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </ProtectedRoute>
  );
}
