from rest_framework import serializers
from .models_archive import RapportArchive


class RapportArchiveSerializer(serializers.ModelSerializer):
    envoye_par_nom = serializers.SerializerMethodField()
    
    class Meta:
        model = RapportArchive
        fields = '__all__'
    
    def get_envoye_par_nom(self, obj):
        if obj.envoye_par:
            return f"{obj.envoye_par.first_name} {obj.envoye_par.last_name}"
        return "-"
