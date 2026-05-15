from django.db import models
from vehiculos.models import UnidadTractocamion
from mantenimiento.models import Taller

class Producto(models.Model):
    CATEGORIAS = [
        ('Mantenimiento', 'Mantenimiento'),
        ('Combustible', 'Combustible'),
        ('Operativo', 'Operativo'),
        ('Administrativo', 'Administrativo'),
        ('Refacciones', 'Refacciones'),
        ('Llantas', 'Llantas'),
        ('Otro', 'Otro'),
    ]
    nombre = models.CharField(max_length=100, unique=True, verbose_name="Nombre del Producto/Servicio")
    categoria = models.CharField(max_length=50, choices=CATEGORIAS, default='Otro', verbose_name="Categoría")
    descripcion = models.TextField(blank=True, null=True, verbose_name="Descripción")

    class Meta:
        verbose_name = "Producto/Servicio"
        verbose_name_plural = "Productos/Servicios"
        ordering = ['nombre']

    def __str__(self):
        return f"{self.nombre} ({self.categoria})"

class Ticket(models.Model):
    CATEGORIAS = [
        ('Mantenimiento y Refacciones', 'Mantenimiento y Refacciones'),
        ('Administrativo', 'Administrativo'),
        ('Operativo', 'Operativo'),
        ('Llantas', 'Llantas'),
        ('Combustible', 'Combustible'),
        ('Otro', 'Otro'),
    ]

    folio_interno = models.CharField(max_length=50, unique=True, verbose_name="Folio Interno", blank=True)
    folio_emision = models.CharField(max_length=50, verbose_name="Folio de Emisión", blank=True, null=True)
    fecha = models.DateField(verbose_name="Fecha del Ticket")
    monto = models.DecimalField(max_digits=12, decimal_places=2, verbose_name="Monto")
    descripcion = models.CharField(max_length=255, blank=True, null=True, verbose_name="Descripción Breve")
    categoria = models.CharField(max_length=50, choices=CATEGORIAS, default='Otro', verbose_name="Categoría")
    taller = models.ForeignKey(
        Taller,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='tickets_facturacion',
        verbose_name="Taller/Origen"
    )
    proveedor = models.ForeignKey(
        'proveedores.Proveedor',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='tickets_facturacion',
        verbose_name="Proveedor"
    )
    unidad = models.ForeignKey(
        UnidadTractocamion, 
        on_delete=models.SET_NULL, 
        null=True,
        blank=True,
        related_name='tickets',
        verbose_name="Unidad Principal"
    )
    unidades = models.ManyToManyField(
        UnidadTractocamion,
        blank=True,
        related_name='tickets_multiples',
        verbose_name="Unidades Relacionadas"
    )
    producto = models.ForeignKey(
        Producto,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='tickets',
        verbose_name="Producto/Servicio"
    )
    archivo_escaneado = models.FileField(upload_to='tickets/%Y/%m/', verbose_name="Documento Escaneado", null=True, blank=True)
    fecha_registro = models.DateTimeField(auto_now_add=True)
    convertido_en_factura = models.BooleanField(default=False, verbose_name="¿Facturado?")

    class Meta:
        verbose_name = "Ticket"
        verbose_name_plural = "Tickets"
        ordering = ['-fecha']

    def save(self, *args, **kwargs):
        if not self.folio_interno:
            last_ticket = Ticket.objects.all().order_by('id').last()
            if not last_ticket:
                self.folio_interno = 'TK-00001'
            else:
                try:
                    last_folio = last_ticket.folio_interno
                    if '-' in last_folio:
                        last_number = int(last_folio.split('-')[1])
                        self.folio_interno = f'TK-{(last_number + 1):05d}'
                    else:
                        self.folio_interno = f'TK-{(last_ticket.id + 1):05d}'
                except (ValueError, IndexError):
                    self.folio_interno = f'TK-{(last_ticket.id + 1):05d}'
        
        if not self.folio_emision:
            self.folio_emision = self.folio_interno
            
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.folio_interno}"

