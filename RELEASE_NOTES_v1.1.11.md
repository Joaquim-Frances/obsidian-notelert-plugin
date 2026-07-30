# Notelert Plugin v1.1.11

This release makes the account settings calmer and fixes the visual Premium
state after unlinking an installation.

## Highlights

- **Clear unlinking:** unlinking now clears the local Premium state
  immediately. It only revokes that plugin installation; it never cancels the
  underlying Notelert account or subscription.
- **Quieter upgrade path:** Free accounts show their reminder counter and
  progress first. Monthly and Yearly Premium options are available in the
  collapsed **Get more reminders** section when needed.
- **Localized and compatible:** the new interaction is translated across all
  supported plugin languages and remains compatible with Obsidian 1.8.7 and
  later.

## Release assets

- `main.js`
- `manifest.json`
- `styles.css`
