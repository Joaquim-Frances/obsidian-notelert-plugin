import { requestUrl } from 'obsidian';
import {
  PLUGIN_GET_NOTIFICATION_EMAIL_URL,
  PLUGIN_REQUEST_EMAIL_VERIFICATION_URL,
  PLUGIN_VERIFY_NOTIFICATION_EMAIL_URL,
} from '../../core/config';

export type NotificationEmailStatus = 'missing' | 'verified' | 'disabled';

interface ApiError {
  error?: string;
  message?: string;
}

class PluginApiError extends Error {
  constructor(
    message: string,
    readonly code?: string,
    readonly status?: number,
  ) {
    super(message);
    this.name = "PluginApiError";
  }
}

export interface NotificationEmailConfiguration {
  notificationEmail: string | null;
  status: NotificationEmailStatus;
  hasActivePushDevice: boolean;
}

export interface EmailVerificationRequestResult {
  verificationId: string;
  expiresAt: string;
}

export interface EmailVerificationResult extends NotificationEmailConfiguration {
  pluginToken?: string;
}

function parseJson<T>(text: string): T {
  try {
    return JSON.parse(text) as T;
  } catch {
    return {} as T;
  }
}

function headers(pluginToken?: string): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    ...(pluginToken?.trim() ? { 'x-plugin-token': pluginToken.trim() } : {}),
  };
}

function throwApiError(status: number, text: string): never {
  const error = parseJson<ApiError>(text);
  throw new PluginApiError(error.message || error.error || `HTTP ${status}`, error.error, status);
}

function isInvalidPluginTokenError(error: unknown): boolean {
  return error instanceof PluginApiError &&
    error.status === 401 &&
    error.code === "INVALID_PLUGIN_TOKEN";
}

export async function requestEmailVerification(options: {
  email: string;
  installationId: string;
  pluginToken?: string;
}): Promise<EmailVerificationRequestResult> {
  const request = async (pluginToken?: string): Promise<EmailVerificationRequestResult> => {
    const response = await requestUrl({
      url: PLUGIN_REQUEST_EMAIL_VERIFICATION_URL,
      method: 'POST',
      headers: headers(pluginToken),
      body: JSON.stringify({ email: options.email, installationId: options.installationId }),
      throw: false,
    });
    if (response.status >= 400) {
      throwApiError(response.status, response.text);
    }
    return parseJson<EmailVerificationRequestResult>(response.text);
  };

  try {
    return await request(options.pluginToken);
  } catch (error) {
    // A revoked/expired installation must be recoverable from the verified
    // email alone. Retrying without the stale credential creates that path.
    if (!options.pluginToken?.trim() || !isInvalidPluginTokenError(error)) {
      throw error;
    }
    return request();
  }
}

export async function verifyNotificationEmail(options: {
  verificationId: string;
  code: string;
  installationId: string;
  pluginToken?: string;
}): Promise<EmailVerificationResult> {
  const request = async (pluginToken?: string): Promise<EmailVerificationResult> => {
    const response = await requestUrl({
      url: PLUGIN_VERIFY_NOTIFICATION_EMAIL_URL,
      method: 'POST',
      headers: headers(pluginToken),
      body: JSON.stringify({
        verificationId: options.verificationId,
        code: options.code,
        installationId: options.installationId,
      }),
      throw: false,
    });
    if (response.status >= 400) {
      throwApiError(response.status, response.text);
    }
    return parseJson<EmailVerificationResult>(response.text);
  };

  try {
    return await request(options.pluginToken);
  } catch (error) {
    if (!options.pluginToken?.trim() || !isInvalidPluginTokenError(error)) {
      throw error;
    }
    return request();
  }
}

export async function getNotificationEmailConfiguration(
  pluginToken: string
): Promise<NotificationEmailConfiguration> {
  const response = await requestUrl({
    url: PLUGIN_GET_NOTIFICATION_EMAIL_URL,
    method: 'GET',
    headers: headers(pluginToken),
    throw: false,
  });
  if (response.status >= 400) {
    throwApiError(response.status, response.text);
  }
  return parseJson<NotificationEmailConfiguration>(response.text);
}
