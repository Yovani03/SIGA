import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()
url = os.getenv('DATABASE_URL')
print("URL:", url)

try:
    conn = psycopg2.connect(url)
    cur = conn.cursor()
    cur.execute("SELECT count(*) FROM facturacion_solicitudcambiofactura;")
    print("COUNT:", cur.fetchone()[0])
    
    cur.execute("SELECT id, estado, cambios_propuestos FROM facturacion_solicitudcambiofactura;")
    print("RECORDS:", cur.fetchall())
except Exception as e:
    print("ERROR:", e)
