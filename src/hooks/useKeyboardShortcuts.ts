import { useEffect, useCallback } from 'react';
import { SHORTCUTS, matchesShortcut } from '../utils/keyboard';

interface KeyboardShortcutsConfig {
  onQuickAdd?: () => void;
  onCommandPalette?: () => void;
  onNewTask?: () => void;        // n — inline add in focused column
  onToday?: () => void;          // t
  onPrevDay?: () => void;        // ←
  onNextDay?: () => void;        // →
  onPrevWeek?: () => void;       // Ctrl+←
  onNextWeek?: () => void;       // Ctrl+→
  onCompleteTask?: () => void;
  onDuplicateTask?: () => void;  // Shift+D
  onDeleteTask?: () => void;
  onEscape?: () => void;
  onHelp?: () => void;           // ?
}

export function useKeyboardShortcuts(config: KeyboardShortcutsConfig = {}) {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      const isInput = ['INPUT', 'TEXTAREA'].includes(target.tagName);

      // Always-active shortcuts (work even in inputs)
      if (matchesShortcut(event, SHORTCUTS.COMMAND_PALETTE)) {
        event.preventDefault();
        config.onCommandPalette?.();
        return;
      }
      if (matchesShortcut(event, SHORTCUTS.ESCAPE)) {
        config.onEscape?.();
        return;
      }

      // Non-input shortcuts only
      if (!isInput) {
        if (matchesShortcut(event, SHORTCUTS.PREV_WEEK)) {
          event.preventDefault();
          config.onPrevWeek?.();
        } else if (matchesShortcut(event, SHORTCUTS.NEXT_WEEK)) {
          event.preventDefault();
          config.onNextWeek?.();
        } else if (matchesShortcut(event, SHORTCUTS.PREV_DAY)) {
          event.preventDefault();
          config.onPrevDay?.();
        } else if (matchesShortcut(event, SHORTCUTS.NEXT_DAY)) {
          event.preventDefault();
          config.onNextDay?.();
        } else if (matchesShortcut(event, SHORTCUTS.TODAY)) {
          event.preventDefault();
          config.onToday?.();
        } else if (matchesShortcut(event, SHORTCUTS.NEW_TASK)) {
          event.preventDefault();
          config.onNewTask?.();
        } else if (matchesShortcut(event, SHORTCUTS.COMPLETE_TASK)) {
          event.preventDefault();
          config.onCompleteTask?.();
        } else if (matchesShortcut(event, SHORTCUTS.DUPLICATE_TASK)) {
          event.preventDefault();
          config.onDuplicateTask?.();
        } else if (matchesShortcut(event, SHORTCUTS.DELETE_TASK)) {
          event.preventDefault();
          config.onDeleteTask?.();
        } else if (matchesShortcut(event, SHORTCUTS.HELP)) {
          event.preventDefault();
          config.onHelp?.();
        }
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [config]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}
