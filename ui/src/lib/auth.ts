import { apiRequest, saveTokens, clearTokens } from './api';
import { User } from '../App';

interface LoginResponse {
  access: string;
  refresh: string;
}

interface UserProfile {
  id: string;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
}

// Connexion
export const login = async (username: string, password: string): Promise<User> => {
  console.log('🔑 Tentative de connexion:', username);
  
  // 1. Obtenir les tokens JWT directement sans apiRequest
  const response = await fetch('http://127.0.0.1:8000/api/auth/login/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  
  if (!response.ok) {
    throw new Error('Identifiants incorrects');
  }
  
  const tokens: LoginResponse = await response.json();
  console.log('✅ Tokens reçus');

  // 2. Sauvegarder les tokens
  saveTokens(tokens.access, tokens.refresh);
  console.log('✅ Tokens sauvegardés dans localStorage');

  // 3. Récupérer le profil utilisateur avec le nouveau token
  console.log('👤 Récupération du profil...');
  const profileResponse = await fetch('http://127.0.0.1:8000/api/users/me/', {
    headers: {
      'Authorization': `Bearer ${tokens.access}`,
      'Content-Type': 'application/json'
    }
  });
  
  if (!profileResponse.ok) {
    throw new Error('Erreur lors de la récupération du profil');
  }
  
  const profile: UserProfile = await profileResponse.json();
  console.log('✅ Profil reçu:', profile.username, profile.role);

  // 4. Retourner l'utilisateur au format attendu par l'app
  return {
    id: profile.id,
    name: `${profile.first_name} ${profile.last_name}`.trim() || profile.username,
    role: profile.role as any,
    email: profile.email,
  };
};

// Déconnexion
export const logout = () => {
  clearTokens();
};

// Vérifier si l'utilisateur est connecté
export const isAuthenticated = (): boolean => {
  return !!localStorage.getItem('access_token');
};

// Récupérer le profil utilisateur actuel
export const getCurrentUser = async (): Promise<User | null> => {
  if (!isAuthenticated()) {
    return null;
  }

  try {
    const profile = await apiRequest<UserProfile>('/users/me/');
    return {
      id: profile.id,
      name: `${profile.first_name} ${profile.last_name}`.trim() || profile.username,
      role: profile.role as any,
      email: profile.email,
    };
  } catch {
    clearTokens();
    return null;
  }
};
