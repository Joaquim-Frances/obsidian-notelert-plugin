# Releases

This folder contains the compiled files of the Notelert plugin, automatically updated on each build.

## Available Files

- **`main.js`**: Compiled JavaScript code of the plugin
- **`manifest.json`**: Plugin configuration file with metadata
- **`notelert-plugin.zip`**: ZIP file containing both files above

## Installation

1. **Download the plugin files**:
   - Download `notelert-plugin.zip` or the individual files (`main.js` and `manifest.json`)
   - Extract the ZIP (if you downloaded it) or use the files directly

2. **Find the Obsidian plugins folder**:
   - **Method A (Easiest)**: In Obsidian, go to Settings → Community Plugins → Click "Open plugins folder"
   - **Method B (Manual)**: Navigate to your vault folder → Open `.obsidian` folder → Open `plugins` folder
     - **Windows**: Usually in `Documents/Obsidian/YourVaultName/.obsidian/plugins/`
     - **macOS**: Usually in `~/Documents/Obsidian/YourVaultName/.obsidian/plugins/` or in your vault location
     - **Linux**: Usually in `~/Documents/Obsidian/YourVaultName/.obsidian/plugins/` or in your vault location

3. **Create the plugin folder**:
   - In the `plugins` folder, create a new folder named `notelert`
   - If the folder already exists, you can use it or delete it and create a new one

4. **Copy the plugin files**:
   - Copy `main.js` and `manifest.json` into the `notelert` folder you just created
   - Make sure both files are directly inside the `notelert` folder (not in a subfolder)

5. **Enable the plugin in Obsidian**:
   - Go back to Obsidian Settings → Community Plugins
   - Turn off "Safe mode" (if enabled)
   - Enable "Notelert"

## Updates

This folder is automatically updated every time a push is made to the `main` or `master` branch of the repository.

