"""
Script de test pour le système d'enregistrement des actions
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


def test_action_log_creation():
    """Tester la création manuelle d'un log d'action"""
    print("\n" + "="*60)
    print("TEST 1: Création manuelle d'un log d'action")
    print("="*60)
    
    # Récupérer un utilisateur
    user = User.objects.filter(username='operateur_meca').first()
    
    if not user:
        print("❌ Utilisateur 'operateur_meca' non trouvé")
        return False
    
    # Créer un log
    log = ActionLog.log_action(
        user=user,
        action_type='essai_create',
        description='Test de création d\'essai',
        http_method='POST',
        endpoint='/api/essais/',
        success=True,
        duration_ms=150
    )
    
    print(f"✅ Log créé avec succès : {log.id}")
    print(f"   - Utilisateur: {log.username}")
    print(f"   - Action: {log.get_action_type_display()}")
    print(f"   - Description: {log.action_description}")
    print(f"   - Succès: {log.success}")
    
    return True


def test_action_log_query():
    """Tester les requêtes sur les logs"""
    print("\n" + "="*60)
    print("TEST 2: Requêtes sur les logs d'actions")
    print("="*60)
    
    # Total de logs
    total = ActionLog.objects.count()
    print(f"📊 Total de logs: {total}")
    
    # Logs des dernières 24h
    yesterday = timezone.now() - timedelta(days=1)
    recent = ActionLog.objects.filter(created_at__gte=yesterday).count()
    print(f"📊 Logs des dernières 24h: {recent}")
    
    # Logs par type d'action
    print("\n📊 Logs par type d'action:")
    from django.db.models import Count
    action_types = ActionLog.objects.values('action_type').annotate(
        count=Count('id')
    ).order_by('-count')[:5]
    
    for item in action_types:
        action_type = item['action_type']
        count = item['count']
        display = dict(ActionLog.ACTION_TYPES).get(action_type, action_type)
        print(f"   - {display}: {count}")
    
    # Logs par utilisateur
    print("\n📊 Logs par utilisateur (top 5):")
    users = ActionLog.objects.values('username').annotate(
        count=Count('id')
    ).order_by('-count')[:5]
    
    for item in users:
        username = item['username'] or 'Anonyme'
        count = item['count']
        print(f"   - {username}: {count}")
    
    # Taux de succès
    success_count = ActionLog.objects.filter(success=True).count()
    success_rate = (success_count / total * 100) if total > 0 else 0
    print(f"\n📊 Taux de succès: {success_rate:.2f}%")
    
    return True


def test_action_log_filtering():
    """Tester les filtres sur les logs"""
    print("\n" + "="*60)
    print("TEST 3: Filtrage des logs d'actions")
    print("="*60)
    
    # Filtrer par utilisateur
    user = User.objects.filter(username='operateur_meca').first()
    if user:
        user_logs = ActionLog.objects.filter(user=user).count()
        print(f"📊 Logs de l'utilisateur 'operateur_meca': {user_logs}")
    
    # Filtrer par type d'action
    essai_logs = ActionLog.objects.filter(action_type__startswith='essai_').count()
    print(f"📊 Logs liés aux essais: {essai_logs}")
    
    echantillon_logs = ActionLog.objects.filter(action_type__startswith='echantillon_').count()
    print(f"📊 Logs liés aux échantillons: {echantillon_logs}")
    
    # Filtrer par succès/échec
    success_logs = ActionLog.objects.filter(success=True).count()
    error_logs = ActionLog.objects.filter(success=False).count()
    print(f"📊 Logs réussis: {success_logs}")
    print(f"📊 Logs en erreur: {error_logs}")
    
    return True


def test_action_log_stats():
    """Tester les statistiques des logs"""
    print("\n" + "="*60)
    print("TEST 4: Statistiques des logs d'actions")
    print("="*60)
    
    from django.db.models import Avg, Max, Min
    
    # Durée moyenne
    avg_duration = ActionLog.objects.filter(
        duration_ms__isnull=False
    ).aggregate(avg=Avg('duration_ms'))['avg']
    
    if avg_duration:
        print(f"📊 Durée moyenne des actions: {avg_duration:.2f} ms")
    
    # Durée max
    max_duration = ActionLog.objects.filter(
        duration_ms__isnull=False
    ).aggregate(max=Max('duration_ms'))['max']
    
    if max_duration:
        print(f"📊 Durée maximale: {max_duration} ms")
    
    # Actions les plus lentes
    print("\n📊 Actions les plus lentes:")
    slow_actions = ActionLog.objects.filter(
        duration_ms__isnull=False
    ).order_by('-duration_ms')[:5]
    
    for log in slow_actions:
        print(f"   - {log.action_description[:50]}: {log.duration_ms} ms")
    
    return True


def test_action_log_recent():
    """Tester l'affichage des actions récentes"""
    print("\n" + "="*60)
    print("TEST 5: Actions récentes")
    print("="*60)
    
    recent_logs = ActionLog.objects.all().order_by('-created_at')[:10]
    
    print(f"📊 {len(recent_logs)} actions les plus récentes:\n")
    
    for log in recent_logs:
        timestamp = log.created_at.strftime('%Y-%m-%d %H:%M:%S')
        username = log.username or 'Anonyme'
        action = log.get_action_type_display()
        status = '✅' if log.success else '❌'
        
        print(f"{status} [{timestamp}] {username} - {action}")
        if log.action_description:
            print(f"   {log.action_description[:80]}")
    
    return True


def main():
    """Exécuter tous les tests"""
    print("\n" + "="*60)
    print("TESTS DU SYSTEME D'ENREGISTREMENT DES ACTIONS")
    print("="*60)
    
    tests = [
        test_action_log_creation,
        test_action_log_query,
        test_action_log_filtering,
        test_action_log_stats,
        test_action_log_recent,
    ]
    
    results = []
    for test in tests:
        try:
            result = test()
            results.append(result)
        except Exception as e:
            print(f"\n❌ Erreur lors du test: {e}")
            results.append(False)
    
    # Résumé
    print("\n" + "="*60)
    print("RESUME DES TESTS")
    print("="*60)
    
    passed = sum(results)
    total = len(results)
    
    print(f"Tests reussis: {passed}/{total}")
    
    if passed == total:
        print("\nTous les tests sont passes avec succes!")
    else:
        print(f"\n{total - passed} test(s) ont echoue")
    
    print("\n" + "="*60)
    print("UTILISATION")
    print("="*60)
    print("Pour consulter les logs via l'API:")
    print("  GET http://127.0.0.1:8000/api/action-logs/")
    print("\nPour consulter les logs via l'admin:")
    print("  http://127.0.0.1:8000/admin/core/actionlog/")
    print("\nPour obtenir des statistiques:")
    print("  GET http://127.0.0.1:8000/api/action-logs/stats/")
    print("="*60 + "\n")


if __name__ == '__main__':
    main()
