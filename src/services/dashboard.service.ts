import { get } from './api.client';

import type { ApiResponse, DashboardStats } from './types';

export const dashboardService = {
  // Get dashboard statistics
  getStats: async (params?: { start_date?: string; end_date?: string; business_id?: number }) => {
    const response = await get<ApiResponse<DashboardStats>>('/dashboard/stats', { params });
    return response.data;
  },

  // Get recent messages
  getRecentMessages: async (limit: number = 10) => {
    const response = await get<ApiResponse<any>>('/dashboard/recent-messages', {
      params: { limit },
    });
    return response.data;
  },

  // Get message trends
  getMessageTrends: async (params?: { period?: 'week' | 'month' | 'year' }) => {
    const response = await get<ApiResponse<any>>('/dashboard/message-trends', { params });
    return response.data;
  },

  // Get cost analysis
  getCostAnalysis: async (params?: { start_date?: string; end_date?: string }) => {
    const response = await get<ApiResponse<any>>('/dashboard/cost-analysis', { params });
    return response.data;
  },
};

