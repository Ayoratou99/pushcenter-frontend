import { get, put, del, post } from './api.client';

import type { ApiResponse, PaginatedResponse } from './types';
import type { AuthUser, UserRole, UserScope } from '../auth/types';

// ----------------------------------------------------------------------

export type ManagedUser = AuthUser & {
  updated_at?: string;
};

export type UserFilters = {
  page?: number;
  per_page?: number;
  search?: string;
  role?: UserRole | '';
  scope?: UserScope | '';
  is_active?: boolean | '';
  two_factor?: 'enabled' | 'disabled' | '';
  business_id?: number | '';
  created_from?: string;
  created_to?: string;
  sort_by?: string;
  sort_dir?: 'asc' | 'desc';
};

export type UserPayload = {
  name: string;
  email: string;
  password?: string;
  phone?: string | null;
  role: UserRole;
  scope: UserScope;
  is_active?: boolean;
  must_change_password?: boolean;
  business_ids?: number[];
};

export const userService = {
  getAll: async (params?: UserFilters) => {
    const response = await get<ApiResponse<PaginatedResponse<ManagedUser>>>('/users', { params });
    return response.data;
  },

  getById: async (id: number) => {
    const response = await get<ApiResponse<ManagedUser>>(`/users/${id}`);
    return response.data.data;
  },

  create: async (data: UserPayload) => {
    const response = await post<ApiResponse<ManagedUser>>('/users', data);
    return response.data.data;
  },

  update: async (id: number, data: Partial<UserPayload>) => {
    const response = await put<ApiResponse<ManagedUser>>(`/users/${id}`, data);
    return response.data.data;
  },

  delete: async (id: number) => {
    const response = await del<ApiResponse<void>>(`/users/${id}`);
    return response.data;
  },

  /** Attach a manager to a precise list of applications, or to all of them. */
  assignBusinesses: async (id: number, payload: { scope: UserScope; business_ids?: number[] }) => {
    const response = await put<ApiResponse<ManagedUser>>(`/users/${id}/businesses`, payload);
    return response.data.data;
  },

  resetTwoFactor: async (id: number) => {
    const response = await post<ApiResponse<ManagedUser>>(`/users/${id}/reset-two-factor`);
    return response.data;
  },

  businessOptions: async () => {
    const response = await get<ApiResponse<{ id: number; name: string; status: string }[]>>(
      '/users/options/businesses'
    );
    return response.data.data;
  },
};
