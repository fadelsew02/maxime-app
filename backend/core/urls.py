"""
URLs pour l'application core
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from .views import (
    UserViewSet, ClientViewSet, EchantillonViewSet, EssaiViewSet,
    NotificationViewSet, ValidationHistoryViewSet, DashboardViewSet,
    RapportViewSet, PlanificationEssaiViewSet, CapaciteLaboratoireViewSet,
    RapportMarketingViewSet, WorkflowValidationViewSet
)
from .views_storage import DataStorageViewSet
from .views_action_log import ActionLogViewSet
from .views_workflow_data import RapportValidationViewSet, EssaiDataViewSet, PlanificationDataViewSet

router = DefaultRouter()
router.register(r'users', UserViewSet, basename='user')
router.register(r'clients', ClientViewSet, basename='client')
router.register(r'echantillons', EchantillonViewSet, basename='echantillon')
router.register(r'essais', EssaiViewSet, basename='essai')
router.register(r'notifications', NotificationViewSet, basename='notification')
router.register(r'validations', ValidationHistoryViewSet, basename='validation')
router.register(r'dashboard', DashboardViewSet, basename='dashboard')
router.register(r'rapports', RapportViewSet, basename='rapport')
router.register(r'planifications', PlanificationEssaiViewSet, basename='planification')
router.register(r'capacites', CapaciteLaboratoireViewSet, basename='capacite')
router.register(r'rapports-marketing', RapportMarketingViewSet, basename='rapport-marketing')
router.register(r'workflows', WorkflowValidationViewSet, basename='workflow')
router.register(r'storage', DataStorageViewSet, basename='storage')
router.register(r'action-logs', ActionLogViewSet, basename='action-log')
router.register(r'rapport-validations', RapportValidationViewSet, basename='rapport-validation')
router.register(r'essai-data', EssaiDataViewSet, basename='essai-data')
router.register(r'planification-data', PlanificationDataViewSet, basename='planification-data')

urlpatterns = [
    # JWT Authentication
    path('auth/login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    
    # API routes
    path('', include(router.urls)),
]
