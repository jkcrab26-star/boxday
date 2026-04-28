#!/usr/bin/env python3
"""
80HD Social Content Render Pipeline
Produces a 9:16 1080×1920 MP4 from a production spec.
Usage: python render.py          # renders Topic 1 to public/social-samples/topic-1.mp4
"""

import os
import sys
import subprocess
import shutil
import tempfile
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

# ── Repo root (scripts/social/ → ../../) ─────────────────────────────────────
REPO_ROOT = Path(__file__).resolve().parent.parent.parent

# ── Dimensions ────────────────────────────────────────────────────────────────
W, H = 1080, 1920
FPS = 30
MARGIN_H = 80          # horizontal safe margin
TEXT_W = W - 2 * MARGIN_H

# ── Fonts ─────────────────────────────────────────────────────────────────────
FONT_PATH = "/System/Library/Fonts/HelveticaNeue.ttc"
FONT_IDX  = {"bold": 1, "regular": 0, "light": 7, "medium": 10, "ultralight": 5}

def fnt(size, weight="bold"):
    return ImageFont.truetype(FONT_PATH, size=size, index=FONT_IDX[weight])

FONTS = {
    "hero":     fnt(148, "bold"),
    "subhero":  fnt(120, "bold"),
    "subtitle": fnt(96,  "medium"),
    "body":     fnt(80,  "regular"),
    "small":    fnt(70,  "regular"),
    "watermark":fnt(48,  "light"),
    "brand":    fnt(156, "bold"),
}

# ── Colors ────────────────────────────────────────────────────────────────────
WHITE      = (255, 255, 255, 255)
DARK_TEXT  = (30, 15, 60, 255)      # deep purple for main text on light bg
GRAY       = (90, 70, 130, 255)     # medium purple for secondary text
DIMGRAY    = (130, 110, 160, 255)   # lighter purple for tertiary text
BG_DARK    = (235, 225, 255)        # soft lavender
BG_DARKER  = (248, 244, 255)        # near white with purple tint
BG_ACCENT  = (215, 200, 248)        # medium lavender for emphasis shots
WATERMARK_ALPHA = 200

# ── Shot definitions ──────────────────────────────────────────────────────────
# Each shot: dur(s), bg keyword, list of (text, font_key, color_rgba, y_bias)
# y_bias: fraction of H to shift center (-0.1 = slightly up, etc.)
SHOTS = [
    {
        "dur": 3, "bg": "dark",
        "lines": [
            ("wanting", "hero", DARK_TEXT, -0.06),
            ("≠", "subhero", GRAY, 0.0),
            ("starting", "hero", DARK_TEXT, 0.06),
        ],
    },
    {
        "dur": 3, "bg": "dark",
        "lines": [
            ("for ADHD brains", "subtitle", GRAY, 0.0),
        ],
    },
    {
        "dur": 6, "bg": "darker",
        "lines": [
            ("40 minutes.", "hero", DARK_TEXT, -0.05),
            ("same tab.", "hero", GRAY, 0.05),
        ],
    },
    {
        "dur": 8, "bg": "accent",
        "lines": [
            ("the", "subtitle", GRAY, -0.06),
            ("dopamine gap", "hero", DARK_TEXT, 0.03),
        ],
    },
    {
        "dur": 10, "bg": "darker",
        "lines": [
            ("PFC needs a signal", "subtitle", DARK_TEXT, -0.04),
            ("to start", "hero", DARK_TEXT, 0.06),
        ],
    },
    {
        "dur": 8, "bg": "dark",
        "lines": [
            ("low interest =", "body", GRAY, -0.08),
            ("low dopamine", "subtitle", DARK_TEXT, 0.0),
            ("= no bridge", "body", GRAY, 0.08),
        ],
    },
    {
        "dur": 8, "bg": "darker",
        "lines": [
            ("seeing ≠ starting", "hero", DARK_TEXT, -0.05),
            ("that's neurobiology,", "small", GRAY, 0.05),
            ("not procrastination", "small", DIMGRAY, 0.1),
        ],
    },
    {
        "dur": 9, "bg": "accent",
        "lines": [
            ("small task.", "subtitle", DARK_TEXT, -0.08),
            ("visible end.", "subtitle", DARK_TEXT, 0.0),
            ("finite.", "hero", DARK_TEXT, 0.1),
        ],
    },
    {
        "dur": 8, "bg": "dark",
        "lines": [
            ("not 'work on this'", "body", GRAY, -0.1),
            ("'work on this for 25 min,", "small", DARK_TEXT, 0.0),
            ("then you're done.'", "small", DARK_TEXT, 0.07),
        ],
    },
    {
        "dur": 7, "bg": "darker",
        "lines": [
            ("the end in sight =", "body", GRAY, -0.1),
            ("dopamine fires =", "body", DARK_TEXT, 0.0),
            ("you start", "hero", DARK_TEXT, 0.1),
        ],
    },
    {
        "dur": 5, "bg": "warm_gradient",
        "lines": [
            ("follow @we80hd", "brand", (20, 10, 0, 255), 0.0),
        ],
    },
]

