from django.db import models

class Producto(models.Model):
    nombre      = models.CharField(max_length=200, unique=True)
    costo_total = models.FloatField(default=0)

    def __str__(self):
        return self.nombre

    class Meta:
        db_table = 'productos'


class Ingrediente(models.Model):
    producto           = models.ForeignKey(Producto, on_delete=models.CASCADE, related_name='ingredientes')
    nombre             = models.CharField(max_length=200)
    unidad             = models.CharField(max_length=50)
    cant_comprada      = models.FloatField()
    precio_compra      = models.FloatField()
    cant_usada         = models.FloatField()
    costo_proporcional = models.FloatField()

    def __str__(self):
        return f"{self.nombre} ({self.producto.nombre})"

    class Meta:
        db_table = 'ingredientes'