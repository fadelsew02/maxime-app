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
        { id: 'essais-rejetes-mecanique' as ActiveView, label: 'Essais Rejetés', icon: TestTube },
      ];
    }

    // Responsable Traitement
    if (role === 'responsable_traitement') {
      return [
        { id: 'home' as ActiveView, label: 'Accueil', icon: Home },
        { id: 'traitement' as ActiveView, label: 'Traitement', icon: FileText },
        { id: 'traitement-rejete' as ActiveView, label: 'Traitement rejeté', icon: FileText },
      ];
    }

    // Chef de projet
    if (role === 'chef_projet') {
      return [
        { id: 'home' as ActiveView, label: 'Accueil', icon: Home },
        { id: 'chef-projet' as ActiveView, label: 'Rapports traitement', icon: FileText },
        { id: 'chef-projet-rejete' as ActiveView, label: 'Rapports rejetés', icon: FileText },
        { id: 'validation' as ActiveView, label: 'Validation', icon: CheckCircle },
      ];
    }

    // Chef de service
    if (role === 'chef_service') {
      return [
        { id: 'home' as ActiveView, label: 'Accueil', icon: Home },
        { id: 'rapports-chef-service' as ActiveView, label: 'Rapports', icon: FileText },
        { id: 'validation' as ActiveView, label: 'Validation', icon: CheckCircle },
      ];
    }

    // Directeur technique
    if (role === 'directeur_technique') {
      return [
        { id: 'home' as ActiveView, label: 'Accueil', icon: Home },
        { id: 'validation' as ActiveView, label: 'Validation', icon: CheckCircle },
        { id: 'rapports-valides' as ActiveView, label: 'Rapport', icon: FileText },
      ];
    }

    // Directeur général
    if (role === 'directeur_general') {
      return [
        { id: 'home' as ActiveView, label: 'Accueil', icon: Home },
        { id: 'validation' as ActiveView, label: 'Validation', icon: CheckCircle },
      ];
    }

    // Directeur SNERTP
    if (role === 'directeur_snertp') {
      return [
        { id: 'home' as ActiveView, label: 'Accueil', icon: Home },
        { id: 'rapports-valides' as ActiveView, label: 'Rapport à aviser', icon: FileText },
      ];
    }

    // Service Marketing
    if (role === 'service_marketing') {
      return [
        { id: 'home' as ActiveView, label: 'Accueil', icon: Home },
        { id: 'service-marketing' as ActiveView, label: 'Rapports à envoyer', icon: FileText },
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
