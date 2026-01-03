export type KeyboardShortcut = {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  meta?: boolean; // Cmd on Mac
};

/**
 * Check if keyboard event matches a shortcut
 */
export function matchesShortcut(event: KeyboardEvent, shortcut: KeyboardShortcut): boolean {
  return (
    event.key === shortcut.key &&
    !!event.ctrlKey === !!shortcut.ctrl &&
    !!event.shiftKey === !!shortcut.shift &&
    !!event.altKey === !!shortcut.alt &&
    !!event.metaKey === !!shortcut.meta
  );
}

/**
 * Prevent default if shortcut matches
 */
export function handleShortcutDefault(
  event: KeyboardEvent,
  shortcut: KeyboardShortcut
): boolean {
  if (matchesShortcut(event, shortcut)) {
    event.preventDefault();
    return true;
  }
  return false;
}

/**
 * Keyboard shortcuts for the app
 */
export const SHORTCUTS = {
  QUICK_ADD: { key: 'k', meta: true, ctrl: true } as KeyboardShortcut,        // Cmd+K (Mac) / Ctrl+K (Windows)
  COMMAND_PALETTE: { key: 'k', shift: true, meta: true, ctrl: true } as KeyboardShortcut,  // Cmd+Shift+K / Ctrl+Shift+K
  COMPLETE_TASK: { key: 'd', meta: true, ctrl: true } as KeyboardShortcut,     // Cmd+D / Ctrl+D
  DELETE_TASK: { key: 'Delete' } as KeyboardShortcut,
  ESCAPE: { key: 'Escape' } as KeyboardShortcut,
  ENTER: { key: 'Enter' } as KeyboardShortcut,
  TAB: { key: 'Tab' } as KeyboardShortcut,
  ARROW_LEFT: { key: 'ArrowLeft' } as KeyboardShortcut,
  ARROW_RIGHT: { key: 'ArrowRight' } as KeyboardShortcut,
  ARROW_UP: { key: 'ArrowUp' } as KeyboardShortcut,
  ARROW_DOWN: { key: 'ArrowDown' } as KeyboardShortcut,
};
