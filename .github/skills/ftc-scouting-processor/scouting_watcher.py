"""
FTC Scouting Photo Watcher

Polls iCloud for new photos and triggers Copilot CLI to process scouting forms.
Run this as a background process during a tournament.

Usage:
    python scouting_watcher.py

Requires:
    - icloud-credentials.json (git-ignored)
    - pyicloud, pillow-heif, Pillow
    - Copilot CLI (copilot) installed and authenticated
"""

import json
import os
import subprocess
import sys
import time
from datetime import datetime, timezone
from pathlib import Path

REPO_DIR = Path(__file__).parent.parent.parent.parent  # .github/skills/ftc-scouting-processor/ → repo root
INCOMING_DIR = REPO_DIR / "scouting" / "incoming"
STATE_FILE = INCOMING_DIR / "watcher_state.json"
POLL_INTERVAL = 30  # seconds
DEFAULT_PHOTOS_TO_CHECK = 20  # how many recent photos to check each poll


def get_icloud_api():
    """Connect to iCloud. Returns API object."""
    from pyicloud import PyiCloudService

    creds_path = REPO_DIR / "icloud-credentials.json"
    with open(creds_path) as f:
        creds = json.load(f)

    api = PyiCloudService(creds["apple_id"], creds["password"])

    if api.requires_2fa:
        print("2FA required. Requesting code...")
        api.request_2fa_code()
        code = input("Enter 2FA code from your device: ")
        result = api.validate_2fa_code(code)
        if result:
            api.trust_session()
            print("Session trusted!")
        else:
            print("2FA validation failed!")
            sys.exit(1)

    return api


def load_state():
    """Load watcher state (processed filenames, newest processed date)."""
    if STATE_FILE.exists():
        with open(STATE_FILE) as f:
            return json.load(f)
    return {"processed_files": [], "newest_processed": None}


def save_state(state):
    """Save watcher state."""
    INCOMING_DIR.mkdir(parents=True, exist_ok=True)
    with open(STATE_FILE, "w") as f:
        json.dump(state, f, indent=2)


def download_photo(photo, outdir):
    """Download a photo (medium version) and save as JPG."""
    outdir.mkdir(parents=True, exist_ok=True)

    stem = Path(photo.filename).stem

    # Use medium version: ~1500px, already JPEG, half the file size
    if "medium" in photo.versions:
        data = photo.download("medium")
        jpg_path = outdir / (stem + ".jpg")
        if data:
            with open(jpg_path, "wb") as f:
                f.write(data)
            return jpg_path

    # Fallback to original if no medium available
    data = photo.download()
    if not data:
        return None

    filename = photo.filename
    raw_path = outdir / filename
    with open(raw_path, "wb") as f:
        f.write(data)

    # Convert HEIC to JPG if needed
    if filename.upper().endswith(".HEIC"):
        from PIL import Image
        from pillow_heif import register_heif_opener

        register_heif_opener()
        img = Image.open(raw_path)
        jpg_path = outdir / (stem + ".jpg")
        img.save(jpg_path, quality=90)
        os.remove(raw_path)
        return jpg_path

    return raw_path


def process_with_copilot(photo_path):
    """Invoke Copilot CLI to process a scouting photo."""
    prompt = (
        f"Process the photo at {photo_path} using the ftc-scouting-processor skill. "
        f"If it's a scouting form, read the form data, update scouting-data.json, "
        f"update or create the team detail page, update the scouting index, "
        f"then git add, commit, and push the changes. "
        f"If it's a robot photo, identify the team number and save it to the team's scouting page. "
        f"If it's not a scouting form or robot photo, skip it — iCloud may include random personal photos."
    )

    print(f"  Invoking Copilot CLI...")
    result = subprocess.run(
        [
            "copilot",
            "-p", prompt,
            "--autopilot",
            "--allow-all",
        ],
        cwd=str(REPO_DIR),
        timeout=300,  # 5 minute timeout per photo
    )

    if result.returncode == 0:
        print(f"  Copilot finished successfully")
    else:
        print(f"  Copilot returned code {result.returncode}")

    return result.returncode == 0


def main():
    import argparse
    parser = argparse.ArgumentParser(description="FTC Scouting Photo Watcher")
    parser.add_argument("--check", type=int, default=DEFAULT_PHOTOS_TO_CHECK,
                        help="Number of recent photos to check each poll (default: %d)" % DEFAULT_PHOTOS_TO_CHECK)
    args = parser.parse_args()
    photos_to_check = args.check

    print("FTC Scouting Photo Watcher")
    print(f"Repo: {REPO_DIR}")
    print(f"Poll interval: {POLL_INTERVAL}s")
    print(f"Photos to check: {photos_to_check}")
    print(f"Incoming dir: {INCOMING_DIR}")
    print()

    api = get_icloud_api()
    state = load_state()
    processed = set(state["processed_files"])
    newest_processed = state.get("newest_processed")
    if newest_processed:
        newest_processed = datetime.fromisoformat(newest_processed)

    print(f"Already processed: {len(processed)} photos")
    if newest_processed:
        print(f"Skipping photos older than: {newest_processed}")
    print("Polling for new photos... (Ctrl+C to stop)\n")

    while True:
        try:
            all_photos = api.photos.all

            new_photos = []
            for i in range(photos_to_check):
                try:
                    p = all_photos[i]
                except IndexError:
                    break
                # Stop scanning once we hit photos older than our cutoff
                if newest_processed and p.added_date <= newest_processed:
                    break
                if p.filename in processed:
                    continue
                if p.item_type == "movie":
                    processed.add(p.filename)
                    continue
                new_photos.append(p)

            if new_photos:
                print(f"[{datetime.now().strftime('%H:%M:%S')}] Found {len(new_photos)} new photo(s)")

                for photo in reversed(new_photos):  # process oldest-first
                    print(f"  Downloading {photo.filename} ({photo.asset_date})...")
                    local_path = download_photo(photo, INCOMING_DIR)

                    if local_path:
                        success = process_with_copilot(local_path)
                        processed.add(photo.filename)

                        # Update newest processed date
                        if newest_processed is None or photo.added_date > newest_processed:
                            newest_processed = photo.added_date

                        state["processed_files"] = list(processed)
                        state["newest_processed"] = newest_processed.isoformat()
                        save_state(state)

                        if success:
                            print(f"  ✓ Processed {photo.filename}")
                        else:
                            print(f"  ✗ Failed to process {photo.filename}")

                print("Polling for new photos...")
            else:
                # Quiet poll — no output unless something new
                pass

        except KeyboardInterrupt:
            print("\nStopping watcher.")
            break
        except Exception as e:
            print(f"[{datetime.now().strftime('%H:%M:%S')}] Error: {e}")

        time.sleep(POLL_INTERVAL)


if __name__ == "__main__":
    main()
