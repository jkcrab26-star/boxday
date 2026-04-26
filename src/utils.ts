export function todayISO(): string {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}

export function formatDate(iso: string): string {
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
}

export function formatDateShort(iso: string): string {
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

export function addDays(iso: string, n: number): string {
  const d = new Date(iso + 'T00:00:00');
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

export function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

export function minutesToTime(totalMinutes: number): string {
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function formatTime(time: string): string {
  const [h, m] = time.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 || 12;
  return `${hour12}:${String(m).padStart(2, '0')} ${period}`;
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

export function generateId(): string {
  return crypto.randomUUID();
}

export function getWeekDates(iso: string): string[] {
  const d = new Date(iso + 'T00:00:00');
  const day = d.getDay(); // 0=Sun
  const monday = new Date(d);
  monday.setDate(d.getDate() - ((day + 6) % 7));
  return Array.from({ length: 7 }, (_, i) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + i);
    return date.toISOString().slice(0, 10);
  });
}

export function getDaysInMonth(iso: string): string[] {
  const d = new Date(iso + 'T00:00:00');
  const year = d.getFullYear();
  const month = d.getMonth();
  const numDays = new Date(year, month + 1, 0).getDate();
  return Array.from({ length: numDays }, (_, i) => {
    const day = new Date(year, month, i + 1);
    return day.toISOString().slice(0, 10);
  });
}

export function getFirstDayOfMonth(iso: string): number {
  const d = new Date(iso + 'T00:00:00');
  return new Date(d.getFullYear(), d.getMonth(), 1).getDay();
}

export function sameMonth(a: string, b: string): boolean {
  return a.slice(0, 7) === b.slice(0, 7);
}

export function nextMomentumTask(tasks: import('./types').Task[]): import('./types').Task | null {
  const open = tasks.filter(t => t.status === 'open' && t.box === 'inbox');
  if (open.length === 0) return null;
  const now = new Date();
  const hourOfDay = now.getHours() + now.getMinutes() / 60;
  // Early in the day + many tasks: shortest first (momentum builder)
  if (hourOfDay < 12 && open.length > 3) {
    return open.reduce((a, b) =>
      (a.estimatedMinutes ?? 30) <= (b.estimatedMinutes ?? 30) ? a : b
    );
  }
  // Near end of day (after 4pm): pick task closest to remaining time
  if (hourOfDay > 16) {
    const remaining = (22 - hourOfDay) * 60;
    return open.reduce((best, t) => {
      const diffBest = Math.abs((best.estimatedMinutes ?? 30) - remaining);
      const diffT = Math.abs((t.estimatedMinutes ?? 30) - remaining);
      return diffT < diffBest ? t : best;
    });
  }
  // Default: lowest estimated time
  return open.reduce((a, b) =>
    (a.estimatedMinutes ?? 30) <= (b.estimatedMinutes ?? 30) ? a : b
  );
}
