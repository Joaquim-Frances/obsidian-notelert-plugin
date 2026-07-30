# Notelert Plugin v1.2.0

This release lets reminders leave Obsidian through the channel that works best
for each moment, without requiring the Android app for time-based reminders.

## Highlights

- **Four delivery channels:** send reminders through Android, email, Google
  Calendar, Telegram, or any combination of them.
- **Simple one-time connections:** connect Google Calendar through OAuth and
  Telegram through the official Notelert bot. Once connected, the plugin
  remembers the channel until you disconnect it.
- **One shared Free allowance:** Free includes 10 reminders per month. A
  reminder counts once even when it uses multiple delivery channels.
- **Cleaner settings:** email and Telegram configuration stay collapsed after
  setup, while connection labels make each channel's state clear.
- **Safer public plugin:** provider credentials, OAuth tokens, and Telegram chat
  identifiers stay on the Notelert backend and are never bundled into Obsidian.

## Release assets

- `main.js`
- `manifest.json`
- `styles.css`
