import { useState, useEffect, useCallback, useRef } from 'react';
import type { Task, AppState, View, BoxSlot } from './types';
import { loadState, saveState, todayISO } from './utils/storage';
import { aiBoxTasks, pickNextTask } from './utils/ai';
import Nav from './components/Nav';
import BrainDump from './components/BrainDump';
import DayView from './components/DayView';
import WeekView from './components/WeekView';
import MonthView from './components/MonthView';
import ReflectionPrompt from './components/ReflectionPrompt';
import UpgradeModal from './components/UpgradeModal';
import FocusMode from './components/FocusMode';
import MomentumBanner from './components/MomentumBanner';

const FREE_TASKS_PER_BOX = 5;

function generateId(): string {
  return crypto.randomUUID();
}

function boxTaskCount(tasks: AppState['tasks'], box: BoxSlot): number {
  return tasks.filter(t => t.box === box && t.status === 'open').length;
}

function updateStreak(state: AppState): AppState {
  const today = todayISO();
  const hadDoneToday = state.tasks.some(t => t.status === 'done' && t.completedAt?.startsWith(today));
  if (!hadDoneToday) return state;
  const streak = { ...state.streak };
  if (streak.lastActiveDate === today) return state;
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yiso = yesterday.toISOString().slice(0, 10);
  if (streak.lastActiveDate === yiso) {
    streak.currentStreak += 1;
  } else {
    streak.currentStreak = 1;
  }
  streak.longestStreak = Math.max(streak.longestStreak, streak.currentStreak);
  streak.lastActiveDate = today;
  return { ...state, streak };
}

