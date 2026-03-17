import { FC, useState, useRef, useEffect } from 'react';
import { format, isToday } from 'date-fns';
import { Task } from '../../../types/task';
import { TaskCard } from '../../task/TaskCard';
import { TaskModal } from '../../task/TaskModal';
import { useDroppable } from '@dnd-kit/core';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Plus } from 'lucide-react';
import { useTaskActions } from '../../../store/hooks';

interface DayColumnProps {
  date: Date;
  tasks: Task[];
  isFocused: boolean;
  isMobileActive: boolean;
  onFocus: () => void;
  registerAddRef: (fn: () => void) => void; // lets WeekView trigger inline add programmatically (keyboard 'n')
}

export const DayColumn: FC<DayColumnProps> = ({
  date, tasks, isFocused, isMobileActive, onFocus, registerAddRef,
}) => {
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const { addTask } = useTaskActions();

  const dateStr = format(date, 'yyyy-MM-dd');
  const { setNodeRef, isOver } = useDroppable({ id: dateStr });

  const isCurrentDay = isToday(date);
  const dayOfWeek = format(date, 'EEE');
  const dayOfMonth = format(date, 'd');

  // Register an openAdd function that WeekView can call via keyboard shortcut
  useEffect(() => {
    registerAddRef(() => {
      onFocus();
      setIsAdding(true);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateStr]);

  useEffect(() => {
    if (isAdding) inputRef.current?.focus();
  }, [isAdding]);

  const handleAddClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onFocus();
    setIsAdding(true);
  };

  const handleSubmit = async () => {
    if (inputValue.trim()) {
      await addTask(inputValue.trim(), dateStr, 'medium');
      setInputValue('');
    }
  };

  const handleKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') { await handleSubmit(); }
    else if (e.key === 'Escape') { setIsAdding(false); setInputValue(''); }
  };

  return (
    <>
      <div
        ref={setNodeRef}
        className={[
          'day-column',
          isCurrentDay ? 'day-column--today' : '',
          isFocused ? 'day-column--focused' : '',
          isOver ? 'day-column--over' : '',
          !isMobileActive ? 'day-column--mobile-hidden' : '',
        ].join(' ')}
        onClick={onFocus}
        role="region"
        aria-label={`${dayOfWeek}, ${format(date, 'MMMM d, yyyy')}`}
      >
        <div className="day-header">
          <div className="day-header-info">
            <span className="day-label">{dayOfWeek}</span>
            <span className={`day-number ${isCurrentDay ? 'day-number--today' : ''}`}>
              {dayOfMonth}
            </span>
          </div>
          <button className="day-add-btn" onClick={handleAddClick} aria-label={`Add task to ${dayOfWeek}`}>
            <Plus size={15} />
          </button>
        </div>

        <div className="day-tasks">
          {tasks.length === 0 && !isAdding && (
            <div className="day-empty">{isOver ? 'Drop here' : ''}</div>
          )}
          {tasks.map((task) => (
            <DraggableTaskCard key={task.id} task={task} onEdit={setSelectedTask} />
          ))}
          {isAdding && (
            <input
              ref={inputRef}
              className="inline-task-input"
              placeholder="Task name…"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={() => { if (!inputValue.trim()) setIsAdding(false); }}
            />
          )}
        </div>

        {tasks.length > 0 && (
          <div className="day-footer">
            {tasks.filter((t) => t.status === 'completed').length}/{tasks.length} done
          </div>
        )}
      </div>

      <TaskModal task={selectedTask} isOpen={selectedTask !== null} onClose={() => setSelectedTask(null)} />
    </>
  );
};

export interface DraggableTaskCardProps {
  task: Task;
  onEdit?: (task: Task) => void;
}

export const DraggableTaskCard: FC<DraggableTaskCardProps> = ({ task, onEdit }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <TaskCard task={task} onEdit={onEdit} isDragging={isDragging} />
    </div>
  );
};
