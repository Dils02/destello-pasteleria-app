from django.db import models

class Venta(models.Model):
    fecha            = models.CharField(max_length=20)
    producto         = models.CharField(max_length=200)
    categoria        = models.CharField(max_length=100)
    unidades         = models.IntegerField()
    precio_venta     = models.FloatField()
    ingreso_total    = models.FloatField()
    costo_produccion = models.FloatField()
    ganancia         = models.FloatField()
    vendedor         = models.CharField(max_length=200)
    notas            = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"{self.producto} - {self.fecha}"

    class Meta:
        db_table = 'ventas'