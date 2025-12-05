"use client"

/**
 * Notification Bell Component
 * 
 * Displays notification icon with unread count badge
 */

import * as React from "react"
import { Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { NotificationList } from "@/components/notifications/notification-list"
import { getNotificationSummary } from "@/lib/notifications/notifications"
import { useAuth } from "@/lib/contexts/auth-context"

export function NotificationBell() {
  const { user } = useAuth()
  const [unreadCount, setUnreadCount] = React.useState(0)
  const [isOpen, setIsOpen] = React.useState(false)

  React.useEffect(() => {
    if (!user) return

    const fetchUnreadCount = async () => {
      const summary = await getNotificationSummary(user.uid)
      setUnreadCount(summary.unread)
    }

    fetchUnreadCount()

    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000)

    return () => clearInterval(interval)
  }, [user])

  if (!user) return null

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
          <span className="sr-only">Notifications</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="end">
        <NotificationList
          onNotificationRead={() => {
            setUnreadCount((prev) => Math.max(0, prev - 1))
          }}
          onClose={() => setIsOpen(false)}
        />
      </PopoverContent>
    </Popover>
  )
}
