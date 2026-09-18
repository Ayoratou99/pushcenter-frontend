import { get, post } from './api.client';

import type { ApiResponse } from './types';

// ----------------------------------------------------------------------

export type NotificationSeverity = 'error' | 'warning' | 'info';

export type AppNotification = {
  id: string;
  type: 'message.failed' | 'webhook.failed' | 'smtp.failed' | string;
  severity: NotificationSeverity;
  title: string;
  description: string;
  occurred_at: string;
  is_unread: boolean;
  business?: { id: number; name: string } | null;
  /** Where the dashboard should take the user when the entry is clicked. */
  link?: {
    view: 'messages' | 'business';
    message_id?: string;
    business_id?: number;
    tab?: string;
  } | null;
};

export type NotificationFeed = {
  notifications: AppNotification[];
  unread_count: number;
  read_at: string | null;
};

export const notificationService = {
  getAll: async (): Promise<NotificationFeed> => {
    const response = await get<ApiResponse<NotificationFeed>>('/notifications');
    return response.data.data;
  },

  markAllRead: async () => {
    const response = await post<ApiResponse<{ read_at: string }>>('/notifications/read');
    return response.data.data;
  },
};
