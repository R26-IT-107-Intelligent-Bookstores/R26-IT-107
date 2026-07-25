"""
train_model_v2.py
Trains the Random Forest demand classifier on the NEW monthly,
branch-wise TrendStock dataset (built from a full year of daily
sales across 51 real books x 3 branches).

Drop this into: trendstock-backend/ml-service/
(reads ../monthly_trend_dataset.csv -- place the CSV in trendstock-backend/)
"""
import pandas as pd
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report
import joblib

# ---- 1. Load dataset ----
df = pd.read_csv("../monthly_trend_dataset.csv")

# ---- 2. Feature columns (same as before, now on real branch-wise data) ----
feature_columns = [
    "Current_Stock",
    "Daily_Sales",
    "Rating",
    "View_Count",
    "Search_Count",
    "Branch_Demand_Score",
]

for col in feature_columns:
    df[col] = pd.to_numeric(df[col], errors="coerce")

df = df.dropna(subset=feature_columns + ["Trend_Label"])

X = df[feature_columns]
y = df["Trend_Label"]

# ---- 3. Train/test split ----
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)

# ---- 4. Train model ----
model = RandomForestClassifier(n_estimators=100, random_state=42)
model.fit(X_train, y_train)

print("Model Classes:")
print(model.classes_)
print()

# ---- 5. Evaluate ----
predictions = model.predict(X_test)
accuracy = accuracy_score(y_test, predictions)
print(f"Hold-out Test Accuracy: {accuracy * 100:.2f}%")
print()
print("Classification Report:")
print(classification_report(y_test, predictions))

# ---- 6. Cross-validation (more robust, stated in methodology as validation strategy) ----
cv_scores = cross_val_score(model, X, y, cv=5)
print(f"5-Fold Cross-Validation Accuracy: {cv_scores.mean() * 100:.2f}% "
      f"(+/- {cv_scores.std() * 100:.2f}%)")

# ---- 7. Save model ----
joblib.dump(model, "trend_model.pkl")
print("\nModel saved as trend_model.pkl")
