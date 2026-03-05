from flask import Flask, request, jsonify
import pickle
import os
import re

app = Flask(__name__)

# Load saved files
MODEL_PATH = "model.pkl"
VECTORIZER_PATH = "vectorizer.pkl"
LABEL_ENCODER_PATH = "label_encoder.pkl"

def load_models():
    if os.path.exists(MODEL_PATH) and os.path.exists(VECTORIZER_PATH) and os.path.exists(LABEL_ENCODER_PATH):
        model = pickle.load(open(MODEL_PATH, "rb"))
        vectorizer = pickle.load(open(VECTORIZER_PATH, "rb"))
        label_encoder = pickle.load(open(LABEL_ENCODER_PATH, "rb"))
        return model, vectorizer, label_encoder
    return None, None, None

model, vectorizer, label_encoder = load_models()

@app.route("/predict", methods=["POST"])
def predict():
    global model, vectorizer, label_encoder
    if not model:
        # Try to reload in case they were just generated
        model, vectorizer, label_encoder = load_models()
        if not model:
            return jsonify({"error": "Models not trained yet"}), 500

    data = request.json
    text = data.get("complaint_text")
    if not text:
        return jsonify({"error": "No complaint_text provided"}), 400

    vector = vectorizer.transform([text])
    prediction = model.predict(vector)
    category = label_encoder.inverse_transform(prediction)

    return jsonify({
        "predicted_category": category[0]
    })

@app.route("/validate-telemetry", methods=["POST"])
def validate_telemetry():
    data = request.json
    if not data:
        return jsonify({"error": "No data provided"}), 400
        
    category = data.get('category')
    speed = data.get('speed', 0)
    
    is_verified = False
    reason = "No evidence found"
    
    if category == "Over Speeding":
        speed_limit = 60 
        if speed > speed_limit:
            is_verified = True
            reason = f"Bus speed of {speed}km/h exceeded limit of {speed_limit}km/h"
        else:
            is_verified = False
            reason = f"Bus speed of {speed}km/h was within limit of {speed_limit}km/h"
            
    return jsonify({
        "verified": is_verified,
        "reason": reason,
        "new_status": "Verified" if is_verified else "Rejected"
    })

if __name__ == "__main__":
    port = int(os.environ.get('PORT', 5002))
    app.run(host='0.0.0.0', port=port)
