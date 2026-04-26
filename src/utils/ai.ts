import type { Task, BoxSlot } from '../types';

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
