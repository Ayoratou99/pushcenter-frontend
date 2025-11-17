import { get, put, del, post } from './api.client';

import type { ApiResponse, PaginatedResponse } from './types';

export interface EmailTemplate {
  id: number;
  business_id: number;
  name: string;
  subject: string;
  description?: string;
  design?: Record<string, any>;
  html?: string;
  plain_text?: string;
  variables?: string[];
  sample_data?: Record<string, any>;
  category: 'marketing' | 'transactional' | 'notification';
  status: 'draft' | 'active' | 'archived';
  is_active: boolean;
  usage_count: number;
  last_used_at?: string;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export const emailTemplateService = {
  // Get all email templates
  getAll: async (params?: {
    page?: number;
    per_page?: number;
    status?: string;
    search?: string;
    business_id?: number;
  }) => {
    const response = await get<ApiResponse<PaginatedResponse<EmailTemplate>>>('/email-templates', { params });
    return response.data;
  },

  // Get single email template
  getById: async (id: number) => {
    const response = await get<ApiResponse<EmailTemplate>>(`/email-templates/${id}`);
    return response.data;
  },

  // Create email template
  create: async (data: Partial<EmailTemplate>) => {
    const response = await post<ApiResponse<EmailTemplate>>('/email-templates', data);
    return response.data;
  },

  // Update email template
  update: async (id: number, data: Partial<EmailTemplate>) => {
    const response = await put<ApiResponse<EmailTemplate>>(`/email-templates/${id}`, data);
    return response.data;
  },

  // Delete email template
  delete: async (id: number) => {
    const response = await del<ApiResponse<void>>(`/email-templates/${id}`);
    return response.data;
  },

  // Activate email template
  activate: async (id: number) => {
    const response = await post<ApiResponse<EmailTemplate>>(`/email-templates/${id}/activate`);
    return response.data;
  },

  // Deactivate email template
  deactivate: async (id: number) => {
    const response = await post<ApiResponse<EmailTemplate>>(`/email-templates/${id}/deactivate`);
    return response.data;
  },
};

