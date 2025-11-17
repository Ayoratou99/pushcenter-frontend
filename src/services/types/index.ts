// Business Types
export interface Business {
  id: number;
  business_id: string;
  name: string;
  email: string;
  phone?: string;
  phone_number?: string;
  website?: string;
  description?: string;
  logo_url?: string;
  status: 'active' | 'inactive' | 'suspended';
  subscription_tier: string;
  credits_balance: number;
  monthly_credits_limit?: number;
  timezone: string;
  locale: string;
  app_id?: string;
  app_secret?: string;
  created_at: string;
  updated_at: string;
}

// Message Types
export interface Message {
  id: number;
  message_id: string;
  business_id: number;
  external_id?: string;
  message_type: 'email' | 'sms' | 'whatsapp';
  status: 'pending' | 'queued' | 'sending' | 'sent' | 'delivered' | 'read' | 'failed' | 'cancelled';
  error_message?: string;
  retry_count: number;
  sent_at?: string;
  delivered_at?: string;
  failed_at?: string;
  campaign_id?: string;
  cost?: number;
  currency: string;
  created_at: string;
  updated_at: string;
}

// WhatsApp Message Types
export interface WhatsAppMessage {
  id: number;
  message_id: number;
  template_id?: number;
  is_template: boolean;
  whatsapp_phone_number_id: number;
  recipient_number: string;
  recipient_name?: string;
  content?: string;
  media_url?: string;
  button_url?: string;
  button_text?: string;
  template_variables?: Record<string, any>;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

// SMS Message Types
export interface SmsMessage {
  id: number;
  message_id: number;
  template_id?: number;
  is_template: boolean;
  sms_phone_number_id: number;
  recipient_number: string;
  recipient_name?: string;
  content?: string;
  template_variables?: Record<string, any>;
  message_count: number;
  created_at: string;
  updated_at: string;
}

// Email Message Types
export interface EmailMessage {
  id: number;
  message_id: number;
  template_id?: number;
  is_template: boolean;
  recipient_email: string;
  recipient_name?: string;
  sender_email?: string;
  sender_name?: string;
  subject?: string;
  content?: string;
  template_variables?: Record<string, any>;
  attachments?: any[];
  cc?: string[];
  bcc?: string[];
  created_at: string;
  updated_at: string;
}

// Template Types
export interface Template {
  id: number;
  business_id: number;
  name: string;
  description?: string;
  type: 'email' | 'sms' | 'whatsapp';
  category: 'marketing' | 'transactional' | 'notification';
  status: 'draft' | 'active' | 'archived';
  is_active: boolean;
  usage_count: number;
  last_used_at?: string;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

// Dashboard Stats Types
export interface DashboardStats {
  total_messages: number;
  sent_messages: number;
  delivered_messages: number;
  failed_messages: number;
  pending_messages: number;
  total_cost: number;
  credits_remaining: number;
  messages_by_type: {
    email: number;
    sms: number;
    whatsapp: number;
  };
  messages_by_status: {
    pending: number;
    sent: number;
    delivered: number;
    failed: number;
  };
}

// Pagination Types
export interface PaginatedResponse<T> {
  data: T[];
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
  from: number;
  to: number;
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  message?: string;
}

export interface ApiError {
  message: string;
  errors?: Record<string, string[]>;
}

