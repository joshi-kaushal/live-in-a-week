import { FC, useState } from 'react';
import { addDays, format, startOfWeek } from 'date-fns';
import { useTasksInRange, useUIState } from '../../../store/hooks';
import { DayColumn } from './DayColumn';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { Button } from '../../ui/button';
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { Task } from '../../../types/task';
import { TaskCard } from '../../task/TaskCard';
import { useTaskActions } from '../../../store/hooks';

export const WeekView: FC = () => {
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 0 }));
  const { focusedDate, setFocusedDate } = useUIState();
  const { moveTaskToDate } = useTaskActions();
  
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  const weekEnd = addDays(weekStart, 6);
  const weekTasks = useTasksInRange(
    format(weekStart, 'yyyy-MM-dd'),
    format(weekEnd, 'yyyy-MM-dd')
  );

  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handlePreviousWeek = () => {
    const newStart = addDays(weekStart, -7);
    setWeekStart(newStart);
  };

  const handleNextWeek = () => {
    const newStart = addDays(weekStart, 7);
    setWeekStart(newStart);
  };

  const handleToday = () => {
    const today = startOfWeek(new Date(), { weekStartsOn: 0 });
    setWeekStart(today);
    setFocusedDate(format(new Date(), 'yyyy-MM-dd'));
  };

  const handleDragStart = (event: DragStartEvent) => {
    const task = weekTasks.find(t => t.id === event.active.id);
    if (task) {
      setActiveTask(task);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    setActiveTask(null);

    if (!over) return;

    const taskId = active.id as string;
    const newDate = over.id as string;

    // Move task to new date
    if (taskId && newDate) {
      moveTaskToDate(taskId, newDate);
    }
  };

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="w-full h-full flex flex-col">
        {/* Navigation Header */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {format(weekStart, 'MMMM yyyy')}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {format(weekStart, 'MMM d')} - {format(weekEnd, 'MMM d, yyyy')}
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleToday}
              className="gap-2"
            >
              <Calendar className="w-4 h-4" />
              Today
            </Button>
            <div className="flex gap-1">
              <Button
                variant="outline"
                size="icon"
                onClick={handlePreviousWeek}
                aria-label="Previous week"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={handleNextWeek}
                aria-label="Next week"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Week Grid */}
        <div className="grid grid-cols-7 gap-3 flex-1 overflow-hidden">
          {days.map((day) => {
            const dateStr = format(day, 'yyyy-MM-dd');
            const dayTasks = weekTasks.filter((t) => t.dueDate === dateStr);
            
            return (
              <DayColumn
                key={dateStr}
                date={day}
                tasks={dayTasks}
                isFocused={focusedDate === dateStr}
                onFocus={() => setFocusedDate(dateStr)}
              />
            );
          })}
        </div>

        {/* Drag Overlay */}
        <DragOverlay>
          {activeTask ? (
            <div className="rotate-2 scale-105">
              <TaskCard task={activeTask} isDragging />
            </div>
          ) : null}
        </DragOverlay>
      </div>
    </DndContext>
  );
};
