import joblib
import pandas as pd
import numpy as np
from flask import Flask, request, jsonify
import json
import os

app = Flask(__name__)
MODEL_PATH = os.path.join(os.path.dirname(__file__), 'xgboost_passenger_model.joblib')
ROUTES_PATH = os.path.join(os.path.dirname(__file__), 'bus_routes.json')

# Load the trained model
try:
    model = joblib.load(MODEL_PATH)
    print("Model loaded successfully.")
except Exception as e:
    print(f"Error loading model: {e}")
    model = None

# Load route categories
try:
    with open(ROUTES_PATH, 'r') as f:
        routes_data = json.load(f)
    route_id_training_categories = sorted(list(set([str(r['route_id']) for r in routes_data])))
    print(f"Loaded {len(route_id_training_categories)} unique route categories.")
except Exception as e:
    print(f"Error loading routes: {e}")
    route_id_training_categories = []

# Define the FEATURES list (must match the training features exactly)
FEATURES = [
    "Route_ID",
    "day_of_week",
    "is_weekend",
    "week_of_year",
    "month",
    "day_of_month",
    "day_of_year",
    "is_holiday",
    "lag_1",
    "lag_2",
    "lag_3",
    "lag_7",
    "lag_14",
    "rolling_mean_7",
    "rolling_std_7",
]

@app.route('/predict', methods=['POST'])
def predict():
    if model is None:
        return jsonify({'error': 'Model not loaded'}), 500
        
    try:
        data = request.get_json(force=True)
        if not data:
            return jsonify({'error': 'No data provided'}), 400

        # Handle multiple items or single item
        if isinstance(data, dict):
            data = [data]
            
        # Convert input data to DataFrame
        input_df = pd.DataFrame(data)

        # Ensure 'Route_ID' is categorical with the same categories as training
        if 'Route_ID' in input_df.columns:
            input_df['Route_ID'] = input_df['Route_ID'].astype(str)
            input_df['Route_ID'] = pd.Categorical(input_df['Route_ID'], categories=route_id_training_categories)

        # Ensure all FEATURES are present and in correct order
        missing_cols = set(FEATURES) - set(input_df.columns)
        for c in missing_cols:
            input_df[c] = 0  
        
        input_df = input_df[FEATURES]

        print(input_df)

        # Make prediction
        predictions = model.predict(input_df)

        # Return results
        results = [float(p) for p in predictions]
        return jsonify({'predictions': results})

    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5001))
    app.run(host='0.0.0.0', port=port, debug=True)
