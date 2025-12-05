"use client"

/**
 * Notification Item Component
 * 
 * Individual notification card
 */

import * as React from "react"
import Link from "next/link"
import { useAuth } from "@/lib/contexts/auth-context"
import { markNotificationAsRead } from "@/lib/notifications/notifications"
import { formatDistanceToNow } from "date-fns"
import { 
  AlertCircle, 
  AlertTriangle, 
  TrendingUp, 
  DollarSign, 
  Calendar, 
  Users, 
  CheckCircle,
  Info
} from "lucide-react"
import type { Notification } from "@/lib/notifications/types"
import { cn } from "@/lib/utils"

interface NotificationItemProps {
  notification: Notification
  onRead?: (id: string) => void
  onClose?: () => void
}

export function NotificationItem({ notification, onRead, onClose }: NotificationItemProps) {
  const { user } = useAuth()

  const handleClick = async () => {
    if (!user || notification.status === 'read') return

    try {
      await markNotificationAsRead(user.uid, notification.id)
      onRead?.(notification.id)
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }

    if (notification.actionUrl) {
      onClose?.()
    }
  }

  const getIcon = () => {
    switch (notification.type) {
      case 'budget_exceeded':
        return <AlertCircle className="h-5 w-5 text-red-500" />
      case 'budget_warning':
      case 'budget_approaching':
        return <AlertTriangle className="h-5 w-5 text-amber-500" />
      case 'spending_spike':
        return <TrendingUp className="h-5 w-5 text-orange-500" />
      case 'large_expense':
        return <DollarSign className="h-5 w-5 text-purple-500" />
      case 'recurring_created':
        return <Calendar className="h-5 w-5 text-blue-500" />
      case 'settlement_due':
      case 'payment_received':
        return <DollarSign className="h-5 w-5 text-green-500" />
      case 'group_invite':
        return <Users className="h-5 w-5 text-indigo-500" />
      case 'savings_milestone':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'monthly_summary':
        return <Info className="h-5 w-5 text-blue-500" />
      default:
        return <Info className="h-5 w-5 text-muted-foreground" />
    }
  }

  const getPriorityColor = () => {
    switch (notification.priority) {
      case 'urgent':
        return 'border-l-red-500'
      case 'high':
        return 'border-l-amber-500'
      case 'medium':
        return 'border-l-blue-500'
      default:
        return 'border-l-muted'
    }
  }

  const content = (
    <div
      className={cn(
        "p-4 border-l-4 hover:bg-accent/50 transition-colors cursor-pointer",
        getPriorityColor(),
        notification.status === 'unread' && "bg-accent/20"
      )}
      onClick={handleClick}
    >
      <div className="flex gap-3">
        <div className="shrink-0 mt-0.5">{getIcon()}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h4 className={cn(
              "text-sm font-medium leading-tight",
              notification.status === 'unread' && "font-semibold"
            )}>
              {notification.title}
            </h4>
            {notification.status === 'unread' && (
              <span className="h-2 w-2 rounded-full bg-primary shrink-0 mt-1.5" />
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
            {notification.message}
          </p>
          <div className="flex items-center gap-3 mt-2">
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(notification.createdAt, { addSuffix: true })}
            </span>
            {notification.actionLabel && (
              <span className="text-xs font-medium text-primary">
                {notification.actionLabel} →
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )

  if (notification.actionUrl) {
    return (
      <Link href={notification.actionUrl} className="block">
        {content}
      </Link>
    )
  }

  return content
}
