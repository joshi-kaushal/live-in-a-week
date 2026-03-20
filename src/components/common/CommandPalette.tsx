import { FC, useState, useEffect, useRef, ReactNode } from 'react';
import { useUIState, useTaskActions, useTasksForDate } from '../../store/hooks';
import { Dialog, DialogContent } from '../ui/dialog';
import { Input } from '../ui/input';
import { Command, Search, Plus, CheckCircle, Calendar as CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';

interface CommandItem {
  id: string;
  label: string;
  description?: string;
  icon?: ReactNode;
  action: () => void;
  group: string;
}

export const CommandPalette: FC = () => {
  const { commandPaletteOpen, setCommandPaletteOpen, setQuickAddOpen } = useUIState();
  const { addTask, toggleComplete } = useTaskActions();
  const todayTasks = useTasksForDate(format(new Date(), 'yyyy-MM-dd'));
  
  const [search, setSearch] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (commandPaletteOpen) {
      setSearch('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [commandPaletteOpen]);

  // Build command list
  const commands: CommandItem[] = [
    {
      id: 'quick-add',
      label: 'Quick Add Task',
      description: 'Add a new task quickly',
      icon: <Plus className="w-4 h-4" />,
      action: () => {
        setCommandPaletteOpen(false);
        setQuickAddOpen(true);
      },
      group: 'Actions',
    },
    {
      id: 'add-today',
      label: 'Add Task for Today',
      description: 'Create a task due today',
      icon: <CalendarIcon className="w-4 h-4" />,
      action: async () => {
        const title = prompt('Task title:');
        if (title?.trim()) {
          await addTask(title.trim(), format(new Date(), 'yyyy-MM-dd'), 'medium');
          setCommandPaletteOpen(false);
        }
      },
      group: 'Actions',
    },
    ...todayTasks.slice(0, 5).map((task) => ({
      id: `task-${task.id}`,
      label: task.title,
      description: task.status === 'completed' ? 'Mark incomplete' : 'Mark complete',
      icon: <CheckCircle className="w-4 h-4" />,
      action: async () => {
        await toggleComplete(task.id);
        setCommandPaletteOpen(false);
      },
      group: 'Today\'s Tasks',
    })),
  ];

  // Filter commands based on search
  const filteredCommands = commands.filter((cmd) =>
    cmd.label.toLowerCase().includes(search.toLowerCase()) ||
    cmd.description?.toLowerCase().includes(search.toLowerCase())
  );

  // Group commands
  const groupedCommands = filteredCommands.reduce((acc, cmd) => {
    if (!acc[cmd.group]) {
      acc[cmd.group] = [];
    }
    acc[cmd.group].push(cmd);
    return acc;
  }, {} as Record<string, CommandItem[]>);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.min(prev + 1, filteredCommands.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredCommands[selectedIndex]) {
        filteredCommands[selectedIndex].action();
      }
    }
  };

  return (
    <Dialog open={commandPaletteOpen} onOpenChange={setCommandPaletteOpen}>
      <DialogContent className="sm:max-w-2xl p-0 overflow-hidden">
        {/* Search Input */}
        <div className="flex items-center gap-2 p-4 border-b">
          <Search className="w-5 h-5 text-gray-400" />
          <Input
            ref={inputRef}
            type="text"
            placeholder="Type a command or search..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
          />
          <kbd className="hidden sm:inline-flex h-6 px-2 items-center gap-1 rounded border bg-gray-100 text-xs text-gray-600">
            <Command className="w-3 h-3" />K
          </kbd>
        </div>

        {/* Commands List */}
        <div className="max-h-[400px] overflow-y-auto">
          {filteredCommands.length === 0 ? (
            <div className="p-8 text-center text-sm text-gray-500">
              No commands found
            </div>
          ) : (
            Object.entries(groupedCommands).map(([group, items]) => (
              <div key={group}>
                <div className="px-4 py-2 text-xs font-semibold text-gray-500 bg-gray-50">
                  {group}
                </div>
                {items.map((cmd, _) => {
                  const globalIndex = filteredCommands.indexOf(cmd);
                  return (
                    <button
                      key={cmd.id}
                      onClick={cmd.action}
                      onMouseEnter={() => setSelectedIndex(globalIndex)}
                      className={`
                        w-full flex items-center gap-3 px-4 py-3 text-left
                        transition-colors cursor-pointer
                        ${globalIndex === selectedIndex ? 'bg-blue-50 text-blue-900' : 'hover:bg-gray-50'}
                      `}
                    >
                      <div className="flex-shrink-0 text-gray-500">
                        {cmd.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">
                          {cmd.label}
                        </div>
                        {cmd.description && (
                          <div className="text-xs text-gray-500 truncate">
                            {cmd.description}
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-2 text-xs text-gray-500 bg-gray-50 border-t">
          <div className="flex gap-4">
            <span>
              <kbd className="px-1.5 py-0.5 bg-white rounded border">↑↓</kbd> Navigate
            </span>
            <span>
              <kbd className="px-1.5 py-0.5 bg-white rounded border">Enter</kbd> Select
            </span>
            <span>
              <kbd className="px-1.5 py-0.5 bg-white rounded border">Esc</kbd> Close
            </span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
