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
2. **FLL Gameday scoreboard URL** — e.g., `https://fllgameday.com/scoreboard/{event-id}`
3. **Team list** — either from the schedule image or the scoreboard API (auto-fetched)
4. **Output filename** — the markdown file to create (e.g., `Carolina-Qualifier.md`)

Optional:
- **Schedule image** — helps verify team pairings but may not be accurate
- **Example format** — defaults to the Florida-Qualifier.md format

## Step-by-step process

### Step 1: Fetch scores from FLL Gameday API

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

### Step 2: Download captions from YouTube

Use `yt-dlp` to download auto-generated English captions. **Important:** The standard `--write-auto-sub --skip-download` approach often fails with "Did not get any data blocks" due to YouTube signature extraction issues. Use this workaround:

```bash
# This works reliably:
yt-dlp --extractor-args "youtube:player_client=ios" --write-auto-sub --sub-lang en --sub-format vtt --skip-download -o "captions" "VIDEO_URL"
```

The `youtube:player_client=ios` flag bypasses the signature extraction problem.

If yt-dlp is not installed or is outdated, install/update it:
```bash
pip install --upgrade yt-dlp
```

### Step 3: Parse captions and find match timestamps

Run the analysis script:

```bash
python .github/skills/fll-tournament-analyzer/analyze_tournament.py \
  --captions captions.en.vtt \
  --scoreboard-url https://fllgameday.com/scoreboard/{event-id} \
  --output analysis.json
```

The script:
1. Parses VTT captions into timestamped text entries
2. Searches for match start markers (countdown patterns: "three, two, one", "3, 2, 1")
3. Searches for team names/numbers near each match start (within a 2-minute window before the countdown)
4. Groups matches into rounds based on timing gaps
5. Uses process of elimination to fill in missing team pairings (each team plays exactly once per round)
6. Outputs a JSON file with all match data

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

Remove temporary files: `captions.en.vtt`, `analysis.json`, and any Python scripts created during the process.

## Key technical details

### FLL match structure
- Each FLL tournament has **3 qualifying rounds** (plus an optional practice round)
- Each round has every team playing exactly once
- Two teams run on the same table simultaneously (they get independent scores, not versus each other)
- Tournaments typically have 2 tables (Table A and Table B) running in parallel
- Each match is **2.5 minutes** long
- With 2 tables, matches are staggered — the camera covers one table, then moves to the other

### Caption analysis heuristics
- **Match start markers**: "three, two, one" or "3, 2, 1" followed by "let's go", "go", or "start"
- **Match end markers**: "hands up", "time's up", "stop", or "five, four, three, two, one" followed by "stop"
- **Team identification**: Search for team numbers (e.g., "36689") and team names (e.g., "mission possible", "gear girls") within 2 minutes before a countdown
- **Round gaps**: Typically 5-15 minutes between the last match of one round and the first of the next
- **Awards section**: Usually in the last 20-30 minutes of the video

### Common issues
- Auto-generated captions often mishear team names (e.g., "Mission Impossible" instead of "Mission Possible", "Cicero Circus" instead of "Cicero Circuit")
- Some matches may have no team names in nearby captions — use process of elimination
- Clock malfunctions can cause match redos, creating extra countdowns
- Practice rounds may or may not be in the video depending on when the livestream started
- The schedule image (if provided) may not be accurate if teams were added or dropped

## Dependencies

```bash
pip install yt-dlp
```

No other dependencies needed — the analysis script uses only Python standard library.
