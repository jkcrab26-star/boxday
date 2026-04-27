#!/usr/bin/env python3
"""
80HD Social Video Render Pipeline v1.1
Uses Pillow for frame generation (no drawtext required) + ffmpeg for encode.
Usage: python3 render-social.py
Output: public/social-samples/topic-1.mp4
"""

import subprocess, os, sys
from PIL import Image, ImageDraw, ImageFont

WORK_DIR   = "/tmp/80hd-render"
REPO_DIR   = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUTPUT_DIR = os.path.join(REPO_DIR, "public", "social-samples")

W, H       = 1080, 1920
GEN_FPS    = 5          # frames generated per second (upscaled to 30 by ffmpeg)
OUT_FPS    = 30

os.makedirs(WORK_DIR, exist_ok=True)
os.makedirs(OUTPUT_DIR, exist_ok=True)

# ─── Shot definitions (durations sum to 75s) ──────────────────────────────────
SHOTS = [
    {"dur": 3,  "color": (15,  15,  26)},   # 1 deep navy
    {"dur": 3,  "color": (17,  24,  39)},   # 2 dark slate
    {"dur": 8,  "color": (26,  26,  46)},   # 3 navy
    {"dur": 10, "color": (13,  27,  42)},   # 4 dark blue
    {"dur": 8,  "color": (22,  33,  62)},   # 5 mid blue
    {"dur": 8,  "color": (31,  31,  31)},   # 6 near black
    {"dur": 8,  "color": (26,  26,  26)},   # 7 black
    {"dur": 9,  "color": (15,  25,  35)},   # 8 dark blue-green
    {"dur": 8,  "color": (17,  17,  17)},   # 9 black
    {"dur": 7,  "color": (10,  22,  40)},   # 10 dark navy
    {"dur": 5,  "color": (45,  27,  78)},   # 11 deep purple
]
_t = 0
for s in SHOTS:
    s["t_start"] = _t
    _t += s["dur"]
    s["t_end"] = _t
TOTAL_DUR = _t  # 75

# ─── Overlays: (t_start, t_end, text_lines, hero) ─────────────────────────────
# text_lines: list of (line, fontsize, y_offset) tuples
# hero=True uses Impact; hero=False uses Arial Bold
OVERLAYS = [
    (0,   5,  [("wanting != starting", 78,  0)], True),
    (3,   10, [("for ADHD brains",     48, 30)], False),
    (12,  20, [("the dopamine gap",    78,  0)], True),
    (20,  30, [("PFC needs a signal to start", 50, 0)], False),
    (30,  38, [("low interest = low dopamine", 50, 0)], False),
    (38,  46, [("seeing != starting",  78, -60), ("neurobiology, not willpower.", 40, 60)], True),
    (46,  56, [("small task. visible end.", 52, -40), ("finite time box.", 52, 40)], False),
    (55,  65, [("25 min. then you are done.", 50, 0)], False),
    (63,  72, [("end in sight = dopamine fires", 50, 0)], False),
    (70,  75, [("follow @we80hd",      88,  0)], True),
]

# ─── Voiceover script ─────────────────────────────────────────────────────────
TTS_SCRIPT = """\
The problem is not that you don't want to do the task.
It's that wanting to and starting are two different neurological events.
[[slnc 700]]
You have been staring at the same open tab for forty minutes.
You want to start. You know you should start.
You just cannot. And you don't know why.
[[slnc 700]]
Here is the science.
[[slnc 400]]
For neurotypical brains, seeing a task is usually enough to initiate it.
For ADHD brains, seeing the task and starting the task are separated by a dopamine gap.
A gap in the prefrontal cortex.
[[slnc 700]]
The brain needs a dopamine signal to bridge that gap.
Low-interest tasks do not generate enough signal.
[[slnc 700]]
That is not procrastination.
That is neurobiology.
[[slnc 700]]
The fix: artificially close the gap.
Small task. Visible end. Finite time box.
Not work on this. Work on this for exactly twenty-five minutes, and then you are done.
[[slnc 700]]
The end has to be in sight before you start.
That visibility is what fires the dopamine.
That is the whole mechanism.
[[slnc 700]]
Follow for more. We post ADHD science every day.\
"""

# ─── Font paths ───────────────────────────────────────────────────────────────
FONT_HERO_PATH = "/Library/Fonts/Impact.ttf"
FONT_BODY_PATH = "/Library/Fonts/Arial Bold.ttf"


def get_duration(path):
    r = subprocess.run(
        ["ffprobe", "-i", path, "-show_entries", "format=duration",
         "-v", "quiet", "-of", "csv=p=0"],
        capture_output=True, text=True, check=True,
    )
    return float(r.stdout.strip())


def generate_tts():
    txt  = os.path.join(WORK_DIR, "tts.txt")
    aiff = os.path.join(WORK_DIR, "vo.aiff")
    mp3  = os.path.join(WORK_DIR, "vo.mp3")

    with open(txt, "w") as f:
        f.write(TTS_SCRIPT)

    print("  [1] Generating TTS (macOS say, Daniel voice)...")
    subprocess.run(["say", "-v", "Daniel", "-r", "148", "-o", aiff, "-f", txt], check=True)
    subprocess.run(
        ["ffmpeg", "-y", "-i", aiff, "-c:a", "libmp3lame", "-b:a", "192k", mp3],
        check=True, capture_output=True,
    )
    dur = get_duration(mp3)
    print(f"      TTS: {dur:.1f}s")
    return mp3, dur


