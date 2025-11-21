"""
Moteur d'optimisation pour la planification par contraintes
Utilise OR-Tools de Google pour résoudre le problème d'ordonnancement
"""

from ortools.sat.python import cp_model
from datetime import datetime, timedelta
from typing import List, Dict, Tuple
import time

from core.models import Essai, Echantillon
from .models import Ressource, ContrainteTemporelle, Planning, AffectationEssai


class SchedulerOptimizer:
    """
    Optimiseur de planning basé sur la programmation par contraintes
    """
    
    def __init__(self, date_debut, date_fin, section=None):
        """
        Initialise l'optimiseur
        
        Args:
            date_debut: Date de début du planning
            date_fin: Date de fin du planning
            section: Section spécifique ('route' ou 'mecanique') ou None pour toutes
        """
        self.date_debut = date_debut
        self.date_fin = date_fin
        self.section = section
        self.model = cp_model.CpModel()
        self.solver = cp_model.CpSolver()
        
        # Dictionnaires pour stocker les variables
        self.task_starts = {}
        self.task_ends = {}
        self.task_intervals = {}
        self.task_presences = {}
        
        # Paramètres
        self.horizon = (date_fin - date_debut).days
        self.max_capacity_route = 5  # Nombre max d'essais simultanés en route
        self.max_capacity_mecanique = 3  # Nombre max d'essais simultanés en mécanique
        
    def get_essais_a_planifier(self) -> List[Essai]:
        """Récupère les essais à planifier"""
        queryset = Essai.objects.filter(statut='attente')
        
        if self.section:
            queryset = queryset.filter(section=self.section)
        
        return list(queryset.select_related('echantillon'))
    
    def get_contraintes_temporelles(self) -> List[ContrainteTemporelle]:
        """Récupère les contraintes temporelles actives"""
        return list(ContrainteTemporelle.objects.filter(
            active=True,
            date_debut__lte=self.date_fin,
            date_fin__gte=self.date_debut
        ))
    
    def get_jours_fermes(self) -> List[int]:
        """Retourne les jours fermés (weekends, jours fériés)"""
        jours_fermes = []
        current_date = self.date_debut
        
        while current_date <= self.date_fin:
            # Samedi (5) et Dimanche (6)
            if current_date.weekday() in [5, 6]:
                jour_index = (current_date - self.date_debut).days
                jours_fermes.append(jour_index)
            current_date += timedelta(days=1)
        
        # Ajouter les jours fermés des contraintes
        for contrainte in self.get_contraintes_temporelles():
            if contrainte.type == 'jour_ferme':
                current = contrainte.date_debut
                while current <= contrainte.date_fin:
                    jour_index = (current - self.date_debut).days
                    if 0 <= jour_index < self.horizon and jour_index not in jours_fermes:
                        jours_fermes.append(jour_index)
                    current += timedelta(days=1)
        
        return jours_fermes
    
    def calculer_priorite(self, essai: Essai) -> int:
        """
        Calcule la priorité d'un essai
        
        Plus le score est élevé, plus l'essai est prioritaire
        """
        priorite = 0
        echantillon = essai.echantillon
        
        # Échantillons urgents
        if echantillon.priorite == 'urgente':
            priorite += 100
        
        # Ancienneté de l'échantillon
        jours_attente = (datetime.now().date() - echantillon.date_reception).days
        priorite += jours_attente * 2
        
        # Type d'essai (certains essais plus rapides peuvent être priorisés)
        if essai.type in ['Proctor']:  # Essais courts
            priorite += 10
        
        # Essais déjà rejetés (à refaire en priorité)
        if essai.was_resumed:
            priorite += 50
        
        return priorite
    
    def optimize(self) -> Dict:
        """
        Lance l'optimisation du planning
        
        Returns:
            Dictionnaire contenant les résultats de l'optimisation
        """
        start_time = time.time()
        
        # 1. Récupérer les essais à planifier
        essais = self.get_essais_a_planifier()
        
        if not essais:
            return {
                'success': True,
                'message': 'Aucun essai à planifier',
                'affectations': [],
                'temps_calcul': 0
            }
        
        # 2. Créer les variables pour chaque essai
        jours_fermes = self.get_jours_fermes()
        
        for essai in essais:
            # Variables de début et fin de tâche
            start_var = self.model.NewIntVar(0, self.horizon, f'start_{essai.id}')
            end_var = self.model.NewIntVar(0, self.horizon, f'end_{essai.id}')
            duration = essai.duree_estimee
            
            # Créer l'intervalle de la tâche
            interval_var = self.model.NewIntervalVar(
                start_var, duration, end_var, f'interval_{essai.id}'
            )
            
            self.task_starts[essai.id] = start_var
            self.task_ends[essai.id] = end_var
            self.task_intervals[essai.id] = interval_var
            
            # Contrainte: ne pas planifier sur les jours fermés
            for jour_ferme in jours_fermes:
                # Si l'essai commence à jour_ferme, interdire
                self.model.Add(start_var != jour_ferme)
                
                # Si l'essai chevauche un jour fermé, interdire
                for d in range(duration):
                    self.model.Add(start_var + d != jour_ferme)
        
        # 3. Contraintes de capacité (nombre max d'essais simultanés)
        essais_route = [e for e in essais if e.section == 'route']
        essais_mecanique = [e for e in essais if e.section == 'mecanique']
        
        # Contrainte de capacité pour la section route
        if essais_route:
            intervals_route = [self.task_intervals[e.id] for e in essais_route]
            self.model.AddCumulative(
                intervals_route,
                [1] * len(intervals_route),  # Chaque essai prend 1 unité de ressource
                self.max_capacity_route
            )
        
        # Contrainte de capacité pour la section mécanique
        if essais_mecanique:
            intervals_mecanique = [self.task_intervals[e.id] for e in essais_mecanique]
            self.model.AddCumulative(
                intervals_mecanique,
                [1] * len(intervals_mecanique),
                self.max_capacity_mecanique
            )
        
        # 4. Contraintes de précédence (essais du même échantillon)
        # Grouper les essais par échantillon
        essais_par_echantillon = {}
        for essai in essais:
            ech_id = essai.echantillon_id
            if ech_id not in essais_par_echantillon:
                essais_par_echantillon[ech_id] = []
            essais_par_echantillon[ech_id].append(essai)
        
        # Pour chaque échantillon avec plusieurs essais, ajouter des contraintes de précédence
        for ech_id, ech_essais in essais_par_echantillon.items():
            if len(ech_essais) > 1:
                # Trier par type d'essai (ordre logique: AG -> Proctor -> CBR -> autres)
                ordre = {'AG': 0, 'Proctor': 1, 'CBR': 2, 'Oedometre': 3, 'Cisaillement': 4}
                ech_essais_sorted = sorted(ech_essais, key=lambda e: ordre.get(e.type, 99))
                
                # L'essai suivant doit commencer après la fin du précédent
                for i in range(len(ech_essais_sorted) - 1):
                    essai_current = ech_essais_sorted[i]
                    essai_next = ech_essais_sorted[i + 1]
                    
                    # Ajouter un délai minimum de 1 jour entre les essais
                    self.model.Add(
                        self.task_starts[essai_next.id] >= 
                        self.task_ends[essai_current.id] + 1
                    )
        
        # 5. Fonction objectif: minimiser la durée totale ET respecter les priorités
        # Calcul du makespan (durée totale)
        makespan = self.model.NewIntVar(0, self.horizon, 'makespan')
        
        for essai in essais:
            self.model.Add(makespan >= self.task_ends[essai.id])
        
        # Objectif: minimiser le makespan
        # On peut aussi ajouter une pondération pour les essais prioritaires
        weighted_ends = []
        for essai in essais:
            priorite = self.calculer_priorite(essai)
            # Les essais prioritaires devraient se terminer plus tôt
            weight = max(1, 200 - priorite)  # Inverse: plus prioritaire = poids plus faible
            weighted_end = self.model.NewIntVar(0, self.horizon * weight, f'weighted_{essai.id}')
            self.model.Add(weighted_end == self.task_ends[essai.id] * weight)
            weighted_ends.append(weighted_end)
        
        # Objectif combiné
        total_weighted = self.model.NewIntVar(0, self.horizon * len(essais) * 200, 'total_weighted')
        self.model.Add(total_weighted == sum(weighted_ends))
        
        # Minimiser: makespan + somme pondérée des fins
        self.model.Minimize(makespan + total_weighted // 100)
        
        # 6. Résoudre le modèle
        self.solver.parameters.max_time_in_seconds = 30.0  # Limite de temps
        status = self.solver.Solve(self.model)
        
        # 7. Extraire les résultats
        affectations = []
        
        if status in [cp_model.OPTIMAL, cp_model.FEASIBLE]:
            for essai in essais:
                start_day = self.solver.Value(self.task_starts[essai.id])
                end_day = self.solver.Value(self.task_ends[essai.id])
                
                date_debut_planifiee = self.date_debut + timedelta(days=start_day)
                date_fin_planifiee = self.date_debut + timedelta(days=end_day)
                
                affectations.append({
                    'essai_id': essai.id,
                    'essai': essai,
                    'date_debut_planifiee': date_debut_planifiee,
                    'date_fin_planifiee': date_fin_planifiee,
                    'priorite_calculee': self.calculer_priorite(essai)
                })
        
        end_time = time.time()
        temps_calcul = end_time - start_time
        
        # 8. Retourner les résultats
        return {
            'success': status in [cp_model.OPTIMAL, cp_model.FEASIBLE],
            'status': self.solver.StatusName(status),
            'affectations': affectations,
            'temps_calcul': temps_calcul,
            'score': self.solver.ObjectiveValue() if status != cp_model.INFEASIBLE else None,
            'nombre_essais': len(essais)
        }
    
    def creer_planning(self, nom: str) -> Planning:
        """
        Crée un planning optimisé et le sauvegarde en base de données
        
        Args:
            nom: Nom du planning
            
        Returns:
            Instance de Planning créée
        """
        # Lancer l'optimisation
        resultats = self.optimize()
        
        if not resultats['success']:
            raise ValueError(f"Échec de l'optimisation: {resultats['status']}")
        
        # Créer le planning
        planning = Planning.objects.create(
            nom=nom,
            date_debut=self.date_debut,
            date_fin=self.date_fin,
            score_optimisation=resultats['score'],
            temps_calcul=resultats['temps_calcul'],
            nombre_essais_planifies=resultats['nombre_essais'],
            statut='draft'
        )
        
        # Créer les affectations
        for affectation_data in resultats['affectations']:
            affectation = AffectationEssai.objects.create(
                planning=planning,
                essai=affectation_data['essai'],
                date_debut_planifiee=affectation_data['date_debut_planifiee'],
                date_fin_planifiee=affectation_data['date_fin_planifiee'],
                priorite_calculee=affectation_data['priorite_calculee']
            )
        
        return planning


def optimiser_planning_hebdomadaire():
    """
    Fonction utilitaire pour optimiser le planning de la semaine suivante
    """
    from datetime import datetime, timedelta
    
    # Calculer la date de début (lundi prochain)
    aujourd_hui = datetime.now().date()
    jours_avant_lundi = (7 - aujourd_hui.weekday()) % 7
    if jours_avant_lundi == 0:
        jours_avant_lundi = 7
    
    date_debut = aujourd_hui + timedelta(days=jours_avant_lundi)
    date_fin = date_debut + timedelta(days=13)  # 2 semaines
    
    # Créer l'optimiseur
    optimizer = SchedulerOptimizer(date_debut, date_fin)
    
    # Créer le planning
    nom_planning = f"Planning {date_debut.strftime('%d/%m/%Y')} - {date_fin.strftime('%d/%m/%Y')}"
    planning = optimizer.creer_planning(nom_planning)
    
    return planning
