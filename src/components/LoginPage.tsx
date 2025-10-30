import { useState } from 'react';
import { User, UserRole } from '../App';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { FlaskConical } from 'lucide-react';

interface LoginPageProps {
  onLogin: (user: User) => void;
}

const roleLabels: Record<UserRole, string> = {
  receptionniste: 'Réceptionniste',
  responsable_materiaux: 'Responsable Matériaux',
  operateur_route: 'Opérateur Labo - Section Route',
  operateur_mecanique: 'Opérateur Labo - Mécanique des sols',
  responsable_traitement: 'Responsable Traitement',
  chef_projet: 'Chef de Projet',
  chef_service: 'Chef Service Génie Civil',
  directeur_technique: 'Directeur Technique',
  directeur_general: 'Directeur Général',
};

export function LoginPage({ onLogin }: LoginPageProps) {
  const [role, setRole] = useState<UserRole>('receptionniste');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Mot de passe commun pour la démo
    if (password === 'demo123') {
      onLogin({
        id: `user-${role}`,
        name: roleLabels[role],
        role,
        email: `${role}@labo.com`,
      });
    } else {
      alert('Mot de passe incorrect. Utilisez: demo123');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F5F5F5' }}>
      <Card className="w-full max-w-md">
        <CardHeader className="text-center" style={{ backgroundColor: '#003366', color: '#FFFFFF' }}>
          <div className="flex justify-center mb-4">
            <FlaskConical className="h-12 w-12" />
          </div>
          <CardTitle>Gestion d'Échantillons</CardTitle>
          <CardDescription className="text-gray-200">
            Laboratoire SNERTP
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="role">Profil utilisateur</Label>
              <Select value={role} onValueChange={(value) => setRole(value as UserRole)}>
                <SelectTrigger id="role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(roleLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Entrez le mot de passe"
                required
              />
              <p className="text-xs" style={{ color: '#A9A9A9' }}>
                Démo: demo123
              </p>
            </div>

            <Button type="submit" className="w-full" style={{ backgroundColor: '#003366' }}>
              Se connecter
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
