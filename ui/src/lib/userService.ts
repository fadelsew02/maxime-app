import { apiRequest } from './api';

export interface ChefProjet {
  id: string;
  username: string;
  full_name: string;
  email: string;
}

// Récupérer la liste des chefs de projet
export const getChefsProjet = async (): Promise<ChefProjet[]> => {
  return apiRequest<ChefProjet[]>('/users/chefs_projet/');
};
