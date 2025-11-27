import { Editor, EditorPosition } from "obsidian";
import { INotelertPlugin } from "../../core/plugin-interface";
import { NotelertDatePickerModal } from "../../modals/DatePickerModal";

export function handleEditorChange(
  editor: Editor,
  // La firma de Obsidian para change incluye un objeto complejo;
  // no lo usamos aquí, así que lo tipamos de forma segura.
  info: unknown,
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
  
  // Detectar si se acaba de escribir :# (unificado con :@ para fecha/hora)
  if (beforeCursor.endsWith(':#')) {
    plugin.log("Detectado :# - abriendo date picker (modo unificado)");
    openDatePicker(editor, cursor, plugin);
  }
}

// Abrir date picker y reemplazar :@ con la fecha/hora seleccionada
export function openDatePicker(editor: Editor, cursor: EditorPosition, plugin: INotelertPlugin): void {
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

