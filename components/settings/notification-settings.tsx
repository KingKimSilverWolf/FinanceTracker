"use client"

/**
 * Notification Settings Component
 * 
 * Configure notification preferences and thresholds
 */

import * as React from "react"
import { useAuth } from "@/lib/contexts/auth-context"
import { 
  getNotificationPreferences,
  saveNotificationPreferences,
  type NotificationPreferences 
} from "@/lib/notifications"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Save, Bell, AlertTriangle, TrendingUp, CreditCard } from "lucide-react"
import { toast } from "sonner"

export function NotificationSettings() {
  const { user } = useAuth()
  const [preferences, setPreferences] = React.useState<NotificationPreferences | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [saving, setSaving] = React.useState(false)

  React.useEffect(() => {
    if (!user) return

    const loadPreferences = async () => {
      setLoading(true)
      const prefs = await getNotificationPreferences(user.uid)
      if (prefs) {
        setPreferences(prefs)
      }
      setLoading(false)
    }

    loadPreferences()
  }, [user])

  const handleSave = async () => {
    if (!user || !preferences) return

    try {
      setSaving(true)
      await saveNotificationPreferences(preferences)
      toast.success('Notification settings saved successfully')
    } catch (error) {
      console.error('Error saving notification settings:', error)
      toast.error('Failed to save notification settings')
    } finally {
      setSaving(false)
    }
  }

  if (loading || !preferences) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Notification Settings</CardTitle>
          <CardDescription>Loading...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-3/4" />
            <div className="h-4 bg-muted rounded w-full" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notification Settings</CardTitle>
        <CardDescription>
          Manage your notification preferences and alert thresholds
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Master Toggle */}
        <div className="flex items-center justify-between p-4 rounded-lg border">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-muted-foreground" />
              <Label className="text-base">In-App Notifications</Label>
            </div>
            <p className="text-sm text-muted-foreground">
              Receive notifications within the app
            </p>
          </div>
          <Switch
            checked={preferences.inAppNotifications}
            onCheckedChange={(checked) =>
              setPreferences({ ...preferences, inAppNotifications: checked })
            }
          />
        </div>

        {/* Budget Warning Threshold */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            <Label>Budget Warning Threshold</Label>
          </div>
          <div className="flex items-center gap-3">
            <Input
              type="number"
              min="50"
              max="100"
              value={preferences.budgetWarningThreshold}
              onChange={(e) =>
                setPreferences({
                  ...preferences,
                  budgetWarningThreshold: Number(e.target.value),
                })
              }
              className="max-w-[100px]"
              disabled={!preferences.budgetWarningEnabled}
            />
            <span className="text-sm text-muted-foreground">
              % of budget
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Switch
              checked={preferences.budgetWarningEnabled}
              onCheckedChange={(checked) =>
                setPreferences({ ...preferences, budgetWarningEnabled: checked })
              }
            />
            <Label className="text-sm cursor-pointer">Enable budget warnings</Label>
          </div>
        </div>

        {/* Large Expense Threshold */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-red-500" />
            <Label>Large Expense Threshold</Label>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">$</span>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={(preferences.largeExpenseThreshold / 100).toFixed(2)}
              onChange={(e) =>
                setPreferences({
                  ...preferences,
                  largeExpenseThreshold: Math.round(Number(e.target.value) * 100),
                })
              }
              className="max-w-[120px]"
              disabled={!preferences.largeExpenseEnabled}
            />
          </div>
          <div className="flex items-center gap-2">
            <Switch
              checked={preferences.largeExpenseEnabled}
              onCheckedChange={(checked) =>
                setPreferences({ ...preferences, largeExpenseEnabled: checked })
              }
            />
            <Label className="text-sm cursor-pointer">Enable large expense alerts</Label>
          </div>
        </div>

        {/* Spending Spike Detection */}
        <div className="space-y-3 p-4 rounded-lg border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-orange-500" />
              <Label>Spending Spike Detection</Label>
            </div>
            <Switch
              checked={preferences.spendingSpikeEnabled}
              onCheckedChange={(checked) =>
                setPreferences({ ...preferences, spendingSpikeEnabled: checked })
              }
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Get notified when daily spending increases significantly compared to average
          </p>
        </div>

        {/* Notification Channels */}
        <div className="space-y-3">
          <Label>Notification Channels</Label>
          
          <div className="flex items-center justify-between p-3 rounded-lg border">
            <div className="space-y-0.5">
              <Label className="text-sm cursor-pointer">Email Notifications</Label>
              <p className="text-xs text-muted-foreground">
                Receive alerts via email (Coming soon)
              </p>
            </div>
            <Switch
              checked={preferences.emailNotifications}
              onCheckedChange={(checked) =>
                setPreferences({ ...preferences, emailNotifications: checked })
              }
              disabled={true}
            />
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg border">
            <div className="space-y-0.5">
              <Label className="text-sm cursor-pointer">Push Notifications</Label>
              <p className="text-xs text-muted-foreground">
                Browser push notifications (Coming soon)
              </p>
            </div>
            <Switch
              checked={preferences.pushNotifications}
              onCheckedChange={(checked) =>
                setPreferences({ ...preferences, pushNotifications: checked })
              }
              disabled={true}
            />
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end pt-4 border-t">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent mr-2" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Settings
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
