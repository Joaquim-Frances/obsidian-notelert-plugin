# Notelert

Notelert is a companion Obsidian plugin for the Notelert Android app. It detects reminder patterns in your notes, builds a deeplink, and hands the reminder off to the mobile app for delivery. The plugin does not scan your vault.

## Availability

Notelert is available in the Obsidian Community Plugins library. Open Obsidian, browse community plugins, and search for `Notelert`.

## What It Does

- Date and time reminders from your notes
- Location reminders through the companion Android app
- Email reminders for supported premium flows
- Optional recurrence support
- Visual indicators and a configurable trigger to open the picker

## Requirements

- Obsidian 0.15.0 or higher
- The Notelert Android app installed on your device
- A plugin token from the mobile app for premium features
- Premium in the companion app for location reminders and email reminders

## How It Works

1. You type the configured trigger in a note. The default trigger is `:@`.
2. The plugin opens the picker and reads only the relevant reminder text.
3. You confirm the reminder details.
4. The plugin sends the reminder to the Notelert backend and the Android app handles delivery.

### Date and Time

The plugin parses date and time patterns from the current note and creates a reminder without scanning your vault.

### Location

Location reminders use the companion app and backend services to resolve and deliver geofenced notifications.

### Email

Email reminders are scheduled through the backend and require the token configured in the plugin settings.

## Privacy and Remote Services

Notelert uses remote services because the notifications have to be delivered even when Obsidian is not active.

### Services Used

- Firebase Functions for scheduling and delivery
- Firebase and Google cloud infrastructure for the backend transport layer
- Google Maps services for location-related features
- Resend for email delivery

### Data Sent

- The note title and the specific reminder text you select
- Scheduled date and time
- Location search text when you request a location reminder
- Your plugin token for premium verification and authenticated requests

### What Is Not Sent

- Full vault contents
- File contents from your notes
- Marketing identifiers or ad-tech payloads from this plugin

### Tracking and Analytics

- This plugin repository does not include marketing trackers.
- Google/Firebase infrastructure may process the technical metadata required to operate the service securely, such as request and device-level information handled by the backend.
- There is no plugin-side analytics switch in this repository. If the companion app exposes anonymous usage analytics, that control should live in the mobile app settings and can be disabled there.

## Premium Features

- Free mode: date and time reminders
- Premium mode: location reminders and email reminders

## Development

```bash
npm run build
```

This compiles the plugin into `dist/main.js` and `dist/manifest.json`.

```bash
npm run release:assets
```

This prepares the release assets in `releases/` for GitHub Releases.

## Notes

- The plugin only reads the reminder line you trigger, not the rest of the vault.
- The settings UI includes a plugin token field because premium features depend on the companion backend.
