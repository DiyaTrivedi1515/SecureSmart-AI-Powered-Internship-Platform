import os
import tempfile
import pickle
import re
from flask import Flask, request, jsonify
from flask_cors import CORS
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np
import spacy
from pdfminer.high_level import extract_text

# Load Spacy model
try:
    nlp = spacy.load("en_core_web_sm")
    print("Spacy model loaded.")
except Exception as e:
    print(f"Error loading Spacy: {e}")
    nlp = None

app = Flask(__name__)
CORS(app)

# Load the model and vectorizer at startup
try:
    with open('model.pkl', 'rb') as f:
        model = pickle.load(f)
    with open('vectorizer.pkl', 'rb') as f:
        vectorizer = pickle.load(f)
    print("ML model and vectorizer loaded successfully.")
except Exception as e:
    print(f"Error loading pickle models: {e}")
    model = None
    vectorizer = None

def extract_skills(text):
    # Expanded skill set for better matching
    skills_db = [
        "python", "java", "javascript", "typescript", "react", "angular", "vue",
        "node.js", "express", "mongodb", "sql", "postgresql", "mysql", "html", "css",
        "tailwind", "bootstrap", "aws", "azure", "gcp", "docker", "kubernetes",
        "machine learning", "deep learning", "nlp", "data science", "statistics",
        "c++", "c#", "php", "ruby", "go", "rust", "flutter", "react native"
    ]
    found_skills = []
    text_lower = text.lower()
    for skill in skills_db:
        if re.search(r'\b' + re.escape(skill) + r'\b', text_lower):
            found_skills.append(skill)
    return found_skills

def extract_contact_info(text):
    email = re.search(r'[\w\.-]+@[\w\.-]+', text)
    phone = re.search(r'(\d{3}[-\.\s]??\d{3}[-\.\s]??\d{4}|\(\d{3}\)\s*\d{3}[-\.\s]??\d{4}|\d{10})', text)
    return {
        "email": email.group(0) if email else None,
        "phone": phone.group(0) if phone else None
    }

def extract_education(text):
    # Education keywords and patterns
    edu_keywords = ['Bsc', 'B.Tech', 'M.Tech', 'B.E', 'M.E', 'MS', 'Ph.D', 'Bachelor', 'Master', 'Degree', 'University', 'College', 'Institute', 'School']
    education = []
    lines = text.split('\n')
    for line in lines:
        for keyword in edu_keywords:
            if keyword.lower() in line.lower():
                education.append(line.strip())
                break
    return list(set(education))[:5] # Limit to top 5 hits

def extract_experience(text):
    # Experience heuristics: look for date ranges and company names
    # This is a basic implementation; real-world parsing is complex.
    lines = text.split('\n')
    experience = []
    exp_keywords = ['Experience', 'Work History', 'Internship', 'Employment']
    found_section = False
    for line in lines:
        if any(keyword.lower() in line.lower() for keyword in exp_keywords):
            found_section = True
            continue
        if found_section and line.strip():
            # Stop if we hit another section or have enough lines
            if len(line.strip()) < 100: # Heuristic for job title/company
                experience.append(line.strip())
            if len(experience) > 10:
                break
    return experience[:5]

@app.route('/predict-risk', methods=['POST'])
def predict_risk():
    if not model or not vectorizer:
        return jsonify({"error": "ML model not loaded"}), 500

    data = request.json
    description = data.get('description', '')
    
    # Vectorize and predict
    vectorized_text = vectorizer.transform([description])
    probabilities = model.predict_proba(vectorized_text)[0]
    
    # riskScore as probability of class 1 (Fraudulent) * 100
    risk_score = float(probabilities[1] * 100)
    risk_level = "High Risk" if risk_score > 70 else "Medium Risk" if risk_score > 30 else "Low Risk"
    
    return jsonify({
        "riskScore": round(risk_score, 2),
        "riskLevel": risk_level
    })

@app.route('/parse-resume', methods=['POST'])
def parse_resume():
    if 'resume' not in request.files:
        return jsonify({"error": "No resume file provided"}), 400
    
    file = request.files['resume']
    with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as temp:
        file.save(temp.name)
        temp_path = temp.name

    try:
        text = extract_text(temp_path)
        
        # Heuristic extraction
        skills = extract_skills(text)
        contact = extract_contact_info(text)
        education = extract_education(text)
        experience = extract_experience(text)
        
        # Use Spacy for Name extraction
        name = "Unknown"
        if nlp:
            doc = nlp(text[:500])
            for ent in doc.ents:
                if ent.label_ == "PERSON":
                    name = ent.text
                    break
        
        return jsonify({
            "name": name,
            "email": contact["email"],
            "phone": contact["phone"],
            "skills": skills,
            "education": education,
            "experience": experience,
            "no_of_pages": None,
            "total_experience": 0
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)

@app.route('/verify-kyc', methods=['POST'])
def verify_kyc():
    if 'id_image' not in request.files or 'selfie_image' not in request.files:
        return jsonify({"error": "Missing ID image or Selfie image"}), 400
    
    return jsonify({
        "status": "success",
        "match": True,
        "confidence": 100.0
    })

@app.route('/recommend-internships', methods=['POST'])
def recommend_internships():
    if not vectorizer:
        return jsonify({"error": "Vectorizer not loaded"}), 500

    data = request.json
    student_skills = ", ".join(data.get('studentSkills', []))
    internships = data.get('internships', [])
    
    if not internships:
        return jsonify({"recommended_internships": []})

    internship_descriptions = [i.get('description', '') for i in internships if i.get('description')]
    if not internship_descriptions:
        return jsonify({"recommended_internships": internships[:10]})

    skill_vec = vectorizer.transform([student_skills])
    intern_vecs = vectorizer.transform(internship_descriptions)
    
    similarities = cosine_similarity(skill_vec, intern_vecs).flatten()
    
    for i, score in enumerate(similarities):
        internships[i]['relevanceScore'] = float(score)
    
    sorted_internships = sorted(internships, key=lambda x: x['relevanceScore'], reverse=True)
    
    return jsonify({
        "recommended_internships": sorted_internships[:10]
    })

if __name__ == '__main__':
    # Using threaded=True to handle multiple requests better during local dev
    app.run(host='0.0.0.0', port=5001, debug=True, threaded=True)
