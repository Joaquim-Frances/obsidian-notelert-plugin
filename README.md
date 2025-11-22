## What is Notelert
Notelert is an app that sets notifications and reminders in the Android systems thanks to the Notelert plug-in in Obsidian. This app and plugin act as a bridge between Obsidian and the Android native capavilites regarding notifications. So you want a notification in a certain line of your note, you trigger the pop up select the notification type and confirm. Notelert opens, register the notification in the Android system and return you back to Obsidian in less than two seconds. So the notification is set and you can continue with your notes. The app also acts as list or log of your current active notifications and the old ones, and you can set some preferences also. But that's it.
Notelert app or plugin does not scans you vault in any way.

### Demo Videos
- [Demo Video 1](https://youtube.com/shorts/7So2Wmqgnjo)
- [Demo Video 2](https://youtube.com/shorts/gm-CqmlDU-0)

## Note for Obsidian Team
The plugin still need some polishing, and also the app is in an open beta test in Google Play but I do not want to go further without your consent. I really want you to test the app and plugin fully so if you provide me of some emails that the team use for testing I can add you to the beta test in Google Play so you will be able to download the app and test it properly. Without the app the plugin does nothing. If there is another way that you like to use to test the whole system I'm completely open to know about. 
Many thanks!
## How it Works 

### Basic Usage
The user triggers a pop-up using `:@` then in the pop-up the user can select the date and time that he/she wants to be notified and confirms. After confirming a deeplink is generated and the Notelert app catches it and parses the link. If the link contains a valid future date and time, the app sets a notification in the system.

### Location Notifications
If the user chooses to set a location based notification the process is the same but instead of using date and time the deeplink contains at latitude and longitude. When pressing the location button in the pop-up, appears the list of pre-selected locations that previously the user has selected in the options of the plugin.
The app uses Google Maps API and geofencing to detect the position of the device and triggers the notification when arriving.

### Email Notifications
In adition to the push notifications the user can choose if he/she wants to receive email notifications at the same moment than the push notifications. There is a section in the options page when the user can activate or deactive email notifications. Also there is a section in the options page to specify the email that the user wants to use to receive the notification. Email system is using a small backend in Firebase and Resend email system.

## Mobile vs Desktop Modes
The plugin detects when the device is desktop or mobile and changes the behaviour of the plugin. Initially I was only thinking to use the plugin for mobile, but after setting the email system I decided to use that feature in desktop mode. So in desktop due to the limitations of this project at this stage the email notifications is the only way to be notified. 
In desktop mode the user selects in the pop-up the date and time of the notification and he/she will receive an email at that moment. Also the email notification that the user sets in desktop mode are listed in the options section of the plugin and can be deleted

## Data usage
All the data that the app collects is to provide the notifications and nothing else. 
The plugin nor the app does NOT scan the vaults. Only gets the title of the note and the line of the reminder.

## Premium Features
While the plugin is totally free the app has a free mode and premium one. The free mode permit all user to set a maximum of 5 active reminders ( I'm still considering the limits). 
Also the app will have a Premium mode that will unlimit the push notifications and will enable the location and the email notifications.((both location and email notifications has costs of mantainance attached)
