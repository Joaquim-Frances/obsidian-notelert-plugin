import { requestUrl } from 'obsidian';
import { PLUGIN_LIST_REMINDERS_URL } from '../../core/config';
import { DeliveryChannel, RecurrenceConfig } from '../../core/types';

export interface ScheduledReminder {
  notificationId: string;
  title: string;
  scheduledDate: string;
  recurrence: RecurrenceConfig | null;
  channels: DeliveryChannel[];
}

export async function listScheduledReminders(pluginToken: string): Promise<ScheduledReminder[]> {
  const response = await requestUrl({
    url: PLUGIN_LIST_REMINDERS_URL,
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-plugin-token': pluginToken },
    body: '{}',
  });
  if (response.status >= 400) throw new Error(`No se pudieron cargar los recordatorios (${response.status}).`);
  return (JSON.parse(response.text) as { reminders?: ScheduledReminder[] }).reminders || [];
}
