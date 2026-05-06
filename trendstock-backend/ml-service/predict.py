import joblib
import pandas as pd

model = joblib.load("trend_model.pkl")

sample_data = pd.DataFrame([{
    "Current Stock": 10,
    "Daily Sales": 18,
    "Rating": 4.6,
    "View Count": 500,
    "Search Count": 120,
    "Branch Demand Score": 95
}])

prediction = model.predict(sample_data)

print(prediction[0])