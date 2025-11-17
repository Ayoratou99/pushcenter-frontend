import { get, put, del, post } from './api.client';

import type { ApiResponse, PaginatedResponse } from './types';

export interface SmsTemplate {
  id: number;
  business_id: number;
  name: string;
  message: string;
  description?: string;
  variables?: string[];
  sample_data?: Record<string, any>;
  category: 'marketing' | 'transactional' | 'otp' | 'notification';
  status: 'draft' | 'active' | 'archived';
  is_active: boolean;
  sender_id?: string;
  cost_per_message?: number;
  usage_count: number;
  last_used_at?: string;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export const smsTemplateService = {
  // Get all SMS templates
  getAll: async (params?: {
    page?: number;
    per_page?: number;
    status?: string;
    search?: string;
    business_id?: number;
  }) => {
    const response = await get<ApiResponse<PaginatedResponse<SmsTemplate>>>('/sms-templates', { params });
    return response.data;
  },

  // Get single SMS template
  getById: async (id: number) => {
    const response = await get<ApiResponse<SmsTemplate>>(`/sms-templates/${id}`);
    return response.data;
  },

  // Create SMS template
  create: async (data: Partial<SmsTemplate>) => {
    const response = await post<ApiResponse<SmsTemplate>>('/sms-templates', data);
    return response.data;
  },

  // Update SMS template
  update: async (id: number, data: Partial<SmsTemplate>) => {
    const response = await put<ApiResponse<SmsTemplate>>(`/sms-templates/${id}`, data);
    return response.data;
  },

  // Delete SMS template
  delete: async (id: number) => {
    const response = await del<ApiResponse<void>>(`/sms-templates/${id}`);
    return response.data;
  },

  // Activate SMS template
  activate: async (id: number) => {
    const response = await post<ApiResponse<SmsTemplate>>(`/sms-templates/${id}/activate`);
    return response.data;
  },

  // Deactivate SMS template
  deactivate: async (id: number) => {
    const response = await post<ApiResponse<SmsTemplate>>(`/sms-templates/${id}/deactivate`);
    return response.data;
  },
};

