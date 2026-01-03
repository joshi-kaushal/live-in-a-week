import { FC, useState, useEffect, useRef } from 'react';
import { useTaskActions, useUIState } from '../../store/hooks';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { formatDateForInput } from '../../utils/date';

export const QuickAdd: FC = () => {
  const { quickAddOpen, setQuickAddOpen, focusedDate } = useUIState();
  const { addTask } = useTaskActions();
  
  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (quickAddOpen) {
      // Set default date to focused date or today
      setDueDate(focusedDate || formatDateForInput(new Date()));
      setTitle('');
      // Focus input after a brief delay to ensure dialog is rendered
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [quickAddOpen, focusedDate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await addTask(title.trim(), dueDate || undefined, 'medium');
      setTitle('');
      setQuickAddOpen(false);
    } catch (error) {
      console.error('Failed to add task:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setQuickAddOpen(false);
    setTitle('');
  };

  return (
    <Dialog open={quickAddOpen} onOpenChange={setQuickAddOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Quick Add Task</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="task-title" className="block text-sm font-medium mb-2">
              Task Title
            </label>
            <Input
              ref={inputRef}
              id="task-title"
              type="text"
              placeholder="What do you need to do?"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={isSubmitting}
              autoComplete="off"
              className="w-full"
            />
          </div>

          <div>
            <label htmlFor="task-date" className="block text-sm font-medium mb-2">
              Due Date
            </label>
            <Input
              id="task-date"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              disabled={isSubmitting}
              className="w-full"
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!title.trim() || isSubmitting}
            >
              {isSubmitting ? 'Adding...' : 'Add Task'}
            </Button>
          </div>
        </form>

        <div className="text-xs text-gray-500 mt-2">
          Tip: Press <kbd className="px-1.5 py-0.5 bg-gray-100 rounded">Esc</kbd> to close
        </div>
      </DialogContent>
    </Dialog>
  );
};
