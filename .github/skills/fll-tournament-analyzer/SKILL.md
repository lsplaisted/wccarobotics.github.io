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
2. **Check for special events** — Look for match redos (clock malfunctions), false starts ("reset", "stop" after countdown), solo matches (odd team count), and exhibition runs after official matches.
3. **Verify round boundaries** — There's typically a 5-10 minute gap between rounds, but some tournaments have very short gaps. Use "end of round X" announcements and team pairings to determine boundaries, not just timing gaps. The announcer may start a new round before announcing the previous round's scores.
4. **Verify countdown count** — Count the total detected start countdowns and compare to expected matches. Extra countdowns may be false starts, exhibition runs, or misclassified end countdowns.
5. **Awards ceremony** — Search the last ~30-60 minutes of captions for award announcements. Most awards have two finalists and one winner. Look for keywords: "award", "finalist", "winner", "champion", "core values", "innovation", "robot design", "robot performance", "advancing".

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

For odd-team tournaments with solo runs (no partner):
| TEAM_NUM TEAM_NAME | SCORE | — | — | [TIMESTAMP](VIDEO_LINK?t=SECONDS) |

*Note: Exhibition/bonus runs after all official matches should NOT be in the match table. Add a footnote:*
> *TEAM_NUM TEAM_NAME had an [exhibition run](VIDEO_LINK?t=SECONDS) after all official matches.*

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
    - Finalist: TEAM_NUM TEAM_NAME
    - Finalist: TEAM_NUM TEAM_NAME
    - Winner: TEAM_NUM TEAM_NAME
```

Video links use the format: `https://www.youtube.com/live/VIDEO_ID?t=SECONDS`

### Step 6: Add to tournaments index

After creating the tournament page, add an entry to `tournaments/index.md`. Follow the existing card format, grouping by season (e.g., "2024–25 SUBMERGED Season"). Example:

```markdown
### 2024–25 SUBMERGED Season

<div class="tournament-list" markdown="1">

[![Tournament Name](assets/images/tournament-thumbnail.jpg)](tournaments/FILENAME)
[**Tournament Name**](tournaments/FILENAME)
City, State — Month Day, Year

</div>
```

### Step 7: Clean up

Remove temporary files: `captions.en.vtt`, `analysis.json`, `transcript.json`, `tournament_audio.mp4`, `scoreboard_video.png`, and any Python scripts created during the process.

## Key technical details

### FLL match structure
- Each FLL tournament has **3 qualifying rounds** (plus an optional practice round)
- Each round has every team playing exactly once
- Two teams run on the same table simultaneously (they get independent scores, not versus each other)
- Tournaments may have 2 or 3 tables running **sequentially** per time slot (not simultaneously). Each table gets its own countdown. Don't assume all tables start at the same time — the announcer moves from one table to the next.
- Each match is **2.5 minutes** (~150 seconds) long
- **Odd number of teams**: When there's an odd number of teams, each round has one team without a partner. This is handled in one of two ways:
  - **Surrogate match**: A volunteer team fills the empty table slot. The surrogate's score does NOT count in rankings. Mark with *(surrogate)* and use `—` for the score. Three surrogate teams are selected at the coaches meeting (one per round).
  - **Solo match**: The odd team runs alone with no partner. Their score still counts. Mark the missing partner with `— | —` in the table. The solo match may be at its scheduled position or moved to the end of the round.
- **Even number of teams**: No surrogates needed; all matches are scored
- **Cross-round matches**: Some schedules have a match where one physical run counts as Round 1 for one team and Round 2 for the other. This means one round has one fewer physical match (that team already got their score from the cross-round). Note these with a footnote explaining which team gets which round's score.
- **Exhibition/bonus matches**: After all official rounds complete, a team may get an extra unofficial run (e.g., the announcer says "finish one more match"). These don't count for scoring — the team already has all 3 round scores. Note these separately from official matches.

