import { INotelertPlugin } from "../../core/plugin-interface";
import { NotelertDatePickerModal } from "../../modals/DatePickerModal";
import { NotelertLocationPickerModal } from "../../modals/LocationPickerModal";

export function handleEditorChange(
  editor: any,
  info: any,
  plugin: INotelertPlugin
): void {
  if (!plugin.settings.enableDatePicker || !plugin.settings.useNewSyntax) return;
  
  const cursor = editor.getCursor();
  const line = editor.getLine(cursor.line);
  const beforeCursor = line.substring(0, cursor.ch);
  
  // Detectar si se acaba de escribir :@
  if (beforeCursor.endsWith(':@')) {
    plugin.log("Detectado :@ - abriendo date picker");
    openDatePicker(editor, cursor, plugin);
    return;
  }
  
  // Detectar si se acaba de escribir :#
  if (beforeCursor.endsWith(':#')) {
    plugin.log("Detectado :# - abriendo location picker");
    openLocationPicker(editor, cursor, plugin);
  }
}

// Abrir date picker y reemplazar :@ con la fecha/hora seleccionada
export function openDatePicker(editor: any, cursor: any, plugin: INotelertPlugin): void {
  const line = editor.getLine(cursor.line);
  const originalText = line;
  
  new NotelertDatePickerModal(
    plugin.app,
    plugin,
    plugin.settings.language,
    editor,
    cursor,
    originalText,
    () => {
      plugin.log("Date picker cancelado");
    }
  ).open();
}

// Abrir location picker y reemplazar :# con la ubicación seleccionada
export function openLocationPicker(editor: any, cursor: any, plugin: INotelertPlugin): void {
  const line = editor.getLine(cursor.line);
  const originalText = line;
  
  new NotelertLocationPickerModal(
    plugin.app,
    plugin,
    plugin.settings.language,
    editor,
    cursor,
    originalText,
    () => {
      plugin.log("Location picker cancelado");
    }
  ).open();
}

