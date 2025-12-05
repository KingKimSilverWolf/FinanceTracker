/**
 * Settings Page
 * 
 * Centralized settings for budgets, notifications, and preferences
 */

'use client'

import { BudgetSettings } from "@/components/settings/budget-settings"
import { NotificationSettings } from "@/components/settings/notification-settings"
import { ThemeToggle } from "@/components/settings/theme-toggle"
import { DashboardLayout } from "@/components/layouts/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DollarSign, Bell, Settings as SettingsIcon } from "lucide-react"

export default function SettingsPage() {
  return (
    <DashboardLayout>
      <div className="container max-w-4xl py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground mt-1">
          Manage your budgets, notifications, and preferences
        </p>
      </div>

      <Tabs defaultValue="budgets" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="budgets">
            <DollarSign className="h-4 w-4 mr-2" />
            Budgets
          </TabsTrigger>
          <TabsTrigger value="notifications">
            <Bell className="h-4 w-4 mr-2" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="general">
            <SettingsIcon className="h-4 w-4 mr-2" />
            General
          </TabsTrigger>
        </TabsList>

        <TabsContent value="budgets" className="space-y-4 pt-4">
          <BudgetSettings />
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4 pt-4">
          <NotificationSettings />
        </TabsContent>

        <TabsContent value="general" className="space-y-4 pt-4">
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
              <CardDescription>
                Customize your app experience
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Theme</p>
                  <p className="text-sm text-muted-foreground">
                    Choose your preferred theme
                  </p>
                </div>
                <ThemeToggle />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      </div>
    </DashboardLayout>
  )
}
