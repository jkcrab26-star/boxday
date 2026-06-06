const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined
const SCOPES = 'https://www.googleapis.com/auth/calendar.events'
const TOKEN_KEY = '80hd_gcal_token'
const TOKEN_EXPIRY_KEY = '80hd_gcal_token_expiry'

export interface GCalEvent {
  id: string
  summary: string
  startTime: string  // HH:MM
  endTime: string    // HH:MM
}

function getToken(): string | null {
  const token = localStorage.getItem(TOKEN_KEY)
  const expiry = Number(localStorage.getItem(TOKEN_EXPIRY_KEY) ?? '0')
  if (!token || Date.now() > expiry) return null
  return token
}

function saveToken(token: string, expiresInSeconds: number) {
  localStorage.setItem(TOKEN_KEY, token)
  localStorage.setItem(TOKEN_EXPIRY_KEY, String(Date.now() + expiresInSeconds * 1000))
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(TOKEN_EXPIRY_KEY)
}

export function isConnected(): boolean {
  return !!getToken()
}

function loadGIS(cb: () => void) {
  if ((window as any).google?.accounts?.oauth2) { cb(); return }
  const script = document.createElement('script')
  script.src = 'https://accounts.google.com/gsi/client'
  script.async = true
  script.onload = cb
  document.head.appendChild(script)
}

export function connectGoogleCalendar(callback: (connected: boolean) => void) {
  if (!CLIENT_ID) {
    alert('Google Calendar is not configured. Set VITE_GOOGLE_CLIENT_ID.')
    callback(false)
    return
  }

  loadGIS(() => {
    const client = (window as any).google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: SCOPES,
      callback: (response: any) => {
        if (response.access_token) {
          saveToken(response.access_token, Number(response.expires_in ?? 3600))
          callback(true)
        } else {
          callback(false)
        }
      },
    })
    client.requestToken()
  })
}

async function apiFetch(path: string, options?: RequestInit) {
  const token = getToken()
  if (!token) throw new Error('gcal:unauthenticated')
  const res = await fetch(`https://www.googleapis.com/calendar/v3${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(options?.headers ?? {}),
    },
  })
  if (res.status === 401) { clearToken(); throw new Error('gcal:token_expired') }
  if (!res.ok) throw new Error(`gcal:${res.status}`)
  return res.json()
}

function toTimeStr(iso: string): string {
  const d = new Date(iso)
  const h = String(d.getHours()).padStart(2, '0')
  const m = String(d.getMinutes()).padStart(2, '0')
  return `${h}:${m}`
}

export async function createCalendarEvent(
  title: string,
  date: string,
  time: string,
  durationMinutes: number,
): Promise<void> {
  const [h, m] = time.split(':').map(Number)
  const start = new Date(date)
  start.setHours(h, m, 0, 0)
  const end = new Date(start.getTime() + durationMinutes * 60000)

  await apiFetch('/calendars/primary/events', {
    method: 'POST',
    body: JSON.stringify({
      summary: title,
      start: { dateTime: start.toISOString() },
      end: { dateTime: end.toISOString() },
    }),
  })
}

export async function fetchCalendarEvents(date: string): Promise<GCalEvent[]> {
  try {
    const dayStart = new Date(date)
    dayStart.setHours(0, 0, 0, 0)
    const dayEnd = new Date(date)
    dayEnd.setHours(23, 59, 59, 999)

    const params = new URLSearchParams({
      timeMin: dayStart.toISOString(),
      timeMax: dayEnd.toISOString(),
      singleEvents: 'true',
      orderBy: 'startTime',
      maxResults: '50',
    })

    const data = await apiFetch(`/calendars/primary/events?${params}`)
    return (data.items ?? [])
      .filter((e: any) => e.start?.dateTime)
      .map((e: any) => ({
        id: e.id,
        summary: e.summary ?? '(no title)',
        startTime: toTimeStr(e.start.dateTime),
        endTime: toTimeStr(e.end.dateTime),
      }))
  } catch {
    return []
  }
}