assert sum(s["dur"] for s in SHOTS) == 75, "shot durations must sum to 75s"


# ── Background generators ─────────────────────────────────────────────────────

def bg_solid(color):
    img = Image.new("RGBA", (W, H), color + (255,))
    return img


def bg_warm_gradient():
    img = Image.new("RGBA", (W, H))
    px = img.load()
    top = (255, 165, 30)
    bot = (210, 70, 0)
    for y in range(H):
        t = y / H
        r = int(top[0] + (bot[0] - top[0]) * t)
        g = int(top[1] + (bot[1] - top[1]) * t)
        b = int(top[2] + (bot[2] - top[2]) * t)
        for x in range(W):
            px[x, y] = (r, g, b, 255)
    return img


def make_bg(key):
    if key == "dark":          return bg_solid(BG_DARK)
    if key == "darker":        return bg_solid(BG_DARKER)
    if key == "accent":        return bg_solid(BG_ACCENT)
    if key == "warm_gradient": return bg_warm_gradient()
    raise ValueError(f"unknown bg key: {key}")


# ── Noise/grain overlay for texture ──────────────────────────────────────────

def add_grain(img, intensity=12):
    """Adds subtle film grain for a more cinematic feel."""
    import random
    overlay = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)
    for _ in range(W * H // 8):
        x = random.randint(0, W - 1)
        y = random.randint(0, H - 1)
        v = random.randint(-intensity, intensity)
        draw.point((x, y), fill=(max(0,v), max(0,v), max(0,v), 30))
    return Image.alpha_composite(img, overlay)


# ── Text rendering ────────────────────────────────────────────────────────────

def wrap_text(text, font, max_width):
    """Naive word-wrap; returns list of lines."""
    words = text.split()
    lines, current = [], []
    for word in words:
        test = " ".join(current + [word])
        bbox = font.getbbox(test)
        if bbox[2] - bbox[0] > max_width and current:
            lines.append(" ".join(current))
            current = [word]
        else:
            current.append(word)
    if current:
        lines.append(" ".join(current))
    return lines


def text_height(font, text):
    bbox = font.getbbox(text)
    return bbox[3] - bbox[1]


def render_text_on_img(img, line_specs):
    """
    line_specs: list of (text, font_key, color_rgba, y_bias)
    y_bias: fraction of H to offset center (stacks relative to each other)
    Each line is centered individually at: H/2 + y_bias*H
    """
    draw = ImageDraw.Draw(img)
    for text, fkey, color, y_bias in line_specs:
        font = FONTS[fkey]
        wrapped = wrap_text(text, font, TEXT_W)
        # measure full block
        line_heights = [text_height(font, ln) for ln in wrapped]
        line_spacing = 16
        block_h = sum(line_heights) + line_spacing * (len(wrapped) - 1)
        cy = int(H / 2 + y_bias * H) - block_h // 2
        for i, ln in enumerate(wrapped):
            bbox = font.getbbox(ln)
            lw = bbox[2] - bbox[0]
            lh = line_heights[i]
            x = (W - lw) // 2
            # subtle text shadow for depth
            draw.text((x + 2, cy + 2), ln, font=font, fill=(0, 0, 0, 80))
            draw.text((x, cy), ln, font=font, fill=color)
            cy += lh + line_spacing
    return img


def add_watermark(img):
    draw = ImageDraw.Draw(img)
    text = "@we80hd"
    font = FONTS["watermark"]
    bbox = font.getbbox(text)
    tw = bbox[2] - bbox[0]
    th = bbox[3] - bbox[1]
    x = W - tw - 48
    y = H - th - 80
    draw.text((x + 1, y + 1), text, font=font, fill=(255, 255, 255, 40))
    draw.text((x, y), text, font=font, fill=(30, 15, 60, WATERMARK_ALPHA))
    return img


# ── Frame generation ──────────────────────────────────────────────────────────

def generate_frame(shot, path):
    bg_key  = shot["bg"]
    lines   = shot["lines"]
    img = make_bg(bg_key)
    img = render_text_on_img(img, lines)
    img = add_watermark(img)
    img = add_grain(img)
    # Convert to RGB for JPEG-like save (no alpha in MP4)
    img_rgb = Image.new("RGB", (W, H), (0, 0, 0))
    img_rgb.paste(img, mask=img.split()[3])
    img_rgb.save(path, "PNG")


# ── FFmpeg helpers ────────────────────────────────────────────────────────────

def run(cmd, check=True, **kw):
    result = subprocess.run(cmd, shell=True, text=True,
                            capture_output=True, **kw)
    if check and result.returncode != 0:
        print(f"CMD: {cmd}")
        print(f"STDERR: {result.stderr}")
        sys.exit(1)
    return result


def create_clip(png_path, duration, out_path, fade_dur=0.4):
    """Encode a still PNG to MP4 with fade-in and fade-out."""
    frames = int(duration * FPS)
    fade_frames = int(fade_dur * FPS)
    vf = f"fade=t=in:st=0:d={fade_dur},fade=t=out:st={duration - fade_dur}:d={fade_dur}"
    run(
        f'ffmpeg -y -loop 1 -framerate {FPS} -i "{png_path}" '
        f'-vf "{vf}" -t {duration} '
        f'-c:v libx264 -preset fast -pix_fmt yuv420p '
        f'-r {FPS} "{out_path}"'
    )


def concat_clips(clip_paths, concat_list_path, out_path):
    with open(concat_list_path, "w") as f:
        for p in clip_paths:
            f.write(f"file '{p}'\n")
    run(
        f'ffmpeg -y -f concat -safe 0 -i "{concat_list_path}" '
        f'-c copy "{out_path}"'
    )


def get_audio_duration(path):
    r = run(
        f'ffprobe -v quiet -show_entries format=duration '
        f'-of default=noprint_wrappers=1:nokey=1 "{path}"'
    )
    return float(r.stdout.strip())


def mix_audio(video_path, audio_path, out_path, target_dur=75):
    """Overlay audio on video. Trims or pads audio to target_dur."""
    # Normalize audio and mix, ending video at whichever is shorter
    run(
        f'ffmpeg -y -i "{video_path}" -i "{audio_path}" '
        f'-c:v copy -c:a aac -map 0:v:0 -map 1:a:0 '
        f'-shortest "{out_path}"'
    )


# ── Voiceover ─────────────────────────────────────────────────────────────────

VOICEOVER_SCRIPT = (
    "The problem isn't that you don't want to do the task. "
    "It's that wanting to and starting are two different neurological events. "
    "[[slnc 1500]] "
    "You've been staring at the same open tab for forty minutes. "
    "You want to start. You know you should start. "
    "You just... can't. And you don't know why. "
    "[[slnc 1500]] "
    "Here's the science. "
    "[[slnc 800]] "
    "For neurotypical brains, seeing a task is usually enough to initiate it. "
    "For ADHD brains, seeing the task and starting the task are separated by a dopamine gap "
    "— a gap in the prefrontal cortex. "
    "The brain needs a dopamine signal to bridge that gap. "
    "Low-interest tasks don't generate enough signal. "
    "[[slnc 1500]] "
    "That's not procrastination. "
    "That's neurobiology. "
    "[[slnc 1500]] "
    "The fix: artificially close the gap. "
    "Small task. Visible end. Finite time box. "
    "Not 'work on this' — 'work on this for exactly twenty-five minutes, and then you're done.' "
    "[[slnc 1500]] "
    "The end has to be in sight before you start. "
    "That visibility is what fires the dopamine. "
    "That's the whole mechanism. "
    "[[slnc 1500]] "
    "Follow for more — we post ADHD science every day."
)


def generate_voiceover(out_aiff, out_mp3):
    script_escaped = VOICEOVER_SCRIPT.replace('"', '\\"')
    run(f'say -v Daniel -r 148 "{script_escaped}" -o "{out_aiff}"')
    run(
        f'ffmpeg -y -i "{out_aiff}" '
        f'-c:a libmp3lame -ar 44100 -ab 192k "{out_mp3}"'
    )
    dur = get_audio_duration(out_mp3)
    print(f"  Voiceover duration: {dur:.1f}s")
    return dur


# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    tmp = Path(tempfile.mkdtemp(prefix="80hd_social_"))
    print(f"Working dir: {tmp}")

    output_path = REPO_ROOT / "public" / "social-samples" / "topic-1.mp4"
    output_path.parent.mkdir(parents=True, exist_ok=True)

    # 1. Generate voiceover
    print("Generating voiceover via macOS say...")
    vo_aiff = tmp / "voiceover.aiff"
    vo_mp3  = tmp / "voiceover.mp3"
    vo_dur  = generate_voiceover(str(vo_aiff), str(vo_mp3))

    # 2. Generate frames + clips
    print("Rendering shot frames...")
    clip_paths = []
    for i, shot in enumerate(SHOTS):
        n    = i + 1
        png  = tmp / f"shot_{n:02d}.png"
        clip = tmp / f"clip_{n:02d}.mp4"
        print(f"  Shot {n:2d}  {shot['dur']}s  bg={shot['bg']}")
        generate_frame(shot, str(png))
        create_clip(str(png), shot["dur"], str(clip))
        clip_paths.append(str(clip))

    # 3. Concatenate clips
    print("Concatenating clips...")
    concat_list = tmp / "concat.txt"
    silent_video = tmp / "video_silent.mp4"
    concat_clips(clip_paths, str(concat_list), str(silent_video))

    # 4. Mix in voiceover
    print("Mixing audio...")
    final = tmp / "topic-1-final.mp4"
    mix_audio(str(silent_video), str(vo_mp3), str(final))

    # 5. Copy to output
    shutil.copy2(str(final), str(output_path))
    print(f"\n✓ Done: {output_path}")
    print(f"  GH Pages URL: https://jkcrab26-star.github.io/boxday/social-samples/topic-1.mp4")


if __name__ == "__main__":
    main()
