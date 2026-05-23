import os
import requests
import cloudinary
import cloudinary.api
from dotenv import load_dotenv

# Cargar variables de entorno del archivo .env
load_dotenv(os.path.join(os.path.dirname(__file__), '.env'))

# Configurar Cloudinary
cloudinary.config(
    cloud_name=os.getenv('CLOUDINARY_CLOUD_NAME'),
    api_key=os.getenv('CLOUDINARY_API_KEY'),
    api_secret=os.getenv('CLOUDINARY_API_SECRET'),
    secure=True
)

def download_resources(resource_type):
    print(f"Buscando archivos de tipo '{resource_type}' en Cloudinary...")
    next_cursor = None
    count = 0
    
    while True:
        try:
            params = {
                'resource_type': resource_type,
                'max_results': 100
            }
            if next_cursor:
                params['next_cursor'] = next_cursor
                
            res = cloudinary.api.resources(**params)
            resources = res.get('resources', [])
            
            for item in resources:
                url = item['secure_url']
                public_id = item['public_id']
                
                # Reconstruir ruta local a partir del public_id
                filename = public_id
                # Si es un formato conocido y no termina con la extensión, agregársela
                if 'format' in item and item['format'] and not filename.lower().endswith('.' + item['format'].lower()):
                    filename = f"{public_id}.{item['format']}"
                
                local_path = os.path.join('media', filename)
                local_dir = os.path.dirname(local_path)
                
                # Crear los directorios necesarios
                os.makedirs(local_dir, exist_ok=True)
                
                print(f"Descargando: {url} -> {local_path} ...")
                response = requests.get(url)
                if response.status_code == 200:
                    with open(local_path, 'wb') as f:
                        f.write(response.content)
                    count += 1
                else:
                    print(f"Error al descargar {public_id}: Código HTTP {response.status_code}")
                    
            next_cursor = res.get('next_cursor')
            if not next_cursor:
                break
        except Exception as e:
            print(f"Error al procesar recursos de tipo {resource_type}: {e}")
            break
            
    print(f"Total descargado para tipo '{resource_type}': {count} archivos.")

if __name__ == '__main__':
    # Crear carpeta media en el directorio de backend
    os.makedirs('media', exist_ok=True)
    print("Iniciando descarga de respaldos desde Cloudinary...")
    download_resources('image')
    download_resources('raw')
    print("Migración de Cloudinary finalizada.")
