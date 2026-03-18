import pandas as pd
import numpy as np
import pickle
import os
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split

# Path to the dataset
csv_path = 'fake_job_postings.csv'

if not os.path.exists(csv_path):
    print(f"Error: {csv_path} not found. Please run create_dataset.py first or provide the Kaggle dataset.")
    exit(1)

# Load the dataset
print(f"Loading dataset from {csv_path}...")
df = pd.read_csv(csv_path)

# Prepare the data
# We combine 'company_profile', 'description', and 'requirements' for training
df['text'] = df['company_profile'].fillna('') + " " + df['description'].fillna('') + " " + df['requirements'].fillna('')

# TF-IDF Vectorization
print("Vectorizing text data...")
vectorizer = TfidfVectorizer(stop_words='english', max_features=5000)
X = vectorizer.fit_transform(df['text'])
y = df['fraudulent']

# Train-test split for basic evaluation
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# Train Logistic Regression model
print("Training model...")
model = LogisticRegression(max_iter=1000)
model.fit(X_train, y_train)

# Evaluate
score = model.score(X_test, y_test)
print(f"Model trained with accuracy: {round(score * 100, 2)}%")

# Save the model and vectorizer
with open('model.pkl', 'wb') as f:
    pickle.dump(model, f)

with open('vectorizer.pkl', 'wb') as f:
    pickle.dump(vectorizer, f)

print("Model and Vectorizer saved successfully.")
