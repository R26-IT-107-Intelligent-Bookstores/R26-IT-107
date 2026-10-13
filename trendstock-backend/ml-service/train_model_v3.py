# TrendStock - predict NEXT month's demand (Low / Moderate / High) with a Random Forest
import os
import numpy as np
import pandas as pd
import joblib
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score
from sklearn.model_selection import GroupShuffleSplit

folder = os.path.dirname(os.path.abspath(__file__))

# 1. Load monthly sales (units sold per book, per branch, per month)
df = pd.read_csv(os.path.join(folder, "monthly_sales.csv"))
df["month"] = pd.PeriodIndex(df["month"], freq="M")
totals = df.groupby("month").units.sum()
if totals.iloc[-1] < 0.5 * totals.median():      # last month is incomplete, remove it
    df = df[df.month != totals.index[-1]]

# 2. Give every book-branch a row for every month (no sales = 0 units)
months = pd.period_range(df.month.min(), df.month.max(), freq="M")
info = df.groupby(["book_id", "branch"])[["category", "price", "rating"]].first().reset_index()
idx = pd.MultiIndex.from_product([info.set_index(["book_id", "branch"]).index, months], names=["bb", "month"])
data = pd.DataFrame(index=idx).reset_index()
data[["book_id", "branch"]] = pd.DataFrame(data.bb.tolist(), index=data.index)
data = data.drop(columns="bb").merge(info, on=["book_id", "branch"])
data = data.merge(df[["book_id", "branch", "month", "units"]], on=["book_id", "branch", "month"], how="left")
data["units"] = data.units.fillna(0)
data = data.sort_values(["book_id", "branch", "month"]).reset_index(drop=True)

# 3. Demand label for each month: top 15% = High (2), next 45% = Moderate (1), rest = Low (0)
def make_label(u):
    return pd.Series(np.where(u >= u.quantile(0.85), 2, np.where(u >= u.quantile(0.40), 1, 0)), index=u.index)
data["label"] = data.groupby("month").units.transform(make_label)

# 4. Inputs = this month and the past. Answer to predict = NEXT month's label
g = data.groupby(["book_id", "branch"])
data["last_month"] = g.units.shift(1)
data["two_months_ago"] = g.units.shift(2)
data["avg_3_months"] = g.units.transform(lambda s: s.rolling(3, min_periods=1).mean())
data["change"] = data.units - data.last_month
data["month_number"] = data.month.dt.month
data["next_label"] = g.label.shift(-1)
data = data.dropna(subset=["last_month", "two_months_ago", "next_label"]).copy()
data["next_label"] = data.next_label.astype(int)
top = data.category.value_counts().head(12).index
data["cat"] = data.category.where(data.category.isin(top), "Other")

inputs = ["units", "last_month", "two_months_ago", "avg_3_months", "change", "month_number", "price", "rating", "branch", "cat"]
X = pd.get_dummies(data[inputs], columns=["branch", "cat"])
y = data.next_label.values

# 5. Train on 80% of the books, test on 20% of books the model has never seen
train, test = next(GroupShuffleSplit(n_splits=1, test_size=0.2, random_state=42).split(X, y, data.book_id.values))
model = RandomForestClassifier(n_estimators=300, min_samples_leaf=3, class_weight="balanced", random_state=42, n_jobs=-1)
model.fit(X.iloc[train], y[train])

accuracy = accuracy_score(y[test], model.predict(X.iloc[test]))
print(f"Model accuracy: {accuracy*100:.1f}%")

joblib.dump({"model": model, "columns": list(X.columns)}, os.path.join(folder, "model_v3.joblib"))