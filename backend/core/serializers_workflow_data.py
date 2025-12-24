from rest_framework import serializers
from .models_workflow_data import RapportValidation, EssaiData, PlanificationData


class RapportValidationSerializer(serializers.ModelSerializer):
    class Meta:
        model = RapportValidation
        fields = '__all__'


class EssaiDataSerializer(serializers.ModelSerializer):
    class Meta:
        model = EssaiData
        fields = '__all__'


class PlanificationDataSerializer(serializers.ModelSerializer):
    class Meta:
        model = PlanificationData
        fields = '__all__'
