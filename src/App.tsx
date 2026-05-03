import { useState, useCallback, useEffect } from 'react';
import { addDays, startOfWeek, format } from 'date-fns';
import { Layout } from './components/Layout';
import { WeekView } from './components/views/WeekView';
import Navbar from './components/Navbar';
import { ShortcutsHelp } from './components/common/ShortcutsHelp';
import { useUIState } from './store/hooks';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { useTaskStore } from './store/taskStore';
import { useAuthStore } from './store/authStore';

export default function App() {
  const initialize = useAuthStore((s) => s.initialize);
  useEffect(() => { initialize(); }, [initialize]);
  const [weekStart, setWeekStart] = useState(() =>
    startOfWeek(new Date(), { weekStartsOn: 1 })
  );
  const [showHelp, setShowHelp] = useState(false);

  const weekEnd = addDays(weekStart, 6);

  const handlePreviousWeek = useCallback(() => setWeekStart((d) => addDays(d, -7)), []);
  const handleNextWeek = useCallback(() => setWeekStart((d) => addDays(d, 7)), []);
  const handleToday = useCallback(() => {
    setWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }));
  }, []);

  return (
    <AppWithShortcuts
      weekStart={weekStart}
      weekEnd={weekEnd}
      showHelp={showHelp}
      onPrevWeek={handlePreviousWeek}
      onNextWeek={handleNextWeek}
      onToday={handleToday}
      onShowHelp={() => setShowHelp(true)}
      onHideHelp={() => setShowHelp(false)}
    />
  );
}

// Separated so hooks can access UIState (store)
function AppWithShortcuts(props: {
  weekStart: Date;
  weekEnd: Date;
  showHelp: boolean;
  onPrevWeek: () => void;
  onNextWeek: () => void;
  onToday: () => void;
  onShowHelp: () => void;
  onHideHelp: () => void;
}) {
  const { focusedDate, setFocusedDate, selectedTaskId } = useUIState();
  const duplicateTask = useTaskStore((state) => state.duplicateTask);

  const handlePrevDay = useCallback(() => {
    const current = focusedDate ? new Date(focusedDate + 'T00:00:00') : new Date();
    const prev = addDays(current, -1);
    const prevStr = format(prev, 'yyyy-MM-dd');
    setFocusedDate(prevStr);
    // If the new date is before the current weekStart, flip to previous week
    if (prev < props.weekStart) {
      props.onPrevWeek();
    }
  }, [focusedDate, setFocusedDate, props]);

  const handleNextDay = useCallback(() => {
    const current = focusedDate ? new Date(focusedDate + 'T00:00:00') : new Date();
    const next = addDays(current, 1);
    const nextStr = format(next, 'yyyy-MM-dd');
    setFocusedDate(nextStr);
    // If the new date is past the end of the current week (weekStart + 6), flip to next week
    const weekEnd = addDays(props.weekStart, 6);
    if (next > weekEnd) {
      props.onNextWeek();
    }
  }, [focusedDate, setFocusedDate, props]);

  const handleTodayFull = useCallback(() => {
    props.onToday();
    setFocusedDate(format(new Date(), 'yyyy-MM-dd'));
  }, [props, setFocusedDate]);

  // Signal to WeekView to open inline add in focused column
  const [triggerNewTask, setTriggerNewTask] = useState(0);
  const handleNewTask = useCallback(() => {
    setTriggerNewTask((n) => n + 1);
  }, []);

  const handleDuplicateTask = useCallback(() => {
    if (selectedTaskId) {
      duplicateTask(selectedTaskId);
    }
  }, [selectedTaskId, duplicateTask]);

  useKeyboardShortcuts({
    onCommandPalette: () => { },
    onPrevWeek: props.onPrevWeek,
    onNextWeek: props.onNextWeek,
    onPrevDay: handlePrevDay,
    onNextDay: handleNextDay,
    onToday: handleTodayFull,
    onNewTask: handleNewTask,
    onDuplicateTask: handleDuplicateTask,
    onHelp: props.onShowHelp,
    onEscape: props.onHideHelp,
  });

  return (
    <Layout
      navbar={
        <Navbar
          weekStart={props.weekStart}
          weekEnd={props.weekEnd}
          onPrevWeek={props.onPrevWeek}
          onNextWeek={props.onNextWeek}
          onToday={handleTodayFull}
          onShowHelp={props.onShowHelp}
        />
      }
    >
      <WeekView
        weekStart={props.weekStart}
        triggerNewTask={triggerNewTask}
      />
      {props.showHelp && <ShortcutsHelp onClose={props.onHideHelp} />}
    </Layout>
  );
}