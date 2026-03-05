import pandas as pd
import pickle
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import LabelEncoder
import os

# Sample dataset
data = {
    "complaint_text": [
        "Bus was driving too fast",
        "Driver was rude",
        "Bus arrived late",
        "Bus changed route",
        "Seats were dirty",
        "The driver was driving dangerously and exceeding limits.",
        "The driver was very rude to the passengers.",
        "Driver was talking on the phone while driving.",
        "The bus is 30 minutes late to the station.",
        "I've been waiting for an hour for the bus.",
        "The bus took a different route than usual.",
        "Driver missed the planned stops and went elsewhere.",
        "The seats are very dirty and there is trash everywhere.",
        "The bus smelled bad and was not cleaned."
    ],
    "category": [
        "Over Speeding",
        "Driver Behavior",
        "Delay",
        "Route Deviation",
        "Cleanliness",
        "Over Speeding",
        "Driver Behavior",
        "Driver Behavior",
        "Delay",
        "Delay",
        "Route Deviation",
        "Route Deviation",
        "Cleanliness",
        "Cleanliness"
    ]
}

df = pd.DataFrame(data)

vectorizer = TfidfVectorizer()
X = vectorizer.fit_transform(df["complaint_text"])

label_encoder = LabelEncoder()
y = label_encoder.fit_transform(df["category"])

model = LogisticRegression()
model.fit(X, y)

pickle.dump(model, open("model.pkl", "wb"))
pickle.dump(vectorizer, open("vectorizer.pkl", "wb"))
pickle.dump(label_encoder, open("label_encoder.pkl", "wb"))

print("Model trained and saved!")
