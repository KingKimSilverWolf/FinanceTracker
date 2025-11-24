'use client';

import { useState } from 'react';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { DashboardLayout } from '@/components/layouts/dashboard-layout';
import { useAuth } from '@/lib/contexts/auth-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';
import { getInitials } from '@/lib/utils';
import { User, Mail, Calendar, Bell, DollarSign, Globe, Download, Shield, Smartphone } from 'lucide-react';
import { toast } from 'sonner';

export default function ProfilePage() {
  const { user, userProfile } = useAuth();
  
  // Settings state
  const [notifications, setNotifications] = useState({
    email: true,
    push: false,
    settlements: true,
    largeExpense: true,
    monthly: true,
  });

  const [preferences, setPreferences] = useState({
    currency: 'USD',
    locale: 'en-US',
  });

  const handleNotificationToggle = (key: keyof typeof notifications) => {
    setNotifications(prev => ({ ...prev, [key]: !prev[key] }));
    toast.success('Notification preferences updated');
  };

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-primary/10">
          <header className="border-b bg-background/95 backdrop-blur">
            <div className="container mx-auto px-4 py-4">
              <h1 className="text-2xl font-bold">Profile</h1>
              <p className="text-sm text-muted-foreground">Manage your account settings</p>
            </div>
          </header>

          <main className="container mx-auto px-4 py-8">
            <div className="max-w-2xl mx-auto space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Profile Information</CardTitle>
                  <CardDescription>
                    Your personal information and account details
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center gap-4">
                    <Avatar className="w-20 h-20">
                      <AvatarImage src={user?.photoURL || undefined} alt={userProfile?.displayName} />
                      <AvatarFallback className="text-2xl">
                        {getInitials(userProfile?.displayName || user?.email || 'User')}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="text-xl font-semibold">{userProfile?.displayName || 'User'}</h3>
                      <p className="text-sm text-muted-foreground">{user?.email}</p>
                    </div>
                  </div>

                  <div className="space-y-4 pt-4 border-t">
                    <div className="flex items-center gap-3">
                      <User className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Display Name</p>
                        <p className="text-sm text-muted-foreground">
                          {userProfile?.displayName || 'Not set'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Mail className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Email</p>
                        <p className="text-sm text-muted-foreground">{user?.email}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Calendar className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Member Since</p>
                        <p className="text-sm text-muted-foreground">
                          {user?.metadata.creationTime
                            ? new Date(user.metadata.creationTime).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                              })
                            : 'Unknown'}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Account Settings</CardTitle>
                  <CardDescription>
                    Additional settings and preferences
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-8">
                  {/* Notifications */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 pb-2">
                      <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-500/10 flex items-center justify-center">
                        <Bell className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <p className="font-medium">Notifications</p>
                        <p className="text-sm text-muted-foreground">
                          Manage your notification preferences
                        </p>
                      </div>
                    </div>

                    <div className="space-y-4 pl-13">
                      <div className="flex items-center justify-between py-3 border-b">
                        <div>
                          <p className="text-sm font-medium">Email Notifications</p>
                          <p className="text-xs text-muted-foreground">
                            Receive updates via email
                          </p>
                        </div>
                        <Switch
                          checked={notifications.email}
                          onCheckedChange={() => handleNotificationToggle('email')}
                        />
                      </div>

                      <div className="flex items-center justify-between py-3 border-b">
                        <div>
                          <p className="text-sm font-medium">Push Notifications</p>
                          <p className="text-xs text-muted-foreground">
                            Get notified on your device (coming soon)
                          </p>
                        </div>
                        <Switch
                          checked={notifications.push}
                          onCheckedChange={() => handleNotificationToggle('push')}
                          disabled
                        />
                      </div>

                      <div className="flex items-center justify-between py-3 border-b">
                        <div>
                          <p className="text-sm font-medium">Settlement Reminders</p>
                          <p className="text-xs text-muted-foreground">
                            Notify when settlements are due
                          </p>
                        </div>
                        <Switch
                          checked={notifications.settlements}
                          onCheckedChange={() => handleNotificationToggle('settlements')}
                        />
                      </div>

                      <div className="flex items-center justify-between py-3 border-b">
                        <div>
                          <p className="text-sm font-medium">Large Expense Alerts</p>
                          <p className="text-xs text-muted-foreground">
                            Alert when expenses exceed threshold
                          </p>
                        </div>
                        <Switch
                          checked={notifications.largeExpense}
                          onCheckedChange={() => handleNotificationToggle('largeExpense')}
                        />
                      </div>

                      <div className="flex items-center justify-between py-3">
                        <div>
                          <p className="text-sm font-medium">Monthly Summary</p>
                          <p className="text-xs text-muted-foreground">
                            Monthly spending report via email
                          </p>
                        </div>
                        <Switch
                          checked={notifications.monthly}
                          onCheckedChange={() => handleNotificationToggle('monthly')}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Currency & Locale */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 pb-2">
                      <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-green-500/20 to-green-500/10 flex items-center justify-center">
                        <DollarSign className="h-5 w-5 text-green-600 dark:text-green-400" />
                      </div>
                      <div>
                        <p className="font-medium">Regional Settings</p>
                        <p className="text-sm text-muted-foreground">
                          Currency and locale preferences
                        </p>
                      </div>
                    </div>

                    <div className="space-y-4 pl-13">
                      <div className="flex items-center justify-between py-3 border-b">
                        <div>
                          <p className="text-sm font-medium">Currency</p>
                          <p className="text-xs text-muted-foreground">
                            Default currency for expenses
                          </p>
                        </div>
                        <span className="text-sm font-medium text-muted-foreground">
                          {preferences.currency}
                        </span>
                      </div>

                      <div className="flex items-center justify-between py-3">
                        <div>
                          <p className="text-sm font-medium">Locale</p>
                          <p className="text-xs text-muted-foreground">
                            Date and number format
                          </p>
                        </div>
                        <span className="text-sm font-medium text-muted-foreground">
                          {preferences.locale}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Data & Privacy */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 pb-2">
                      <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-purple-500/20 to-purple-500/10 flex items-center justify-center">
                        <Shield className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div>
                        <p className="font-medium">Data & Privacy</p>
                        <p className="text-sm text-muted-foreground">
                          Manage your data and privacy settings
                        </p>
                      </div>
                    </div>

                    <div className="space-y-4 pl-13">
                      <div className="flex items-center justify-between py-3 border-b">
                        <div>
                          <p className="text-sm font-medium">Export Data</p>
                          <p className="text-xs text-muted-foreground">
                            Download all your data (CSV)
                          </p>
                        </div>
                        <Download className="h-4 w-4 text-muted-foreground" />
                      </div>

                      <div className="flex items-center justify-between py-3">
                        <div>
                          <p className="text-sm font-medium">Data Retention</p>
                          <p className="text-xs text-muted-foreground">
                            How long we keep your data
                          </p>
                        </div>
                        <span className="text-xs text-muted-foreground">Indefinitely</span>
                      </div>
                    </div>
                  </div>

                  {/* App Settings */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 pb-2">
                      <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-500/10 flex items-center justify-center">
                        <Smartphone className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                      </div>
                      <div>
                        <p className="font-medium">App Settings</p>
                        <p className="text-sm text-muted-foreground">
                          Application preferences
                        </p>
                      </div>
                    </div>

                    <div className="space-y-4 pl-13">
                      <div className="flex items-center justify-between py-3 border-b">
                        <div>
                          <p className="text-sm font-medium">Default Split Method</p>
                          <p className="text-xs text-muted-foreground">
                            How expenses are split by default
                          </p>
                        </div>
                        <span className="text-sm font-medium text-muted-foreground">Equal</span>
                      </div>

                      <div className="flex items-center justify-between py-3">
                        <div>
                          <p className="text-sm font-medium">App Version</p>
                          <p className="text-xs text-muted-foreground">
                            Current version of DuoFi
                          </p>
                        </div>
                        <span className="text-xs text-muted-foreground">v0.1.0</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </main>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
