# 📝 Submission Guidelines

This folder is where you place your submission files for the **PROVEN-GNN Challenge**.

---

## 1️⃣ Required Files

### 1. `predictions.csv`

Your model predictions must follow this format:

```csv
id,y_pred
0,1
1,0
2,1
...
```

* `id` — integer index of the test function
* `y_pred` — 1 if vulnerable, 0 if non-vulnerable

---

### 2. `metadata.json`

Contains metadata about your submission:

```json
{
  "team": "example_team",
  "run_id": "example_run_id",
  "type": "human",   // must be "human", "llm-only", or "human+llm"
  "model": "GAT",
  "notes": "Additional notes"
}
```

---

## 2️⃣ How to Submit

1. Place your `predictions.csv` and `metadata.json` in this `submissions/` folder
2. Commit and push your changes to your forked repository
3. Create a **Pull Request** to the main repository
4. GitHub Actions will automatically evaluate your submission
5. Your results will be posted as a comment and added to the leaderboard
