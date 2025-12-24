from django.core.management.base import BaseCommand
from django.utils import timezone
from core.models import TacheProgrammee, Echantillon, Essai


class Command(BaseCommand):
    help = 'Execute les taches programmees dont la date est arrivee'

    def handle(self, *args, **options):
        now = timezone.now()
        
        taches = TacheProgrammee.objects.filter(
            statut='en_attente',
            date_execution__lte=now
        )
        
        count = 0
        for tache in taches:
            try:
                if tache.type_tache == 'envoi_essai' and tache.essai:
                    essai = tache.essai
                    essai.statut = 'en_cours'
                    essai.date_debut = timezone.now().date()
                    essai.save()
                    
                    if essai.echantillon.statut == 'stockage':
                        essai.echantillon.statut = 'essais'
                        essai.echantillon.save()
                    
                    self.stdout.write(self.style.SUCCESS(
                        f'Essai {essai.type} demarre automatiquement'
                    ))
                
                elif tache.type_tache == 'envoi_traitement' and tache.echantillon:
                    echantillon = tache.echantillon
                    echantillon.statut = 'traitement'
                    echantillon.save()
                    
                    self.stdout.write(self.style.SUCCESS(
                        f'Echantillon {echantillon.code} envoye au traitement'
                    ))
                
                tache.statut = 'executee'
                tache.executed_at = now
                tache.save()
                count += 1
                
            except Exception as e:
                self.stdout.write(self.style.ERROR(f'Erreur: {str(e)}'))
        
        if count > 0:
            self.stdout.write(self.style.SUCCESS(f'{count} tache(s) executee(s)'))
        else:
            self.stdout.write('Aucune tache a executer')
