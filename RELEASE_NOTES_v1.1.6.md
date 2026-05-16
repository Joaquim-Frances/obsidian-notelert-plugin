# Notelert Plugin v1.1.6

## Review pipeline refresh

- Publishes a fresh release after the automated review fixes passed on the review branch.
- Keeps `minAppVersion` at `1.0.0` for installation compatibility.
- Keeps the manifest description aligned between the repository root and release asset.
- Ensures the manifest description does not include the word "Obsidian".

## Release assets

- `main.js`
- `manifest.json`
- `styles.css`
