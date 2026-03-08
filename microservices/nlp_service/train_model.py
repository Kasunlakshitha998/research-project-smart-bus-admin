import pandas as pd
import pickle
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import LabelEncoder
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, classification_report
import os

# Load dataset from CSV
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
CSV_PATH = os.path.join(BASE_DIR, "bus_complaints_2000_dataset.csv")

df = pd.read_csv(CSV_PATH)
print(f"Loaded {len(df)} records from {CSV_PATH}")

label_encoder = LabelEncoder()
y = label_encoder.fit_transform(df["category"])

# Split into train / test sets (80/20)
X_train_raw, X_test_raw, y_train, y_test = train_test_split(
    df["complaint_text"], y, test_size=0.2, random_state=42
)

vectorizer = TfidfVectorizer()
X_train = vectorizer.fit_transform(X_train_raw)
X_test  = vectorizer.transform(X_test_raw)

model = LogisticRegression(max_iter=1000)
model.fit(X_train, y_train)

pickle.dump(model, open("model.pkl", "wb"))
pickle.dump(vectorizer, open("vectorizer.pkl", "wb"))
pickle.dump(label_encoder, open("label_encoder.pkl", "wb"))

# --- Accuracy Metrics ---
y_pred = model.predict(X_test)
acc = accuracy_score(y_test, y_pred)
print(f"\n✅ Model trained and saved!")
print(f"📊 Test Accuracy : {acc * 100:.2f}%")
print("\n📋 Classification Report:")
print(classification_report(y_test, y_pred, target_names=label_encoder.classes_))
