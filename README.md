# Notelert

Notelert is an Obsidian companion plugin for the Notelert Android app.

The plugin requires the Android app to create and deliver notifications. Install it from Google Play:

https://play.google.com/store/apps/details?id=com.quim79.notelert

⚠️ ATTENTION: All previous versions of the App in Google Play are not working any more. On May 22 a new version has been uploaded to Google Play that should work fine. Please update your app. If the update gives you any error, uninstall it completely and reinstall it from 0. 🙏🏻

Privacy note: Notelert only sends the notification line that you choose to turn into a reminder. It never scans your vaults, never reads unrelated notes, and never uploads full note files.

Notelert is currently in a testing phase. The plugin, Android app, backend, and premium flows are being actively validated and may change as the system is refined.

## What It Does

Notelert lets you turn lines in Obsidian into reminders handled by the Notelert service and Android app. Open the notification picker from a note, choose the reminder details, and the plugin schedules the notification through Firebase.

The current plugin flow does not use Notelert deeplinks to schedule notifications. Scheduling is handled through authenticated Firebase endpoints using the App link token from the Android app.

## Requirements

- Obsidian 1.13.0 or newer
- The Notelert Android app
- An App link token generated in the Android app
- Internet access for Firebase scheduling and premium validation
- A Premium plan for some advanced features

The iOS app is not available yet. iOS support is planned, but this plugin currently depends on the Android app.

## Main Features

- Push notifications for date and time reminders
- Location-based notifications using saved locations from the Android app
- Email reminders when an email is configured and the account supports them
- Recurring reminders with daily, weekly, monthly, or yearly intervals
- Recurrence end rules: never, after a number of times, or on a specific date
- Saved location loading from the Notelert backend
- Quick actions such as today, tomorrow, in 1 hour, and in 2 hours
- Configurable picker trigger, defaulting to `:@`
- Multilanguage UI for the settings and picker
- Obsidian return links included in scheduled notifications when the note context is available
- Optional local list of scheduled email reminders inside plugin settings

## Premium Features

Some Notelert features are Premium because they depend on backend processing, geofencing, email delivery, or recurring scheduling.

Premium-related features include:

- Location notifications
- Recurring notifications
- Email reminder delivery
- Higher backend limits where applicable
- Calendar sync when enabled from the Notelert app and backend account

Free users can still use basic date and time push reminders, subject to the limits shown in the app.

## How To Use

1. Install the Notelert Android app from Google Play.
2. Open the Android app and create or access your account.
3. Generate an App link token in the app settings.
4. In Obsidian, install Notelert from Community Plugins.
5. Open Settings > Notelert.
6. Paste the token into App link token.
7. Type the configured trigger in a note. The default trigger is `:@`.
8. Choose date/time, location, and recurrence options in the picker.
9. Confirm the reminder.

The app and plugin linking steps only need to be completed once per device or Obsidian installation. Make sure the same App link token is available in both the mobile app and the desktop plugin. On mobile Obsidian, token synchronization should happen automatically when everything is working correctly. On desktop, or if automatic synchronization does not complete, you may need to copy the token manually from the Android app into the plugin settings.

The plugin sends the selected reminder data to Firebase. The Android app and Notelert backend then handle delivery.

## Firebase And Remote Services

Notelert uses remote services because reminders must be delivered even when Obsidian is closed.

Services used by the Notelert system include:

- Firebase Functions for scheduling push notifications and emails
- Firebase and Google cloud infrastructure for backend processing
- Firebase Cloud Messaging for push delivery through the Android app
- Google Maps services for saved locations and location-based reminders
- Resend or equivalent email infrastructure for email reminders

The plugin authenticates requests with the App link token. API keys are not stored in the plugin.

## Data Sent

The plugin sends only the data needed to create the requested reminder. In normal use, this means the line selected for the notification and the scheduling metadata around it:

- Reminder title and selected reminder text
- Scheduled date and time
- Notification type, such as time or location
- Saved location name and coordinates when creating a location reminder
- Recurrence configuration when recurrence is enabled
- App link token for authentication and premium validation
- An Obsidian return link when available, so the notification can take you back to the note context
- Optional email address if email reminders are configured

The plugin does not scan your vault. It works from the reminder you explicitly create in the picker.

## Tracking And Analytics

Notelert uses minimal technical tracking required to schedule and deliver notifications reliably. This can include request metadata, delivery status, error information, notification identifiers, and account or token validation data.

The Android app may also use anonymous analytics to understand whether the testing system is working correctly, diagnose failures, and improve reliability. These analytics are not intended to identify personal note content and can be disabled from the Android app settings.

Notelert does not use the Obsidian plugin to collect marketing analytics from your vault.

## What Is Not Sent

- Full vault contents
- Entire note files
- Unrelated note content
- Folder scans for analytics
- Advertising payloads from the Obsidian plugin

## Calendar Sync

Calendar sync belongs to the broader Notelert app and backend system. When enabled for an account, calendar-related reminder data is handled by the Android app and backend, not by local vault scanning in the Obsidian plugin.

Because the system is still in testing, availability can depend on the app version, account configuration, and Premium status.

## Development

Build the plugin:

```bash
npm run build
```

Prepare Obsidian release assets:

```bash
npm run release:assets
```

The public release should include only:

- `main.js`
- `manifest.json`
- `styles.css`

Do not upload ZIP files as public Obsidian release assets.

## Status

Notelert is under active testing. Feedback from Obsidian review, Android testing, and real reminder delivery is being used to stabilize the plugin and companion app before broader release.
