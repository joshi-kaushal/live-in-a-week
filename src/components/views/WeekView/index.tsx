import { FC, useState, useEffect, useRef } from 'react';
import { addDays, format, isToday } from 'date-fns';
import { useTasksInRange, useSomedayTasks, useBacklogTasks } from '../../../store/hooks';
import { useUIState } from '../../../store/hooks';
import { DayColumn, DraggableTaskCard } from './DayColumn';
import {
  DndContext, DragEndEvent, DragOverlay, DragStartEvent,
  PointerSensor, useSensor, useSensors, useDroppable,
} from '@dnd-kit/core';
import { Task } from '../../../types/task';
import { TaskCard } from '../../task/TaskCard';
import { useTaskActions } from '../../../store/hooks';
import { Plus, ArchiveX, Hourglass } from 'lucide-react';

interface WeekViewProps {
  weekStart: Date;
  triggerNewTask?: number; // incremented externally to open inline add in focused column
}

export const WeekView: FC<WeekViewProps> = ({ weekStart, triggerNewTask }) => {
  const { focusedDate, setFocusedDate } = useUIState();
  const { moveTaskToDate, updateTask, addTask } = useTaskActions();

  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [somedayAdding, setSomedayAdding] = useState(false);
  const [somedayInput, setSomedayInput] = useState('');
  const [activeMobileDay, setActiveMobileDay] = useState<number>(() => {
    // Default to today's index or 0 (Mon)
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    for (let i = 0; i < 7; i++) {
      if (format(addDays(weekStart, i), 'yyyy-MM-dd') === todayStr) return i;
    }
    return 0;
  });

  const weekEnd = addDays(weekStart, 6);
  const weekTasks = useTasksInRange(
    format(weekStart, 'yyyy-MM-dd'),
    format(weekEnd, 'yyyy-MM-dd')
  );
  const somedayTasks = useSomedayTasks();
  const backlogTasks = useBacklogTasks();

  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  // Exposed ref map: dateStr → openAddFn, so triggerNewTask can call the focused column's open fn
  const columnAddRefs = useRef<Record<string, () => void>>({});

  useEffect(() => {
    if (triggerNewTask && triggerNewTask > 0) {
      const target = focusedDate || format(new Date(), 'yyyy-MM-dd');
      columnAddRefs.current[target]?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [triggerNewTask]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const taskId = event.active.id as string;
    const task =
      weekTasks.find((t) => t.id === taskId) ||
      somedayTasks.find((t) => t.id === taskId) ||
      backlogTasks.find((t) => t.id === taskId);
    if (task) setActiveTask(task);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);
    if (!over) return;

    const taskId = active.id as string;
    const overId = over.id as string;

    if (overId === 'someday') {
      updateTask(taskId, { dueDate: null });
    } else {
      moveTaskToDate(taskId, overId);
    }
  };

  const handleSomedaySubmit = async () => {
    if (somedayInput.trim()) {
      await addTask(somedayInput.trim(), undefined, 'medium');
      setSomedayInput('');
    }
  };


  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="week-view">
        {/* Mobile day strip — only visible on small screens */}
        <MobileDayStrip
          days={days}
          activeDayIndex={activeMobileDay}
          onSelectDay={(i) => {
            setActiveMobileDay(i);
            setFocusedDate(format(days[i], 'yyyy-MM-dd'));
          }}
        />

        {/* Week Grid */}
        <div className="week-grid">
          {days.map((day, i) => {
            const dateStr = format(day, 'yyyy-MM-dd');
            const dayTasks = weekTasks.filter((t) => t.dueDate === dateStr);
            return (
              <DayColumn
                key={dateStr}
                date={day}
                tasks={dayTasks}
                isFocused={focusedDate === dateStr}
                isMobileActive={i === activeMobileDay}
                onFocus={() => setFocusedDate(dateStr)}
                registerAddRef={(fn) => { columnAddRefs.current[dateStr] = fn; }}
              />
            );
          })}
        </div>

        {/* Bottom: Backlog + Someday */}
        <div className="bottom-section">
          {/* Backlog panel — source only, not droppable */}
          <BacklogPanel tasks={backlogTasks} />

          {/* Someday panel — droppable */}
          <SomedayPanel
            tasks={somedayTasks}
            isAdding={somedayAdding}
            inputValue={somedayInput}
            onInputChange={setSomedayInput}
            onInputKeyDown={async (e) => {
              if (e.key === 'Enter') { await handleSomedaySubmit(); }
              else if (e.key === 'Escape') { setSomedayAdding(false); setSomedayInput(''); }
            }}
            onInputBlur={() => { if (!somedayInput.trim()) setSomedayAdding(false); }}
            onAddClick={() => setSomedayAdding(true)}
          />
        </div>
      </div>

      <DragOverlay>
        {activeTask ? (
          <div className="drag-overlay-card">
            <TaskCard task={activeTask} isDragging />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};

// ── Mobile Day Strip ───────────────────────────────────────────
interface MobileDayStripProps {
  days: Date[];
  activeDayIndex: number;
  onSelectDay: (i: number) => void;
}

const MobileDayStrip: FC<MobileDayStripProps> = ({ days, activeDayIndex, onSelectDay }) => {
  return (
    <div className="mobile-day-strip">
      {days.map((day, i) => {
        const isActive = i === activeDayIndex;
        const isCurrent = isToday(day);
        return (
          <button
            key={i}
            className={[
              'mobile-day-pill',
              isActive ? 'mobile-day-pill--active' : '',
              isCurrent ? 'mobile-day-pill--today' : '',
            ].join(' ')}
            onClick={() => onSelectDay(i)}
          >
            <span className="mobile-day-label">{format(day, 'EEE')}</span>
            <span className="mobile-day-num">{format(day, 'd')}</span>
          </button>
        );
      })}
    </div>
  );
};

// ── Backlog Panel ──────────────────────────────────────────────
interface BacklogPanelProps { tasks: Task[]; }
const BacklogPanel: FC<BacklogPanelProps> = ({ tasks }) => (
  <div className="backlog-panel">
    <div className="panel-header">
      <span className="panel-label">
        <Hourglass size={12} />
        Backlog
      </span>
      {tasks.length > 0 && (
        <span className="panel-count">{tasks.length}</span>
      )}
    </div>
    <div className="panel-tasks">
      {tasks.length === 0 ? (
        <span className="panel-empty">
          <ArchiveX size={14} />
          All caught up!
        </span>
      ) : (
        tasks.map((task) => (
          <DraggableTaskCard key={task.id} task={task} />
        ))
      )}
    </div>
  </div>
);

// ── Someday Panel ──────────────────────────────────────────────
interface SomedayPanelProps {
  tasks: Task[];
  isAdding: boolean;
  inputValue: string;
  onInputChange: (v: string) => void;
  onInputKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onInputBlur: () => void;
  onAddClick: () => void;
}

const SomedayPanel: FC<SomedayPanelProps> = ({
  tasks, isAdding, inputValue, onInputChange, onInputKeyDown, onInputBlur, onAddClick,
}) => {
  const { setNodeRef, isOver } = useDroppable({ id: 'someday' });

  return (
    <div
      className={`someday-panel ${isOver ? 'someday-panel--over' : ''}`}
      ref={setNodeRef}
    >
      <div className="panel-header">
        <span className="panel-label">Someday</span>
        <button className="add-task-btn" onClick={onAddClick} aria-label="Add someday task">
          <Plus size={13} />
          <span>Add task</span>
        </button>
      </div>
      <div className="panel-tasks">
        {tasks.length === 0 && !isAdding && (
          <span className="panel-empty">
            {isOver ? 'Drop to unschedule' : 'No someday tasks'}
          </span>
        )}
        {tasks.map((task) => (
          <DraggableTaskCard key={task.id} task={task} />
        ))}
        {isAdding && (
          <input
            className="inline-task-input someday-inline-input"
            placeholder="Task name…"
            value={inputValue}
            onChange={(e) => onInputChange(e.target.value)}
            onKeyDown={onInputKeyDown}
            onBlur={onInputBlur}
            autoFocus
          />
        )}
      </div>
    </div>
  );
};
