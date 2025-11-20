# Notelert

Automates the creation of notifications for the **Notelert** mobile app by detecting date/time patterns in your Obsidian notes. Write reminders in your notes and the plugin will automatically convert them into scheduled notifications.

## Features

- ✅ **Automatic detection** of date/time patterns using `{@date, time}` syntax
- ✅ **Interactive date picker** - Type `{@` to open a visual date and time selector
- ✅ **Location selector** - Type `{#` to create location-based reminders (geofencing)
- ✅ **Multi-language support** - 10 popular languages with native keywords
- ✅ **Relative dates** - Supports "today", "tomorrow", "yesterday" in multiple languages
- ✅ **Absolute dates** - Formats DD/MM, DD/MM/YYYY, DD-MM-YYYY
- ✅ **Multiple time formats** - HH:MM, H:MM, HH.MM, H.MM
- ✅ **Email notifications** - On desktop, schedule emails directly without needing the mobile app
- ✅ **Notelert integration** - On mobile, automatically opens the Notelert app
- ✅ **Geocoding** - Support for multiple providers (Google Maps, Nominatim, Mapbox, etc.)
- ✅ **Flexible configuration** - Customize keywords, excluded folders, and more

## Installation

### From Obsidian (Recommended)

1. Open **Settings** → **Community plugins**
2. Search for "Notelert"
3. Click **Install** and then **Enable**

### Manual Installation

1. Download the latest version from [GitHub Releases](https://github.com/tu-usuario/obsidian-notelert-plugin/releases)
2. Extract the `main.js` and `manifest.json` files to your plugins folder:
   ```
   .obsidian/plugins/obsidian-notelert-plugin/
   ```
3. Restart Obsidian and enable the plugin in **Settings** → **Community plugins**

## Usage

### Basic Syntax

The plugin detects patterns using the `{@date, time}` syntax:

```
{@tomorrow, 10:00} Important team meeting
{@15/12/2025, 14:30} Doctor's appointment
{@today, 18:00} Buy Christmas gifts
```

### Interactive Date Picker

1. Type `{@` in any note
2. A date and time selector will automatically open
3. Select the desired date and time
4. The plugin will automatically create the notification

### Location Selector

1. Type `{#` in any note
2. A location selector with an interactive map will open
3. Search for an address or click on the map
4. Configure the geofence radius
5. The plugin will create a location-based reminder

### Examples

#### Relative Dates
```
{@today, 16:00} Review pending emails
{@tomorrow, 09:00} Call the client
{@yesterday, 20:00} Review meeting notes
```

#### Absolute Dates
```
{@12/10, 18:00} Buy birthday gifts
{@15/10/2025, 14:30} Important doctor's appointment
{@31-12-2025, 23:59} New Year's celebration
```

#### With Location
```
{#Home, 100m} Arrive home and take medication
{#Work, 50m} Team meeting at the office
{#Supermarket, 200m} Buy ingredients for dinner
```

## Configuration

Access settings from **Settings** → **Community plugins** → **Notelert**

### General Settings

- **Enable date picker** - Enable/disable the picker when typing `{@`
- **Debug mode** - Show debug messages in the console
- **Language** - Select the language for pattern detection (10 languages available)

### Desktop Settings (Email)

- **User email** - Your email to receive scheduled notifications
- **Notelert API Key** - API key for authentication (included by default)

### Location Settings

- **Geocoding provider** - Choose between Google Maps, Nominatim, Mapbox, etc.
- **API Keys** - Configure optional API keys for premium providers
- **Saved locations** - Manage your favorite locations

### Excluded Folders

By default, these folders are not processed:
- `Templates`
- `Archive`
- `Trash`

You can add more folders in the settings.

## Supported Languages

The plugin supports pattern detection in 10 languages:

- 🇪🇸 **Spanish** - `Recordar:`, `Notificar:`, `Alerta:`, etc.
- 🇺🇸 **English** - `Remember:`, `Notify:`, `Alert:`, etc.
- 🇫🇷 **French** - `Rappeler:`, `Notifier:`, `Alerte:`, etc.
- 🇩🇪 **German** - `Erinnern:`, `Benachrichtigen:`, `Alarm:`, etc.
- 🇮🇹 **Italian** - `Ricordare:`, `Notificare:`, `Allerta:`, etc.
- 🇵🇹 **Portuguese** - `Lembrar:`, `Notificar:`, `Alerta:`, etc.
- 🇷🇺 **Russian** - `Напомнить:`, `Уведомить:`, `Тревога:`, etc.
- 🇯🇵 **Japanese** - `覚えて:`, `通知:`, `アラート:`, etc.
- 🇨🇳 **Chinese** - `记住:`, `通知:`, `警报:`, etc.
- 🇸🇦 **Arabic** - `تذكر:`, `إشعار:`, `تنبيه:`, etc.

Each language has its own native keywords and support for relative dates.

## Requirements

- **Obsidian**: Version 0.15.0 or higher
- **Operating systems**: Windows, macOS, Linux
- **Notelert** (optional): Mobile app installed for push notifications on mobile devices

## Platforms

### Desktop (Windows, macOS, Linux)

On desktop, the plugin schedules **email** notifications directly using the Notelert API. You don't need the mobile app installed.

### Mobile (Android/iOS)

On mobile devices, the plugin automatically opens the **Notelert** app using deeplinks to create push notifications.

## Troubleshooting

### Date picker doesn't open

- Verify that "Enable date picker" is enabled in settings
- Make sure you type exactly `{@` (no spaces)
- Restart Obsidian if the problem persists

### Notifications are not created

- **On desktop**: Verify that your email is configured correctly
- **On mobile**: Make sure the Notelert app is installed
- Enable debug mode to see detailed messages in the console

### Geocoding errors

- Verify that your API key is configured correctly (if using a premium provider)
- Consider switching to Nominatim (free, no API key required)
- Check the logs in the console with debug mode enabled

## Development

### Build from source

```bash
# Clone the repository
git clone https://github.com/tu-usuario/obsidian-notelert-plugin.git
cd obsidian-notelert-plugin

# Install dependencies
npm install

# Compile the plugin
npm run build
```

### Project Structure

```
obsidian-notelert-plugin/
├── src/
│   ├── main.ts              # Plugin entry point
│   ├── core/                # Configuration and types
│   ├── features/            # Main features
│   ├── modals/              # Interface modals
│   └── settings/            # Settings panel
├── manifest.json            # Plugin manifest
└── package.json             # Dependencies and scripts
```

## Contributing

Contributions are welcome. Please:

1. Fork the project
2. Create a branch for your feature (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License. See the `LICENSE` file for details.

## Author

**Quim Frances**

- GitHub: [@tu-usuario](https://github.com/tu-usuario)

## Acknowledgments

- Obsidian team for the excellent API
- Plugin developer community
- All users who report bugs and suggest improvements

---

**Having problems or suggestions?** Open an [issue on GitHub](https://github.com/tu-usuario/obsidian-notelert-plugin/issues).

**Like the plugin?** Give it a star ⭐ on GitHub!
