import { FC, useState, useEffect } from 'react';
import { Task } from '../../types/task';
import { useTaskActions } from '../../store/hooks';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

interface TaskModalProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
}

export const TaskModal: FC<TaskModalProps> = ({ task, isOpen, onClose }) => {
  const { updateTask } = useTaskActions();
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [dueTime, setDueTime] = useState('');
  const [energyLevel, setEnergyLevel] = useState<Task['energyLevel']>('medium');
  const [priority, setPriority] = useState<Task['priority']>('medium');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description || '');
      setDueDate(task.dueDate || '');
      setDueTime(task.dueTime || '');
      setEnergyLevel(task.energyLevel);
      setPriority(task.priority);
    }
  }, [task]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!task || !title.trim()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await updateTask(task.id, {
        title: title.trim(),
        description: description.trim(),
        dueDate: dueDate || null,
        dueTime: dueTime || undefined,
        energyLevel,
        priority,
        priorityOverride: true, // User manually set priority
      });
      onClose();
    } catch (error) {
      console.error('Failed to update task:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    onClose();
  };

  if (!task) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Task</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div>
            <label htmlFor="edit-title" className="block text-sm font-medium mb-2">
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
            <label htmlFor="edit-description" className="block text-sm font-medium mb-2">
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
              <label htmlFor="edit-date" className="block text-sm font-medium mb-2">
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
              <label htmlFor="edit-time" className="block text-sm font-medium mb-2">
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

          {/* Energy Level */}
          <div>
            <label htmlFor="edit-energy" className="block text-sm font-medium mb-2">
              Energy Level
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
                <SelectItem value="low">🔋 Low Energy</SelectItem>
                <SelectItem value="medium">⚡ Medium Energy</SelectItem>
                <SelectItem value="high">🚀 High Energy</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Priority */}
          <div>
            <label htmlFor="edit-priority" className="block text-sm font-medium mb-2">
              Priority
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
                <SelectItem value="low">🟢 Low Priority</SelectItem>
                <SelectItem value="medium">🟡 Medium Priority</SelectItem>
                <SelectItem value="high">🔴 High Priority</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Status Info */}
          {task.completedAt && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-md">
              <p className="text-sm text-green-800">
                ✓ Completed on {new Date(task.completedAt).toLocaleDateString()}
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 pt-4 border-t">
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
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
