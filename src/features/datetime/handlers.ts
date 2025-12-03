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
  
  // Usar el trigger personalizado del usuario (por defecto :@)
  const trigger = plugin.settings.datePickerTrigger || ':@';
  
  // Detectar si se acaba de escribir el trigger personalizado
  if (beforeCursor.endsWith(trigger)) {
    plugin.log(`Detectado ${trigger} - abriendo date picker`);
    openDatePicker(editor, cursor, plugin, trigger);
    return;
  }
}

// Abrir date picker y reemplazar el trigger con la fecha/hora seleccionada
export function openDatePicker(editor: Editor, cursor: EditorPosition, plugin: INotelertPlugin, trigger: string = ':@'): void {
  const line = editor.getLine(cursor.line);
  const originalText = line;
  
  new NotelertDatePickerModal(
    plugin.app,
    plugin,
    plugin.settings.language,
    editor,
    cursor,
    originalText,
    trigger,
    () => {
      plugin.log("Date picker cancelado");
    }
  ).open();
}

