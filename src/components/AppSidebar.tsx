import { User } from '../App';
import { ActiveView } from './DashboardLayout';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from './ui/sidebar';
import {
  FlaskConical,
  Home,
  ClipboardList,
  Package,
  FileCheck,
  TestTube,
  FileText,
  CheckCircle,
  BarChart3,
  LogOut
} from 'lucide-react';
import { Button } from './ui/button';
import { Separator } from './ui/separator';
import { NotificationBell } from './ui/notification-bell';

interface AppSidebarProps {
  user: User;
  activeView: ActiveView;
  onNavigate: (view: ActiveView) => void;
  onLogout: () => void;
}

export function AppSidebar({ user, activeView, onNavigate, onLogout }: AppSidebarProps) {
  const getMenuItems = () => {
    const role = user.role;

    // Réceptionniste
    if (role === 'receptionniste') {
      return [
        { id: 'home' as ActiveView, label: 'Accueil', icon: Home },
        { id: 'reception' as ActiveView, label: 'Réception', icon: ClipboardList },
        { id: 'storage' as ActiveView, label: 'Stockage', icon: Package },
        { id: 'decodification' as ActiveView, label: 'Décodification', icon: FileCheck },
      ];
    }

    // Responsable Matériaux
    if (role === 'responsable_materiaux') {
      return [
        { id: 'home' as ActiveView, label: 'Accueil', icon: Home },
        { id: 'storage' as ActiveView, label: 'Stockage', icon: Package },
      ];
    }

    // Opérateurs Labo
    if (role === 'operateur_route') {
      return [
        { id: 'home' as ActiveView, label: 'Accueil', icon: Home },
        { id: 'essais-route' as ActiveView, label: 'Essais - Route', icon: TestTube },
        { id: 'essais-rejetes' as ActiveView, label: 'Essais Rejetés', icon: TestTube },
      ];
    }

    if (role === 'operateur_mecanique') {
      return [
        { id: 'home' as ActiveView, label: 'Accueil', icon: Home },
        { id: 'essais-mecanique' as ActiveView, label: 'Essais - Mécanique', icon: TestTube },
      ];
    }

    // Responsable Traitement
    if (role === 'responsable_traitement') {
      return [
        { id: 'home' as ActiveView, label: 'Accueil', icon: Home },
        { id: 'traitement' as ActiveView, label: 'Traitement', icon: FileText },
      ];
    }

    // Hiérarchie de validation
    if (['chef_projet', 'chef_service', 'directeur_technique', 'directeur_general'].includes(role)) {
      return [
        { id: 'home' as ActiveView, label: 'Accueil', icon: Home },
        { id: 'validation' as ActiveView, label: 'Validation', icon: CheckCircle },
      ];
    }

    return [{ id: 'home' as ActiveView, label: 'Accueil', icon: Home }];
  };

  const menuItems = getMenuItems();
  const isAdmin = user.role === 'chef_service' || user.role === 'directeur_technique';

  return (
    <Sidebar>
      <SidebarHeader style={{ backgroundColor: '#003366', color: '#FFFFFF' }} className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FlaskConical className="h-10 w-10" />
            <div>
              <h2 className="font-semibold">Laboratoire SNERTP</h2>
              <p className="text-xs opacity-90">Gestion d'Échantillons</p>
            </div>
          </div>
          <NotificationBell />
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton
                    onClick={() => onNavigate(item.id)}
                    isActive={activeView === item.id}
                    tooltip={item.label}
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {isAdmin && (
          <SidebarGroup>
            <SidebarGroupLabel>Administration</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    onClick={() => onNavigate('admin')}
                    isActive={activeView === 'admin'}
                    tooltip="Supervision"
                  >
                    <BarChart3 className="h-4 w-4" />
                    <span>Supervision</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter>
        <div className="p-4 space-y-3">
          <Separator />
          <div className="text-xs" style={{ color: '#A9A9A9' }}>
            <p>{user.name}</p>
            <p>{user.email}</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={onLogout}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Déconnexion
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