### Caption/transcript analysis heuristics
- **Match start markers**: "three, two, one" or "3, 2, 1" followed by "lego", "let's go", "let go", "go", or "start". Auto-captions often mishear "lego" as "let go."
- **Match end markers**: "five, four, three, two, one" (or "10, 9, 8...") followed by "stop", "time's up". The key distinction: END countdowns count DOWN TO STOP from 5 or 10, while START countdowns count "three, two, one" then say "lego"/"let go."
- **Distinguishing START from END countdowns**: Both contain "three, two, one." To tell them apart: (1) if "five, four" or "10, 9, 8" appears BEFORE the "three, two, one," it's an END countdown; (2) if "lego" or "let go" appears AFTER, it's a START; (3) verify by checking that START-END pairs are ~140-160 seconds apart.
- **False starts / restarts**: Sometimes a match is started but immediately stopped ("reset that", "stop guys", "sorry", "restart"). A new countdown follows. Exclude the false start timestamp — use the restart. Look for "reset", "stop", "sorry", "restart", "again" within 30 seconds after a countdown.
- **Announcer announces NEXT match while CURRENT match runs**: Team names mentioned near a countdown may be for the upcoming match being called to the table, not the match currently starting. The announcer often calls "Team X and Team Y, come to the red table" while the blue table match is still running. Use the schedule pairings as the primary source of truth for which teams play when.
- **Team identification**: Search for team numbers (e.g., "36689") and team names (e.g., "mission possible", "gear girls") within 2 minutes before a countdown. Team numbers spoken digit-by-digit (e.g., "five, nine, six, zero, two") are common in auto-generated captions and Whisper output. **Always fetch the scoreboard API first** to get accurate team names, then search captions for those exact names.
- **Round gaps**: Typically 5-15 minutes between the last match of one round and the first of the next. Gaps often include interviews, emoji games, or break announcements. However, some tournaments have very short gaps (~60 seconds) between rounds if teams are already queued.
- **VTT deduplication**: YouTube VTT captions have heavy duplication — the same text appears at multiple timestamps as the caption updates. Deduplicate entries by `(int(start_seconds), text)` key before analysis.
- **Awards section**: Usually in the last 20-60 minutes of the video. Search for: "award", "champion", "core values", "innovation", "robot design", "robot performance", "advancing". Most awards have **two finalists and one winner** announced separately — search for "finalist" mentions before "winner."
- **Whisper VAD gaps**: When using Whisper with VAD filtering, segments of music or ambient noise will be skipped entirely. The awards ceremony often has long music gaps where award names may be lost — flag these for the user to fill in manually.

### Common issues
- Auto-generated captions and Whisper both often mishear team names (e.g., "Mission Impossible" instead of "Mission Possible", "Cicero Circus" instead of "Cicero Circuit", "table bots" or "tail bots" instead of "TerraBots", "harbots" instead of "Hobbots", "Shark Novas" instead of "Sharknovus", "Aquinauts" instead of "Aquanauts")
- Team numbers are more reliable than names — search for both digit sequences ("69648") and spoken digits ("six, nine, six, four, eight")
- Some matches may have no team names in nearby captions — use process of elimination
- Not all match starts have a clear countdown — the announcer may just say "let's start" or "lego" without a formal 3-2-1. Search for "start this match" and "lego" as additional markers.
- Clock malfunctions can cause match redos, creating extra countdowns. Also look for false starts where the announcer says "reset" or "stop" immediately after a countdown.
- Practice rounds may or may not be in the video depending on when the livestream started
- The schedule image/PDF (if provided) may not be accurate if teams were added or dropped, or if the organizer rearranged matches on the day
- Surrogate teams sometimes decline to play (as seen in Mid-Atlantic tournament), requiring another team to volunteer. Listen for "surrogate" mentions. Some tournaments skip surrogates entirely and let the odd team run solo instead.
- The announcer may be confused about round numbering (e.g., calling the "second competition round" the "third set of rounds"). Use match timestamps and team pairings to determine the actual round structure, not the announcer's numbering.
- **"Unknown creature", "shark", "coral"** — these are game element names from the SUBMERGED season, NOT team names. Don't confuse in-game commentary ("we got the shark released") with team identification ("Sharknovus is at the blue table").
- **Awards ceremony gaps**: When using Whisper, the awards ceremony often has long music/silence gaps where award announcements may be lost. Common FLL awards are: Core Values, Innovation Project, Robot Design, Robot Performance, and Champions Award. Flag any missing awards for the user to fill in from watching the video.
- **Coach Mentor Award**: This is given to a coach/mentor, not a team. Note the coach's name and their team.
- **Rising All-Star Award**: This award may have multiple winners (not just one).
- **yt-dlp download-sections**: The `--download-sections` flag for extracting video clips often fails with YouTube HLS streams (HTTP 403 errors on segments). Use Playwright screenshots instead for extracting frames.

### Verification checklist
After generating the page, verify:
1. Each team appears exactly once per round (except: the team missing from the cross-round's other round)
2. All scores match the FLL Gameday API data (match1/match2/match3 for each team)
3. START-END countdown pairs are ~140-160 seconds apart
4. The total number of detected start countdowns matches: R1 matches + R2 matches + R3 matches (plus any false starts or exhibition runs)
5. No countdown was misclassified as START when it's actually END (check for "five, four" before "three, two, one")
6. Add the tournament to `tournaments/index.md` after creating the page

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