class Factura(models.Model):
    fecha = models.DateField(verbose_name="Fecha de Factura")
    monto = models.DecimalField(max_digits=12, decimal_places=2, verbose_name="Monto")
    folio = models.CharField(max_length=50, unique=True, verbose_name="Folio de Factura")
    descripcion = models.CharField(max_length=255, blank=True, null=True, verbose_name="Descripción Breve")
    categoria = models.CharField(max_length=50, choices=Ticket.CATEGORIAS, default='Otro', verbose_name="Categoría")
    taller = models.ForeignKey(
        Taller,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='facturas_facturacion',
        verbose_name="Taller/Origen"
    )
    proveedor = models.ForeignKey(
        'proveedores.Proveedor',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='facturas',
        verbose_name="Proveedor"
    )
    rfc_emisor = models.CharField(max_length=13, blank=True, null=True, verbose_name="RFC Emisor")
    razon_social_emisor = models.CharField(max_length=255, blank=True, null=True, verbose_name="Razón Social Emisor")
    unidad = models.ForeignKey(
        UnidadTractocamion, 
        on_delete=models.SET_NULL, 
        null=True,
        blank=True,
        related_name='facturas',
        verbose_name="Unidad Principal"
    )
    unidades = models.ManyToManyField(
        UnidadTractocamion,
        blank=True,
        related_name='facturas_multiples',
        verbose_name="Unidades Relacionadas"
    )
    producto = models.ForeignKey(
        Producto,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='facturas',
        verbose_name="Producto/Servicio"
    )
    ticket = models.OneToOneField(
        Ticket,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='factura_vinculada',
        verbose_name="Ticket Relacionado"
    )
    archivo_escaneado = models.FileField(upload_to='facturas/%Y/%m/', verbose_name="Documento Escaneado", null=True, blank=True)
    iva_aplicado = models.BooleanField(default=False, verbose_name="IVA Aplicado")
    fecha_registro = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Factura"
        verbose_name_plural = "Facturas"
        ordering = ['-fecha']

    def save(self, *args, **kwargs):
        is_new = self.pk is None
        if is_new and not self.ticket:
            # Auto-generar ticket si no se proporcionó uno
            from django.core.files.base import ContentFile
            
            nuevo_ticket = Ticket.objects.create(
                fecha=self.fecha,
                monto=self.monto,
                descripcion=f"Auto-generado por Factura {self.folio}. {self.descripcion or ''}"[:255],
                categoria=self.categoria,
                taller=self.taller,
                proveedor=self.proveedor,
                unidad=self.unidad,
                producto=self.producto,
                convertido_en_factura=True
            )
            # Vincular unidades ManyToMany
            if self.pk:
                nuevo_ticket.unidades.set(self.unidades.all())
            
            self.ticket = nuevo_ticket

        if self.ticket:
            self.ticket.convertido_en_factura = True
            self.ticket.save()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.folio} - {self.unidad}"

class TicketDetalleUnidad(models.Model):
    ticket = models.ForeignKey(Ticket, on_delete=models.CASCADE, related_name='detalles_unidades')
    unidad = models.ForeignKey(UnidadTractocamion, on_delete=models.CASCADE)
    monto = models.DecimalField(max_digits=12, decimal_places=2)

    class Meta:
        verbose_name = "Detalle de Gasto por Unidad (Ticket)"
        verbose_name_plural = "Detalles de Gasto por Unidades (Tickets)"
        unique_together = ('ticket', 'unidad')

class FacturaDetalleUnidad(models.Model):
    factura = models.ForeignKey(Factura, on_delete=models.CASCADE, related_name='detalles_unidades')
    unidad = models.ForeignKey(UnidadTractocamion, on_delete=models.CASCADE)
    monto = models.DecimalField(max_digits=12, decimal_places=2)

    class Meta:
        verbose_name = "Detalle de Gasto por Unidad (Factura)"
        verbose_name_plural = "Detalles de Gasto por Unidades (Facturas)"
        unique_together = ('factura', 'unidad')
