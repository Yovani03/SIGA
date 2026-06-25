import requests

def debug():
    try:
        # Assuming the API is running locally on port 8000
        res = requests.get('http://localhost:8000/api/variados/')
        if res.status_code == 200:
            variados = res.json()
            for v in variados:
                if v.get('numero_economico') == 'H-104':
                    print("Found H-104!")
                    print(v)
        else:
            print("API error:", res.status_code)
    except Exception as e:
        print("Error:", e)

if __name__ == '__main__':
    debug()
