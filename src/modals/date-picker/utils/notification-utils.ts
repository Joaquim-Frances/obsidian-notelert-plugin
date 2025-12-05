/**
 * Utilidades para crear notificaciones desde el date picker
 */

import { Editor, EditorPosition } from "obsidian";
import { DetectedPattern, SavedLocation } from "../../../core/types";
import { INotelertPlugin } from "../../../core/plugin-interface";
import { errorToString } from "../../../features/notifications/utils";

/**
 * Crea una notificación desde el date picker con fecha y hora
 */
export async function createNotificationFromDatePicker(
  plugin: INotelertPlugin,
  editor: Editor,
  cursor: EditorPosition,
  trigger: string,
  date: string,
  time: string,
  fullText: string,
  language: string
): Promise<boolean> {
  try {
    // Obtener el título de la nota (nombre del archivo sin extensión)
    const activeFile = plugin.app.workspace.getActiveFile();
    const noteTitle = activeFile ? activeFile.basename : 'Nota';

    // Obtener la línea actual y limpiarla de los patrones trigger+fecha, hora
    const currentLine = editor.getLine(cursor.line);
    // Escapar el trigger para usar en regex
    const escapedTrigger = trigger.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const cleanMessage = currentLine.replace(new RegExp(`${escapedTrigger}[^,\\s]+,\\s*[^\\s]+`, 'g'), '').trim();

    // Crear el patrón detectado
    const pattern: DetectedPattern = {
      text: fullText.trim(),
      title: noteTitle,
      message: cleanMessage,
      date: date,
      time: time,
      fullMatch: `${trigger}${date}, ${time}`,
      startIndex: 0,
      endIndex: fullText.length,
      filePath: activeFile?.path,
      lineNumber: cursor.line + 1,
      type: 'time'
    };

    // Crear la notificación directamente
    await plugin.createNotificationAndMarkProcessed(pattern);

    return true;
  } catch (err) {
    const errorMessage = errorToString(err);
    plugin.log(`Error creando notificación desde date picker: ${errorMessage}`);
    const { getTranslation } = await import("../../../i18n");
    const { Notice } = await import("obsidian");
    new Notice(getTranslation(language, "notices.errorCreatingNotification", { title: "Recordatorio" }));
    return false;
  }
}

/**
 * Crea una notificación desde una ubicación guardada
 */
export async function createNotificationFromLocation(
  plugin: INotelertPlugin,
  editor: Editor,
  cursor: EditorPosition,
  trigger: string,
  location: SavedLocation,
  language: string
): Promise<boolean> {
  try {
    // Reemplazar el trigger con :#nombreUbicacion (siempre usamos :# para ubicaciones)
    const replacement = `:#${location.name}`;
    const line = editor.getLine(cursor.line);
    const beforeCursor = line.substring(0, cursor.ch - trigger.length); // Quitar el trigger
    const afterCursor = line.substring(cursor.ch);
    const newLine = beforeCursor + replacement + afterCursor;

    editor.setLine(cursor.line, newLine);

    // Mover cursor al final del reemplazo
    const newCursor = {
      line: cursor.line,
      ch: beforeCursor.length + replacement.length
    };
    editor.setCursor(newCursor);

    // Obtener el título de la nota (nombre del archivo sin extensión)
    const activeFile = plugin.app.workspace.getActiveFile();
    const noteTitle = activeFile ? activeFile.basename : 'Nota';

    // Obtener la línea actual y limpiarla de los patrones :#ubicacion
    const currentLine = editor.getLine(cursor.line);
    const cleanMessage = currentLine.replace(/:#[^\s]+/g, '').trim();

    // Crear el patrón detectado
    const pattern: DetectedPattern = {
      text: newLine.trim(),
      title: noteTitle,
      message: cleanMessage,
      date: new Date().toISOString().split('T')[0],
      time: "00:00",
      fullMatch: replacement,
      startIndex: 0,
      endIndex: newLine.length,
      filePath: activeFile?.path,
      lineNumber: cursor.line + 1,
      location: location.name,
      latitude: location.latitude,
      longitude: location.longitude,
      radius: location.radius,
      type: 'location'
    };

    // Crear la notificación directamente
    await plugin.createNotificationAndMarkProcessed(pattern);

    plugin.log(`Notificación de ubicación creada: ${pattern.title} en ${location.name}`);
    return true;
  } catch (err) {
    const errorMessage = errorToString(err);
    plugin.log(`Error creando notificación de ubicación: ${errorMessage}`);
    const { getTranslation } = await import("../../../i18n");
    const { Notice } = await import("obsidian");
    new Notice(getTranslation(language, "notices.errorCreatingNotification", { title: "Recordatorio de ubicación" }));
    return false;
  }
}

