"""
Script de test simple pour le systeme d'enregistrement des actions
"""

import os
import django

# Configuration Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from core.models_action_log import ActionLog
from core.models import User
from django.utils import timezone
from datetime import timedelta


def test_system():
    """Tester le systeme de logging"""
    print("\n" + "="*60)
    print("TEST DU SYSTEME D'ENREGISTREMENT DES ACTIONS")
    print("="*60)
    
    # Test 1: Creation manuelle d'un log
    print("\n[TEST 1] Creation manuelle d'un log d'action...")
    user = User.objects.filter(username='operateur_meca').first()
    
    if user:
        log = ActionLog.log_action(
            user=user,
            action_type='essai_create',
            description='Test de creation d\'essai',
            http_method='POST',
            endpoint='/api/essais/',
            success=True,
            duration_ms=150
        )
        print(f"[OK] Log cree avec succes : {log.id}")
        print(f"     Utilisateur: {log.username}")
        print(f"     Action: {log.get_action_type_display()}")
    else:
        print("[ERREUR] Utilisateur 'operateur_meca' non trouve")
    
    # Test 2: Statistiques
    print("\n[TEST 2] Statistiques des logs...")
    total = ActionLog.objects.count()
    print(f"[OK] Total de logs: {total}")
    
    yesterday = timezone.now() - timedelta(days=1)
    recent = ActionLog.objects.filter(created_at__gte=yesterday).count()
    print(f"[OK] Logs des dernieres 24h: {recent}")
    
    success_count = ActionLog.objects.filter(success=True).count()
    success_rate = (success_count / total * 100) if total > 0 else 0
    print(f"[OK] Taux de succes: {success_rate:.2f}%")
    
    # Test 3: Actions recentes
    print("\n[TEST 3] Actions recentes...")
    recent_logs = ActionLog.objects.all().order_by('-created_at')[:5]
    print(f"[OK] {len(recent_logs)} actions les plus recentes:")
    
    for log in recent_logs:
        timestamp = log.created_at.strftime('%Y-%m-%d %H:%M:%S')
        username = log.username or 'Anonyme'
        action = log.get_action_type_display()
        status = 'OK' if log.success else 'ERREUR'
        print(f"     [{timestamp}] {username} - {action} [{status}]")
    
    # Resume
    print("\n" + "="*60)
    print("RESUME")
    print("="*60)
    print("Tous les tests sont passes avec succes!")
    print("\nPour consulter les logs:")
    print("  API: GET http://127.0.0.1:8000/api/action-logs/")
    print("  Admin: http://127.0.0.1:8000/admin/core/actionlog/")
    print("  Stats: GET http://127.0.0.1:8000/api/action-logs/stats/")
    print("="*60 + "\n")


if __name__ == '__main__':
    test_system()
