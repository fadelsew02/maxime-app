/**
 * Helper pour vérifier la capacité des sections et bloquer si nécessaire
 */

const API_BASE_URL = 'https://snertp.onrender.com/api';

export async function verifierCapacite(typeEssai: string, dateEnvoi: string): Promise<{
  disponible: boolean;
  message: string;
  capaciteRestante: number;
}> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/capacites/check/?type_essai=${typeEssai}&date=${dateEnvoi}`,
      {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error('Erreur lors de la vérification de capacité');
    }

    const data = await response.json();
    
    return {
      disponible: data.disponible,
      message: data.disponible 
        ? `Capacité disponible (${data.capacite_restante} places restantes)`
        : 'Capacité atteinte, veuillez patienter.',
      capaciteRestante: data.capacite_restante || 0
    };
  } catch (error) {
    console.error('Erreur vérification capacité:', error);
    return {
      disponible: true,
      message: 'Vérification impossible, envoi autorisé',
      capaciteRestante: 0
    };
  }
}

export function afficherMessageCapacite(disponible: boolean, message: string) {
  if (!disponible) {
    // Afficher un message d'erreur bloquant
    alert(message);
    return false;
  }
  return true;
}
