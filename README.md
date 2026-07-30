# Notelert

Notelert turns a line in an Obsidian note into a reminder delivered through
Android push, email, Google Calendar, Telegram, or any combination of those
channels.

Android is optional for date and time reminders. It is only required for
Android push notifications and location-based reminders.

## Features

- Date and time reminders from the `:@` picker.
- Independent delivery toggles for Android, email, Google Calendar, and
  Telegram.
- Location reminders through the Notelert Android app.
- Daily, weekly, monthly, and yearly recurrence on supported plans.
- Quick actions such as today, tomorrow, in one hour, and in two hours.
- Return links that can open the originating Obsidian note.
- Settings and reminder picker available in Spanish, English, Catalan, French,
  German, and Portuguese.

## Free and paid plans

The Free plan includes 10 reminders per month. One reminder consumes one unit
even when it is delivered through several selected channels.

Premium features and limits are shown before purchase in the plugin. They can
include higher email allowances, recurring reminders, and location reminders.
Current prices and entitlements are confirmed by the checkout provider before
payment.

## First-time setup

Notelert requires an account-linked App link token. You can obtain it from the
Notelert Android app or by completing the email account flow in plugin
settings.

1. Install and enable Notelert in Obsidian.
2. Open **Settings → Notelert**.
3. Link an existing App link token or verify your email.
4. Enable the delivery channels you want:
   - **Email:** enter and verify the delivery address once.
   - **Google Calendar:** enable its toggle and approve Google OAuth once.
   - **Telegram:** enable its toggle, open the Notelert bot, and press Start
     once.
   - **Android:** open the Notelert Android app and link the same account.
5. Type `:@` in a note, select the reminder date and time, and confirm.

Google Calendar and Telegram remain connected until you disconnect them,
revoke provider access, or delete your Notelert account.

## Network access and external services

Notelert uses remote services because reminders need to run while Obsidian is
closed. The plugin connects to Notelert endpoints hosted on Firebase/Google
Cloud for authentication, account management, quota validation, scheduling,
and delivery status.

Depending on the channels you enable, Notelert also uses:

- Firebase Cloud Messaging for Android push delivery.
- An email delivery provider for verification and reminder emails.
- Google Calendar API after you grant the `calendar.events` OAuth permission.
- Telegram Bot API after you connect the Notelert bot.
- Google Maps services for saved locations and location reminders.
- Stripe or Google Play when you explicitly start a purchase or manage a
  subscription.

Notelert does not run marketing analytics from the Obsidian plugin.
Operational records such as request status, delivery status, error type,
notification identifier, and quota usage may be processed to deliver and
secure the service. Notelert also keeps anonymous daily counters for channel
selection, connection state, delivery outcome, and quota blocks. Those
aggregated counters contain no reminder content, email address, Calendar ID,
Telegram chat ID, or Notelert account ID.

## Data sent

When you create a reminder, the plugin sends only the information required for
that request:

- Reminder title and the selected reminder line.
- Date, time, recurrence, and selected delivery channels.
- Location name and coordinates for a location reminder.
- An optional Obsidian return link.
- The account-linked App link token in an authenticated request header.
- An email address when you configure email delivery.

Google OAuth tokens and Telegram chat identifiers are stored encrypted on the
Notelert backend. They are never returned to or bundled inside the public
plugin. Provider secrets and API credentials are also kept server-side.

The plugin does not scan vaults, upload complete notes, read unrelated note
content, or collect vault contents for analytics.

## Disconnecting and deleting data

Email, Google Calendar, and Telegram can be disconnected from Notelert
settings. Account export, installation revocation, and global account deletion
are available under **Account & privacy**.

- [Privacy Policy](https://notelert.com/privacy)
- [Terms and Conditions](https://notelert.com/terms)
- [Account deletion](https://notelert.com/delete-account)

Deleting a Notelert account removes stored integration credentials and pending
Notelert data. Calendar events already created in the user's own Google
Calendar and Telegram messages already delivered remain under those providers'
controls.

## Android app

The Android app is available for push and location reminders:

<a href="https://play.google.com/store/apps/details?id=com.quim79.notelert"><img src="https://play.google.com/intl/en_us/badges/static/images/badges/en_badge_web_generic.png" alt="Get it on Google Play" height="60"/></a>

iOS push and location delivery are not currently available. Email, Google
Calendar, and Telegram can still be used without an Android device.

## Development

```bash
npm install
npm run build
npm run release:assets
```

An Obsidian release contains exactly:

- `main.js`
- `manifest.json`
- `styles.css`

## Privacy summary

Notelert processes the reminder line the user explicitly selects and the
associated scheduling data. It does not inspect unrelated files or upload full
vault contents.
