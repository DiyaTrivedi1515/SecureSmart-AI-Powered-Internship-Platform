# SecureSmart | AI-Powered Internship Platform

![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)
![Express.js](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)
![Python](https://img.shields.io/badge/Python-FFD43B?style=for-the-badge&logo=python&logoColor=blue)
![Flask](https://img.shields.io/badge/flask-%23000.svg?style=for-the-badge&logo=flask&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white)

SecureSmart is a next-generation internship platform engineered to eliminate fake job postings and recruitment scams. By combining a zero-trust KYC verification system with an industrial-grade Machine Learning engine, SecureSmart ensures that students apply to 100% verified opportunities while companies receive highly relevant candidates.

## 🌟 Key Features

* **🛡️ AI Fraud Detection Engine:** Intercepts and scores internship listings for scam anomalies using supervised NLP Machine learning (Scikit-Learn).
* **📄 Smart Resume Parsing:** Upload a PDF and let `pdfminer` and `Spacy` instantly extract your skills, contact info, education, and experience. 
* **🔒 Zero-Trust Architecture:** Unbreakable trust workflows. Students must be manually vetted via Aadhaar cards, and Companies via GST certificates before interacting with the platform.
* **🎯 AI Candidate Matchmaking:** Utilizes Cosine Similarity algorithms to seamlessly match a student's parsed skills directly against verified internship requirements.

## 🛠️ Technology Stack

* **Frontend:** Next.js 16 (App Router), React, Tailwind CSS, Lucide UI
* **Backend API:** Node.js, Express.js, MongoDB (Mongoose ORM), JWT Authentication, Multer (File Handling)
* **ML Microservice:** Python, Flask, Scikit-Learn (TF-IDF Vectorization), Spacy (NER), Pyresparser

## 🚀 Getting Started (Universal Quick-Start)

The project includes an automated PowerShell script that spins up all three microservices seamlessly in parallel for local development.

1. Ensure you have **Node.js**, **Python 3**, and **MongoDB** (running locally on port `27017`) installed.
2. Open PowerShell and navigate to the project directory:
   ```powershell
   cd "path/to/SecureSmart"
   ```
3. Run the automated execution script:
   ```powershell
   .\RESTART_SECURESMART.ps1
   ```
4. The script will securely launch:
   * **ML Service** running on `http://localhost:5001`
   * **Backend API** running on `http://localhost:5000`
   * **Frontend Interface** running on `http://localhost:3000`

5. Navigate to `http://localhost:3000` in your web browser to begin.

## 📂 Project Structure

```
SecureSmart/
├── backend/            # Express endpoints, MongoDB models, JWT Auth logic
├── frontend/           # Next.js 16 App Router UI, Tailwind styling, contexts
├── ml-service/         # Flask API, ML Scikit-Learn models, NLP parsers
└── RESTART_SECURESMART.ps1 # Auto-Launch configuration
```

## 👥 User Roles

* **Admin:** Overlooks the ecosystem. Approves/rejects KYC submissions and overrides flagged internships from the ML engine.
* **Company:** Posts internships mapped against the Fraud Analysis model. Can view and update AI-enriched application statuses.
* **Student:** Uploads their PDF resume for AI parsing and applies to matched, 100% verified internships.
