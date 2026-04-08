---
name: ftc-scouting-processor
description: Process FTC scouting form photos and robot images during a tournament. Reads handwritten scouting forms, extracts data, and updates scouting pages with match results, team stats, and robot photos. Use this skill when asked to process scouting data from photos or update scouting pages during a tournament.
---

# FTC Scouting Processor

This skill processes photos of handwritten scouting forms and robot images taken during an FTC tournament. It extracts data from the forms, updates the scouting summary and team detail pages, and manages robot photos.

## When to use this skill

- When the user provides photos of filled-out scouting forms
- When the user provides photos of robots at a tournament
- When asked to update scouting pages with new data
- When setting up scouting pages for a new tournament

## Required inputs

1. **Scouting form photos** — photos of filled-out paper scouting forms (HEIC, JPG, or PNG)
2. **Event info** — FTC Events URL for the tournament (for match schedules, rankings, scores)

Optional:
3. **Robot photos** — photos of robots at the tournament, with team number visible on the nameplate
4. **Scouting data folder** — a folder to watch for new photos (e.g., `C:\Users\Daniel\OneDrive\Documents\Scouting`)

## Setup for a new tournament

### Step 1: Create the scouting pages

Create the following files:

- `scouting/index.md` — tournament overview with teams table and match schedule
- `scouting/scouting-data.json` — raw scouting data store

Fetch match schedule and rankings from FTC Events:
- `https://ftc-events.firstinspires.org/{season}/{event_code}/qualifications`
- `https://ftc-events.firstinspires.org/{season}/{event_code}/rankings`

### Step 2: Build the initial teams table

The teams table combines rankings and scouting data in one view:

```markdown
## Teams

| Rank | Team | RS | W-L-T | Match Pts | Avg Auto | Avg Teleop | Teleop Acc. | Notes |
| ---- | ---- | -- | ----- | --------- | -------- | ---------- | ----------- | ----- |
| 1 | [TEAM_NUM TEAM_NAME](/scouting/TEAM_NUM) | RS | W-L-T | PTS | auto data | teleop data | accuracy | notes |
```

Teams with scouting data link to their detail page. Scouting columns are blank until data comes in.

Auto column format:
- If team has auto from one position only: `~6 pts (near only)`
- If team has auto from both: `~6 pts`
- If team has no auto: `No auto`

### Step 3: Build the match schedule

```markdown
## Match Schedule & Results

| Match | Red Alliance | Blue Alliance | Score |
| ----- | ------------ | ------------- | ----- |
| Q1 | TEAM / TEAM | TEAM / TEAM | **SCORE** – SCORE |
```

Update scores as results come in from FTC Events.

## Processing scouting forms

### Step 1: Convert photos if needed

HEIC files (from iPhones) need conversion:

```python
from pillow_heif import register_heif_opener
from PIL import Image
register_heif_opener()
img = Image.open('photo.heic')
img.save('photo.jpg', quality=85)
```

Install if needed: `pip install pillow-heif`

### Step 2: Read the form

View the photo and extract all fields from the scouting form. The form uses circle-style options (circle the chosen value) and ✓/✗ tallies for shot tracking.

**Form fields to extract:**

Header:
- Match #
- Team #
- Team name
- Alliance (Red / Blue)
- Scout name

Autonomous:
- Start position (Near / Far)
- Moved? (Yes / No)
- Leave pts? (Yes / No)
- Auto shots (count ✓ and ✗ marks separately)

Teleop:
- Teleop shots (count ✓ and ✗ marks separately)
- Shot from (Near / Far / Both)
- Where in near zone (freeform text)
- Cycle speed (Fast / Med / Slow)
- Played defense? (Yes / No)
- Base? (None / Partial / Full)
- Response to defense (freeform text)

Robot Details:
- Drive type (Tank / Mecanum / Other)
- Intake? (Yes / No)

Overall:
- Broke down? (Yes / No)
- Driver skill (Excellent / Good / Needs work)
- Want as alliance partner? (Def / Maybe / No)
- Notes (freeform text)

**Important rules for reading forms:**
- Blank/uncircled fields should be recorded as `null`, NOT defaulted to any value. Treat blank as unknown.
- For shot tallies, ✓ = scored, ✗ = missed. Count each separately.
- Circled options: look for ink loops around the printed text
- Handwritten notes may be hard to read — do your best, note uncertainty with [?]

### Step 3: Update scouting-data.json

Add the extracted data as a new entry in the `scouting` array in `scouting/scouting-data.json`.

### Step 4: Update or create team detail page

Create `scouting/TEAM_NUM.md` if it doesn't exist, or update it with new match data.

**Team detail page format:**

```markdown
---
layout: page
title: "Scouting — TEAM_NUM TEAM_NAME"
---

# TEAM_NUM TEAM_NAME

[← Back to scouting overview](/scouting/)

![TEAM_NUM TEAM_NAME robot](/assets/images/scouting/TEAM_NUM-robot.jpg)
(only if a robot photo exists)

## Robot Details

| | |
| --- | --- |
| Drive type | TYPE |
| Intake | Yes/No — additional details |

## Summary

| Stat | Value |
| ---- | ----- |
| Matches scouted | N |
| Auto (near start) | X/Y shots (~Z pts), leave/no leave (N matches) |
| Auto (far start) | X/Y shots (~Z pts) or "Did not run auto" (N matches) |
| Teleop accuracy | X/Y (Z%), ~W pts avg |
| Leave points | N of M matches |
| Base | status per match or "unknown" if not recorded |
| Cycle speed | Fast/Med/Slow |
| Played defense | Yes/No |

## Scouting Notes

- Compiled notable observations from all forms

## Match Details

### Match N — ALLIANCE Alliance (Won/Lost SCORE–SCORE)

*Scout: NAME*

**Autonomous:** Started near/far. Details. Shots: ✓✗ (X/Y, ~Z pts)

**Teleop:** Shots: ✓✗ (X/Y, ~Z pts). Shot from zone. Cycle: speed. Defense: details. Base: status.

**Notes:** Any notes from the form.
```

