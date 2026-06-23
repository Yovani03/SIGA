from django.db import migrations

def clear_combustibles_data(apps, schema_editor):
    CargaCombustible = apps.get_model('combustibles', 'CargaCombustible')
    BloqueCargaCombustible = apps.get_model('combustibles', 'BloqueCargaCombustible')
    Factura = apps.get_model('facturacion', 'Factura')

    # Delete all fuel loads and blocks
    CargaCombustible.objects.all().delete()
    BloqueCargaCombustible.objects.all().delete()

    # Delete all auto-generated and manual fuel facturas
    Factura.objects.filter(folio__startswith='FUEL-').delete()
    Factura.objects.filter(categoria='Combustible').delete()

def reverse_clear_combustibles_data(apps, schema_editor):
    pass

class Migration(migrations.Migration):

    dependencies = [
        ('combustibles', '0008_bloquecargacombustible_cargacombustible_bloque'),
        ('facturacion', '0019_solicitudcambiofactura'),
    ]

    operations = [
        migrations.RunPython(clear_combustibles_data, reverse_clear_combustibles_data),
    ]
