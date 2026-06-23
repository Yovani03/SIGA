from combustibles.models import CargaCombustible
from facturacion.models import Factura

cargas = CargaCombustible.objects.filter(unidad_variada__isnull=False)
count=0
for c in cargas:
  folio = f'FUEL-{c.fecha}-{c.unidad_variada.numero_economico}-{c.id}'
  f = Factura.objects.filter(folio=folio).first()
  if f and not f.variado:
    f.variado = c.unidad_variada
    f.save()
    count+=1
    
print('Fixed Facturas:', count)
