from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Producto, Ingrediente
from .serializers import ProductoSerializer, IngredienteSerializer


class ProductoViewSet(viewsets.ModelViewSet):
    queryset           = Producto.objects.all()
    serializer_class   = ProductoSerializer

    @action(detail=True, methods=['post'])
    def agregar_ingrediente(self, request, pk=None):
        producto = self.get_object()
        data     = request.data.copy()
        data['producto'] = producto.id

        serializer = IngredienteSerializer(data=data)
        if serializer.is_valid():
            ingrediente        = serializer.save()
            costo_proporcional = (ingrediente.cant_usada / ingrediente.cant_comprada) * ingrediente.precio_compra
            ingrediente.costo_proporcional = costo_proporcional
            ingrediente.save()

            # Actualizar costo total del producto
            total = sum(i.costo_proporcional for i in producto.ingredientes.all())
            producto.costo_total = total
            producto.save()

            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class IngredienteViewSet(viewsets.ModelViewSet):
    queryset         = Ingrediente.objects.all()
    serializer_class = IngredienteSerializer