import { get, put, del, post } from './api.client';

import type { Business, ApiResponse, PaginatedResponse } from './types';

export const businessService = {
  // Get all businesses
  getAll: async (params?: { page?: number; per_page?: number; search?: string }) => {
    const response = await get<ApiResponse<PaginatedResponse<Business>>>('/businesses', { params });
    return response.data;
  },

  // Get single business
  getById: async (id: number) => {
    const response = await get<ApiResponse<Business>>(`/businesses/${id}`);
    return response.data;
  },

  // Create business
  create: async (data: Partial<Business>) => {
    const response = await post<ApiResponse<Business>>('/businesses', data);
    return response.data;
  },

  // Update business
  update: async (id: number, data: Partial<Business>) => {
    const response = await put<ApiResponse<Business>>(`/businesses/${id}`, data);
    return response.data;
  },

  // Delete business
  delete: async (id: number) => {
    const response = await del<ApiResponse<void>>(`/businesses/${id}`);
    return response.data;
  },

  // Get business stats
  getStats: async (id: number) => {
    const response = await get<ApiResponse<any>>(`/businesses/${id}/stats`);
    return response.data;
  },

  // Regenerate app credentials
  regenerateCredentials: async (id: number) => {
    const response = await post<ApiResponse<{ app_id: string; app_secret: string }>>(
      `/businesses/${id}/regenerate-credentials`,
      {}
    );
    return response.data;
  },
};