**Auto stats should be split by starting position** (near vs far) in the summary. If a team only has auto from one position, show that clearly. If a team chose not to run auto (e.g., let their alliance partner run instead), note that — it's different from not having an auto.

**Scoring points estimation:** Each made shot is ~3 pts. Use this to estimate auto and teleop points from shot counts. Show as approximate (~) since we can't distinguish classified from overflow by observation.

### Step 5: Update the scouting index

Update the team's row in the Teams table in `scouting/index.md`:
- Add a link to the team detail page
- Fill in Avg Auto (with near/far note if only one position), Avg Teleop, Teleop Accuracy, and Notes
- Update rankings if they've changed

## Processing robot photos

### Step 1: Identify the team

Look for the team number on the robot's nameplate or team sign. FTC teams are required to have their number displayed on two sides of the robot.

### Step 2: Crop and save the photo

Crop the photo to focus on the robot, removing excess background. Save to `assets/images/scouting/`:

```
assets/images/scouting/TEAM_NUM-robot.jpg
```

Use JPEG at quality 85 for reasonable file size. Resize if the image is very large (max ~1200px wide).

Create the `assets/images/scouting/` directory if it doesn't exist.

### Step 3: Add to team detail page

Add the photo to the team's scouting page near the top, after the title and back link:

```markdown
![TEAM_NUM TEAM_NAME robot](/assets/images/scouting/TEAM_NUM-robot.jpg)
```

If multiple photos exist for a team, use a photo grid:

```html
<div class="photo-grid">
  <img src="/assets/images/scouting/TEAM_NUM-robot-1.jpg" alt="TEAM_NAME robot">
  <img src="/assets/images/scouting/TEAM_NUM-robot-2.jpg" alt="TEAM_NAME robot">
</div>
```

## Updating rankings and scores

Periodically during the tournament, re-fetch data from FTC Events to update:
- Match scores in the match schedule table
- Rankings in the teams table

Use `web_fetch` to get the latest data from:
- `https://ftc-events.firstinspires.org/{season}/{event_code}/qualifications`
- `https://ftc-events.firstinspires.org/{season}/{event_code}/rankings`

## Batch processing

When given a folder of photos, process all new files:

1. List all files in the folder
2. Compare against already-processed files (tracked in `scouting-data.json` or by filename)
3. For each new file:
   - If it looks like a scouting form (paper with printed form fields), extract scouting data
   - If it looks like a robot photo (robot in a pit or on a field), identify team and save as robot photo
4. Update all affected team pages and the scouting index

## Multi-event data

Scouting data accumulates across events within a season. The same team pages and summary table carry forward from one tournament to the next.

### Data structure

`scouting-data.json` tracks which event each observation came from:

```json
{
  "events": {
    "USARLRAS": {
      "name": "Adventist Robotics Carolina Scrimmage",
      "friendly_id": "2026-nc-scrimmage",
      "date": "2026-03-01"
    },
    "USARLCMP": {
      "name": "Adventist Robotics League Championship",
      "friendly_id": "2026-championship",
      "date": "2026-04-12"
    }
  },
  "scouting": [
    { "event_code": "USARLRAS", "match": 2, "team": 27795, ... },
    { "event_code": "USARLCMP", "match": 1, "team": 27795, ... }
  ]
}
```

### Team detail pages

Group match details by event with headings:

```markdown
## Match Details

### Carolina Scrimmage (March 1, 2026)

#### Match 2 — Red Alliance (Lost 30–39)
...

### Championship (April 12, 2026)

#### Match 1 — Blue Alliance (Won 85–42)
...
```

Summary stats should reflect data across all events, but note if data is from a previous event (robots may have changed).

### Transitioning to a new tournament

When setting up for a new tournament:
1. Keep existing team pages and data — don't delete
2. Update `scouting/index.md` with the new event's match schedule and rankings
3. Add the new event to `scouting-data.json` events section
4. New scouting entries get the new event code
5. Teams table shows current event rankings but scouting data from all events

### Archiving

When data gets too large or a season ends, archive to `scouting/archive/FRIENDLY_ID/`:
- Copy `index.md` and team pages
- The archived version is read-only

## Key conventions

- All scouting pages live in `scouting/`
- Team detail pages are `scouting/TEAM_NUM.md`
- Robot photos go in `assets/images/scouting/TEAM_NUM-robot.jpg`
- Raw data is stored in `scouting/scouting-data.json`
- Blank form fields = `null` in JSON, shown as "unknown" or "not recorded" on pages — never default to a value
- The scouting guide is at `scouting/scouting-guide.md` and the printable form is at `scouting/scouting-form.html` — don't modify these during a tournament
- Shot points are estimated at ~3 pts per made shot (approximate since we can't distinguish classified from overflow by observation)
- The scouting index page (`scouting/index.md`) has a combined Teams table at the top (rankings + scouting data) followed by the match schedule

## Dependencies

```bash
pip install pillow-heif   # for HEIC photo conversion (iPhone photos)
pip install Pillow         # for image processing and cropping
```
