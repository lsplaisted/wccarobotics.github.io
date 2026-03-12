---
name: fll-tournament-analyzer
description: Analyze an FLL tournament livestream video to find match timestamps, fetch scores from FLL Gameday, and generate a markdown page documenting all matches, rankings, and awards. Use this skill when asked to create a tournament summary page from an FLL livestream video.
---

# FLL Tournament Analyzer

This skill analyzes an FLL (FIRST LEGO League) tournament livestream video to produce a markdown page documenting every match with timestamped video links, scores, rankings, and awards — following the format used in [Florida-Qualifier.md](https://github.com/wccarobotics/submerged/blob/main/Florida-Qualifier.md).

## When to use this skill

- When the user provides an FLL tournament livestream URL and asks to document it
- When the user wants match timestamps extracted from an FLL video
- When creating a tournament summary markdown page

## Required inputs

1. **YouTube video URL** — the full tournament livestream
2. **Output filename** — the markdown file to create (e.g., `Carolina-Qualifier.md`)

One of the following for scores (in order of preference):
3. **FLL Gameday scoreboard URL** — e.g., `https://fllgameday.com/scoreboard/{event-id}` (best: structured data via API)
4. **Scoreboard visible in video** — if no API link, use Playwright to screenshot the YouTube player at the timestamp where the scoreboard is shown, then read scores from the image

Optional:
- **Schedule image** — helps verify team pairings but may not be accurate
- **Example format** — defaults to the Carolina-Qualifier.md / Mid-Atlantic-Qualifier.md format

## Step-by-step process

### Step 1: Fetch scores

**Option A — FLL Gameday API (preferred when a scoreboard URL is available):**

The FLL Gameday scoreboard is a Vue.js SPA. The data is available via a REST API:

```
GET https://api.fllgameday.com/public/scoreboard/{event-id}
GET https://api.fllgameday.com/public/event/{event-id}
```

Extract the `{event-id}` from the scoreboard URL (it's the UUID at the end).

The scoreboard API returns a JSON array with each team's data:
```json
{
  "customTeamId": "54580",
  "rank": 1,
  "name": "Gear Girls",
  "practice": 320,
  "match1": 335,
  "match2": 360,
  "match3": 395,
  "highScore": 395
}
```

Use `web_fetch` to retrieve this data. Store the team list and all scores.

**Option B — Screenshot scoreboard from video (when no API link is available):**

If there's no FLL Gameday link, the scoreboard is often shown on-screen during the livestream. Use Playwright to screenshot the YouTube player at the relevant timestamp:

```python
from playwright.sync_api import sync_playwright
import time

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 1920, "height": 1080})
    page.goto(f"https://www.youtube.com/watch?v={VIDEO_ID}&t={TIMESTAMP_SECONDS}", wait_until="networkidle", timeout=60000)
    time.sleep(5)
    try:
        page.click('button[aria-label="Accept all"]', timeout=3000)
    except:
        pass
    try:
        page.click('.ytp-play-button', timeout=3000)
        time.sleep(3)
        page.click('.ytp-play-button', timeout=3000)  # pause
    except:
        pass
    video_el = page.query_selector('video')
    if video_el:
        video_el.screenshot(path="scoreboard_video.png")
    browser.close()
```

Install Playwright if needed: `pip install playwright && python -m playwright install chromium`

Read the scores from the screenshot image. The scoreboard typically shows: Rank, Team Number, Team Name, High Score, Match 1, Match 2, Match 3, Practice.

### Step 2: Get transcript from YouTube

**Option A — Auto-generated captions (try first):**

Use `yt-dlp` to download auto-generated English captions. **Important:** The standard `--write-auto-sub --skip-download` approach often fails with "Did not get any data blocks" due to YouTube signature extraction issues. Use this workaround:

```bash
yt-dlp --extractor-args "youtube:player_client=ios" --write-auto-sub --sub-lang en --sub-format vtt --skip-download -o "captions" "VIDEO_URL"
```

The `youtube:player_client=ios` flag bypasses the signature extraction problem.

**Option B — Whisper speech recognition (when captions are unavailable):**

Some livestreams have no auto-generated captions. In that case, download the audio and use Whisper:

```bash
# Download audio only
yt-dlp --extractor-args "youtube:player_client=ios" -f 234 -o "tournament_audio.%(ext)s" "VIDEO_URL"

# Install faster-whisper
pip install faster-whisper
```

Then run speech recognition:

```python
from faster_whisper import WhisperModel
import json

model = WhisperModel("base", device="cpu", compute_type="int8")
segments, info = model.transcribe("tournament_audio.mp4", beam_size=5, language="en",
                                   vad_filter=True, vad_parameters=dict(min_silence_duration_ms=500))

results = [{"start": round(s.start, 2), "end": round(s.end, 2), "text": s.text.strip()} for s in segments]
with open("transcript.json", "w") as f:
    json.dump(results, f, indent=2)
```

This takes ~8 minutes for a 3.5-hour video on CPU. The output is a JSON array of `{start, end, text}` segments. Note: Whisper transcription may have gaps during music/silence and team names are often misheard worse than YouTube auto-captions.

If yt-dlp is not installed or is outdated, install/update it:
```bash
pip install --upgrade yt-dlp
```

### Step 3: Parse transcript and find match timestamps

If you have VTT captions, run the analysis script:

```bash
python .github/skills/fll-tournament-analyzer/analyze_tournament.py \
  --captions captions.en.vtt \
  --scoreboard-url https://fllgameday.com/scoreboard/{event-id} \
  --output analysis.json
```

If you have Whisper JSON output instead of VTT, analyze it directly. Search the transcript for:

1. **Match start markers** — countdown patterns: "three, two, one", "3, 2, 1", followed by "lego", "go", "start"
2. **Team identification** — search for team numbers and team names within a 2-minute window before each countdown
3. **Round boundaries** — 5-15 minute gaps between rounds, often with breaks, interviews, or games

The script / manual analysis should:
1. Parse captions/transcript into timestamped text entries
2. Search for match start markers (countdown patterns)
3. Search for team names/numbers near each match start
4. Group matches into rounds based on timing gaps
5. Use process of elimination to fill in missing team pairings (each team plays exactly once per round)
6. Output structured match data

### Step 4: Review and refine

The auto-generated captions are imperfect. After the script runs, **manually review** the output:

1. **Verify team pairings** — Check that each team appears exactly once per round. If a pairing seems wrong, search the captions near that timestamp for clues.
2. **Check for special events** — Look for match redos (clock malfunctions), practice rounds before Round 1, or other anomalies.
3. **Verify round boundaries** — There's typically a 5-10 minute gap between rounds. The script groups by timing, but verify the grouping is correct.
4. **Awards ceremony** — Search the last ~30 minutes of captions for award announcements. Look for keywords: "award", "champion", "core values", "innovation", "robot design", "robot performance", "advancing".

### Step 5: Generate the markdown page

Use the analysis JSON to create the markdown file following this format:

```markdown
# Tournament Name

[Full tournament livestream](VIDEO_URL)

[Tournament results](SCOREBOARD_URL)

## Round 1

| Team A | Points Scored | Team B | Points Scored | Video Link |
| ------ | ------------- | -------| ------------- | ---------- |
| TEAM_NUM TEAM_NAME | SCORE | TEAM_NUM TEAM_NAME | SCORE | [TIMESTAMP](VIDEO_LINK?t=SECONDS) |

For odd-team tournaments with surrogates:
| TEAM_NUM TEAM_NAME | SCORE | TEAM_NUM TEAM_NAME *(surrogate)* | — | [TIMESTAMP](VIDEO_LINK?t=SECONDS) |

## Round 2
...

## Round 3
...

## Robot Game Rankings

| Rank | Team | High Score | Match 1 | Match 2 | Match 3 |
| ---- | ---- | ---------- | ------- | ------- | ------- |
| 1 | TEAM_NUM TEAM_NAME | HIGH | M1 | M2 | M3 |

## Awards Ceremony

- Start of awards ceremony [TIMESTAMP](VIDEO_LINK?t=SECONDS)
- Participation medals
  - [TEAM_NUM TEAM_NAME](VIDEO_LINK?t=SECONDS)
- Awards
  - [Award Name](VIDEO_LINK?t=SECONDS)
    - Winner: TEAM_NUM TEAM_NAME
```

Video links use the format: `https://www.youtube.com/live/VIDEO_ID?t=SECONDS`

### Step 6: Clean up

Remove temporary files: `captions.en.vtt`, `analysis.json`, `transcript.json`, `tournament_audio.mp4`, `scoreboard_video.png`, and any Python scripts created during the process.

## Key technical details

### FLL match structure
- Each FLL tournament has **3 qualifying rounds** (plus an optional practice round)
- Each round has every team playing exactly once
- Two teams run on the same table simultaneously (they get independent scores, not versus each other)
- Tournaments typically have 2 tables (Table A and Table B) running in parallel
- Each match is **2.5 minutes** long
- With 2 tables, matches are staggered — the camera covers one table, then moves to the other
- **Odd number of teams**: When there's an odd number of teams, each round includes one **surrogate match** where a volunteer team fills the empty table slot. The surrogate's score does NOT count in rankings. Mark these in the markdown with *(surrogate)* and use `—` for the score. Three surrogate teams are selected at the coaches meeting (one per round).
- **Even number of teams**: No surrogates needed; all matches are scored

### Caption/transcript analysis heuristics
- **Match start markers**: "three, two, one" or "3, 2, 1" followed by "lego", "let's go", "go", or "start"
- **Match end markers**: "hands up", "time's up", "stop", or "five, four, three, two, one" followed by "stop"
- **Team identification**: Search for team numbers (e.g., "36689") and team names (e.g., "mission possible", "gear girls") within 2 minutes before a countdown. Team numbers spoken digit-by-digit (e.g., "five, nine, six, zero, two") are common in auto-generated captions and Whisper output.
- **Round gaps**: Typically 5-15 minutes between the last match of one round and the first of the next. Gaps often include interviews, emoji games, or break announcements.
- **Awards section**: Usually in the last 20-30 minutes of the video. Search for: "award", "champion", "core values", "innovation", "robot design", "robot performance", "advancing"
- **Whisper VAD gaps**: When using Whisper with VAD filtering, segments of music or ambient noise will be skipped entirely. The awards ceremony often has long music gaps where award names may be lost — flag these for the user to fill in manually.

### Common issues
- Auto-generated captions and Whisper both often mishear team names (e.g., "Mission Impossible" instead of "Mission Possible", "Cicero Circus" instead of "Cicero Circuit", "table bots" or "tail bots" instead of "TerraBots", "harbots" instead of "Hobbots")
- Team numbers are more reliable than names — search for both digit sequences ("69648") and spoken digits ("six, nine, six, four, eight")
- Some matches may have no team names in nearby captions — use process of elimination
- Not all match starts have a clear countdown — the announcer may just say "let's start" or "lego" without a formal 3-2-1. Search for "start this match" and "lego" as additional markers.
- Clock malfunctions can cause match redos, creating extra countdowns
- Practice rounds may or may not be in the video depending on when the livestream started
- The schedule image (if provided) may not be accurate if teams were added or dropped
- Surrogate teams sometimes decline to play (as seen in Mid-Atlantic tournament), requiring another team to volunteer. Listen for "surrogate" mentions.
- The announcer may be confused about round numbering (e.g., calling the "second competition round" the "third set of rounds"). Use match timestamps and team pairings to determine the actual round structure, not the announcer's numbering.
- **Awards ceremony gaps**: When using Whisper, the awards ceremony often has long music/silence gaps where award announcements may be lost. Common FLL awards are: Core Values, Innovation Project, Robot Design, Robot Performance, and Champions Award. Flag any missing awards for the user to fill in from watching the video.
- **yt-dlp download-sections**: The `--download-sections` flag for extracting video clips often fails with YouTube HLS streams (HTTP 403 errors on segments). Use Playwright screenshots instead for extracting frames.

### Standard FLL awards
The typical awards given at FLL tournaments (in order of announcement):
1. **Core Values Award** — teamwork, discovery, inclusion, innovation, impact, fun
2. **Innovation Project Award** — best innovation project presentation
3. **Robot Design Award** — best robot mechanical/programming design
4. **Robot Performance Award** — highest robot game score
5. **Champions Award** — best overall team embodying the FLL experience (often advances)
6. **Advancing teams** — typically the Champions Award winner plus one or more additional teams

## Dependencies

```bash
pip install yt-dlp
```

For videos without auto-generated captions:
```bash
pip install faster-whisper
```

For scoreboard screenshots from video:
```bash
pip install playwright
python -m playwright install chromium
```