export default function App() {
  const [state, setState] = useState<AppState>(() => loadState());
  const [view, setView] = useState<View>('dump');
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [isBoxing, setIsBoxing] = useState(false);
  const [focusTaskId, setFocusTaskId] = useState<string | null>(null);
  const [momentumTask, setMomentumTask] = useState<Task | null>(null);
  const upgradeShownThisSession = useRef(false);

  useEffect(() => { saveState(state); }, [state]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('pro') === '1') {
      setState(prev => ({ ...prev, isPro: true }));
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const today = todayISO();
    if (state.lastResetDate !== today) {
      setState(prev => ({
        ...prev,
        tasks: prev.tasks.map(t =>
          t.status === 'open' && t.box !== 'inbox' ? { ...t, box: 'inbox' } : t
        ),
        lastResetDate: today,
      }));
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Once-per-session upgrade CTA trigger (Alfred design hold)
  const triggerUpgradeModal = useCallback((isAuto = false) => {
    if (isAuto && upgradeShownThisSession.current) return;
    if (isAuto) upgradeShownThisSession.current = true;
    setShowUpgrade(true);
  }, []);

  const addTask = useCallback((title: string) => {
    const task: Task = {
      id: generateId(),
      title: title.trim(),
      estimatedMinutes: null,
      box: 'inbox',
      status: 'open',
      completedAt: null,
      createdAt: new Date().toISOString(),
      scheduledDate: null,
    };
    setState(prev => ({ ...prev, tasks: [...prev.tasks, task] }));
  }, []);

  const deleteTask = useCallback((id: string) => {
    setState(prev => ({ ...prev, tasks: prev.tasks.filter(t => t.id !== id) }));
  }, []);

  const completeTask = useCallback((id: string) => {
    setState(prev => {
      const task = prev.tasks.find(t => t.id === id);
      const updated = {
        ...prev,
        tasks: prev.tasks.map(t =>
          t.id === id ? { ...t, status: 'done' as const, completedAt: new Date().toISOString() } : t
        ),
      };
      // Momentum: surface ONE next task after completion
      if (task) {
        const remaining = updated.tasks.filter(t => t.status === 'open' && t.box !== 'inbox');
        const next = pickNextTask(task, remaining);
        setTimeout(() => setMomentumTask(next), 400);
      }
      return updateStreak(updated);
    });
  }, []);

  const moveTask = useCallback((id: string, toBox: BoxSlot) => {
    setState(prev => {
      if (!prev.isPro && toBox !== 'inbox') {
        const count = boxTaskCount(prev.tasks, toBox);
        if (count >= FREE_TASKS_PER_BOX) {
          setTimeout(() => triggerUpgradeModal(true), 0);
          return prev;
        }
      }
      return {
        ...prev,
        tasks: prev.tasks.map(t =>
          t.id === id
            ? { ...t, box: toBox, scheduledDate: toBox !== 'inbox' ? todayISO() : t.scheduledDate }
            : t
        ),
      };
    });
  }, [triggerUpgradeModal]);

  const setEstimate = useCallback((id: string, minutes: number) => {
    setState(prev => ({
      ...prev,
      tasks: prev.tasks.map(t => t.id === id ? { ...t, estimatedMinutes: minutes } : t),
    }));
  }, []);

  const boxAllWithAI = useCallback(async () => {
    const inbox = state.tasks.filter(t => t.box === 'inbox' && t.status === 'open');
    if (inbox.length === 0) return;
    setIsBoxing(true);
    try {
      const results = await aiBoxTasks(inbox);
      setState(prev => {
        const boxCounts: Record<string, number> = {
          AM: boxTaskCount(prev.tasks, 'AM'),
          PM: boxTaskCount(prev.tasks, 'PM'),
          Evening: boxTaskCount(prev.tasks, 'Evening'),
        };
        const today = todayISO();
        const updatedTasks = prev.tasks.map(t => {
          const r = results.find(r => r.id === t.id);
          if (!r) return t;
          const slot = r.box;
          if (!prev.isPro && slot !== 'inbox') {
            if ((boxCounts[slot] ?? 0) >= FREE_TASKS_PER_BOX) return t;
            boxCounts[slot] = (boxCounts[slot] ?? 0) + 1;
          }
          return { ...t, box: slot, estimatedMinutes: r.estimatedMinutes, scheduledDate: slot !== 'inbox' ? today : t.scheduledDate };
        });
        return { ...prev, tasks: updatedTasks };
      });
      setView('day');
    } finally {
      setIsBoxing(false);
    }
  }, [state.tasks]);

  const addReflection = useCallback((q1: string, q2: string, q3: string) => {
    const today = todayISO();
    const reflection = {
      date: today,
      q1, q2, q3,
      completedAt: new Date().toISOString(),
    };
    setState(prev => ({
      ...prev,
      reflections: [...prev.reflections.filter(r => r.date !== today), reflection],
    }));
    setView('day');
  }, []);

  const snoozeTask = useCallback((id: string) => {
    setFocusTaskId(null);
    setState(prev => ({
      ...prev,
      tasks: prev.tasks.map(t => t.id === id ? { ...t, box: 'inbox' as const } : t),
    }));
  }, []);

  const activatePro = useCallback(() => {
    setState(prev => ({ ...prev, isPro: true }));
    setShowUpgrade(false);
  }, []);

  const focusTask = focusTaskId ? state.tasks.find(t => t.id === focusTaskId) : null;
  const todayStr = todayISO();
  const todayTasks = state.tasks.filter(t => t.status === 'open' || t.completedAt?.startsWith(todayStr));
  const inboxTasks = state.tasks.filter(t => t.box === 'inbox' && t.status === 'open');
  const todayReflection = state.reflections.find(r => r.date === todayStr);

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', background: 'var(--bg)' }}>
      <Nav
        view={view}
        setView={setView}
        streak={state.streak}
        isPro={state.isPro}
        onUpgradeClick={() => triggerUpgradeModal(false)}
        inboxCount={inboxTasks.length}
      />

      <main style={{ flex: 1, maxWidth: 680, width: '100%', margin: '0 auto', padding: '16px 16px 80px' }}>
        {view === 'dump' && (
          <BrainDump
            tasks={inboxTasks}
            allTasks={state.tasks}
            onAdd={addTask}
            onDelete={deleteTask}
            onSetEstimate={setEstimate}
            onBoxAll={boxAllWithAI}
            onMoveTask={moveTask}
            isBoxing={isBoxing}
            isPro={state.isPro}
            onUpgradeClick={() => triggerUpgradeModal(false)}
            onSwitchToDay={() => setView('day')}
          />
        )}

        {view === 'day' && (
          <DayView
            tasks={todayTasks}
            onComplete={completeTask}
            onMoveTask={moveTask}
            onSetEstimate={setEstimate}
            onStartReflect={() => setView('reflect')}
            todayReflection={todayReflection}
            isPro={state.isPro}
            onUpgradeClick={() => triggerUpgradeModal(false)}
            onFocusTask={setFocusTaskId}
          />
        )}

        {view === 'week' && (
          <WeekView
            tasks={state.tasks}
            reflections={state.reflections}
            isPro={state.isPro}
            onUpgradeClick={() => triggerUpgradeModal(false)}
            onGoToDay={() => setView('day')}
          />
        )}

        {view === 'month' && (
          <MonthView
            tasks={state.tasks}
            isPro={state.isPro}
            onUpgradeClick={() => triggerUpgradeModal(false)}
          />
        )}

        {view === 'reflect' && (
          <ReflectionPrompt
            onSubmit={addReflection}
            onSkip={() => setView('day')}
            existing={todayReflection}
          />
        )}
      </main>

      {showUpgrade && (
        <UpgradeModal
          onClose={() => setShowUpgrade(false)}
          onActivatePro={activatePro}
        />
      )}

      {focusTask && (
        <FocusMode
          task={focusTask}
          onDone={(id) => { completeTask(id); setFocusTaskId(null); }}
          onSnooze={snoozeTask}
          onExit={() => setFocusTaskId(null)}
        />
      )}

      <MomentumBanner
        task={momentumTask}
        onStart={(id) => { setFocusTaskId(id); setView('day'); }}
        onDismiss={() => setMomentumTask(null)}
      />
    </div>
  );
}
