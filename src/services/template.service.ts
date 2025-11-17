import { get, put, del, post } from './api.client';

import type { Template, ApiResponse, PaginatedResponse } from './types';

export const templateService = {
  // Get all templates
  getAll: async (params?: {
    page?: number;
    per_page?: number;
    type?: string;
    status?: string;
    search?: string;
  }) => {
    const response = await get<ApiResponse<PaginatedResponse<Template>>>('/templates', { params });
    return response.data;
  },

  // Get single template
  getById: async (id: number) => {
    const response = await get<ApiResponse<Template>>(`/templates/${id}`);
    return response.data;
  },

  // Create template
  create: async (data: Partial<Template>) => {
    const response = await post<ApiResponse<Template>>('/templates', data);
    return response.data;
  },

  // Update template
  update: async (id: number, data: Partial<Template>) => {
    const response = await put<ApiResponse<Template>>(`/templates/${id}`, data);
    return response.data;
  },

  // Delete template
  delete: async (id: number) => {
    const response = await del<ApiResponse<void>>(`/templates/${id}`);
    return response.data;
  },

  // Activate template
  activate: async (id: number) => {
    const response = await post<ApiResponse<Template>>(`/templates/${id}/activate`);
    return response.data;
  },

  // Deactivate template
  deactivate: async (id: number) => {
    const response = await post<ApiResponse<Template>>(`/templates/${id}/deactivate`);
    return response.data;
  },
};

