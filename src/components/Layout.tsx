import { FC, ReactNode, useEffect } from 'react';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { Toast } from './common/Toast';
import { QuickAdd } from './task/QuickAdd';
import { CommandPalette } from './common/CommandPalette';
import { useTaskStore } from '../store/taskStore';

interface LayoutProps {
  children: ReactNode;
  navbar: ReactNode;
}

export const Layout: FC<LayoutProps> = ({ children, navbar }) => {
  const initializeStore = useTaskStore((state) => state.initializeStore);

  useEffect(() => {
    initializeStore();
  }, [initializeStore]);

  useKeyboardShortcuts();

  return (
    <div className="app-shell">
      {/* Sticky Top Navbar */}
      <header className="app-navbar">
        {navbar}
      </header>

      {/* Full-width Main Content */}
      <main className="app-main">
        {children}
      </main>

      {/* Global Components */}
      <QuickAdd />
      <CommandPalette />
      <Toast />
    </div>
  );
};
