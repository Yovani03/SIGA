from django.db import migrations

def backfill_variados_zeros(apps, schema_editor):
    VehiculoVariado = apps.get_model('vehiculos', 'VehiculoVariado')
    UnidadTractocamion = apps.get_model('vehiculos', 'UnidadTractocamion')
    CargaCombustible = apps.get_model('combustibles', 'CargaCombustible')
    
    # Update VehiculoVariado
    for v in VehiculoVariado.objects.all():
        ultima_carga = CargaCombustible.objects.filter(
            unidad_variada=v, ignorar_kilometraje=False
        ).order_by('-fecha', '-fecha_registro').first()
        
        if ultima_carga:
            if v.fecha_ultima_carga != ultima_carga.fecha:
                v.fecha_ultima_carga = ultima_carga.fecha
            if ultima_carga.kilometraje is not None and v.ultimo_kilometraje != ultima_carga.kilometraje:
                v.ultimo_kilometraje = ultima_carga.kilometraje
            if ultima_carga.rendimiento is not None and v.ultimo_rendimiento != ultima_carga.rendimiento:
                v.ultimo_rendimiento = ultima_carga.rendimiento
            v.save()

    # Update UnidadTractocamion
    for u in UnidadTractocamion.objects.all():
        ultima_carga = CargaCombustible.objects.filter(
            unidad=u, ignorar_kilometraje=False
        ).order_by('-fecha', '-fecha_registro').first()
        
        if ultima_carga:
            if u.fecha_ultima_carga != ultima_carga.fecha:
                u.fecha_ultima_carga = ultima_carga.fecha
            if ultima_carga.kilometraje is not None and u.ultimo_kilometraje != ultima_carga.kilometraje:
                u.ultimo_kilometraje = ultima_carga.kilometraje
            if ultima_carga.rendimiento is not None and u.ultimo_rendimiento != ultima_carga.rendimiento:
                u.ultimo_rendimiento = ultima_carga.rendimiento
            u.save()

class Migration(migrations.Migration):

    dependencies = [
        ('combustibles', '0010_cleanup_tickets_combustible'),
        ('vehiculos', '0017_vehiculovariado_fecha_ultima_carga_and_more'),
    ]

    operations = [
        migrations.RunPython(backfill_variados_zeros),
    ]
