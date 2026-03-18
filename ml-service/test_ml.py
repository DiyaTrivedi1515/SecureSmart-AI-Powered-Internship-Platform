import requests

def test_predict():
    try:
        r = requests.post('http://localhost:5001/predict-risk', json={'description': 'Fake job over here'})
        print("Predict:", r.status_code, r.text)
    except Exception as e:
        print("Predict failed:", e)

def test_recommend():
    try:
        r = requests.post('http://localhost:5001/recommend-internships', json={'studentSkills': ['Python'], 'internships': [{'id': 1, 'description': 'Python dev'}]})
        print("Recommend:", r.status_code, r.text)
    except Exception as e:
        print("Recommend failed:", e)

test_predict()
test_recommend()
