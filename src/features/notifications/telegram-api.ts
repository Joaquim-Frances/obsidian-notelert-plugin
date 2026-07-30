import { requestUrl, RequestUrlResponse } from "obsidian";
import {
  PLUGIN_SCHEDULE_TELEGRAM_URL,
  PLUGIN_TELEGRAM_CONNECTION_URL,
} from "../../core/config";

async function post<T>(
  url: string,
  pluginToken: string,
  body: Record<string, unknown>
): Promise<T> {
  let response: RequestUrlResponse;
  try {
    response = await requestUrl({
      url,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-plugin-token": pluginToken,
      },
      body: JSON.stringify(body),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes("404")) {
      throw new Error("Telegram todavía no está disponible en el servidor.");
    }
    throw error;
  }
  if (response.status >= 400) {
    let message = `HTTP ${response.status}`;
    try {
      const data = JSON.parse(response.text) as { error?: string; message?: string };
      message = data.message || data.error || message;
    } catch {
      // Keep the HTTP fallback.
    }
    throw new Error(message);
  }
  return JSON.parse(response.text) as T;
}

export async function getTelegramConnectionStatus(pluginToken: string): Promise<boolean> {
  const result = await post<{ connected: boolean }>(
    PLUGIN_TELEGRAM_CONNECTION_URL,
    pluginToken,
    { action: "status" }
  );
  return result.connected;
}

export async function beginTelegramConnection(pluginToken: string): Promise<string> {
  const result = await post<{ connectUrl: string }>(
    PLUGIN_TELEGRAM_CONNECTION_URL,
    pluginToken,
    { action: "connect" }
  );
  return result.connectUrl;
}

export async function scheduleTelegramReminder(options: {
  pluginToken: string;
  notificationId: string;
  title: string;
  message: string;
  scheduledDate: Date;
  obsidianDeepLink?: string;
}): Promise<void> {
  await post(
    PLUGIN_SCHEDULE_TELEGRAM_URL,
    options.pluginToken,
    {
      notificationId: options.notificationId,
      title: options.title,
      message: options.message,
      scheduledDate: options.scheduledDate.toISOString(),
      obsidianDeepLink: options.obsidianDeepLink,
    }
  );
}
