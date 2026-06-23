from django.db import migrations

def clear_tickets(apps, schema_editor):
    Ticket = apps.get_model('facturacion', 'Ticket')

    # Delete auto-generated tickets from Fuel loads
    Ticket.objects.filter(descripcion__startswith='Auto-generado por Factura FUEL-').delete()
    Ticket.objects.filter(categoria='Combustible').delete()

def reverse_clear_tickets(apps, schema_editor):
    pass

class Migration(migrations.Migration):

    dependencies = [
        ('combustibles', '0009_cleanup_combustibles_data'),
    ]

    operations = [
        migrations.RunPython(clear_tickets, reverse_clear_tickets),
    ]
