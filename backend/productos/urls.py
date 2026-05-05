from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ProductoViewSet, IngredienteViewSet

router = DefaultRouter()
router.register(r'productos',    ProductoViewSet)
router.register(r'ingredientes', IngredienteViewSet)

urlpatterns = [
    path('', include(router.urls)),
]