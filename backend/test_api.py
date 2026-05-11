import requests

def check_api():
    base_url = "http://localhost:8000/api/"
    endpoints = ["operadores/", "viajes/", "vehiculos/"]
    
    for ep in endpoints:
        try:
            r = requests.get(base_url + ep)
            print(f"Endpoint {ep}: Status {r.status_code}")
            if r.status_code != 200:
                print(r.text)
        except Exception as e:
            print(f"Error connecting to {ep}: {e}")

if __name__ == "__main__":
    check_api()
