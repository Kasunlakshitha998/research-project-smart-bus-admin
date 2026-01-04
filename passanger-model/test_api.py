import requests
import json

url = "http://localhost:5001/predict"
data = [
    {
        "Route_ID": "100",
        "day_of_week": 2,
        "is_weekend": 0,
        "week_of_year": 45,
        "month": 11,
        "day_of_month": 6,
        "day_of_year": 310,
        "is_holiday": 0,
        "lag_1": 1800,
        "lag_2": 1750,
        "lag_3": 1700,
        "lag_7": 1650,
        "lag_14": 1600,
        "rolling_mean_7": 1720.5,
        "rolling_std_7": 150.2
    }
]

try:
    response = requests.post(url, json=data)
    print(f"Status Code: {response.status_code}")
    print(f"Response JSON: {json.dumps(response.json(), indent=2)}")
except Exception as e:
    print(f"Error: {e}")
