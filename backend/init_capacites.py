import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from core.models import CapaciteLaboratoire

# Données des capacités
capacites_data = [
    {
        'type_essai': 'AG',
        'capacite_quotidienne': 6,
        'capacite_simultanee': 7,
        'duree_standard_jours': 5
    },
    {
        'type_essai': 'Proctor',
        'capacite_quotidienne': 4,
        'capacite_simultanee': 5,
        'duree_standard_jours': 4
    },
    {
        'type_essai': 'CBR',
        'capacite_quotidienne': 4,
        'capacite_simultanee': 5,
        'duree_standard_jours': 5
    },
    {
        'type_essai': 'Cisaillement',
        'capacite_quotidienne': 3,
        'capacite_simultanee': 4,
        'duree_standard_jours': 8
    },
    {
        'type_essai': 'Oedometre',
        'capacite_quotidienne': 10,
        'capacite_simultanee': 12,
        'duree_standard_jours': 18
    },
]

print("=" * 60)
print("INITIALISATION DES CAPACITÉS LABORATOIRE")
print("=" * 60)
print()

created_count = 0
updated_count = 0

for cap_data in capacites_data:
    capacite, created = CapaciteLaboratoire.objects.update_or_create(
        type_essai=cap_data['type_essai'],
        defaults={
            'capacite_quotidienne': cap_data['capacite_quotidienne'],
            'capacite_simultanee': cap_data['capacite_simultanee'],
            'duree_standard_jours': cap_data['duree_standard_jours']
        }
    )
    
    if created:
        created_count += 1
        print(f"✓ Créé: {capacite.get_type_essai_display()} - {capacite.capacite_quotidienne}/{capacite.capacite_simultanee} - {capacite.duree_standard_jours}j")
    else:
        updated_count += 1
        print(f"↻ Mis à jour: {capacite.get_type_essai_display()} - {capacite.capacite_quotidienne}/{capacite.capacite_simultanee} - {capacite.duree_standard_jours}j")

print()
print("=" * 60)
print(f"RÉSUMÉ: {created_count} créés, {updated_count} mis à jour")
print("=" * 60)
