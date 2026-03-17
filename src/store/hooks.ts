import { useMemo } from 'react';
import { useTaskStore } from './taskStore';
import { TaskFilter } from '../types/task';
import { format } from 'date-fns';

/**
 * Get all tasks for a specific date
 */
export const useTasksForDate = (date: string) => {
  const tasks = useTaskStore((state) => state.tasks);
  const getTasksForDate = useTaskStore((state) => state.getTasksForDate);

  return useMemo(() => {
    return getTasksForDate(date);
  }, [date, tasks, getTasksForDate]);
};

/**
 * Get tasks in a date range (for week view, etc)
 */
export const useTasksInRange = (startDate: string, endDate: string) => {
  const tasks = useTaskStore((state) => state.tasks);
  const getTasksInDateRange = useTaskStore((state) => state.getTasksInDateRange);

  return useMemo(() => {
    return getTasksInDateRange(startDate, endDate);
  }, [startDate, endDate, tasks, getTasksInDateRange]);
};

/**
 * Get filtered tasks
 */
export const useFilteredTasks = (filter: TaskFilter) => {
  const tasks = useTaskStore((state) => state.tasks);
  const getTasksByFilter = useTaskStore((state) => state.getTasksByFilter);

  return useMemo(() => {
    return getTasksByFilter(filter);
  }, [filter, tasks, getTasksByFilter]);
};

/**
 * Get someday tasks — tasks with no due date (dueDate === null)
 * Fixes the bug where useFilteredTasks({ dueDate: undefined }) returned ALL tasks
 */
export const useSomedayTasks = () => {
  const tasks = useTaskStore((state) => state.tasks);

  return useMemo(() => {
    return Array.from(tasks.values()).filter(
      (task) => task.dueDate === null || task.dueDate === undefined
    );
  }, [tasks]);
};

/**
 * Get backlog tasks — pending tasks from previous weeks (overdue)
 */
export const useBacklogTasks = () => {
  const tasks = useTaskStore((state) => state.tasks);
  const today = format(new Date(), 'yyyy-MM-dd');

  return useMemo(() => {
    return Array.from(tasks.values()).filter(
      (task) =>
        task.status !== 'completed' &&
        task.dueDate !== null &&
        task.dueDate !== undefined &&
        task.dueDate < today
    ).sort((a, b) => (a.dueDate! < b.dueDate! ? -1 : 1)); // oldest first
  }, [tasks, today]);
};

/**
 * Get a specific task
 */
export const useTask = (taskId?: string) => {
  const tasks = useTaskStore((state) => state.tasks);
  const getTask = useTaskStore((state) => state.getTask);

  return useMemo(() => {
    if (!taskId) return undefined;
    return getTask(taskId);
  }, [taskId, tasks, getTask]);
};

/**
 * Actions hook - stable reference for all task mutations
 */
export const useTaskActions = () => {
  const addTask = useTaskStore((state) => state.addTask);
  const updateTask = useTaskStore((state) => state.updateTask);
  const deleteTask = useTaskStore((state) => state.deleteTask);
  const duplicateTask = useTaskStore((state) => state.duplicateTask);
  const toggleComplete = useTaskStore((state) => state.toggleTaskComplete);
  const moveTaskToDate = useTaskStore((state) => state.moveTaskToDate);
  const createRecurringTask = useTaskStore((state) => state.createRecurringTask);
  const deleteRecurringTask = useTaskStore((state) => state.deleteRecurringTask);

  return useMemo(
    () => ({
      addTask,
      updateTask,
      deleteTask,
      duplicateTask,
      toggleComplete,
      moveTaskToDate,
      createRecurringTask,
      deleteRecurringTask,
    }),
    [addTask, updateTask, deleteTask, duplicateTask, toggleComplete, moveTaskToDate, createRecurringTask, deleteRecurringTask]
  );
};

/**
 * UI state hook
 */
export const useUIState = () => {
  const selectedTaskId = useTaskStore((state) => state.selectedTaskId);
  const setSelectedTask = useTaskStore((state) => state.setSelectedTask);
  const focusedDate = useTaskStore((state) => state.focusedDate);
  const setFocusedDate = useTaskStore((state) => state.setFocusedDate);
  const currentView = useTaskStore((state) => state.currentView);
  const setCurrentView = useTaskStore((state) => state.setCurrentView);
  const commandPaletteOpen = useTaskStore((state) => state.commandPaletteOpen);
  const setCommandPaletteOpen = useTaskStore((state) => state.setCommandPaletteOpen);
  const quickAddOpen = useTaskStore((state) => state.quickAddOpen);
  const setQuickAddOpen = useTaskStore((state) => state.setQuickAddOpen);

  return useMemo(
    () => ({
      selectedTaskId,
      setSelectedTask,
      focusedDate,
      setFocusedDate,
      currentView,
      setCurrentView,
      commandPaletteOpen,
      setCommandPaletteOpen,
      quickAddOpen,
      setQuickAddOpen,
    }),
    [
      selectedTaskId,
      setSelectedTask,
      focusedDate,
      setFocusedDate,
      currentView,
      setCurrentView,
      commandPaletteOpen,
      setCommandPaletteOpen,
      quickAddOpen,
      setQuickAddOpen,
    ]
  );
};

/**
 * Notifications hook
 */
export const useNotifications = () => {
  const notifications = useTaskStore((state) => state.notificationQueue);
  const showNotification = useTaskStore((state) => state.showNotification);
  const dismissNotification = useTaskStore((state) => state.dismissNotification);

  return useMemo(
    () => ({
      notifications,
      showNotification,
      dismissNotification,
    }),
    [notifications, showNotification, dismissNotification]
  );
};
