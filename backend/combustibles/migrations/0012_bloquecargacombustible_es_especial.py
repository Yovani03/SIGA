# Generated manually

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('combustibles', '0011_backfill_variados_zeros'),
    ]

    operations = [
        migrations.AddField(
            model_name='bloquecargacombustible',
            name='es_especial',
            field=models.BooleanField(default=False, verbose_name='¿Es Bloque Especial?'),
        ),
    ]
