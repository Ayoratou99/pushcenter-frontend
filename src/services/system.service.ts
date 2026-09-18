import { get } from './api.client';

import type { ApiResponse } from './types';

// ----------------------------------------------------------------------

export type HorizonQueue = {
  name: string;
  length: number;
  wait_seconds: number;
  processes: number;
};

export type HorizonStatus = {
  /** `running` and healthy, `paused`, `inactive` (down), or `unknown`. */
  status: 'running' | 'paused' | 'inactive' | 'unknown';
  healthy: boolean;
  message: string;
  supervisors: number;
  queues: HorizonQueue[];
  pending_jobs: number;
  failed_jobs: number;
  longest_wait_seconds: number;
  measured_at?: string;
};

export const systemService = {
  horizon: async (): Promise<HorizonStatus> => {
    const response = await get<ApiResponse<HorizonStatus>>('/system/horizon');
    return response.data.data;
  },
};
