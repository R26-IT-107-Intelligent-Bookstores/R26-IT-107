import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score
import joblib

# Load dataset
df = pd.read_csv("../books_dataset.csv")

# Features
feature_columns = [
    "Current Stock",
    "Daily Sales",
    "Rating",
    "View Count",
    "Search Count",
    "Branch Demand Score"
]

# Convert columns to numeric
for col in feature_columns:
    df[col] = pd.to_numeric(df[col], errors="coerce")

# Remove missing values
df = df.dropna(subset=feature_columns + ["Trend Label"])

# X and y
X = df[feature_columns]
y = df["Trend Label"]

# Split dataset
X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.2,
    random_state=42
)

# Train model
model = RandomForestClassifier(
    n_estimators=100,
    random_state=42
)

model.fit(X_train, y_train)

# Predict
predictions = model.predict(X_test)

# Accuracy
accuracy = accuracy_score(y_test, predictions)

print(f"Model Accuracy: {accuracy * 100:.2f}%")

# Save model
joblib.dump(model, "trend_model.pkl")

print("Model trained and saved successfully!")