import { apiRequest } from './api';

export interface DashboardStats {
  total_echantillons: number;
  echantillons_en_cours: number;
  echantillons_termines: number;
  echantillons_urgents: number;
  essais_en_attente: number;
  essais_en_cours: number;
  essais_termines: number;
  clients_actifs: number;
  delai_moyen_traitement: number;
  taux_respect_delais: number;
}

export interface Task {
  module: string;
  count: number;
  description: string;
}

// Récupérer les statistiques du dashboard
export const getDashboardStats = async (): Promise<DashboardStats> => {
  return apiRequest<DashboardStats>('/dashboard/stats/');
};

// Récupérer les tâches de l'utilisateur connecté
export const getMyTasks = async (): Promise<Task[]> => {
  return apiRequest<Task[]>('/dashboard/my_tasks/');
};
