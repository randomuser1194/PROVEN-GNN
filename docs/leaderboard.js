/* * Leaderboard UI for PROVEN-GNN
 * - Fields: Rank, Team, Type, Model, Macro-F1, Accuracy, Precision, Recall, Date
 */

function parseCSV(text) {
  const lines = text.trim().split(/\r?\n/);
  const header = lines[0].split(",");
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    const cols = [];
    let cur = "", inQ = false;
    for (let j = 0; j < lines[i].length; j++) {
      const ch = lines[i][j];
      if (ch === '"') { inQ = !inQ; continue; }
      if (ch === "," && !inQ) { cols.push(cur); cur = ""; continue; }
      cur += ch;
    }
    cols.push(cur);
    const obj = {};
    header.forEach((h, idx) => obj[h] = (cols[idx] ?? "").trim());
    rows.push(obj);
  }
  return rows;
}

function daysAgo(dateStr) {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return Infinity;
  const now = new Date();
  return (now - d) / (1000 * 60 * 60 * 24);
}

const state = {
  rows: [],
  filtered: [],
  sortKey: "macro_f1",
  sortDir: "desc",
  hiddenCols: new Set(),
};

function renderTable() {
  const tbody = document.querySelector("#tbl tbody");
  tbody.innerHTML = "";
  const rows = state.filtered;

  let lastScore = null;
  let lastRank = 0;

  rows.forEach((r, idx) => {
    const tr = document.createElement("tr");
    let rank;

    if (state.sortKey === "macro_f1") {
      const currentScore = parseFloat(r.macro_f1);
      if (currentScore === lastScore) {
        rank = lastRank;
      } else {
        rank = idx + 1;
        lastRank = rank;
        lastScore = currentScore;
      }
    } else {
      rank = idx + 1;
    }

    // UI Structure: Added 'type', Accuracy, Precision, Recall; Removed Notes
    const cells = [
      ["rank", rank],
      ["team", r.team],
      ["type", r.type],
      ["model", r.model],
      ["macro_f1", r.macro_f1],
      ["accuracy", r.accuracy],
      ["precision", r.precision],
      ["recall", r.recall],
      ["timestamp_utc", r.timestamp_utc],
    ];

    cells.forEach(([k, v]) => {
      const td = document.createElement("td");
      td.dataset.key = k;
      td.textContent = v;
      if (k === "rank") td.classList.add("rank");
      if (k === "macro_f1") td.classList.add("score");
      if (state.hiddenCols.has(k)) td.style.display = "none";
      tr.appendChild(td);
    });

    tbody.appendChild(tr);
  });

  document.querySelectorAll("#tbl thead th").forEach(th => {
    const k = th.dataset.key;
    th.style.display = state.hiddenCols.has(k) ? "none" : "";
  });

  document.getElementById("status").textContent =
    rows.length ? `${rows.length} result(s)` : "No results";
}

function applyFilters() {
  const q = document.getElementById("search").value.toLowerCase().trim();
  const model = document.getElementById("modelFilter").value;
  const date = document.getElementById("dateFilter").value;

  let rows = [...state.rows];

  if (model !== "all") {
    rows = rows.filter(r => (r.model || "").toLowerCase() === model);
  }

  if (date !== "all") {
    const maxDays = (date === "last30") ? 30 : 180;
    rows = rows.filter(r => daysAgo(r.timestamp_utc) <= maxDays);
  }

  if (q) {
    rows = rows.filter(r => {
      // Search now includes 'type' field
      const hay = `${r.team} ${r.type} ${r.model} ${r.timestamp_utc}`.toLowerCase();
      return hay.includes(q);
    });
  }

  const k = state.sortKey;
  const dir = state.sortDir === "asc" ? 1 : -1;
  rows.sort((a, b) => {
    let av = a[k], bv = b[k];
    if (["macro_f1", "accuracy", "precision", "recall"].includes(k)) {
      av = parseFloat(av); bv = parseFloat(bv);
      if (isNaN(av)) av = -Infinity;
      if (isNaN(bv)) bv = -Infinity;
      return (av - bv) * dir;
    }
    av = (av ?? "").toString().toLowerCase();
    bv = (bv ?? "").toString().toLowerCase();
    if (av < bv) return -1 * dir;
    if (av > bv) return 1 * dir;
    return 0;
  });

  state.filtered = rows;
  renderTable();
}

function setupColumnToggles() {
  const cols = [
    ["rank", "Rank"],
    ["team", "Team"],
    ["type", "Type"],
    ["model", "Model"],
    ["macro_f1", "Macro-F1 Score"],
    ["accuracy", "Accuracy"],
    ["precision", "Precision"],
    ["recall", "Recall"],
    ["timestamp_utc", "Date (UTC)"],
  ];
  const wrap = document.getElementById("columnToggles");
  wrap.innerHTML = "";
  cols.forEach(([k, label]) => {
    const id = `col_${k}`;
    const lab = document.createElement("label");
    const cb = document.createElement("input");
    cb.type = "checkbox";
    cb.checked = !state.hiddenCols.has(k);
    cb.id = id;
    cb.addEventListener("change", () => {
      if (cb.checked) state.hiddenCols.add(k); // Using Set logic correctly
      else state.hiddenCols.add(k);
      // Logic fix: toggle set
      if (state.hiddenCols.has(k)) {
        if (cb.checked) state.hiddenCols.delete(k);
        else state.hiddenCols.add(k);
      }
      renderTable();
    });
    lab.appendChild(cb);
    const sp = document.createElement("span");
    sp.textContent = label;
    lab.appendChild(sp);
    wrap.appendChild(lab);
  });
}

function setupSorting() {
  document.querySelectorAll("#tbl thead th").forEach(th => {
    th.addEventListener("click", () => {
      const k = th.dataset.key;
      if (!k) return;
      if (state.sortKey === k) {
        state.sortDir = (state.sortDir === "asc") ? "desc" : "asc";
      } else {
        state.sortKey = k;
        state.sortDir = (["macro_f1", "accuracy", "precision", "recall"].includes(k)) ? "desc" : "asc";
      }
      applyFilters();
    });
  });
}

async function main() {
  const status = document.getElementById("status");
  try {
    const res = await fetch("/PROVEN-GNN/leaderboard/leaderboard.csv", { cache: "no-store" });
    const txt = await res.text();
    const rows = parseCSV(txt);

    const cleaned = rows
      .filter(r => r.team)
      .map(r => ({
        timestamp_utc: r.timestamp_utc,
        team: r.team,
        type: r.type || "N/A", // New mapping for 'type'
        model: (r.model || "").toLowerCase(),
        macro_f1: r.macro_f1 || "0.0",
        accuracy: r.accuracy || "0.0",
        precision: r.precision || "0.0",
        recall: r.recall || "0.0"
      }));

    state.rows = cleaned;

    const modelSet = new Set(cleaned.map(r => r.model).filter(Boolean));
    const sel = document.getElementById("modelFilter");
    [...modelSet].sort().forEach(m => {
      const opt = document.createElement("option");
      opt.value = m;
      opt.textContent = m;
      sel.appendChild(opt);
    });

    setupColumnToggles();
    setupSorting();

    document.getElementById("search").addEventListener("input", applyFilters);
    document.getElementById("modelFilter").addEventListener("change", applyFilters);
    document.getElementById("dateFilter").addEventListener("change", applyFilters);

    state.sortKey = "macro_f1";
    state.sortDir = "desc";
    applyFilters();
  } catch (e) {
    status.textContent = "Failed to load leaderboard.";
    console.error(e);
  }
}

main();