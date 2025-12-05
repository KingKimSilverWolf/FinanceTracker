"use client"

/**
 * Budget Settings Component
 * 
 * Configure budget limits and alerts
 */

import * as React from "react"
import { useAuth } from "@/lib/contexts/auth-context"
import { 
  getUserBudgetSettings, 
  saveUserBudgetSettings,
  type BudgetSetting 
} from "@/lib/firebase/analytics"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Trash2, Plus, AlertTriangle, Save } from "lucide-react"
import { toast } from "sonner"
import { EXPENSE_CATEGORIES, type ExpenseCategoryKey } from "@/lib/constants/expenses"

// Convert EXPENSE_CATEGORIES object to array
const CATEGORY_ARRAY = Object.entries(EXPENSE_CATEGORIES).map(([key, value]) => ({
  key: key as ExpenseCategoryKey,
  label: value.label,
  icon: value.icon,
}))

export function BudgetSettings() {
  const { user } = useAuth()
  const [budgets, setBudgets] = React.useState<BudgetSetting[]>([])
  const [alertThreshold, setAlertThreshold] = React.useState(80)
  const [loading, setLoading] = React.useState(true)
  const [saving, setSaving] = React.useState(false)

  React.useEffect(() => {
    if (!user) return

    const loadSettings = async () => {
      setLoading(true)
      const settings = await getUserBudgetSettings(user.uid)
      if (settings) {
        setBudgets(settings.budgets)
        setAlertThreshold(settings.alertThreshold)
      }
      setLoading(false)
    }

    loadSettings()
  }, [user])

  const handleAddBudget = () => {
    // Find first unused category
    const usedCategories = new Set(budgets.map((b) => b.category))
    const availableCategory = CATEGORY_ARRAY.find(
      (cat) => !usedCategories.has(cat.label)
    )

    if (!availableCategory) {
      toast.error('All categories already have budgets')
      return
    }

    setBudgets([
      ...budgets,
      {
        category: availableCategory.label,
        monthlyLimit: 50000, // Default $500
        enabled: true,
      },
    ])
  }

  const handleRemoveBudget = (index: number) => {
    setBudgets(budgets.filter((_, i) => i !== index))
  }

  const handleBudgetChange = (
    index: number,
    field: keyof BudgetSetting,
    value: string | number | boolean
  ) => {
    setBudgets(
      budgets.map((budget, i) =>
        i === index ? { ...budget, [field]: value } : budget
      )
    )
  }

  const handleSave = async () => {
    if (!user) return

    try {
      setSaving(true)
      await saveUserBudgetSettings(user.uid, budgets, alertThreshold)
      toast.success('Budget settings saved successfully')
    } catch (error) {
      console.error('Error saving budget settings:', error)
      toast.error('Failed to save budget settings')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Budget Settings</CardTitle>
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

  const usedCategories = new Set(budgets.map((b) => b.category))
  const availableCategories = CATEGORY_ARRAY.filter(
    (cat) => !usedCategories.has(cat.label)
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle>Budget Settings</CardTitle>
        <CardDescription>
          Set monthly budget limits and configure alerts
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Alert Threshold */}
        <div className="space-y-2">
          <Label htmlFor="threshold">Alert Threshold</Label>
          <div className="flex items-center gap-3">
            <Input
              id="threshold"
              type="number"
              min="50"
              max="100"
              value={alertThreshold}
              onChange={(e) => setAlertThreshold(Number(e.target.value))}
              className="max-w-[100px]"
            />
            <span className="text-sm text-muted-foreground">
              % of budget
            </span>
            <AlertTriangle className="h-4 w-4 text-amber-500 ml-auto" />
          </div>
          <p className="text-xs text-muted-foreground">
            You&apos;ll receive warnings when spending exceeds this percentage
          </p>
        </div>

        {/* Budget List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Monthly Budgets</Label>
            <Button
              variant="outline"
              size="sm"
              onClick={handleAddBudget}
              disabled={availableCategories.length === 0}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Budget
            </Button>
          </div>

          {budgets.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p className="text-sm">No budgets configured</p>
              <p className="text-xs mt-1">Click &quot;Add Budget&quot; to get started</p>
            </div>
          ) : (
            <div className="space-y-4">
              {budgets.map((budget, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 p-4 rounded-lg border"
                >
                  <div className="flex-1 space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs">Category</Label>
                        <Select
                          value={budget.category}
                          onValueChange={(value) =>
                            handleBudgetChange(index, 'category', value)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value={budget.category}>
                              {budget.category}
                            </SelectItem>
                            {availableCategories.map((cat) => (
                              <SelectItem key={cat.key} value={cat.label}>
                                {cat.icon} {cat.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs">Monthly Limit</Label>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">$</span>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={(budget.monthlyLimit / 100).toFixed(2)}
                            onChange={(e) =>
                              handleBudgetChange(
                                index,
                                'monthlyLimit',
                                Math.round(Number(e.target.value) * 100)
                              )
                            }
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Switch
                        checked={budget.enabled}
                        onCheckedChange={(checked) =>
                          handleBudgetChange(index, 'enabled', checked)
                        }
                      />
                      <Label className="text-sm cursor-pointer">
                        Enable alerts for this budget
                      </Label>
                    </div>
                  </div>

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveBudget(index)}
                    className="shrink-0"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
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
