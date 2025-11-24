'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Users, Search, CreditCard } from 'lucide-react';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { DashboardLayout } from '@/components/layouts/dashboard-layout';
import { CreateGroupDialog } from '@/components/groups/create-group-dialog';
import { JoinGroupDialog } from '@/components/groups/join-group-dialog';
import { useAuth } from '@/lib/contexts/auth-context';
import { subscribeToUserGroups, Group } from '@/lib/firebase/groups';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/utils/index';
import { getCardDesign } from '@/lib/constants/card-designs';
import { cn } from '@/lib/utils';

export default function GroupsPage() {
  const { user } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!user) return;

    setLoading(true);

    // Subscribe to real-time updates
    const unsubscribe = subscribeToUserGroups(user.uid, (updatedGroups) => {
      setGroups(updatedGroups);
      setLoading(false);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, [user]);

  const filteredGroups = groups.filter((group) =>
    group.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Groups</h1>
              <p className="text-muted-foreground">
                Manage your expense groups and track shared costs
              </p>
            </div>
            <div className="flex gap-2">
              <JoinGroupDialog />
              <CreateGroupDialog />
            </div>
          </div>

          {/* Search */}
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search groups..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Groups List */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading groups...</p>
              </div>
            </div>
          ) : filteredGroups.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Users className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  {searchQuery ? 'No groups found' : 'No groups yet'}
                </h3>
                <p className="text-muted-foreground text-center mb-6 max-w-sm">
                  {searchQuery
                    ? 'Try adjusting your search query'
                    : 'Create your first group to start tracking shared expenses with friends, roommates, or family.'}
                </p>
                {!searchQuery && <CreateGroupDialog />}
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredGroups.map((group) => {
                const cardDesign = getCardDesign(group.cardDesign);
                return (
                  <Link href={`/dashboard/groups/${group.id}`} key={group.id}>
                    <div className="group cursor-pointer">
                      {/* Bank Card Design */}
                      <div className={cn(
                        'relative h-52 rounded-2xl p-6 shadow-xl',
                        'transition-all duration-300 hover:scale-105 hover:shadow-2xl',
                        'flex flex-col justify-between',
                        cardDesign.gradient,
                        cardDesign.textColor
                      )}>
                        {/* Card Top - Chip & Contactless Icon */}
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            {/* Chip */}
                            <div className={cn(
                              'h-10 w-12 rounded-md',
                              cardDesign.accentColor,
                              'backdrop-blur-sm'
                            )}>
                              <div className="h-full w-full grid grid-cols-3 gap-0.5 p-1">
                                {[...Array(9)].map((_, i) => (
                                  <div key={i} className="bg-white/30 rounded-sm" />
                                ))}
                              </div>
                            </div>
                            {/* Contactless */}
                            <div className={cn('h-6 w-6 rounded-full', cardDesign.accentColor, 'flex items-center justify-center')}>
                              <CreditCard className="h-3 w-3 opacity-70" />
                            </div>
                          </div>
                        </div>

                        {/* Card Middle - Group Name */}
                        <div className="flex-1 flex items-center">
                          <div>
                            <h3 className="text-xl font-bold tracking-wide line-clamp-1 mb-1">
                              {group.name}
                            </h3>
                            <p className="text-xs opacity-80 line-clamp-1">
                              {group.description || 'No description'}
                            </p>
                          </div>
                        </div>

                        {/* Card Bottom - Members & Date */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 opacity-80" />
                            <span className="text-sm font-medium">
                              {group.members.length} {group.members.length === 1 ? 'Member' : 'Members'}
                            </span>
                          </div>
                          <div className="text-xs opacity-70">
                            {formatDate(group.updatedAt)}
                          </div>
                        </div>

                        {/* Card Brand/Logo Area */}
                        <div className="absolute top-6 right-6 text-xs font-bold opacity-60 tracking-widest">
                          DUOFI
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
