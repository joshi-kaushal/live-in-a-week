import { useEffect, useCallback } from 'react';
import { SHORTCUTS, matchesShortcut } from '../utils/keyboard';

interface KeyboardShortcutsConfig {
  onQuickAdd?: () => void;
  onCommandPalette?: () => void;
  onCompleteTask?: () => void;
  onDeleteTask?: () => void;
  onEscape?: () => void;
  onEnter?: () => void;
}

/**
 * Hook for handling global keyboard shortcuts
 */
export function useKeyboardShortcuts(config: KeyboardShortcutsConfig) {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // Don't trigger shortcuts while typing in input unless it's the slash command
      const isInput = ['INPUT', 'TEXTAREA'].includes((event.target as HTMLElement).tagName);

      if (matchesShortcut(event, SHORTCUTS.QUICK_ADD)) {
        event.preventDefault();
        config.onQuickAdd?.();
      } else if (matchesShortcut(event, SHORTCUTS.COMMAND_PALETTE)) {
        event.preventDefault();
        config.onCommandPalette?.();
      } else if (!isInput) {
        if (matchesShortcut(event, SHORTCUTS.COMPLETE_TASK)) {
          event.preventDefault();
          config.onCompleteTask?.();
        } else if (matchesShortcut(event, SHORTCUTS.DELETE_TASK)) {
          event.preventDefault();
          config.onDeleteTask?.();
        } else if (matchesShortcut(event, SHORTCUTS.ESCAPE)) {
          config.onEscape?.();
        }
      }

      if (matchesShortcut(event, SHORTCUTS.ENTER)) {
        config.onEnter?.();
      }
    },
    [config]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}
