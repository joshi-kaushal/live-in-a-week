import { useState, useCallback } from 'react';
import { addDays, startOfWeek, format } from 'date-fns';
import { Layout } from './components/Layout';
import { WeekView } from './components/views/WeekView';
import Navbar from './components/Navbar';
import { ShortcutsHelp } from './components/common/ShortcutsHelp';
import { useUIState } from './store/hooks';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';

export default function App() {
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
  const { focusedDate, setFocusedDate } = useUIState();

  const handlePrevDay = useCallback(() => {
    const prev = format(addDays(new Date(focusedDate || new Date()), -1), 'yyyy-MM-dd');
    setFocusedDate(prev);
  }, [focusedDate, setFocusedDate]);

  const handleNextDay = useCallback(() => {
    const next = format(addDays(new Date(focusedDate || new Date()), 1), 'yyyy-MM-dd');
    setFocusedDate(next);
  }, [focusedDate, setFocusedDate]);

  const handleTodayFull = useCallback(() => {
    props.onToday();
    setFocusedDate(format(new Date(), 'yyyy-MM-dd'));
  }, [props, setFocusedDate]);

  // Signal to WeekView to open inline add in focused column
  const [triggerNewTask, setTriggerNewTask] = useState(0);
  const handleNewTask = useCallback(() => {
    setTriggerNewTask((n) => n + 1);
  }, []);

  useKeyboardShortcuts({
    onCommandPalette: () => { }, // handled via CommandPalette component itself
    onPrevWeek: props.onPrevWeek,
    onNextWeek: props.onNextWeek,
    onPrevDay: handlePrevDay,
    onNextDay: handleNextDay,
    onToday: handleTodayFull,
    onNewTask: handleNewTask,
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