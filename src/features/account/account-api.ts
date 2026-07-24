import { requestUrl } from 'obsidian';
import {
  PLUGIN_CONFIRM_ACCOUNT_ACTION_URL,
  PLUGIN_GET_ACCOUNT_SUMMARY_URL,
  PLUGIN_REQUEST_ACCOUNT_ACTION_URL,
  PLUGIN_REVOKE_INSTALLATION_URL,
} from '../../core/config';

export type AccountAction = 'export' | 'delete';

interface ApiError {
  error?: string;
  message?: string;
}

export interface AccountSummary {
  userId: string;
  accountType: 'google' | 'email';
  email: string | null;
  notificationEmail: string | null;
  notificationEmailStatus: string;
  plan: 'free' | 'trial' | 'premium';
  activePluginInstallations: number;
  activeDevices: number;
  scheduledEmailReminders: number;
  scheduledPushReminders: number;
  createdAt: string | null;
}

function parseJson<T>(text: string): T {
  try {
    return JSON.parse(text) as T;
  } catch {
    return {} as T;
  }
}

function headers(pluginToken: string): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    'x-plugin-token': pluginToken.trim(),
  };
}

function throwApiError(status: number, text: string): never {
  const error = parseJson<ApiError>(text);
  throw new Error(error.message || error.error || `HTTP ${status}`);
}

async function apiRequest<T>(options: {
  url: string;
  method: 'GET' | 'POST';
  pluginToken: string;
  body?: Record<string, unknown>;
}): Promise<T> {
  const response = await requestUrl({
    url: options.url,
    method: options.method,
    headers: headers(options.pluginToken),
    ...(options.body ? { body: JSON.stringify(options.body) } : {}),
    throw: false,
  });
  if (response.status >= 400) throwApiError(response.status, response.text);
  return parseJson<T>(response.text);
}

export async function getAccountSummary(pluginToken: string): Promise<AccountSummary> {
  const result = await apiRequest<{ account: AccountSummary }>({
    url: PLUGIN_GET_ACCOUNT_SUMMARY_URL,
    method: 'GET',
    pluginToken,
  });
  return result.account;
}

export async function requestAccountAction(options: {
  pluginToken: string;
  installationId: string;
  action: AccountAction;
}): Promise<{ verificationId: string; expiresAt: string }> {
  return apiRequest({
    url: PLUGIN_REQUEST_ACCOUNT_ACTION_URL,
    method: 'POST',
    pluginToken: options.pluginToken,
    body: { action: options.action, installationId: options.installationId },
  });
}

export async function confirmAccountAction<T = unknown>(options: {
  pluginToken: string;
  installationId: string;
  action: AccountAction;
  verificationId: string;
  code: string;
  confirmation?: 'DELETE';
}): Promise<{ success: true; data?: T }> {
  return apiRequest({
    url: PLUGIN_CONFIRM_ACCOUNT_ACTION_URL,
    method: 'POST',
    pluginToken: options.pluginToken,
    body: {
      action: options.action,
      verificationId: options.verificationId,
      code: options.code,
      installationId: options.installationId,
      ...(options.confirmation ? { confirmation: options.confirmation } : {}),
    },
  });
}

export async function revokeCurrentInstallation(pluginToken: string): Promise<void> {
  await apiRequest({
    url: PLUGIN_REVOKE_INSTALLATION_URL,
    method: 'POST',
    pluginToken,
    body: {},
  });
}
