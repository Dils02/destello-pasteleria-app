from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Pedido
from .serializers import PedidoSerializer


class PedidoViewSet(viewsets.ModelViewSet):
    queryset         = Pedido.objects.all()
    serializer_class = PedidoSerializer

    @action(detail=True, methods=['patch'])
    def cambiar_estado(self, request, pk=None):
        """Cambia el estado de un pedido."""
        pedido = self.get_object()
        estado = request.data.get('estado')

        if estado not in ['pendiente', 'entregado', 'cancelado']:
            return Response(
                {'error': 'Estado inválido'},
                status=status.HTTP_400_BAD_REQUEST
            )

        pedido.estado = estado
        pedido.save()
        return Response(PedidoSerializer(pedido).data)