import { FC } from 'react';
import { Task } from '../../types/task';
import { useTaskActions } from '../../store/hooks';
import { getEnergyLevelDisplay } from '../../utils/formatters';
import { Trash2, Check, Circle } from 'lucide-react';

interface TaskCardProps {
  task: Task;
  onEdit?: (task: Task) => void;
  isDragging?: boolean;
}

export const TaskCard: FC<TaskCardProps> = ({ task, onEdit, isDragging = false }) => {
  const { toggleComplete, deleteTask } = useTaskActions();
  const isCompleted = task.status === 'completed';

  const priorityClass =
    task.priority === 'high'
      ? 'task-card--priority-high'
      : task.priority === 'low'
        ? 'task-card--priority-low'
        : 'task-card--priority-medium';

  const handleToggleComplete = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleComplete(task.id);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm(`Delete "${task.title}"?`)) {
      deleteTask(task.id);
    }
  };

  return (
    <div
      className={[
        'task-card',
        priorityClass,
        isDragging ? 'task-card--dragging' : '',
        isCompleted ? 'task-card--completed' : '',
      ].join(' ')}
      onClick={() => onEdit?.(task)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onEdit?.(task); }
        if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); handleDelete(e as any); }
      }}
      aria-label={`Task: ${task.title}. ${isCompleted ? 'Completed' : 'Pending'}`}
    >
      {/* Complete toggle */}
      <button className="task-check-btn" onClick={handleToggleComplete} aria-label={isCompleted ? 'Mark incomplete' : 'Mark complete'}>
        {isCompleted
          ? <Check size={15} stroke="#10b981" strokeWidth={2.5} />
          : <Circle size={15} strokeWidth={1.5} />
        }
      </button>

      {/* Content */}
      <div className="task-content">
        <div className={`task-title ${isCompleted ? 'task-title--completed' : ''}`}>
          {task.title}
        </div>
        {task.description && (
          <div className="task-desc">{task.description}</div>
        )}
        <div className="task-meta">
          <span className="task-badge">{getEnergyLevelDisplay(task.energyLevel)}</span>
          {task.dueTime && (
            <span className="task-badge task-badge--time">{task.dueTime}</span>
          )}
        </div>
      </div>

      {/* Delete */}
      <button className="task-delete-btn" onClick={handleDelete} aria-label="Delete task">
        <Trash2 size={13} />
      </button>

      {/* Recurring dot */}
      {task.recurrence && (
        <span
          style={{ position: 'absolute', top: 6, right: 6, width: 6, height: 6, borderRadius: '50%', background: '#6366f1' }}
          title="Recurring task"
        />
      )}
    </div>
  );
};
