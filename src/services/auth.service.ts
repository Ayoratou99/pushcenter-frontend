import { get, put, post } from './api.client';
import { tokenStorage } from '../auth/tokens';

import type { ApiResponse } from './types';
import type { AuthUser, LoginResult, TwoFactorEnrolment } from '../auth/types';

// ----------------------------------------------------------------------

type TokenPayload = {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  refresh_expires_in: number;
  token_type: string;
};

type LoginPayload = Partial<TokenPayload> & {
  two_factor_required?: boolean;
  two_factor_setup_required?: boolean;
  challenge_token?: string;
  setup_token?: string;
  user?: AuthUser;
};

export const authService = {
  /**
   * Step 1: email + password. Depending on the account state the server either
   * signs the user in, asks for a Google Authenticator code, or starts the
   * mandatory enrolment.
   */
  login: async (email: string, password: string, code?: string): Promise<LoginResult> => {
    const response = await post<ApiResponse<LoginPayload>>('/auth/login', {
      email,
      password,
      ...(code ? { code } : {}),
    });

    const data = response.data.data;

    if (data.two_factor_setup_required) {
      return {
        status: 'two_factor_setup_required',
        setupToken: data.setup_token!,
        user: data.user!,
      };
    }

    if (data.two_factor_required) {
      return { status: 'two_factor_required', challengeToken: data.challenge_token! };
    }

    tokenStorage.save(data as TokenPayload);

    return { status: 'authenticated' };
  },

  /** Step 2: the 6 digit code (or a recovery code). */
  loginTwoFactor: async (challengeToken: string, code: string): Promise<void> => {
    const response = await post<ApiResponse<TokenPayload>>('/auth/login/two-factor', {
      challenge_token: challengeToken,
      code,
    });

    tokenStorage.save(response.data.data);
  },

  /** Start (or restart) the Google Authenticator enrolment. */
  setupTwoFactor: async (setupToken?: string): Promise<TwoFactorEnrolment> => {
    const response = await post<ApiResponse<TwoFactorEnrolment>>('/auth/two-factor/setup', {
      ...(setupToken ? { setup_token: setupToken } : {}),
    });

    return response.data.data;
  },

  /**
   * Confirm the enrolment. During a first login this also signs the user in and
   * returns the single use recovery codes.
   */
  confirmTwoFactor: async (
    code: string,
    setupToken?: string
  ): Promise<{ recovery_codes: string[]; user: AuthUser }> => {
    const response = await post<ApiResponse<TokenPayload & { recovery_codes: string[]; user: AuthUser }>>(
      '/auth/two-factor/confirm',
      { code, ...(setupToken ? { setup_token: setupToken } : {}) }
    );

    const data = response.data.data;

    if (data.access_token) {
      tokenStorage.save(data);
    }

    return { recovery_codes: data.recovery_codes, user: data.user };
  },

  /** Reset the enrolment; a new setup is required on the next login. */
  disableTwoFactor: async (password: string) => {
    const response = await post<ApiResponse<null>>('/auth/two-factor/disable', { password });
    return response.data;
  },

  regenerateRecoveryCodes: async () => {
    const response = await post<ApiResponse<{ recovery_codes: string[] }>>(
      '/auth/two-factor/recovery-codes'
    );
    return response.data.data;
  },

  me: async (): Promise<AuthUser> => {
    const response = await get<ApiResponse<AuthUser>>('/auth/user');
    return response.data.data;
  },

  updateProfile: async (data: { name?: string; email?: string; phone?: string | null }) => {
    const response = await put<ApiResponse<AuthUser>>('/auth/profile', data);
    return response.data.data;
  },

  updatePassword: async (payload: {
    current_password: string;
    password: string;
    password_confirmation: string;
  }) => {
    const response = await put<ApiResponse<TokenPayload>>('/auth/password', payload);

    // The server rotates every session; keep this one alive with the new pair.
    if (response.data.data?.access_token) {
      tokenStorage.save(response.data.data);
    }

    return response.data;
  },

  logout: async (allDevices = false) => {
    const refreshToken = tokenStorage.getRefreshToken();

    try {
      await post('/auth/logout', {
        ...(refreshToken ? { refresh_token: refreshToken } : {}),
        all_devices: allDevices,
      });
    } finally {
      tokenStorage.clear();
    }
  },
};
