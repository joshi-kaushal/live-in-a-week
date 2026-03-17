export type KeyboardShortcut = {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  meta?: boolean;
};

export function matchesShortcut(event: KeyboardEvent, shortcut: KeyboardShortcut): boolean {
  return (
    event.key === shortcut.key &&
    !!event.ctrlKey === !!shortcut.ctrl &&
    !!event.shiftKey === !!shortcut.shift &&
    !!event.altKey === !!shortcut.alt &&
    !!event.metaKey === !!shortcut.meta
  );
}

export function handleShortcutDefault(event: KeyboardEvent, shortcut: KeyboardShortcut): boolean {
  if (matchesShortcut(event, shortcut)) {
    event.preventDefault();
    return true;
  }
  return false;
}

export const SHORTCUTS = {
  // Global
  COMMAND_PALETTE: { key: 'k', ctrl: true } as KeyboardShortcut,   // Ctrl+K
  QUICK_ADD: { key: 'k', ctrl: true, shift: true } as KeyboardShortcut, // Ctrl+Shift+K

  // Navigation
  TODAY: { key: 't' } as KeyboardShortcut,
  PREV_WEEK: { key: 'ArrowLeft', ctrl: true } as KeyboardShortcut,
  NEXT_WEEK: { key: 'ArrowRight', ctrl: true } as KeyboardShortcut,
  PREV_DAY: { key: 'ArrowLeft' } as KeyboardShortcut,
  NEXT_DAY: { key: 'ArrowRight' } as KeyboardShortcut,

  // Task actions
  NEW_TASK: { key: 'n' } as KeyboardShortcut,         // n — inline add in focused column
  COMPLETE_TASK: { key: 'd', ctrl: true } as KeyboardShortcut,
  DELETE_TASK: { key: 'Delete' } as KeyboardShortcut,

  // UI
  ESCAPE: { key: 'Escape' } as KeyboardShortcut,
  ENTER: { key: 'Enter' } as KeyboardShortcut,
  HELP: { key: '?' } as KeyboardShortcut,              // ? — show shortcut help
};
