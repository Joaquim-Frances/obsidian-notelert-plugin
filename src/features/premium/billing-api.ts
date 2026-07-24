import { requestUrl } from 'obsidian';
import {
  PLUGIN_CREATE_STRIPE_CHECKOUT_URL,
  PLUGIN_CREATE_STRIPE_PORTAL_URL,
} from '../../core/config';

interface BillingResponse {
  url?: string;
  error?: string;
  message?: string;
}

async function billingRequest(url: string, pluginToken: string, body: Record<string, unknown>): Promise<string> {
  const response = await requestUrl({
    url,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-plugin-token': pluginToken.trim(),
    },
    body: JSON.stringify(body),
    throw: false,
  });
  const data = response.json as BillingResponse;
  if (response.status !== 200 || !data.url) {
    throw new Error(data.message || data.error || `Billing request failed (${response.status})`);
  }
  return data.url;
}

export function createStripeCheckout(
  pluginToken: string,
  billingPeriod: 'monthly' | 'yearly',
  locale: string
): Promise<string> {
  return billingRequest(PLUGIN_CREATE_STRIPE_CHECKOUT_URL, pluginToken, { billingPeriod, locale });
}

export function createStripePortal(pluginToken: string): Promise<string> {
  return billingRequest(PLUGIN_CREATE_STRIPE_PORTAL_URL, pluginToken, {});
}
