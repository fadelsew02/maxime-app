"""
Views pour les logs d'actions
"""

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Count, Avg, Q
from django.utils import timezone
from datetime import timedelta
from .models_action_log import ActionLog
from .serializers_action_log import ActionLogSerializer, ActionLogStatsSerializer


class ActionLogViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet pour consulter les logs d'actions
    Lecture seule - les logs sont créés automatiquement par le middleware
    """
    
    queryset = ActionLog.objects.all()
    serializer_class = ActionLogSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Filtrer les logs selon les paramètres de requête"""
        queryset = ActionLog.objects.all()
        
        # Filtrer par utilisateur
        user_id = self.request.query_params.get('user_id')
        if user_id:
            queryset = queryset.filter(user_id=user_id)
        
        username = self.request.query_params.get('username')
        if username:
            queryset = queryset.filter(username__icontains=username)
        
        # Filtrer par type d'action
        action_type = self.request.query_params.get('action_type')
        if action_type:
            queryset = queryset.filter(action_type=action_type)
        
        # Filtrer par méthode HTTP
        http_method = self.request.query_params.get('http_method')
        if http_method:
            queryset = queryset.filter(http_method=http_method)
        
        # Filtrer par succès/échec
        success = self.request.query_params.get('success')
        if success is not None:
            queryset = queryset.filter(success=success.lower() == 'true')
        
        # Filtrer par échantillon
        echantillon_id = self.request.query_params.get('echantillon_id')
        if echantillon_id:
            queryset = queryset.filter(echantillon_id=echantillon_id)
        
        echantillon_code = self.request.query_params.get('echantillon_code')
        if echantillon_code:
            queryset = queryset.filter(echantillon_code__icontains=echantillon_code)
        
        # Filtrer par essai
        essai_id = self.request.query_params.get('essai_id')
        if essai_id:
            queryset = queryset.filter(essai_id=essai_id)
        
        # Filtrer par client
        client_id = self.request.query_params.get('client_id')
        if client_id:
            queryset = queryset.filter(client_id=client_id)
        
        # Filtrer par période
        date_from = self.request.query_params.get('date_from')
        if date_from:
            queryset = queryset.filter(created_at__gte=date_from)
        
        date_to = self.request.query_params.get('date_to')
        if date_to:
            queryset = queryset.filter(created_at__lte=date_to)
        
        # Filtrer par période prédéfinie
        period = self.request.query_params.get('period')
        if period:
            now = timezone.now()
            if period == 'today':
                queryset = queryset.filter(created_at__date=now.date())
            elif period == 'week':
                queryset = queryset.filter(created_at__gte=now - timedelta(days=7))
            elif period == 'month':
                queryset = queryset.filter(created_at__gte=now - timedelta(days=30))
            elif period == 'year':
                queryset = queryset.filter(created_at__gte=now - timedelta(days=365))
        
        return queryset.order_by('-created_at')
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Obtenir des statistiques sur les logs d'actions"""
        
        # Appliquer les mêmes filtres que get_queryset
        queryset = self.get_queryset()
        
        # Total d'actions
        total_actions = queryset.count()
        
        # Actions par type
        actions_by_type = dict(
            queryset.values('action_type')
            .annotate(count=Count('id'))
            .values_list('action_type', 'count')
        )
        
        # Actions par utilisateur
        actions_by_user = dict(
            queryset.values('username')
            .annotate(count=Count('id'))
            .order_by('-count')[:10]
            .values_list('username', 'count')
        )
        
        # Actions par jour (derniers 7 jours)
        now = timezone.now()
        actions_by_day = {}
        for i in range(7):
            day = (now - timedelta(days=i)).date()
            count = queryset.filter(created_at__date=day).count()
            actions_by_day[str(day)] = count
        
        # Taux de succès
        success_count = queryset.filter(success=True).count()
        success_rate = (success_count / total_actions * 100) if total_actions > 0 else 0
        
        # Durée moyenne
        avg_duration = queryset.filter(duration_ms__isnull=False).aggregate(
            avg=Avg('duration_ms')
        )['avg'] or 0
        
        stats_data = {
            'total_actions': total_actions,
            'actions_by_type': actions_by_type,
            'actions_by_user': actions_by_user,
            'actions_by_day': actions_by_day,
            'success_rate': round(success_rate, 2),
            'average_duration_ms': round(avg_duration, 2),
        }
        
        serializer = ActionLogStatsSerializer(stats_data)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def recent(self, request):
        """Obtenir les actions récentes (dernières 24h)"""
        now = timezone.now()
        yesterday = now - timedelta(days=1)
        
        recent_logs = self.get_queryset().filter(created_at__gte=yesterday)[:50]
        serializer = self.get_serializer(recent_logs, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def by_user(self, request):
        """Obtenir les actions d'un utilisateur spécifique"""
        user_id = request.query_params.get('user_id')
        if not user_id:
            return Response(
                {'error': 'user_id parameter is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        logs = self.get_queryset().filter(user_id=user_id)[:100]
        serializer = self.get_serializer(logs, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def by_echantillon(self, request):
        """Obtenir toutes les actions liées à un échantillon"""
        echantillon_id = request.query_params.get('echantillon_id')
        if not echantillon_id:
            return Response(
                {'error': 'echantillon_id parameter is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        logs = self.get_queryset().filter(echantillon_id=echantillon_id)
        serializer = self.get_serializer(logs, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def errors(self, request):
        """Obtenir les actions qui ont échoué"""
        error_logs = self.get_queryset().filter(success=False)[:100]
        serializer = self.get_serializer(error_logs, many=True)
        return Response(serializer.data)
