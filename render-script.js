#!/usr/bin/env node
/**
 * render-script.js — 80HD Video Pipeline CLI
 *
 * Usage:
 *   node render-script.js path/to/topic-N-pack.json
 *
 * Environment:
 *   ELEVENLABS_API_KEY   — from elevenlabs.io (free tier: 10K chars/month)
 *   PEXELS_API_KEY       — from pexels.com/api (free)
 *
 * Outputs:
 *   public/social-samples/topic-N.mp4   (1080x1920, 9:16)
 *   Prints the GitHub Pages URL on success.
 *
 * Pack JSON schema:
 *   { topic: number, title: string, voiceId?: string,
 *     shots: [{ id, voiceover, textOverlay, brollSearch }] }
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync, unlinkSync } from 'fs'
import { execSync } from 'child_process'
import { resolve, join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

// ─── Config ──────────────────────────────────────────────────────────────────

const ELEVENLABS_KEY = process.env.ELEVENLABS_API_KEY
const PEXELS_KEY = process.env.PEXELS_API_KEY
const DEFAULT_VOICE = '21m00Tcm4TlvDq8ikWAM'  // ElevenLabs "Rachel"
const OUTPUT_DIR   = join(__dirname, 'public', 'social-samples')
const BROLL_CACHE  = join(__dirname, '.cache', 'broll')
const TMP_DIR      = join(__dirname, '.cache', 'tmp')
const GH_PAGES_BASE = 'https://jkcrab26-star.github.io/boxday/social-samples'

// ─── Guards ───────────────────────────────────────────────────────────────────

if (!ELEVENLABS_KEY || !PEXELS_KEY) {
  console.error([
    '',
    '  Missing API keys.',
    '  export ELEVENLABS_API_KEY=<your-key>   # elevenlabs.io (free)',
    '  export PEXELS_API_KEY=<your-key>       # pexels.com/api (free)',
    '',
  ].join('\n'))
  process.exit(1)
}

const specPath = process.argv[2]
if (!specPath) {
  console.error('Usage: node render-script.js path/to/topic-N-pack.json')
  process.exit(1)
}

// ─── Load spec ────────────────────────────────────────────────────────────────

const spec = JSON.parse(readFileSync(resolve(specPath), 'utf8'))
const { topic, title, shots, voiceId = DEFAULT_VOICE } = spec

if (!topic || !Array.isArray(shots) || shots.length === 0) {
  console.error('Invalid pack: must have "topic" (number) and "shots" (array).')
  process.exit(1)
}

const outputName = `topic-${topic}`
mkdirSync(OUTPUT_DIR,  { recursive: true })
mkdirSync(BROLL_CACHE, { recursive: true })
mkdirSync(TMP_DIR,     { recursive: true })

console.log(`\n🎬  ${title ?? outputName}  (${shots.length} shots)\n`)

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function downloadBuf(url, headers = {}) {
  const res = await fetch(url, { headers })
  if (!res.ok) throw new Error(`HTTP ${res.status} → ${url}`)
  return Buffer.from(await res.arrayBuffer())
}

function audioDuration(mp3) {
  const out = execSync(
    `ffprobe -v error -show_entries format=duration -of csv=p=0 "${mp3}"`,
    { encoding: 'utf8' }
  ).trim()
  return parseFloat(out)
}

// ffmpeg drawtext escaping (handles apostrophes, colons, arrows)
function escapeDrawtext(text) {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "’")     // smart quote avoids shell quoting hell
    .replace(/:/g, '\\:')
    .replace(/%/g, '\\%')
    .replace(/←/g, '<-')
    .replace(/→/g, '->')
}

async function tts(text, dest) {
  console.log(`  🎙  TTS (${text.length} chars)`)
  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
    method: 'POST',
    headers: {
      'xi-api-key': ELEVENLABS_KEY,
      'Content-Type': 'application/json',
      Accept: 'audio/mpeg',
    },
    body: JSON.stringify({
      text,
      model_id: 'eleven_monolingual_v1',
      voice_settings: { stability: 0.5, similarity_boost: 0.8 },
    }),
  })
  if (!res.ok) throw new Error(`ElevenLabs ${res.status}: ${await res.text()}`)
  writeFileSync(dest, Buffer.from(await res.arrayBuffer()))
}

async function fetchBroll(query, dest) {
  const cacheKey = query.toLowerCase().replace(/\W+/g, '-').slice(0, 60)
  const cached = join(BROLL_CACHE, `${cacheKey}.mp4`)

  if (existsSync(cached)) {
    console.log(`  📦  B-roll (cached): "${query}"`)
    execSync(`cp "${cached}" "${dest}"`)
    return
  }

  console.log(`  🎥  Pexels: "${query}"`)
  const res = await fetch(
    `https://api.pexels.com/videos/search?query=${encodeURIComponent(query)}&orientation=portrait&per_page=5&size=medium`,
    { headers: { Authorization: PEXELS_KEY } }
  )
  if (!res.ok) throw new Error(`Pexels ${res.status}: ${await res.text()}`)
  const data = await res.json()

  const video = data.videos?.[0]
  if (!video) throw new Error(`No Pexels results for: "${query}"`)

  // Prefer portrait HD, fall back to first available
  const files = (video.video_files ?? [])
    .filter(f => f.quality !== 'hls')
    .sort((a, b) => (b.width ?? 0) - (a.width ?? 0))
  const file = files[0]
  if (!file?.link) throw new Error(`No downloadable file for: "${query}"`)

  writeFileSync(cached, await downloadBuf(file.link))
  execSync(`cp "${cached}" "${dest}"`)
}

// ─── Per-shot render ──────────────────────────────────────────────────────────

async function renderShot(shot, index) {
  const sid      = shot.id ?? `s${index}`
  const voMp3    = join(TMP_DIR, `${outputName}-${sid}-vo.mp3`)
  const brollRaw = join(TMP_DIR, `${outputName}-${sid}-broll.mp4`)
  const shotOut  = join(TMP_DIR, `${outputName}-${sid}.mp4`)

  // 1 — Voiceover
  await tts(shot.voiceover, voMp3)
  const dur = audioDuration(voMp3)
  console.log(`     ⏱  ${dur.toFixed(2)}s`)

  // 2 — B-roll
  await fetchBroll(shot.brollSearch ?? shot.voiceover.slice(0, 40), brollRaw)

  // 3 — Compose: loop/trim broll → 1080×1920, add text overlay, mix voiceover
  const overlay = shot.textOverlay ? escapeDrawtext(shot.textOverlay) : null
  const textFilter = overlay
    ? `,drawtext=text='${overlay}':x=(w-tw)/2:y=h*0.82:fontsize=50:fontcolor=white:shadowcolor=black@0.85:shadowx=3:shadowy=3`
    : ''

  const cmd = [
    'ffmpeg -y',
    `-stream_loop -1 -i "${brollRaw}"`,
    `-i "${voMp3}"`,
    `-filter_complex "[0:v]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920${textFilter}[v]"`,
    `-map "[v]" -map 1:a`,
    `-t ${dur.toFixed(3)}`,
    `-c:v libx264 -preset fast -crf 23`,
    `-c:a aac -b:a 128k`,
    `"${shotOut}"`,
  ].join(' ')

  execSync(cmd, { stdio: ['ignore', 'pipe', 'pipe'] })
  return shotOut
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const shotMp4s = []

  for (let i = 0; i < shots.length; i++) {
    console.log(`\n[${i + 1}/${shots.length}]  ${shots[i].id ?? `shot-${i + 1}`}`)
    shotMp4s.push(await renderShot(shots[i], i))
  }

  // Write concat list
  const concatTxt = join(TMP_DIR, `${outputName}-concat.txt`)
  writeFileSync(concatTxt, shotMp4s.map(p => `file '${p}'`).join('\n'))

  // Concatenate
  const finalMp4 = join(OUTPUT_DIR, `${outputName}.mp4`)
  console.log('\n🔗  Concatenating shots...')
  execSync(
    `ffmpeg -y -f concat -safe 0 -i "${concatTxt}" -c copy "${finalMp4}"`,
    { stdio: ['ignore', 'pipe', 'pipe'] }
  )

  const publicUrl = `${GH_PAGES_BASE}/${outputName}.mp4`
  const sizeKb = Math.round(readFileSync(finalMp4).length / 1024)

  console.log(`\n✅  ${finalMp4}  (${sizeKb} KB)`)
  console.log(`🌐  ${publicUrl}`)
  console.log([
    '',
    '   Deploy:',
    `   git add public/social-samples/${outputName}.mp4`,
    `   git commit -m "video: add ${outputName}"`,
    '   git push',
    '',
  ].join('\n'))
}

main().catch(err => {
  console.error(`\n❌  ${err.message}`)
  process.exit(1)
})
