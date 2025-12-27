/**
 * Configuration des menus sidebar par rôle utilisateur
 */

export const sidebarConfig: Record<string, string[]> = {
  receptionniste: [
    'Accueil',
    'Réception',
    'Stockage',
    'Décodification',
  ],
  
  responsable_materiaux: [
    'Accueil',
    'Stockage',
  ],
  
  operateur_route: [
    'Accueil',
    'Essais Route',
  ],
  
  operateur_mecanique: [
    'Accueil',
    'Essais Mécanique',
  ],
  
  responsable_traitement: [
    'Accueil',
    'Traitement',
  ],
  
  chef_projet: [
    'Accueil',
    'Rapport de traitement',
  ],
  
  chef_service: [
    'Accueil',
    'Rapports reçus',
  ],
  
  directeur_technique: [
    'Accueil',
    'Validation',
  ],
  
  directeur_general: [
    'Accueil',
    'Rapports',
    'Validation',
    'Statistiques',
  ],
  
  directeur_snertp: [
    'Accueil',
    'Rapports à aviser',
  ],
  
  service_marketing: [
    'Accueil',
    'Rapports à envoyer',
  ],
};

export function getMenuItemsForRole(role: string): string[] {
  return sidebarConfig[role] || ['Accueil'];
}

export function shouldShowMenuItem(role: string, menuItem: string): boolean {
  const allowedItems = sidebarConfig[role] || [];
  return allowedItems.includes(menuItem);
}
