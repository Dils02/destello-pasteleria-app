from django.db import models

class Pedido(models.Model):
    ESTADOS = [
        ('pendiente',  'Pendiente'),
        ('entregado',  'Entregado'),
        ('cancelado',  'Cancelado'),
    ]

    nombre_cliente  = models.CharField(max_length=200)
    fecha_entrega   = models.CharField(max_length=20)
    fecha_creacion  = models.DateTimeField(auto_now_add=True)
    producto        = models.CharField(max_length=200)
    cantidad        = models.IntegerField()
    receta          = models.CharField(max_length=200, blank=True, null=True)
    notas           = models.TextField(blank=True, null=True)
    estado          = models.CharField(max_length=20, choices=ESTADOS, default='pendiente')

    def __str__(self):
        return f"{self.nombre_cliente} — {self.producto} ({self.estado})"

    class Meta:
        db_table = 'pedidos'
        ordering = ['fecha_entrega']