import sys
import os
import json
import pandas as pd
from datetime import datetime, timezone

# Inputs
score_file = sys.argv[1]      
metadata_file = sys.argv[2]   
username = sys.argv[3]

leaderboard_csv = "leaderboard/leaderboard.csv"

# Read scores
with open(score_file, "r") as f:
    f1, acc, prec, rec = map(float, f.readline().strip().split(","))

# Read metadata
with open(metadata_file, "r") as f:
    metadata = json.load(f)

team = metadata.get("team", "unknown")
run_id = metadata.get("run_id", "unknown")
type_ = metadata.get("type", "unknown")
model = metadata.get("model", "unknown")
timestamp = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")

# Prepare new row
new_row = {
    "username": username,
    "timestamp_utc": timestamp,
    "team": team,
    "run_id": run_id,
    "type": type_,
    "model": model,
    "macro_f1": f1,
    "accuracy": acc,
    "precision": prec,
    "recall": rec
}

# ---------------------------
# Append to leaderboard.csv (ONLY if username not present)
# ---------------------------
if os.path.exists(leaderboard_csv):
    df = pd.read_csv(leaderboard_csv)

    # 🔎 Check if username already exists
    if username in df["username"].values:
        print(f"⚠️ Username '{username}' already exists in leaderboard. No update performed.")
        sys.exit(0)

    # If not exists → append
    df = pd.concat([df, pd.DataFrame([new_row])], ignore_index=True)

else:
    # Create new leaderboard
    df = pd.DataFrame([new_row])

# Save updated leaderboard
df.to_csv(leaderboard_csv, index=False)

print(f"✅ Leaderboard updated: {leaderboard_csv}")
