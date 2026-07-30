import { requestUrl, RequestUrlResponse } from "obsidian";
import {
  PLUGIN_GOOGLE_CALENDAR_CONNECTION_URL,
  PLUGIN_SCHEDULE_GOOGLE_CALENDAR_URL,
} from "../../core/config";

interface ApiError {
  error?: string;
  message?: string;
}

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
      throw new Error("Google Calendar todavía no está disponible en el servidor.");
    }
    throw error;
  }
  if (response.status >= 400) {
    let error: ApiError = {};
    try {
      error = JSON.parse(response.text) as ApiError;
    } catch {
      // Use the HTTP fallback below.
    }
    throw new Error(error.message || error.error || `HTTP ${response.status}`);
  }
  return JSON.parse(response.text) as T;
}

export async function getGoogleCalendarConnectionStatus(
  pluginToken: string
): Promise<boolean> {
  const result = await post<{ connected: boolean }>(
    PLUGIN_GOOGLE_CALENDAR_CONNECTION_URL,
    pluginToken,
    { action: "status" }
  );
  return result.connected;
}

export async function beginGoogleCalendarConnection(
  pluginToken: string
): Promise<string> {
  const result = await post<{ authUrl: string }>(
    PLUGIN_GOOGLE_CALENDAR_CONNECTION_URL,
    pluginToken,
    { action: "connect" }
  );
  return result.authUrl;
}

export async function disconnectGoogleCalendar(pluginToken: string): Promise<void> {
  await post(
    PLUGIN_GOOGLE_CALENDAR_CONNECTION_URL,
    pluginToken,
    { action: "disconnect" }
  );
}

export async function scheduleGoogleCalendarReminder(options: {
  pluginToken: string;
  notificationId: string;
  title: string;
  message: string;
  scheduledDate: Date;
  obsidianDeepLink?: string;
}): Promise<void> {
  await post(
    PLUGIN_SCHEDULE_GOOGLE_CALENDAR_URL,
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
