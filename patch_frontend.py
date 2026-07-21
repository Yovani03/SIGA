import os

path = r"frontend\src\pages\ContraRecibos.jsx"
with open(path, "r", encoding="utf-8") as f:
    content = f.read()

# Replace import
content = content.replace("import axios from 'axios';", "import api from '../services/api';\nimport axios from 'axios';")

# Replace api calls
content = content.replace("axios.get('/api/proveedores/')", "api.get('proveedores/')")
content = content.replace("axios.get('/api/talleres/')", "api.get('talleres/')")
content = content.replace("axios.get('/api/contra-recibos/')", "api.get('contra-recibos/')")
content = content.replace("axios.post('/api/contra-recibos/', payload)", "api.post('contra-recibos/', payload)")
content = content.replace("axios.get(`/api/contra-recibos/${id}/pdf/`, { responseType: 'blob' })", "api.get(`contra-recibos/${id}/pdf/`, { responseType: 'blob' })")

with open(path, "w", encoding="utf-8") as f:
    f.write(content)
print("Replaced axios with api in ContraRecibos.jsx")
