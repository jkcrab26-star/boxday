# BoxDay

**Box your day. Build your brain.**

ADHD-native daily todo app built around brain-boxing — the dump → box → execute loop that works with ADHD instead of against it.

## What it does

1. **Brain dump** — capture everything from working memory, no friction, no judgment
2. **AI brain-boxing** — one batched AI call assigns each dump item to AM / PM / Evening and estimates time
3. **Today view** — three color-coded time boxes, drag-to-reschedule, tap to complete
4. **Focus Mode** — fullscreen countdown with ambient time pulse (CSS gradient shifts calm → warm → coral as time elapses)
5. **Daily reflection** — three questions at end of day, shame-neutral framing throughout
6. **Streak counter** — tracks days with at least one completed task

## Pricing

| Tier | Price |
|------|-------|
| Free | Brain dump + manual boxing (5 tasks/box limit) |
| Pro Monthly | $9/mo |
| Pro Annual | $79/yr (~$6.60/mo, save 27%) |

Pro unlocks AI boxing, unlimited tasks, and streak tracking.

## Dev setup

```bash
npm install
cp .env.local.example .env.local   # fill in keys
npm run dev
```

### Environment variables

| Variable | Description |
|----------|-------------|
| `VITE_ANTHROPIC_API_KEY` | Anthropic API key for AI brain-boxing (Claude Haiku). Falls back to round-robin if not set. |
| `VITE_STRIPE_MONTHLY_LINK` | Stripe Payment Link URL for $9/mo plan |
| `VITE_STRIPE_ANNUAL_LINK` | Stripe Payment Link URL for $79/yr plan |

### Stripe setup

Create two Payment Links in the Stripe dashboard. Under **After payment**, set the redirect URL to `{your-app-url}?pro=1` — this activates Pro client-side after checkout.

## Deploy (Vercel)

```bash
# From Vercel dashboard: import jkcrab26-star/boxday from GitHub
# Framework: Vite (auto-detected)
# Add env vars above, then deploy
```

`vercel.json` already configures SPA routing rewrites.

## Stack

- Vite + React 18 + TypeScript (strict)
- Tailwind CSS v4 (via `@tailwindcss/vite`)
- localStorage persistence — no backend, no auth for v0
- Claude Haiku for AI brain-boxing (batched, one round-trip per session)
- HTML5 drag-and-drop for zone reschedule

## Shame-neutral design (non-negotiable)

Every user-facing string avoids "overdue", "missed", "behind", "failed". Incomplete tasks silently return to the brain dump on daily reset (4am). No task completion ratios. No history of what you didn't finish.

## v0 scope cuts (explicit)

No recurring tasks, no calendar sync, no mobile app, no multi-day planning, no sharing, no dark mode, no push notifications.
