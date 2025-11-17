import { get, del, post } from './api.client';

import type { Message, SmsMessage, ApiResponse, EmailMessage, WhatsAppMessage, PaginatedResponse } from './types';

export const messageService = {
  // Get all messages
  getAll: async (params?: {
    page?: number;
    per_page?: number;
    message_type?: string;
    status?: string;
    search?: string;
  }) => {
    const response = await get<ApiResponse<PaginatedResponse<Message>>>('/messages', { params });
    return response.data;
  },

  // Get single message
  getById: async (id: number) => {
    const response = await get<ApiResponse<Message>>(`/messages/${id}`);
    return response.data;
  },

  // Send WhatsApp message
  sendWhatsApp: async (data: Partial<WhatsAppMessage>) => {
    const response = await post<ApiResponse<Message>>('/messages/whatsapp', data);
    return response.data;
  },

  // Send SMS message
  sendSms: async (data: Partial<SmsMessage>) => {
    const response = await post<ApiResponse<Message>>('/messages/sms', data);
    return response.data;
  },

  // Send Email message
  sendEmail: async (data: Partial<EmailMessage>) => {
    const response = await post<ApiResponse<Message>>('/messages/email', data);
    return response.data;
  },

  // Delete message
  delete: async (id: number) => {
    const response = await del<ApiResponse<void>>(`/messages/${id}`);
    return response.data;
  },

  // Retry failed message
  retry: async (id: number) => {
    const response = await post<ApiResponse<Message>>(`/messages/${id}/retry`);
    return response.data;
  },

  // Cancel pending message
  cancel: async (id: number) => {
    const response = await post<ApiResponse<Message>>(`/messages/${id}/cancel`);
    return response.data;
  },

  // Get message statistics
  getStats: async (params?: { start_date?: string; end_date?: string }) => {
    const response = await get<ApiResponse<any>>('/messages/stats', { params });
    return response.data;
  },
};

