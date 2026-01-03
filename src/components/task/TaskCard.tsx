import { FC } from 'react';
import { Task } from '../../types/task';
import { useTaskActions } from '../../store/hooks';
import { getPriorityColor, getEnergyLevelDisplay } from '../../utils/formatters';
import { Trash2, Check, Circle } from 'lucide-react';
import { Button } from '../ui/button';

interface TaskCardProps {
  task: Task;
  onEdit?: (task: Task) => void;
  isDragging?: boolean;
}

export const TaskCard: FC<TaskCardProps> = ({ task, onEdit, isDragging = false }) => {
  const { toggleComplete, deleteTask } = useTaskActions();

  const handleToggleComplete = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleComplete(task.id);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm(`Delete task "${task.title}"?`)) {
      deleteTask(task.id);
    }
  };

  const handleEdit = () => {
    if (onEdit) {
      onEdit(task);
    }
  };

  const priorityColor = getPriorityColor(task.priority);
  const isCompleted = task.status === 'completed';

  return (
    <div
      className={`
        group relative p-3 mb-2 bg-white border rounded-lg shadow-sm
        transition-all duration-200 hover:shadow-md cursor-pointer
        ${isDragging ? 'opacity-50 rotate-2' : ''}
        ${isCompleted ? 'opacity-60' : ''}
        border-l-4 ${priorityColor}
      `}
      onClick={handleEdit}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleEdit();
        }
        if (e.key === 'Delete' || e.key === 'Backspace') {
          e.preventDefault();
          handleDelete(e as any);
        }
      }}
      aria-label={`Task: ${task.title}. Priority: ${task.priority}. ${isCompleted ? 'Completed' : 'Pending'}`}
    >
      <div className="flex items-start gap-2">
        {/* Completion Toggle */}
        <button
          onClick={handleToggleComplete}
          className="flex-shrink-0 mt-0.5 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
          aria-label={isCompleted ? 'Mark as incomplete' : 'Mark as complete'}
        >
          {isCompleted ? (
            <Check className="w-5 h-5 text-green-600" />
          ) : (
            <Circle className="w-5 h-5 text-gray-400 hover:text-gray-600" />
          )}
        </button>

        {/* Task Content */}
        <div className="flex-1 min-w-0">
          <div className={`font-medium text-sm ${isCompleted ? 'line-through text-gray-500' : 'text-gray-900'}`}>
            {task.title}
          </div>
          {task.description && (
            <div className="mt-1 text-xs text-gray-500 line-clamp-2">
              {task.description}
            </div>
          )}
          
          {/* Metadata */}
          <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
            <span className="px-2 py-0.5 rounded-full bg-gray-100">
              {getEnergyLevelDisplay(task.energyLevel)}
            </span>
            {task.dueTime && (
              <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
                {task.dueTime}
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleDelete}
            className="w-6 h-6 text-red-500 hover:text-red-700 hover:bg-red-50"
            aria-label="Delete task"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Recurring indicator */}
      {task.recurrence && (
        <div className="absolute top-2 right-2 w-2 h-2 bg-blue-500 rounded-full" 
             title="Recurring task"
             aria-label="This is a recurring task"
        />
      )}
    </div>
  );
};
