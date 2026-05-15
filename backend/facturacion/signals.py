
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from .models import Factura, Ticket

@receiver(post_delete, sender=Factura)
def release_ticket_on_delete(sender, instance, **kwargs):
    """Si se borra una factura, el ticket vinculado vuelve a estar pendiente."""
    if instance.ticket:
        instance.ticket.convertido_en_factura = False
        instance.ticket.save()

@receiver(post_save, sender=Factura)
def update_ticket_on_save(sender, instance, created, **kwargs):
    """Asegura que el ticket vinculado esté marcado como facturado."""
    if instance.ticket:
        instance.ticket.convertido_en_factura = True
        instance.ticket.save()
