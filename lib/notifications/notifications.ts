/**
 * Notifications Service
 * 
 * Core notification management system
 */

import {
  collection,
  doc,
  addDoc,
  getDocs,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  deleteDoc,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import type {
  Notification,
  NotificationPreferences,
  NotificationSummary,
  NotificationType,
  NotificationPriority,
} from './types';

/**
 * Create a new notification
 */
export async function createNotification(params: {
  userId: string;
  type: NotificationType;
  priority: NotificationPriority;
  title: string;
  message: string;
  category?: string;
  amount?: number;
  groupId?: string;
  expenseId?: string;
  actionLabel?: string;
  actionUrl?: string;
  expiresInDays?: number;
}): Promise<string> {
  try {
    const {
      userId,
      type,
      priority,
      title,
      message,
      category,
      amount,
      groupId,
      expenseId,
      actionLabel,
      actionUrl,
      expiresInDays,
    } = params;
    
    // Check if user has notifications enabled for this type
    const prefs = await getNotificationPreferences(userId);
    if (!prefs.inAppNotifications) {
      return ''; // User has notifications disabled
    }
    
    const now = new Date();
    let expiresAt: Date | undefined;
    
    if (expiresInDays) {
      expiresAt = new Date(now);
      expiresAt.setDate(expiresAt.getDate() + expiresInDays);
    }
    
    const notification: Omit<Notification, 'id'> = {
      userId,
      type,
      priority,
      status: 'unread',
      title,
      message,
      category,
      amount,
      groupId,
      expenseId,
      actionLabel,
      actionUrl,
      createdAt: now,
      expiresAt,
    };
    
    const notifRef = await addDoc(
      collection(db, 'users', userId, 'notifications'),
      {
        ...notification,
        createdAt: Timestamp.now(),
        expiresAt: expiresAt ? Timestamp.fromDate(expiresAt) : null,
      }
    );
    
    return notifRef.id;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
}

/**
 * Get user notifications
 */
export async function getUserNotifications(
  userId: string,
  limitCount: number = 20,
  includeRead: boolean = true
): Promise<Notification[]> {
  try {
    const notifRef = collection(db, 'users', userId, 'notifications');
    let q = query(notifRef, orderBy('createdAt', 'desc'), limit(limitCount));
    
    if (!includeRead) {
      q = query(
        notifRef,
        where('status', '==', 'unread'),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );
    }
    
    const snapshot = await getDocs(q);
    const notifications: Notification[] = [];
    
    snapshot.forEach((doc) => {
      const data = doc.data();
      notifications.push({
        id: doc.id,
        userId: data.userId,
        type: data.type,
        priority: data.priority,
        status: data.status,
        title: data.title,
        message: data.message,
        icon: data.icon,
        category: data.category,
        amount: data.amount,
        groupId: data.groupId,
        expenseId: data.expenseId,
        actionLabel: data.actionLabel,
        actionUrl: data.actionUrl,
        createdAt: data.createdAt.toDate(),
        readAt: data.readAt?.toDate(),
        expiresAt: data.expiresAt?.toDate(),
      });
    });
    
    return notifications;
  } catch (error) {
    console.error('Error getting notifications:', error);
    return [];
  }
}

/**
 * Mark notification as read
 */
export async function markNotificationAsRead(
  userId: string,
  notificationId: string
): Promise<void> {
  try {
    const notifRef = doc(db, 'users', userId, 'notifications', notificationId);
    await updateDoc(notifRef, {
      status: 'read',
      readAt: Timestamp.now(),
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw error;
  }
}

/**
 * Mark all notifications as read
 */
export async function markAllNotificationsAsRead(userId: string): Promise<void> {
  try {
    const notifRef = collection(db, 'users', userId, 'notifications');
    const q = query(notifRef, where('status', '==', 'unread'));
    const snapshot = await getDocs(q);
    
    const updates = snapshot.docs.map((doc) =>
      updateDoc(doc.ref, {
        status: 'read',
        readAt: Timestamp.now(),
      })
    );
    
    await Promise.all(updates);
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    throw error;
  }
}

/**
 * Delete notification
 */
export async function deleteNotification(
  userId: string,
  notificationId: string
): Promise<void> {
  try {
    const notifRef = doc(db, 'users', userId, 'notifications', notificationId);
    await deleteDoc(notifRef);
  } catch (error) {
    console.error('Error deleting notification:', error);
    throw error;
  }
}

/**
 * Get notification summary
 */
export async function getNotificationSummary(
  userId: string
): Promise<NotificationSummary> {
  try {
    const notifications = await getUserNotifications(userId, 100);
    
    const summary: NotificationSummary = {
      total: notifications.length,
      unread: notifications.filter((n) => n.status === 'unread').length,
      byType: {} as Record<NotificationType, number>,
      byPriority: {} as Record<NotificationPriority, number>,
      urgent: notifications.filter(
        (n) => n.priority === 'urgent' && n.status === 'unread'
      ),
    };
    
    // Count by type
    notifications.forEach((n) => {
      summary.byType[n.type] = (summary.byType[n.type] || 0) + 1;
      summary.byPriority[n.priority] = (summary.byPriority[n.priority] || 0) + 1;
    });
    
    return summary;
  } catch (error) {
    console.error('Error getting notification summary:', error);
    return {
      total: 0,
      unread: 0,
      byType: {} as Record<NotificationType, number>,
      byPriority: {} as Record<NotificationPriority, number>,
      urgent: [],
    };
  }
}

/**
 * Get notification preferences
 */
export async function getNotificationPreferences(
  userId: string
): Promise<NotificationPreferences> {
  try {
    const prefsRef = collection(db, 'users', userId, 'settings');
    const q = query(prefsRef, where('__name__', '==', 'notifications'));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      // Return defaults
      return getDefaultNotificationPreferences(userId);
    }
    
    const data = snapshot.docs[0].data();
    return {
      userId,
      budgetWarningEnabled: data.budgetWarningEnabled ?? true,
      budgetWarningThreshold: data.budgetWarningThreshold ?? 80,
      budgetExceededEnabled: data.budgetExceededEnabled ?? true,
      largeExpenseEnabled: data.largeExpenseEnabled ?? true,
      largeExpenseThreshold: data.largeExpenseThreshold ?? 10000,
      spendingSpikeEnabled: data.spendingSpikeEnabled ?? true,
      settlementDueEnabled: data.settlementDueEnabled ?? true,
      settlementReminderDays: data.settlementReminderDays ?? 7,
      recurringCreatedEnabled: data.recurringCreatedEnabled ?? true,
      monthlySummaryEnabled: data.monthlySummaryEnabled ?? true,
      monthlySummaryDay: data.monthlySummaryDay ?? 1,
      groupInviteEnabled: data.groupInviteEnabled ?? true,
      paymentReceivedEnabled: data.paymentReceivedEnabled ?? true,
      inAppNotifications: data.inAppNotifications ?? true,
      emailNotifications: data.emailNotifications ?? false,
      pushNotifications: data.pushNotifications ?? false,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
    };
  } catch (error) {
    console.error('Error getting notification preferences:', error);
    return getDefaultNotificationPreferences(userId);
  }
}

/**
 * Save notification preferences
 */
export async function saveNotificationPreferences(
  prefs: NotificationPreferences
): Promise<void> {
  try {
    const prefsRef = doc(db, 'users', prefs.userId, 'settings', 'notifications');
    await updateDoc(prefsRef, {
      ...prefs,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error('Error saving notification preferences:', error);
    throw error;
  }
}

/**
 * Get default notification preferences
 */
function getDefaultNotificationPreferences(
  userId: string
): NotificationPreferences {
  return {
    userId,
    budgetWarningEnabled: true,
    budgetWarningThreshold: 80,
    budgetExceededEnabled: true,
    largeExpenseEnabled: true,
    largeExpenseThreshold: 10000, // $100
    spendingSpikeEnabled: true,
    settlementDueEnabled: true,
    settlementReminderDays: 7,
    recurringCreatedEnabled: true,
    monthlySummaryEnabled: true,
    monthlySummaryDay: 1,
    groupInviteEnabled: true,
    paymentReceivedEnabled: true,
    inAppNotifications: true,
    emailNotifications: false,
    pushNotifications: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

/**
 * Clean up expired notifications
 */
export async function cleanupExpiredNotifications(userId: string): Promise<number> {
  try {
    const notifRef = collection(db, 'users', userId, 'notifications');
    const now = Timestamp.now();
    
    const q = query(
      notifRef,
      where('expiresAt', '<=', now)
    );
    
    const snapshot = await getDocs(q);
    const deletes = snapshot.docs.map((doc) => deleteDoc(doc.ref));
    await Promise.all(deletes);
    
    return snapshot.size;
  } catch (error) {
    console.error('Error cleaning up expired notifications:', error);
    return 0;
  }
}
