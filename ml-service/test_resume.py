import requests

with open('dummy.pdf', 'wb') as f:
    f.write(b'%PDF-1.4\n1 0 obj <</Type /Catalog /Pages 2 0 R>> endobj\n')

try:
    with open('dummy.pdf', 'rb') as f:
        r = requests.post('http://localhost:5001/parse-resume', files={'resume': f})
        print('Parse Resume:', r.status_code, r.text)
except Exception as e:
    print('Parse failed:', e)
