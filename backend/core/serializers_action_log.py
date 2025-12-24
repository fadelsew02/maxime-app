"""
Serializers pour les logs d'actions
"""

from rest_framework import serializers
from .models_action_log import ActionLog


class ActionLogSerializer(serializers.ModelSerializer):
    """Serializer pour les logs d'actions"""
    
    action_type_display = serializers.CharField(source='get_action_type_display', read_only=True)
    http_method_display = serializers.CharField(source='get_http_method_display', read_only=True)
    
    class Meta:
        model = ActionLog
        fields = [
            'id',
            'user',
            'username',
            'user_role',
            'action_type',
            'action_type_display',
            'action_description',
            'http_method',
            'http_method_display',
            'endpoint',
            'ip_address',
            'request_data',
            'response_status',
            'echantillon_id',
            'echantillon_code',
            'essai_id',
            'essai_type',
            'client_id',
            'client_code',
            'rapport_id',
            'workflow_id',
            'success',
            'error_message',
            'duration_ms',
            'created_at',
        ]
        read_only_fields = fields


class ActionLogStatsSerializer(serializers.Serializer):
    """Serializer pour les statistiques des logs"""
    
    total_actions = serializers.IntegerField()
    actions_by_type = serializers.DictField()
    actions_by_user = serializers.DictField()
    actions_by_day = serializers.DictField()
    success_rate = serializers.FloatField()
    average_duration_ms = serializers.FloatField()
