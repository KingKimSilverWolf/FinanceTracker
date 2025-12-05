"use client"

/**
 * Notification List Component
 * 
 * Displays list of notifications in dropdown
 */

import * as React from "react"
import { useAuth } from "@/lib/contexts/auth-context"
import { getUserNotifications, markAllNotificationsAsRead } from "@/lib/notifications/notifications"
import { NotificationItem } from "@/components/notifications/notification-item"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { CheckCheck, Inbox } from "lucide-react"
import type { Notification } from "@/lib/notifications/types"

interface NotificationListProps {
  onNotificationRead?: () => void
  onClose?: () => void
}

export function NotificationList({ onNotificationRead, onClose }: NotificationListProps) {
  const { user } = useAuth()
  const [notifications, setNotifications] = React.useState<Notification[]>([])
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    if (!user) return

    const fetchNotifications = async () => {
      setLoading(true)
      const notifs = await getUserNotifications(user.uid, 20)
      setNotifications(notifs)
      setLoading(false)
    }

    fetchNotifications()
  }, [user])

  const handleMarkAllRead = async () => {
    if (!user) return

    try {
      await markAllNotificationsAsRead(user.uid)
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, status: 'read' as const }))
      )
      onNotificationRead?.()
    } catch (error) {
      console.error('Error marking all as read:', error)
    }
  }

  const handleNotificationRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, status: 'read' as const } : n))
    )
    onNotificationRead?.()
  }

  if (loading) {
    return (
      <div className="p-4">
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-4 bg-muted rounded w-3/4 mb-2" />
              <div className="h-3 bg-muted rounded w-full" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  const unreadNotifications = notifications.filter((n) => n.status === 'unread')

  return (
    <div className="max-h-[500px] overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background border-b p-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Notifications</h3>
          {unreadNotifications.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAllRead}
              className="h-8 text-xs"
            >
              <CheckCheck className="h-3 w-3 mr-1" />
              Mark all read
            </Button>
          )}
        </div>
        {unreadNotifications.length > 0 && (
          <p className="text-xs text-muted-foreground mt-1">
            {unreadNotifications.length} unread
          </p>
        )}
      </div>

      {/* Notifications */}
      <div className="divide-y">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4">
            <Inbox className="h-12 w-12 text-muted-foreground mb-3" />
            <p className="text-sm font-medium">No notifications</p>
            <p className="text-xs text-muted-foreground text-center mt-1">
              You&apos;re all caught up!
            </p>
          </div>
        ) : (
          notifications.map((notification) => (
            <NotificationItem
              key={notification.id}
              notification={notification}
              onRead={handleNotificationRead}
              onClose={onClose}
            />
          ))
        )}
      </div>

      {/* Footer */}
      {notifications.length > 0 && (
        <>
          <Separator />
          <div className="p-3 text-center">
            <Button
              variant="ghost"
              size="sm"
              className="text-xs w-full"
              onClick={onClose}
            >
              View all notifications
            </Button>
          </div>
        </>
      )}
    </div>
  )
}
