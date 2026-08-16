import { create } from 'zustand';
import { seededNotifications } from '../mock/workflowFixtures';
import type { Notification } from '../types';

interface NotificationState {
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'notification_id' | 'created_at' | 'read_at'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: seededNotifications,
  
  addNotification: (notif) => {
    const newNotif: Notification = {
      ...notif,
      notification_id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      created_at: new Date().toISOString(),
      read_at: null,
    };
    
    set((state) => ({
      notifications: [newNotif, ...state.notifications],
    }));
  },
  
  markAsRead: (id) => {
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.notification_id === id ? { ...n, read_at: new Date().toISOString() } : n
      ),
    }));
  },
  
  markAllAsRead: () => {
    set((state) => ({
      notifications: state.notifications.map((n) => ({
        ...n,
        read_at: n.read_at || new Date().toISOString(),
      })),
    }));
  },
}));
