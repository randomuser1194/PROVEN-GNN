# 📂 Data Folder Overview

This folder contains the datasets used for the **PROVEN-GNN Challenge**. It includes both training and test data, along with metadata for the test graphs.

---

## 📄 Files

### 1️⃣ `train_data.parquet`

Contains the training features and labels for each graph.

**Structure:**

| Column       | Description                                                                               |
| ------------ | ----------------------------------------------------------------------------------------- |
| `id`         | Unique identifier of the graph                                                            |
| `node_feat`  | Node features of the graph (shape `(N, 512)`), where `N` is the number of nodes           |
| `edge_attr`  | Edge features of the graph (shape `(E, 12)`), where `E` is the number of edges            |
| `edge_index` | List of two lists representing the source node IDs and destination node IDs for each edge |
| `target`     | True label: `1` for vulnerable, `0` for non-vulnerable                                    |

---

### 2️⃣ `test_data.parquet`

Contains the test features for each graph.

**Structure:**

| Column       | Description                                                                               |
| ------------ | ----------------------------------------------------------------------------------------- |
| `id`         | Unique identifier of the graph                                                            |
| `node_feat`  | Node features of the graph (shape `(N, 512)`), where `N` is the number of nodes           |
| `edge_attr`  | Edge features of the graph (shape `(E, 12)`), where `E` is the number of edges            |
| `edge_index` | List of two lists representing the source node IDs and destination node IDs for each edge |

> ⚠️ No labels are provided in `test_data.parquet`.

---

### 3️⃣ `test_ids.csv`

Contains the list of graph IDs in the test set.

**Structure:**

| Column | Description                        |
| ------ | ---------------------------------- |
| `id`   | Index of the graph in the test set |
