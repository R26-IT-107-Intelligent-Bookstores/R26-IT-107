import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
import joblib

df = pd.read_csv("dataset.csv")

feature_columns = [
    "Current_Stock",
    "Daily_Sales",
    "Review_Score",
    "Event_Score",
    "Branch_Demand_Score"
]

# convert features to numbers
for col in feature_columns:
    df[col] = pd.to_numeric(df[col], errors="coerce")

# remove rows where label is empty
df = df.dropna(subset=["Trend_Label"])

# fill empty feature values with 0
df[feature_columns] = df[feature_columns].fillna(0)

X = df[feature_columns]
y = df["Trend_Label"]

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

model = RandomForestClassifier(random_state=42)
model.fit(X_train, y_train)

joblib.dump(model, "trend_model.pkl")

print("Model trained and saved successfully!")