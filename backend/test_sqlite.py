import sqlite3
conn = sqlite3.connect('db.sqlite3')
try:
    print('COUNT:', conn.execute('SELECT count(*) FROM facturacion_solicitudcambiofactura;').fetchone()[0])
except Exception as e:
    print('ERROR:', e)
