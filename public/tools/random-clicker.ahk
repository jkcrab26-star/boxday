#Requires AutoHotkey v2.0
#SingleInstance Force
SendMode "Event"
SetMouseDelay -1

; ─── 80HD random-interval auto clicker ─────────────────────────────────
; F6  = toggle clicking on/off
; F7  = adjust speed (rotates: slow / medium / fast / very fast)
; Esc = quit
;
; Each click happens after a random delay between MIN_MS and MAX_MS,
; which makes detection harder than a perfectly uniform clicker.
; ──────────────────────────────────────────────────────────────────────

profiles := [
    {name: "medium",    minMs: 120, maxMs: 280},
    {name: "fast",      minMs: 60,  maxMs: 140},
    {name: "very fast", minMs: 25,  maxMs: 70 },
    {name: "slow",      minMs: 280, maxMs: 600}
]
profileIdx := 1
active := false

ShowStatus() {
    p := profiles[profileIdx]
    state := active ? "ON" : "OFF"
    ToolTip "80HD random clicker " state " | speed: " p.name " (" p.minMs "-" p.maxMs " ms) | F6 toggle, F7 speed, Esc quit"
    SetTimer () => ToolTip(), -2500
}

GetDelay() {
    p := profiles[profileIdx]
    return Random(p.minMs, p.maxMs)
}

ClickRandom() {
    Click
    SetTimer ClickRandom, -GetDelay()
}

F6:: {
    global active
    active := !active
    if active {
        SetTimer ClickRandom, -GetDelay()
    } else {
        SetTimer ClickRandom, 0
    }
    ShowStatus()
}

F7:: {
    global profileIdx
    profileIdx := Mod(profileIdx, profiles.Length) + 1
    ShowStatus()
}

Esc::ExitApp

ShowStatus()
