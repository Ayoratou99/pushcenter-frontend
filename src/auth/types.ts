export type UserRole = 'admin' | 'manager';

export type UserScope = 'global' | 'restricted';

export type AuthUser = {
  id: number;
  name: string;
  email: string;
  phone?: string | null;
  role: UserRole;
  scope: UserScope;
  is_active: boolean;
  must_change_password: boolean;
  two_factor_enabled: boolean;
  global_scope: boolean;
  last_login_at?: string | null;
  created_at?: string;
  businesses: { id: number; name: string }[];
};

/** Payload returned by POST /auth/login. */
export type LoginResult =
  | { status: 'authenticated' }
  /** Password accepted, waiting for the Google Authenticator code. */
  | { status: 'two_factor_required'; challengeToken: string }
  /** Google Authenticator has never been configured on this account. */
  | { status: 'two_factor_setup_required'; setupToken: string; user: AuthUser };

export type TwoFactorEnrolment = {
  secret: string;
  otpauth_url: string;
  qr_code: string;
  manual_entry_key: string;
  setup_token: string;
  instructions: { title: string; description: string }[];
};
