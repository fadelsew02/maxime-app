"""
URLs pour le module scheduler
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import (
    RessourceViewSet, ContrainteTemporelleViewSet,
    PlanningViewSet, AffectationEssaiViewSet
)

router = DefaultRouter()
router.register(r'ressources', RessourceViewSet, basename='ressource')
router.register(r'contraintes', ContrainteTemporelleViewSet, basename='contrainte')
router.register(r'plannings', PlanningViewSet, basename='planning')
router.register(r'affectations', AffectationEssaiViewSet, basename='affectation')

urlpatterns = [
    path('', include(router.urls)),
]
