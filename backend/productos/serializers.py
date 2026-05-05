from rest_framework import serializers
from .models import Producto, Ingrediente


class IngredienteSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Ingrediente
        fields = '__all__'


class ProductoSerializer(serializers.ModelSerializer):
    ingredientes = IngredienteSerializer(many=True, read_only=True)

    class Meta:
        model  = Producto
        fields = '__all__'