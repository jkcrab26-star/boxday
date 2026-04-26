import { useState, useEffect, useCallback } from 'react';
import type { Task, AppState, View, BoxSlot } from './types';
import { loadState, saveState, todayISO } from './utils/storage';
import { aiBoxTasks } from './utils/ai';
import Nav from './components/Nav';
import BrainDump from './components/BrainDump';
import DayView from './components/DayView';
import ReflectionPrompt from './components/ReflectionPrompt';
import UpgradeModal from './components/UpgradeModal';
import FocusMode from './components/FocusMode';

const FREE_TASKS_PER_BOX = 5;

function generateId(): string {
  return crypto.randomUUID();
}

function boxTaskCount(tasks: AppState['tasks'], box: import('./types').BoxSlot): number {
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

  useEffect(() => { saveState(state); }, [state]);

  // Handle Stripe success redirect: ?pro=1 in URL activates Pro
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('pro') === '1') {
      setState(prev => ({ ...prev, isPro: true }));
      // Clean the URL so refreshing doesn't re-trigger
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-reset: if last reset wasn't today, move yesterday's open tasks back to inbox
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

  const addTask = useCallback((title: string) => {
    const task: Task = {
      id: generateId(),
      title: title.trim(),
      estimatedMinutes: null,
      box: 'inbox',
      status: 'open',
      completedAt: null,
      createdAt: new Date().toISOString(),
    };
    setState(prev => ({ ...prev, tasks: [...prev.tasks, task] }));
  }, []);

  const deleteTask = useCallback((id: string) => {
    setState(prev => ({ ...prev, tasks: prev.tasks.filter(t => t.id !== id) }));
  }, []);

  const completeTask = useCallback((id: string) => {
    setState(prev => {
      const updated = {
        ...prev,
        tasks: prev.tasks.map(t =>
          t.id === id ? { ...t, status: 'done' as const, completedAt: new Date().toISOString() } : t
        ),
      };
      return updateStreak(updated);
    });
  }, []);

  const moveTask = useCallback((id: string, toBox: BoxSlot) => {
    setState(prev => {
      if (!prev.isPro && toBox !== 'inbox') {
        const count = boxTaskCount(prev.tasks, toBox);
        if (count >= FREE_TASKS_PER_BOX) {
          // Trigger upgrade modal after state update — use a deferred call
          setTimeout(() => setShowUpgrade(true), 0);
          return prev;
        }
      }
      return { ...prev, tasks: prev.tasks.map(t => t.id === id ? { ...t, box: toBox } : t) };
    });
  }, []);

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
        // Track how many have been assigned per box this session to respect free limit
        const boxCounts: Record<string, number> = {
          AM: boxTaskCount(prev.tasks, 'AM'),
          PM: boxTaskCount(prev.tasks, 'PM'),
          Evening: boxTaskCount(prev.tasks, 'Evening'),
        };
        const updatedTasks = prev.tasks.map(t => {
          const r = results.find(r => r.id === t.id);
          if (!r) return t;
          const slot = r.box;
          if (!prev.isPro && slot !== 'inbox') {
            if ((boxCounts[slot] ?? 0) >= FREE_TASKS_PER_BOX) {
              // Box is full for free tier — leave in inbox
              return t;
            }
            boxCounts[slot] = (boxCounts[slot] ?? 0) + 1;
          }
          return { ...t, box: slot, estimatedMinutes: r.estimatedMinutes };
        });
        return { ...prev, tasks: updatedTasks };
      });
      setView('day');
    } finally {
      setIsBoxing(false);
    }
  }, [state.tasks]);

  const addReflection = useCallback((q1: string, q2: string, q3: string) => {
    const reflection = {
      date: todayISO(),
      q1, q2, q3,
      completedAt: new Date().toISOString(),
    };
    setState(prev => ({
      ...prev,
      reflections: [...prev.reflections.filter(r => r.date !== todayISO()), reflection],
    }));
    setView('day');
  }, []);

  const snoozeTask = useCallback((id: string) => {
    setFocusTaskId(null);
    // Move to end of its current box — just mark snoozed for now, user can re-box
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
  const todayTasks = state.tasks.filter(t => t.status === 'open' || t.completedAt?.startsWith(todayISO()));
  const inboxTasks = state.tasks.filter(t => t.box === 'inbox' && t.status === 'open');
  const todayReflection = state.reflections.find(r => r.date === todayISO());

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', background: 'var(--bg)' }}>
      <Nav
        view={view}
        setView={setView}
        streak={state.streak}
        isPro={state.isPro}
        onUpgradeClick={() => setShowUpgrade(true)}
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
            onUpgradeClick={() => setShowUpgrade(true)}
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
            onUpgradeClick={() => setShowUpgrade(true)}
            onFocusTask={setFocusTaskId}
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
    </div>
  );
}
