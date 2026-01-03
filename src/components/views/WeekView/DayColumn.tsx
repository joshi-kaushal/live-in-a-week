import { FC, useState } from 'react';
import { format, isToday, isSameDay } from 'date-fns';
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
  onFocus: () => void;
}

export const DayColumn: FC<DayColumnProps> = ({ date, tasks, isFocused, onFocus }) => {
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const { addTask } = useTaskActions();
  
  const dateStr = format(date, 'yyyy-MM-dd');
  const { setNodeRef, isOver } = useDroppable({
    id: dateStr,
  });

  const isCurrentDay = isToday(date);
  const dayOfWeek = format(date, 'EEE');
  const dayOfMonth = format(date, 'd');

  const handleQuickAdd = async () => {
    onFocus();
    const title = prompt('Quick add task:');
    if (title?.trim()) {
      await addTask(title.trim(), dateStr, 'medium');
    }
  };

  const handleTaskEdit = (task: Task) => {
    setSelectedTask(task);
  };

  const handleCloseModal = () => {
    setSelectedTask(null);
  };

  return (
    <>
      <div
        ref={setNodeRef}
        className={`
          flex flex-col h-full min-h-[400px] p-3 rounded-lg border-2 transition-all
          ${isCurrentDay ? 'bg-blue-50 border-blue-300' : 'bg-white border-gray-200'}
          ${isFocused ? 'ring-2 ring-blue-500 ring-offset-2' : ''}
          ${isOver ? 'bg-blue-100 border-blue-400 shadow-lg scale-[1.02]' : ''}
          hover:shadow-md
        `}
        onClick={onFocus}
        role="region"
        aria-label={`${dayOfWeek}, ${format(date, 'MMMM d, yyyy')}`}
      >
        {/* Day Header */}
        <div className="flex items-center justify-between mb-3 pb-2 border-b">
          <div>
            <div className={`text-xs font-medium ${isCurrentDay ? 'text-blue-600' : 'text-gray-500'}`}>
              {dayOfWeek}
            </div>
            <div className={`
              text-lg font-bold mt-0.5
              ${isCurrentDay ? 'text-blue-600' : 'text-gray-900'}
            `}>
              {dayOfMonth}
            </div>
          </div>
          
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleQuickAdd();
            }}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
            aria-label={`Add task to ${dayOfWeek}`}
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Tasks List */}
        <div className="flex-1 overflow-y-auto space-y-2 custom-scrollbar">
          {tasks.length === 0 ? (
            <div className="flex items-center justify-center h-32 text-sm text-gray-400">
              {isOver ? 'Drop here' : 'No tasks'}
            </div>
          ) : (
            tasks.map((task) => (
              <DraggableTaskCard
                key={task.id}
                task={task}
                onEdit={handleTaskEdit}
              />
            ))
          )}
        </div>

        {/* Task Count */}
        {tasks.length > 0 && (
          <div className="mt-2 pt-2 border-t text-xs text-gray-500 text-center">
            {tasks.filter(t => t.status === 'completed').length} / {tasks.length} completed
          </div>
        )}
      </div>

      {/* Task Edit Modal */}
      <TaskModal
        task={selectedTask}
        isOpen={selectedTask !== null}
        onClose={handleCloseModal}
      />
    </>
  );
};

// Draggable wrapper for TaskCard
interface DraggableTaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
}

const DraggableTaskCard: FC<DraggableTaskCardProps> = ({ task, onEdit }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
    >
      <TaskCard
        task={task}
        onEdit={onEdit}
        isDragging={isDragging}
      />
    </div>
  );
};