def get_bg_color(t, scale):
    """Return background RGB for time t (scaled)."""
    for shot in SHOTS:
        if shot["t_start"] * scale <= t < shot["t_end"] * scale:
            return shot["color"]
    return SHOTS[-1]["color"]


def get_active_overlays(t, scale, fade_sec=0.25):
    """Return list of (lines, is_hero, alpha) for active overlays at time t."""
    active = []
    for (ts, te, lines, hero) in OVERLAYS:
        ts_s = ts * scale
        te_s = te * scale
        if t < ts_s or t > te_s:
            continue
        dt_in  = t - ts_s
        dt_out = te_s - t
        alpha  = min(1.0, dt_in / fade_sec, dt_out / fade_sec)
        active.append((lines, hero, max(0.0, alpha)))
    return active


def render_frame(t, scale):
    """Render a single 1080x1920 frame at time t using Pillow."""
    bg = get_bg_color(t, scale)
    img  = Image.new("RGB", (W, H), bg)
    draw = ImageDraw.Draw(img)

    active = get_active_overlays(t, scale)

    # Center all overlays vertically around H/2
    for (lines, hero, alpha) in active:
        # Calculate block height
        fonts = []
        sizes = []
        for (text, fsize, _) in lines:
            try:
                f = ImageFont.truetype(FONT_HERO_PATH if hero else FONT_BODY_PATH, fsize)
            except Exception:
                f = ImageFont.load_default()
            fonts.append(f)
            bb = draw.textbbox((0, 0), text, font=f)
            sizes.append((bb[2] - bb[0], bb[3] - bb[1]))

        total_h = sum(h + 12 for (_, h) in sizes)
        y_base  = (H - total_h) // 2  # vertically centered

        for i, (text, fsize, y_off) in enumerate(lines):
            f = fonts[i]
            tw, th = sizes[i]
            x = (W - tw) // 2
            y = y_base + y_off + sum(sizes[k][1] + 12 for k in range(i))

            # Box behind text
            pad = 14
            box_alpha = int(0.5 * alpha * 255)
            # Draw semi-transparent box using a separate image + paste
            box_img = Image.new("RGBA", (tw + pad * 2, th + pad * 2), (0, 0, 0, box_alpha))
            img.paste(box_img, (x - pad, y - pad), box_img)

            # Text
            text_alpha = int(alpha * 255)
            overlay_img = Image.new("RGBA", (W, H), (0, 0, 0, 0))
            ov_draw = ImageDraw.Draw(overlay_img)
            ov_draw.text((x, y), text, font=f, fill=(255, 255, 255, text_alpha))
            img = img.convert("RGBA")
            img.paste(overlay_img, (0, 0), overlay_img)
            img = img.convert("RGB")
            draw = ImageDraw.Draw(img)

    return img


def render():
    print("=== 80HD Social Video Render — Topic 1 ===")

    mp3, audio_dur = generate_tts()
    video_dur = max(audio_dur + 1.0, float(TOTAL_DUR))
    scale     = video_dur / TOTAL_DUR
    total_frames = int(video_dur * GEN_FPS) + 1
    print(f"  [2] video_dur={video_dur:.1f}s  scale={scale:.3f}  frames={total_frames} @ {GEN_FPS}fps")

    output = os.path.join(OUTPUT_DIR, "topic-1.mp4")

    # Pipe raw RGB frames into ffmpeg
    ffmpeg_cmd = [
        "ffmpeg", "-y",
        "-f", "rawvideo",
        "-vcodec", "rawvideo",
        "-s", f"{W}x{H}",
        "-pix_fmt", "rgb24",
        "-r", str(GEN_FPS),
        "-i", "pipe:0",
        "-i", mp3,
        "-vf", f"fps={OUT_FPS}",           # upsample to 30fps via frame duplication
        "-c:v", "libx264", "-preset", "fast", "-crf", "22",
        "-c:a", "aac", "-b:a", "128k",
        "-t", f"{video_dur:.3f}",
        "-pix_fmt", "yuv420p",
        "-movflags", "+faststart",
        output,
    ]

    print(f"  [3] Rendering {total_frames} frames → {output}")
    proc = subprocess.Popen(ffmpeg_cmd, stdin=subprocess.PIPE, stderr=subprocess.PIPE)

    try:
        for i in range(total_frames):
            t = i / GEN_FPS
            frame = render_frame(t, scale)
            proc.stdin.write(frame.tobytes())
            if i % 50 == 0:
                print(f"      frame {i}/{total_frames} ({t:.1f}s)", end="\r", flush=True)
    except BrokenPipeError:
        pass
    finally:
        proc.stdin.close()

    _, stderr = proc.communicate()
    if proc.returncode != 0:
        print("\nFFMPEG STDERR (last 2000 chars):")
        print(stderr.decode()[-2000:])
        sys.exit(1)

    print()
    dur_out  = get_duration(output)
    size_mb  = os.path.getsize(output) / 1024 / 1024
    print(f"\n  Done: {output}")
    print(f"  Duration: {dur_out:.1f}s  |  Size: {size_mb:.1f} MB")
    return output


if __name__ == "__main__":
    render()
