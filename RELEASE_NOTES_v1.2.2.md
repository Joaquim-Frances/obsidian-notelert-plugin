# Notelert Plugin v1.2.2

This release makes multi-channel reminder setup noticeably faster.

## Highlights

- **Faster multi-channel scheduling:** Android, email, Google Calendar, and
  Telegram are scheduled concurrently. When multiple channels are enabled, the
  wait is now determined by the slowest channel rather than the sum of all
  requests.
- **Custom trigger compatibility:** changing the date-picker trigger in plugin
  settings continues to work when creating and scheduling reminders.

## Release assets

- `main.js`
- `manifest.json`
- `styles.css`
