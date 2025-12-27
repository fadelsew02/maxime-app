/**
 * Utilitaires pour le formatage des dates en français
 */

/**
 * Formate une date en format français court (ex: 30/11/2025)
 */
export const formatDateFr = (dateString: string | Date): string => {
  if (!dateString) return '-';
  
  try {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    
    // Vérifier si la date est valide
    if (isNaN(date.getTime())) return '-';
    
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  } catch {
    return '-';
  }
};

/**
 * Formate une date en format français long (ex: 30 novembre 2025)
 */
export const formatDateLongFr = (dateString: string | Date): string => {
  if (!dateString) return '-';
  
  try {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    
    // Vérifier si la date est valide
    if (isNaN(date.getTime())) return '-';
    
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  } catch {
    return '-';
  }
};

/**
 * Formate une date avec l'heure en français (ex: 30/11/2025 à 14:30)
 */
export const formatDateTimeFr = (dateString: string | Date): string => {
  if (!dateString) return '-';
  
  try {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    
    // Vérifier si la date est valide
    if (isNaN(date.getTime())) return '-';
    
    const dateStr = date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
    
    const timeStr = date.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });
    
    return `${dateStr} à ${timeStr}`;
  } catch {
    return '-';
  }
};

/**
 * Formate une date relative (ex: "il y a 2 jours", "dans 3 jours")
 */
export const formatDateRelativeFr = (dateString: string | Date): string => {
  if (!dateString) return '-';
  
  try {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    
    // Vérifier si la date est valide
    if (isNaN(date.getTime())) return '-';
    
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return "Aujourd'hui";
    if (diffDays === 1) return "Demain";
    if (diffDays === -1) return "Hier";
    if (diffDays > 1) return `Dans ${diffDays} jours`;
    if (diffDays < -1) return `Il y a ${Math.abs(diffDays)} jours`;
    
    return formatDateFr(date);
  } catch {
    return '-';
  }
};

/**
 * Formate une date pour un input de type date (YYYY-MM-DD)
 */
export const formatDateForInput = (dateString: string | Date): string => {
  if (!dateString) return '';
  
  try {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    
    // Vérifier si la date est valide
    if (isNaN(date.getTime())) return '';
    
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
  } catch {
    return '';
  }
};
