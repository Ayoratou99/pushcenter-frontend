import apiClient, { post } from './api.client';

import type { ApiResponse } from './types';

// ----------------------------------------------------------------------

export type TemplateType = 'email' | 'sms' | 'whatsapp';

export type TransferFormat = 'json' | 'txt';

export type ImportPreview = {
  type: TemplateType;
  count: number;
  templates: {
    name: string;
    description?: string | null;
    category?: string | null;
    language?: string | null;
    subject?: string | null;
  }[];
  source?: { template_id: number; business_id: number; business_name?: string } | null;
  exported_at?: string | null;
};

/** Hand the blob to the browser as a download. */
function saveBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function filenameFromHeaders(headers: any, fallback: string): string {
  const disposition: string | undefined = headers?.['content-disposition'];
  const match = disposition?.match(/filename\*?=(?:UTF-8'')?"?([^";]+)"?/i);

  return match ? decodeURIComponent(match[1]) : fallback;
}

export const templateTransferService = {
  /** Download one template as a .json or .txt file. */
  exportOne: async (type: TemplateType, id: number, format: TransferFormat = 'json') => {
    const response = await apiClient.get(`/templates/${type}/${id}/export`, {
      params: { format, download: 1 },
      responseType: 'blob',
    });

    saveBlob(response.data, filenameFromHeaders(response.headers, `${type}-template.${format}`));
  },

  /** Download several templates of the same type in one file. */
  exportMany: async (type: TemplateType, ids: number[], format: TransferFormat = 'json') => {
    const response = await apiClient.post(
      '/templates/export',
      { type, ids, format, download: true },
      { responseType: 'blob' }
    );

    saveBlob(response.data, filenameFromHeaders(response.headers, `${type}-templates.${format}`));
  },

  /** Read an export file without saving anything, to confirm what it holds. */
  preview: async (file: File) => {
    const form = new FormData();
    form.append('file', file);

    const response = await post<ApiResponse<ImportPreview>>('/templates/import/preview', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });

    return response.data.data;
  },

  /**
   * Import the file into an application. Only the target application is needed;
   * the type comes from the file itself.
   */
  import: async (params: { file: File; businessId: number; type?: TemplateType; name?: string }) => {
    const form = new FormData();
    form.append('file', params.file);
    form.append('business_id', String(params.businessId));

    if (params.type) form.append('type', params.type);
    if (params.name) form.append('name', params.name);

    const response = await post<
      ApiResponse<{ type: TemplateType; business: { id: number; name: string }; imported: number }>
    >('/templates/import', form, { headers: { 'Content-Type': 'multipart/form-data' } });

    return response.data;
  },
};
