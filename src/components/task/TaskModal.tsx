import { FC, useState, useEffect, useCallback } from 'react';
import { Task } from '../../types/task';
import { useTaskActions } from '../../store/hooks';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Copy, Clock } from 'lucide-react';
import { parseDurationToMinutes, formatMinutesAsDuration } from '../../utils/duration';

interface TaskModalProps {
  task: Task | null;          // null in create mode
  isOpen: boolean;
  onClose: () => void;
  mode?: 'edit' | 'create';   // 'edit' when task is provided, 'create' otherwise
  defaultDate?: string;       // used in create mode to prefill the due date
  defaultTitle?: string;      // used in create mode to prefill the title
}

export const TaskModal: FC<TaskModalProps> = ({ task, isOpen, onClose, mode = 'edit', defaultDate, defaultTitle }) => {
  const { updateTask, duplicateTask, addTask } = useTaskActions();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [dueTime, setDueTime] = useState('');
  const [energyLevel, setEnergyLevel] = useState<Task['energyLevel']>('medium');
  const [priority, setPriority] = useState<Task['priority']>('medium');
  const [durationText, setDurationText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDuplicating, setIsDuplicating] = useState(false);

  const isCreateMode = mode === 'create' || !task;

  // Reset form when opening (create) or switching tasks (edit)
  useEffect(() => {
    if (!isOpen) return;
    if (task) {
      setTitle(task.title);
      setDescription(task.description || '');
      setDueDate(task.dueDate || '');
      setDueTime(task.dueTime || '');
      setEnergyLevel(task.energyLevel);
      setPriority(task.priority);
      setDurationText(formatMinutesAsDuration(task.estimatedDurationMinutes));
    } else {
      setTitle(defaultTitle || '');
      setDescription('');
      setDueDate(defaultDate || '');
      setDueTime('');
      setEnergyLevel('medium');
      setPriority('medium');
      setDurationText('');
    }
  }, [isOpen, task, defaultDate, defaultTitle]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const durationMinutes = parseDurationToMinutes(durationText);
    // Invalid duration text should be surfaced, not silently dropped
    if (durationText.trim() && durationMinutes === null) {
      return;
    }

    setIsSubmitting(true);
    try {
      if (isCreateMode) {
        await addTask(
          title.trim(),
          dueDate || undefined,
          energyLevel,
          durationMinutes ?? undefined
        );
      } else if (task) {
        await updateTask(task.id, {
          title: title.trim(),
          description: description.trim(),
          dueDate: dueDate || null,
          dueTime: dueTime || undefined,
          energyLevel,
          priority,
          priorityOverride: true, // User manually set priority
          estimatedDurationMinutes: durationMinutes ?? undefined,
        });
      }
      onClose();
    } catch (error) {
      console.error('Failed to save task:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    onClose();
  };

  const handleDuplicate = async () => {
    if (!task) return;
    setIsDuplicating(true);
    try {
      await duplicateTask(task.id);
      onClose();
    } finally {
      setIsDuplicating(false);
    }
  };

  // Shift+1/2/3 → Energy, Shift+4/5/6 → Priority (only while modal is open)
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!e.shiftKey) return;
    switch (e.key) {
      case '!': setEnergyLevel('low'); break;    // Shift+1
      case '@': setEnergyLevel('medium'); break; // Shift+2
      case '#': setEnergyLevel('high'); break;   // Shift+3
      case '$': setPriority('low'); break;       // Shift+4
      case '%': setPriority('medium'); break;    // Shift+5
      case '^': setPriority('high'); break;      // Shift+6
      default: return;
    }
    e.preventDefault();
  }, []);

  if (!isCreateMode && !task) return null;

  const durationError = durationText.trim() !== '' && parseDurationToMinutes(durationText) === null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto" onKeyDown={handleKeyDown}>
        <DialogHeader>
          <DialogTitle>{isCreateMode ? 'New Task' : 'Edit Task'}</DialogTitle>
          <DialogDescription>
            {isCreateMode ? 'Add a new task to your week.' : `Edit "${title}"`}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div>
            <label htmlFor="edit-title" className="block mb-2 text-sm font-medium">
              Task Title *
            </label>
            <Input
              id="edit-title"
              type="text"
              placeholder="Task title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={isSubmitting}
              required
              autoFocus
            />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="edit-description" className="block mb-2 text-sm font-medium">
              Description
            </label>
            <Textarea
              id="edit-description"
              placeholder="Add more details..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isSubmitting}
              rows={3}
            />
          </div>

          {/* Due Date & Time */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="edit-date" className="block mb-2 text-sm font-medium">
                Due Date
              </label>
              <Input
                id="edit-date"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                disabled={isSubmitting}
              />
            </div>
            <div>
              <label htmlFor="edit-time" className="block mb-2 text-sm font-medium">
                Due Time
              </label>
              <Input
                id="edit-time"
                type="time"
                value={dueTime}
                onChange={(e) => setDueTime(e.target.value)}
                disabled={isSubmitting}
              />
            </div>
          </div>

          {/* Estimated Duration */}
          <div>
            <label htmlFor="edit-duration" className="block mb-2 text-sm font-medium">
              Estimated Duration
            </label>
            <div className="relative">
              <Clock size={14} className="absolute text-gray-400 -translate-y-1/2 left-3 top-1/2" />
              <Input
                id="edit-duration"
                type="text"
                placeholder="e.g. 30 min, 1 hour, 1h 30m"
                value={durationText}
                onChange={(e) => setDurationText(e.target.value)}
                disabled={isSubmitting}
                className="pl-9"
                aria-invalid={durationError ? true : undefined}
              />
            </div>
            {durationError && (
              <p className="mt-1 text-xs text-red-600">
                Invalid duration. Try something like “30 min” or “1 hour”.
              </p>
            )}
          </div>

          {/* Energy Level */}
          <div>
            <label htmlFor="edit-energy" className="block mb-2 text-sm font-medium">
              Energy Level <span className="text-xs text-gray-400">(Shift+1/2/3)</span>
            </label>
            <Select
              value={energyLevel}
              onValueChange={(value) => setEnergyLevel(value as Task['energyLevel'])}
              disabled={isSubmitting}
            >
              <SelectTrigger id="edit-energy">
                <SelectValue placeholder="Select energy level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">🔋 Low Energy (Shift+1)</SelectItem>
                <SelectItem value="medium">⚡ Medium Energy (Shift+2)</SelectItem>
                <SelectItem value="high">🚀 High Energy (Shift+3)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Priority */}
          <div>
            <label htmlFor="edit-priority" className="block mb-2 text-sm font-medium">
              Priority <span className="text-xs text-gray-400">(Shift+4/5/6)</span>
            </label>
            <Select
              value={priority}
              onValueChange={(value) => setPriority(value as Task['priority'])}
              disabled={isSubmitting}
            >
              <SelectTrigger id="edit-priority">
                <SelectValue placeholder="Select priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">🟢 Low Priority (Shift+4)</SelectItem>
                <SelectItem value="medium">🟡 Medium Priority (Shift+5)</SelectItem>
                <SelectItem value="high">🔴 High Priority (Shift+6)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Status Info */}
          {!isCreateMode && task?.completedAt && (
            <div className="p-3 border border-green-200 rounded-md bg-green-50">
              <p className="text-sm text-green-800">
                ✓ Completed on {new Date(task.completedAt).toLocaleDateString()}
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-between gap-2 pt-4 border-t">
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isSubmitting || isDuplicating}
              >
                Cancel
              </Button>
              {!isCreateMode && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleDuplicate}
                  disabled={isSubmitting || isDuplicating}
                  title="Duplicate this task (Shift+D)"
                >
                  <Copy size={14} className="mr-1.5" />
                  {isDuplicating ? 'Duplicating…' : 'Duplicate'}
                </Button>
              )}
            </div>
            <Button
              type="submit"
              disabled={!title.trim() || isSubmitting || isDuplicating || durationError}
            >
              {isCreateMode
                ? (isSubmitting ? 'Adding...' : 'Add Task')
                : (isSubmitting ? 'Saving...' : 'Save Changes')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
