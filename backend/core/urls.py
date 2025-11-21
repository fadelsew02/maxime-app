"""
URLs pour l'application core
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from .views import (
    UserViewSet, ClientViewSet, EchantillonViewSet, EssaiViewSet,
    NotificationViewSet, ValidationHistoryViewSet, DashboardViewSet
)

router = DefaultRouter()
router.register(r'users', UserViewSet, basename='user')
router.register(r'clients', ClientViewSet, basename='client')
router.register(r'echantillons', EchantillonViewSet, basename='echantillon')
router.register(r'essais', EssaiViewSet, basename='essai')
router.register(r'notifications', NotificationViewSet, basename='notification')
router.register(r'validations', ValidationHistoryViewSet, basename='validation')
router.register(r'dashboard', DashboardViewSet, basename='dashboard')

urlpatterns = [
    # JWT Authentication
    path('auth/login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    
    # API routes
    path('', include(router.urls)),
]
