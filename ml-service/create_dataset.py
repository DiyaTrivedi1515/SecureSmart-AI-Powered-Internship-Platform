import pandas as pd
import csv

# Realistic headers from the Kaggle "Real or Fake" dataset
headers = [
    'job_id', 'title', 'location', 'department', 'salary_range', 
    'company_profile', 'description', 'requirements', 'benefits', 
    'telecommuting', 'has_company_logo', 'has_questions', 
    'employment_type', 'required_experience', 'required_education', 
    'industry', 'function', 'fraudulent'
]

# Sample data rows
# 0 = Real, 1 = Fake
data = [
    [1, "Software Engineering Intern", "US, NY, New York", "Engineering", "50000-70000", "We are a tech startup building the future.", "Build amazing web apps with React and Node.js. Work with a team of experts.", "CS degree, React knowledge.", "Health insurance, Free snacks.", 0, 1, 1, "Full-time", "Internship", "Bachelor's Degree", "Computer Software", "Engineering", 0],
    [2, "Data Science Intern", "US, CA, San Francisco", "Data", "", "Innovating the world with AI.", "Analyze big data using Python and Spark. Create predictive models.", "Python, SQL, Statistics.", "Remote work possible.", 1, 1, 0, "Part-time", "Internship", "Master's Degree", "Tech", "Data Science", 0],
    [3, "URGENT: Earn $5000/week from home!", "US, TX, Austin", "Direct", "200000-300000", "Making money easy.", "No experience required. Earn fast cash today! Limited spots available. JOIN NOW!", "Internet connection.", "Unlimited money.", 1, 0, 0, "Contract", "No Experience", "Unspecified", "Financial Services", "General", 1],
    [4, "Marketing Intern", "IN, MH, Mumbai", "Marketing", "10k-20k", "Growing global brand.", "Help grow our brand on social media. Manage content and engagement.", "Communication skills, Canva.", "Training certificates.", 0, 1, 1, "Internship", "Internship", "High School", "Marketing", "Social Media", 0],
    [5, "Get PAID to test products! Fast cash", "US, FL, Miami", "Testing", "", "Product testing company.", "Fast cash, easy work. Apply now!!! No background check needed. Quick approval.", "Smartphone.", "Free products.", 0, 0, 0, "Full-time", "No Experience", "Unspecified", "Retail", "Testing", 1],
    [6, "Frontend Developer", "UK, LND, London", "Web", "40k-60k", "Award winning agency.", "Join our team to create beautiful user interfaces using modern CSS and React.", "HTML, CSS, JavaScript.", "Gym membership.", 0, 1, 1, "Full-time", "Entry level", "Associate Degree", "Agency", "Frontend", 0],
    [7, "Financial Analyst Intern", "CA, ON, Toronto", "Finance", "", "Leading bank.", "Support our investment team with research. Analyze market trends.", "Economic degree, Excel.", "Networking events.", 0, 1, 1, "Internship", "Internship", "Bachelor's Degree", "Banking", "Finance", 0],
    [8, "WORK FROM HOME - Guaranteed income!", "US, WA, Seattle", "Wealth", "100k+", "Wealth management experts.", "No interview needed. Join us for a life changing opportunity! Unlimited growth.", "Drive.", "Independence.", 1, 0, 0, "Contract", "No Experience", "Unspecified", "Management", "Wealth", 1],
    [9, "Backend Developer Intern", "DE, BE, Berlin", "Platform", "2000-3000", "Scaling European tech.", "Work on scalable microservices in Java. Learn Spring Boot and Docker.", "Java, SQL.", "Public transport pass.", 0, 1, 1, "Internship", "Internship", "Bachelor's Degree", "E-commerce", "Backend", 0],
    [10, "High-paying internship selected!", "PH, MN, Manila", "Admin", "", "Processing agency.", "Congratulations! You've been selected for a high-paying internship. Pay $100 for processing fee.", "Payment.", "Job offer.", 0, 0, 0, "Full-time", "Internship", "High School", "Service", "Admin", 1],
]

# Generate more rows to simulate a larger dataset
expanded_data = data * 50 # 500 rows

with open('fake_job_postings.csv', 'w', newline='', encoding='utf-8') as f:
    writer = csv.writer(f)
    writer.writerow(headers)
    writer.writerows(expanded_data)

print("Created synthetic 'fake_job_postings.csv' with Kaggle structure.")
