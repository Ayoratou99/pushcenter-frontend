import { get, put, del, post } from './api.client';

import type { ApiResponse, PaginatedResponse } from './types';

export interface WhatsappTemplate {
  id: number;
  business_id: number;
  name: string;
  display_name: string;
  description?: string;
  language: string;
  category: string;
  header?: Record<string, any>;
  body: string;
  footer?: Record<string, any>;
  buttons?: Record<string, any>[];
  components?: Record<string, any>;
  variables?: string[];
  sample_data?: Record<string, any>;
  template_id?: string;
  facebook_template_id?: string;
  status: 'draft' | 'pending' | 'approved' | 'rejected' | 'disabled';
  facebook_status?: string;
  rejection_reason?: string;
  submitted_at?: string;
  approved_at?: string;
  quality_score?: Record<string, any>;
  cost_per_message?: number;
  usage_count: number;
  last_used_at?: string;
  is_active: boolean;
  allow_variables: boolean;
  max_variables?: number;
  metadata?: Record<string, any>;
  media_file_size?: number;
  created_at: string;
  updated_at: string;
}

export const whatsappTemplateService = {
  // Get all WhatsApp templates
  getAll: async (params?: {
    page?: number;
    per_page?: number;
    status?: string;
    search?: string;
    business_id?: number;
    language?: string;
  }) => {
    const response = await get<ApiResponse<PaginatedResponse<WhatsappTemplate>>>('/whatsapp-templates', { params });
    return response.data;
  },

  // Get single WhatsApp template
  getById: async (id: number) => {
    const response = await get<ApiResponse<WhatsappTemplate>>(`/whatsapp-templates/${id}`);
    return response.data;
  },

  // Create WhatsApp template
  create: async (data: Partial<WhatsappTemplate>) => {
    const response = await post<ApiResponse<WhatsappTemplate>>('/whatsapp-templates', data);
    return response.data;
  },

  // Update WhatsApp template
  update: async (id: number, data: Partial<WhatsappTemplate>) => {
    const response = await put<ApiResponse<WhatsappTemplate>>(`/whatsapp-templates/${id}`, data);
    return response.data;
  },

  // Delete WhatsApp template
  delete: async (id: number) => {
    const response = await del<ApiResponse<void>>(`/whatsapp-templates/${id}`);
    return response.data;
  },

  // Activate WhatsApp template
  activate: async (id: number) => {
    const response = await post<ApiResponse<WhatsappTemplate>>(`/whatsapp-templates/${id}/activate`);
    return response.data;
  },

  // Deactivate WhatsApp template
  deactivate: async (id: number) => {
    const response = await post<ApiResponse<WhatsappTemplate>>(`/whatsapp-templates/${id}/deactivate`);
    return response.data;
  },

  // Submit for approval
  submitForApproval: async (id: number) => {
    const response = await post<ApiResponse<WhatsappTemplate>>(`/whatsapp-templates/${id}/submit`);
    return response.data;
  },
};

