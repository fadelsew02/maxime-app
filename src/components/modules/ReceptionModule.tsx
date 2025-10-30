import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Checkbox } from '../ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Badge } from '../ui/badge';
import { UserPlus, PackagePlus, QrCode, Printer, Camera } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import {
  addClient,
  addEchantillon,
  generateClientCode,
  generateEchantillonCode,
  estimateEndDate,
  getClients,
  Client,
  Echantillon,
  naturesEchantillons,
  chefsProjets,
} from '../../lib/mockData';
import { useNotifications } from '../../contexts/NotificationContext';

export function ReceptionModule() {
  const { addNotification } = useNotifications();

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1>Module Réception</h1>
        <p style={{ color: '#A9A9A9' }}>
          Codification clients et échantillons
        </p>
      </div>

      <Tabs defaultValue="client" className="space-y-6">
        <TabsList>
          <TabsTrigger value="client">
            <UserPlus className="h-4 w-4 mr-2" />
            Nouveau Client
          </TabsTrigger>
          <TabsTrigger value="echantillon">
            <PackagePlus className="h-4 w-4 mr-2" />
            Nouvel Échantillon
          </TabsTrigger>
        </TabsList>

        <TabsContent value="client">
          <ClientForm />
        </TabsContent>

        <TabsContent value="echantillon">
          <EchantillonForm />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ClientForm() {
  const [formData, setFormData] = useState({
    nom: '',
    contact: '',
    projet: '',
    email: '',
    telephone: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const client: Client = {
      id: Date.now().toString(),
      code: generateClientCode(),
      ...formData,
      dateCreation: new Date().toISOString().split('T')[0],
    };

    addClient(client);
    toast.success(`Client créé avec succès: ${client.code}`);

    // Notification pour les réceptionnistes
    addNotification({
      type: 'success',
      title: 'Nouveau client ajouté',
      message: `Le client ${client.nom} (${client.code}) a été ajouté au système`,
      userRole: 'receptionniste',
      module: 'Réception',
    });

    setFormData({
      nom: '',
      contact: '',
      projet: '',
      email: '',
      telephone: '',
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Codification Client</CardTitle>
        <CardDescription>Enregistrement d'un nouveau client</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nom">Nom du client *</Label>
              <Input
                id="nom"
                value={formData.nom}
                onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                placeholder="Ex: SOGEA-SATOM"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contact">Personne de contact *</Label>
              <Input
                id="contact"
                value={formData.contact}
                onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                placeholder="Ex: M. Koné"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="projet">Nom du projet *</Label>
              <Input
                id="projet"
                value={formData.projet}
                onChange={(e) => setFormData({ ...formData, projet: e.target.value })}
                placeholder="Ex: Autoroute Abidjan-Bassam"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="contact@entreprise.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="telephone">Téléphone</Label>
              <Input
                id="telephone"
                value={formData.telephone}
                onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
                placeholder="+225 07 00 00 00"
              />
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <Button type="submit" style={{ backgroundColor: '#003366' }}>
              Enregistrer le client
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function EchantillonForm() {
  const [selectedClient, setSelectedClient] = useState('');
  const [formData, setFormData] = useState({
    nature: '',
    profondeurDebut: '',
    profondeurFin: '',
    sondage: 'carotte' as 'carotte' | 'vrac',
    nappe: '',
    chefProjet: '',
    photo: '',
  });
  const [essaisSelectionnes, setEssaisSelectionnes] = useState<string[]>([]);
  const [qrCodeGenere, setQrCodeGenere] = useState<string | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  // Rafraîchir automatiquement les données toutes les 5 secondes
  useEffect(() => {
    const interval = setInterval(() => {
      // Rafraîchir les clients si nécessaire
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const clients = getClients();

  const essaisDisponibles = [
    { id: 'AG', label: 'Tamisage (AG)', duree: '5 jours' },
    { id: 'Proctor', label: 'Proctor', duree: '4 jours' },
    { id: 'CBR', label: 'CBR', duree: '5 jours' },
    { id: 'Cisaillement', label: 'Cisaillement', duree: '8 jours' },
    { id: 'Oedometre', label: 'Œdomètre', duree: '18 jours' },
  ];

  const toggleEssai = (essaiId: string) => {
    setEssaisSelectionnes(prev =>
      prev.includes(essaiId)
        ? prev.filter(id => id !== essaiId)
        : [...prev, essaiId]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedClient) {
      toast.error('Veuillez sélectionner un client');
      return;
    }

    if (essaisSelectionnes.length === 0) {
      toast.error('Veuillez sélectionner au moins un essai');
      return;
    }

    if (!formData.chefProjet) {
      toast.error('Veuillez sélectionner un chef de projet');
      return;
    }

    const code = generateEchantillonCode();
    const qrCode = `QR-${code.replace('/', '-')}`;

    const echantillon: Echantillon = {
      id: Date.now().toString(),
      code,
      clientCode: selectedClient,
      nature: formData.nature,
      profondeurDebut: formData.profondeurDebut,
      profondeurFin: formData.profondeurFin,
      sondage: formData.sondage,
      nappe: formData.nappe,
      essais: essaisSelectionnes,
      qrCode,
      dateReception: new Date().toISOString().split('T')[0],
      dateFinEstimee: estimateEndDate(essaisSelectionnes),
      statut: 'stockage',
      chefProjet: formData.chefProjet,
      photo: formData.photo,
    };

    addEchantillon(echantillon);
    setQrCodeGenere(qrCode);

    toast.success(`Échantillon créé: ${code}`, {
      description: `QR Code: ${qrCode}`,
    });

    // Notifications pour les différents rôles
    // Pour le responsable matériaux
    addNotification({
      type: 'info',
      title: 'Nouvel échantillon reçu',
      message: `L'échantillon ${code} (${echantillon.nature}) a été réceptionné et est en attente de stockage`,
      userRole: 'responsable_materiaux',
      module: 'Réception',
      actionRequired: true,
    });

    // Pour les opérateurs de décodification
    addNotification({
      type: 'info',
      title: 'Nouvel échantillon à décoder',
      message: `L'échantillon ${code} nécessite une décodification du QR code`,
      userRole: 'receptionniste',
      module: 'Réception',
      actionRequired: true,
    });

    // Pour le chef de projet concerné
    addNotification({
      type: 'info',
      title: 'Votre échantillon est arrivé',
      message: `L'échantillon ${code} pour le projet ${getClients().find(c => c.code === selectedClient)?.nom} est arrivé`,
      userRole: 'chef_projet',
      module: 'Réception',
    });

    // Reset form (mais garder le QR code visible)
    setFormData({
      nature: '',
      profondeurDebut: '',
      profondeurFin: '',
      sondage: 'carotte',
      nappe: '',
      chefProjet: '',
      photo: '',
    });
    setPhotoPreview(null);
    setEssaisSelectionnes([]);
  };

  const handlePrintQR = () => {
    if (qrCodeGenere) {
      toast.success('Impression du QR Code...', {
        description: qrCodeGenere,
      });
      // Dans une vraie application, ceci déclencherait l'impression
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Codification Échantillon</CardTitle>
          <CardDescription>Enregistrement d'un nouvel échantillon</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="client">Client *</Label>
              <Select value={selectedClient} onValueChange={setSelectedClient}>
                <SelectTrigger id="client">
                  <SelectValue placeholder="Sélectionner un client" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.code}>
                      {client.code} - {client.nom}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nature">Nature de l'échantillon *</Label>
                <Select value={formData.nature} onValueChange={(value) => setFormData({ ...formData, nature: value })}>
                  <SelectTrigger id="nature">
                    <SelectValue placeholder="Sélectionner la nature" />
                  </SelectTrigger>
                  <SelectContent>
                    {naturesEchantillons.map((nature) => (
                      <SelectItem key={nature} value={nature}>
                        {nature}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="sondage">Type de sondage *</Label>
                <Select
                  value={formData.sondage}
                  onValueChange={(value: 'carotte' | 'vrac') =>
                    setFormData({ ...formData, sondage: value })
                  }
                >
                  <SelectTrigger id="sondage">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="carotte">Carotté</SelectItem>
                    <SelectItem value="vrac">Vrac</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="profondeurDebut">Profondeur début (m) *</Label>
                <Input
                  id="profondeurDebut"
                  type="number"
                  step="0.1"
                  value={formData.profondeurDebut}
                  onChange={(e) => setFormData({ ...formData, profondeurDebut: e.target.value })}
                  placeholder="Ex: 0"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="profondeurFin">Profondeur fin (m) *</Label>
                <Input
                  id="profondeurFin"
                  type="number"
                  step="0.1"
                  value={formData.profondeurFin}
                  onChange={(e) => setFormData({ ...formData, profondeurFin: e.target.value })}
                  placeholder="Ex: 2"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="nappe">Nappe phréatique</Label>
                <Input
                  id="nappe"
                  value={formData.nappe}
                  onChange={(e) => setFormData({ ...formData, nappe: e.target.value })}
                  placeholder="Ex: Non rencontrée ou 3.5m"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="chefProjet">Chef de projet *</Label>
                <Select value={formData.chefProjet} onValueChange={(value) => setFormData({ ...formData, chefProjet: value })}>
                  <SelectTrigger id="chefProjet">
                    <SelectValue placeholder="Sélectionner le chef de projet" />
                  </SelectTrigger>
                  <SelectContent>
                    {chefsProjets.map((chef) => (
                      <SelectItem key={chef} value={chef}>
                        {chef}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="photo">Photo de l'échantillon</Label>
                <div className="flex items-center gap-4">
                  <Input
                    id="photo"
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = (e) => {
                          const result = e.target?.result as string;
                          setFormData({ ...formData, photo: result });
                          setPhotoPreview(result);
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById('photo')?.click()}
                    className="flex items-center gap-2"
                  >
                    <Camera className="h-4 w-4" />
                    {photoPreview ? 'Changer la photo' : 'Ajouter une photo'}
                  </Button>
                  {photoPreview && (
                    <div className="w-16 h-16 rounded-lg overflow-hidden border">
                      <img src={photoPreview} alt="Aperçu" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <Label>Essais à réaliser *</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {essaisDisponibles.map((essai) => (
                  <div
                    key={essai.id}
                    className="flex items-center space-x-3 p-3 rounded-lg"
                    style={{ backgroundColor: '#F5F5F5' }}
                  >
                    <Checkbox
                      id={essai.id}
                      checked={essaisSelectionnes.includes(essai.id)}
                      onCheckedChange={() => toggleEssai(essai.id)}
                    />
                    <label htmlFor={essai.id} className="flex-1 cursor-pointer">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">{essai.label}</span>
                        <span className="text-xs" style={{ color: '#A9A9A9' }}>
                          {essai.duree}
                        </span>
                      </div>
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <Button type="submit" style={{ backgroundColor: '#003366' }}>
                <QrCode className="h-4 w-4 mr-2" />
                Créer l'échantillon
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* QR Code généré */}
      {qrCodeGenere && (
        <Card>
          <CardHeader>
            <CardTitle>QR Code généré</CardTitle>
            <CardDescription>Vous pouvez imprimer ce QR Code</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-6 rounded-lg" style={{ backgroundColor: '#F5F5F5' }}>
              <div className="flex items-center gap-4">
                <div className="p-4 bg-white rounded-lg border-2 border-dashed" style={{ borderColor: '#003366' }}>
                  <QrCode className="h-16 w-16" style={{ color: '#003366' }} />
                </div>
                <div>
                  <p className="font-semibold">{qrCodeGenere}</p>
                  <p className="text-sm" style={{ color: '#A9A9A9' }}>
                    Code QR de l'échantillon
                  </p>
                </div>
              </div>
              <Button onClick={handlePrintQR} style={{ backgroundColor: '#003366' }}>
                <Printer className="h-4 w-4 mr-2" />
                Imprimer
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}