import joblib
import pandas as pd
import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
model_path = os.path.join(BASE_DIR, "trend_model.pkl")

model = joblib.load(model_path)

sample_data = pd.DataFrame([{
    "Current_Stock": 20,
    "Daily_Sales": 18,
    "Review_Score": 85,
    "Event_Score": 70,
    "Branch_Demand_Score": 80
}])

prediction = model.predict(sample_data)

print("Prediction:", prediction[0])