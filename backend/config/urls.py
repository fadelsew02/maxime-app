"""
URL configuration for SNERTP Laboratory Management System.
"""

from django.contrib import admin
from django.urls import path, include, re_path
from django.conf import settings
from django.conf.urls.static import static
from rest_framework import permissions
from drf_yasg.views import get_schema_view
from drf_yasg import openapi
from core.frontend_views import frontend_view, catch_all_view

schema_view = get_schema_view(
    openapi.Info(
        title="SNERTP Laboratory API",
        default_version='v1',
        description="API pour le système de gestion d'échantillons du laboratoire SNERTP",
        contact=openapi.Contact(email="contact@snertp.ci"),
    ),
    public=True,
    permission_classes=(permissions.AllowAny,),
)

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('core.urls')),
    path('api/scheduler/', include('scheduler.urls')),
    
    # Swagger documentation
    path('swagger/', schema_view.with_ui('swagger', cache_timeout=0), name='schema-swagger-ui'),
    path('redoc/', schema_view.with_ui('redoc', cache_timeout=0), name='schema-redoc'),
    
    # Frontend routes
    path('', frontend_view, name='frontend'),
    re_path(r'^(?!api|admin|swagger|redoc|static|media).*$', catch_all_view, name='catch-all'),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
