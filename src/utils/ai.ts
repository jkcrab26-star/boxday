import type { Task, BoxSlot } from '../types';

export interface ScopeLockResult {
  locked: boolean;
  suggestion: string | null;
}

export async function aiScopeLock(task: Task): Promise<ScopeLockResult> {
  const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY as string | undefined;
  if (!apiKey) return { locked: true, suggestion: null };

  const prompt = `Evaluate if this task is specific enough to start immediately without more planning.

Task: "${task.title}"
Time estimate: ${task.estimatedMinutes ?? 'unknown'} minutes

A well-scoped task has a clear start/end, requires no sub-decisions before beginning, and fits the time estimate.

Respond with JSON only: {"locked": boolean, "suggestion": string|null}
- locked: true if ready to start, false if too vague
- suggestion: if not locked, one sentence making it more specific (null if locked)`;

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 150,
        messages: [{ role: 'user', content: prompt }],
      }),
    });
    if (!res.ok) return { locked: true, suggestion: null };
    const data = await res.json();
    const text: string = data.content?.[0]?.text ?? '{}';
    return JSON.parse(text) as ScopeLockResult;
  } catch {
    return { locked: true, suggestion: null };
  }
}

export function pickNextTask(completedTask: Task, candidates: Task[]): Task | null {
  if (candidates.length === 0) return null;
  const sameBox = candidates.filter(t => t.box === completedTask.box);
  const pool = sameBox.length > 0 ? sameBox : candidates;
  return pool.reduce((best, t) => {
    const bestMin = best.estimatedMinutes ?? 60;
    const tMin = t.estimatedMinutes ?? 60;
    return tMin < bestMin ? t : best;
  });
}

export interface AiBoxingResult {
  id: string;
  box: BoxSlot;
  estimatedMinutes: number;
}

// Calls Claude via a simple CORS-compatible proxy.
// For production, move this to a serverless function (src/api/box.ts on Vercel/Netlify).
// For dev, set VITE_ANTHROPIC_API_KEY in .env.local
export async function aiBoxTasks(tasks: Task[]): Promise<AiBoxingResult[]> {
  const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY as string | undefined;
  if (!apiKey) {
    // Fallback: round-robin assign to boxes, 30 min each
    const boxes: BoxSlot[] = ['AM', 'PM', 'Evening'];
    return tasks.map((t, i) => ({ id: t.id, box: boxes[i % 3], estimatedMinutes: 30 }));
  }

  const prompt = `You are a scheduling assistant for an ADHD productivity app called BoxDay.
Given a list of tasks, assign each to the best time box: AM (morning, high-focus work), PM (afternoon, meetings/admin), or Evening (light tasks, wind-down).
Also estimate how many minutes each task will take (15, 30, 60, or 90 minutes).

Tasks:
${tasks.map((t, i) => `${i + 1}. [${t.id}] ${t.title}`).join('\n')}

Respond ONLY with a valid JSON array, no markdown, no explanation:
[{"id":"<task-id>","box":"AM"|"PM"|"Evening","estimatedMinutes":15|30|60|90}, ...]`;

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 512,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!res.ok) {
    console.error('AI boxing failed:', res.status);
    const boxes: BoxSlot[] = ['AM', 'PM', 'Evening'];
    return tasks.map((t, i) => ({ id: t.id, box: boxes[i % 3], estimatedMinutes: 30 }));
  }

  const data = await res.json();
  const text: string = data.content?.[0]?.text ?? '[]';
  try {
    return JSON.parse(text) as AiBoxingResult[];
  } catch {
    const boxes: BoxSlot[] = ['AM', 'PM', 'Evening'];
    return tasks.map((t, i) => ({ id: t.id, box: boxes[i % 3], estimatedMinutes: 30 }));
  }
}
