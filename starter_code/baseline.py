import pandas as pd
import numpy as np
from sklearn.metrics import f1_score
from sklearn . model_selection import train_test_split
import torch
import torch.nn.functional as F
from torch_geometric.data import Data
from torch_geometric.loader import DataLoader
from torch_geometric.nn import GCNConv, global_mean_pool

class GCN(torch.nn.Module):
    def __init__(self, in_channels, hidden_channels, num_classes):
        super(GCN, self).__init__()
        self.conv1 = GCNConv(in_channels, hidden_channels)
        self.conv2 = GCNConv(hidden_channels, hidden_channels)
        self.lin = torch.nn.Linear(hidden_channels, num_classes)
    
    def forward(self, x, edge_index, batch):
        x = self.conv1(x, edge_index)
        x = F.relu(x)
        x = self.conv2(x, edge_index)
        x = global_mean_pool(x, batch)  
        x = self.lin(x)
        return x
    
def build_dataloader(df, batch_size=32, shuffle=False, has_labels=True):
    graph_list = []

    for _, row in df.iterrows():
        x = torch.tensor(np.vstack(row["node_feat"]).astype(np.float32))
        edge_index = torch.tensor(np.vstack(row["edge_index"]).astype(np.int64))
        edge_attr = torch.tensor(np.vstack(row["edge_attr"]).astype(np.float32))

        if has_labels:
            y = torch.tensor(row["y"], dtype=torch.long)
            data = Data(
                x=x,
                edge_index=edge_index,
                edge_attr=edge_attr,
                y=y,
            )
        else:
            data = Data(
                x=x,
                edge_index=edge_index,
                edge_attr=edge_attr,
            )

        graph_list.append(data)

    return DataLoader(graph_list, batch_size=batch_size, shuffle=shuffle,
    )

# Loading data 
dataset = pd.read_parquet('../data/public/train_data.parquet')
dataset = dataset.rename(columns={"label": "y"})
train, val = train_test_split(dataset, test_size=0.2, random_state=42, shuffle=True) 
test = pd.read_parquet('../data/public/train_data.parquet')

# Building dataloaders   
train_loader = build_dataloader(train, batch_size=32, shuffle=True, has_labels=True)
val_loader = build_dataloader(val, batch_size=32, shuffle=False, has_labels=True)
test_loader = build_dataloader(test, batch_size=32, shuffle=False, has_labels=False)

# Initiating the model
num_node_features = 527
num_classes = 2  

model = GCN(num_node_features, hidden_channels=64, num_classes=num_classes)
optimizer = torch.optim.Adam(model.parameters(), lr=0.01)
criterion = torch.nn.CrossEntropyLoss()

# Training
n_epoch = 100
model.train()
for epoch in range(n_epoch):  
    total_loss = 0
    for batch in train_loader:
        optimizer.zero_grad()
        out = model(batch.x, batch.edge_index, batch.batch)
        loss = criterion(out, batch.y)
        loss.backward()
        optimizer.step()
        total_loss += loss.item()
    print(f"Epoch {epoch+1}, Loss: {total_loss/len(train_loader):.4f}")
    
    
# Validation
model.eval()
y_true, y_pred = [], []

with torch.no_grad():
    for batch in val_loader:
        out = model(batch.x, batch.edge_index, batch.batch)
        pred = out.argmax(dim=1)

        y_true.extend(batch.y.cpu().numpy())
        y_pred.extend(pred.cpu().numpy())
        
    score = f1_score(y_true, y_pred, average ='macro')
    
print (f'Validation F1 Score : {score:.4f}')


# Testing
test_preds =[]
with torch.no_grad():
    for batch in test_loader:
        out = model(batch.x, batch.edge_index, batch.batch)
        pred = out.argmax(dim=1)
        test_preds.extend(pred.cpu().numpy())
        
pd.DataFrame({'id': test['id'], 'y_pred': test_preds}).to_csv('predictions.csv', index=False)