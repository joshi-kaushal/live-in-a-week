import { FC, ReactNode, useEffect } from 'react';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { Toast } from './common/Toast';
import { QuickAdd } from './task/QuickAdd';
import { CommandPalette } from './common/CommandPalette';
import { useTaskStore } from '../store/taskStore';

interface LayoutProps {
  children: ReactNode;
}

export const Layout: FC<LayoutProps> = ({ children }) => {
  const initializeStore = useTaskStore((state) => state.initializeStore);

  // Initialize store from IndexedDB on mount
  useEffect(() => {
    initializeStore();
  }, [initializeStore]);

  // Setup global keyboard shortcuts
  useKeyboardShortcuts();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 max-w-7xl">
        {children}
      </main>

      {/* Global Components */}
      <QuickAdd />
      <CommandPalette />
      <Toast />
    </div>
  );
};
