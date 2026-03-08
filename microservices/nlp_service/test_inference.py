import pickle
import os

model = pickle.load(open("model.pkl", "rb"))
vectorizer = pickle.load(open("vectorizer.pkl", "rb"))
label_encoder = pickle.load(open("label_encoder.pkl", "rb"))

test_texts = [
    "The bus was driving way too fast on the highway.",
    "The driver was extremely rude to the old lady.",
    "I had to wait 45 minutes for the bus to arrive.",
    "The bus skipped my stop and took a shortcut.",
    "The seats were covered in trash and dust."
]

X = vectorizer.transform(test_texts)
preds = model.predict(X)
categories = label_encoder.inverse_transform(preds)

for text, cat in zip(test_texts, categories):
    print(f"Text: {text}\nPredicted: {cat}\n")
