import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Checkbox } from '../ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Badge } from '../ui/badge';
import { UserPlus, PackagePlus, QrCode as QrCodeIcon, Printer, Camera, Loader2 } from 'lucide-react';
import QRCode from 'react-qr-code';
import { toast } from 'sonner';
import {
  naturesEchantillons,
  chefsProjets,
} from '../../lib/mockData';
import { createClient, Client } from '../../lib/clientService';
import { createEchantillon } from '../../lib/echantillonService';
import { useNotifications } from '../../contexts/NotificationContext';

export function ReceptionModule() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [activeTab, setActiveTab] = useState('client');

  const handleClientCreated = () => {
    // Incrémenter la clé pour forcer le rechargement des clients
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1>Module Réception</h1>
        <p style={{ color: '#A9A9A9' }}>
          Codification clients et échantillons
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
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
          <ClientForm onClientCreated={handleClientCreated} />
        </TabsContent>

        <TabsContent value="echantillon">
          <EchantillonForm key={refreshKey} refreshTrigger={refreshKey} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

interface ClientFormProps {
  onClientCreated?: () => void;
}

function ClientForm({ onClientCreated }: ClientFormProps) {
  const { addNotification } = useNotifications();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nom: '',
    contact: '',
    projet: '',
    email: '',
    telephone: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const client = await createClient(formData);
      
      toast.success(`Client créé avec succès: ${client.code}`);

      // Notification pour les réceptionnistes
      addNotification({
        type: 'success',
        title: 'Nouveau client ajouté',
        message: `Le client ${client.nom} (${client.code}) a été ajouté au système`,
        userRole: 'receptionniste',
        module: 'Réception',
      });

      // Réinitialiser le formulaire
      setFormData({
        nom: '',
        contact: '',
        projet: '',
        email: '',
        telephone: '',
      });

      // Notifier le parent que le client a été créé
      if (onClientCreated) {
        onClientCreated();
      }
    } catch (error) {
      console.error('Erreur lors de la création du client:', error);
      toast.error(error instanceof Error ? error.message : 'Erreur lors de la création du client');
    } finally {
      setLoading(false);
    }
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
            <Button type="submit" style={{ backgroundColor: '#003366' }} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enregistrement...
                </>
              ) : (
                'Enregistrer le client'
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

interface EchantillonFormProps {
  refreshTrigger?: number;
}

function EchantillonForm({ refreshTrigger }: EchantillonFormProps) {
  const { addNotification } = useNotifications();
  const [selectedClient, setSelectedClient] = useState('');
  const [clients, setClients] = useState<Client[]>([]);
  const [loadingClients, setLoadingClients] = useState(true);
  const [formData, setFormData] = useState({
    nature: '',
    profondeurDebut: '',
    profondeurFin: '',
    sondage: 'carotte' as 'carotte' | 'vrac',
    numeroSondage: '',
    nappe: '',
    chefProjet: '',
  });
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [essaisSelectionnes, setEssaisSelectionnes] = useState<string[]>([]);
  const [qrCodeGenere, setQrCodeGenere] = useState<string | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [echantillonCree, setEchantillonCree] = useState<any>(null);

  // Charger les clients au montage du composant et quand refreshTrigger change
  useEffect(() => {
    const loadClients = async () => {
      setLoadingClients(true);
      try {
        const { getClients } = await import('../../lib/clientService');
        const data = await getClients();
        setClients(data);
      } catch (error) {
        console.error('Erreur lors du chargement des clients:', error);
        toast.error('Erreur lors du chargement des clients');
      } finally {
        setLoadingClients(false);
      }
    };

    loadClients();
  }, [refreshTrigger]);

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

  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
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

    setLoading(true);

    try {
      // Trouver l'ID du client sélectionné
      const selectedClientObj = clients.find(c => c.code === selectedClient);
      if (!selectedClientObj) {
        toast.error('Client introuvable');
        return;
      }

      // Préparer les données pour l'API
      const echantillonData = {
        client: selectedClientObj.id, // UUID du client
        nature: formData.nature,
        profondeur_debut: parseFloat(formData.profondeurDebut),
        profondeur_fin: parseFloat(formData.profondeurFin),
        sondage: formData.sondage,
        nappe: formData.nappe,
        chef_projet: formData.chefProjet,
        priorite: 'normale' as const,
        statut: 'stockage' as const,
        essais_types: essaisSelectionnes, // Liste des types d'essais
      };

      // Créer l'échantillon via l'API (avec photo si disponible)
      const echantillon = await createEchantillon(echantillonData, photoFile || undefined);

      // Construire l'URL de la photo
      let photoUrl = '';
      if (echantillon.photo) {
        photoUrl = echantillon.photo.startsWith('http') 
          ? echantillon.photo 
          : `http://127.0.0.1:8000${echantillon.photo}`;
      }

      // Calculer la date de retour client (somme des durées des essais)
      const dureeMax = Math.max(
        ...essaisSelectionnes.map(id => {
          const essai = essaisDisponibles.find(e => e.id === id);
          return essai ? parseInt(essai.duree) : 0;
        })
      );
      const dateRetour = new Date();
      dateRetour.setDate(dateRetour.getDate() + dureeMax);

      // Créer la liste de données pour le QR code
      const qrData = `Code: ${echantillon.code}
Nature: ${echantillon.nature}
Photo: ${photoUrl}
Essais: ${essaisSelectionnes.join(', ')}
Profondeur début: ${formData.profondeurDebut}m
Profondeur fin: ${formData.profondeurFin}m
Nappe phréatique: ${formData.nappe}
Date retour client: ${dateRetour.toLocaleDateString('fr-FR')}`;

      // Afficher le QR code généré avec les données complètes
      setQrCodeGenere(qrData);
      setEchantillonCree({
        ...echantillon,
        profondeurDebut: formData.profondeurDebut,
        profondeurFin: formData.profondeurFin,
        nappe: formData.nappe,
        sondage: formData.sondage,
        numeroSondage: formData.numeroSondage
      });

      toast.success(`Échantillon créé: ${echantillon.code}`, {
        description: `QR Code: ${echantillon.qr_code}`,
      });

      // Notifications pour les différents rôles
      addNotification({
        type: 'info',
        title: 'Nouvel échantillon reçu',
        message: `L'échantillon ${echantillon.code} (${echantillon.nature}) a été réceptionné et est en attente de stockage`,
        userRole: 'responsable_materiaux',
        module: 'Réception',
        actionRequired: true,
      });

      addNotification({
        type: 'info',
        title: 'Nouvel échantillon à décoder',
        message: `L'échantillon ${echantillon.code} nécessite une décodification du QR code`,
        userRole: 'receptionniste',
        module: 'Réception',
        actionRequired: true,
      });

      const clientName = selectedClientObj.nom;
      addNotification({
        type: 'info',
        title: 'Votre échantillon est arrivé',
        message: `L'échantillon ${echantillon.code} pour le projet ${clientName} est arrivé`,
        userRole: 'chef_projet',
        module: 'Réception',
      });

      // Reset form (mais garder le QR code visible)
      setFormData({
        nature: '',
        profondeurDebut: '',
        profondeurFin: '',
        sondage: 'carotte',
        numeroSondage: '',
        nappe: '',
        chefProjet: '',
      });
      setPhotoFile(null);
      setEssaisSelectionnes([]);
      setSelectedClient('');
    } catch (error) {
      console.error('Erreur lors de la création de l\'échantillon:', error);
      toast.error(error instanceof Error ? error.message : 'Erreur lors de la création de l\'échantillon');
    } finally {
      setLoading(false);
    }
  };

  const handlePrintQR = () => {
    if (!qrCodeGenere || !echantillonCree) return;

    try {
      // Parser les données du QR code (format: libellé: valeur\n)
      const lines = qrCodeGenere.split('\n');
      const qrData: any = {};
      lines.forEach(line => {
        const [key, ...valueParts] = line.split(': ');
        qrData[key] = valueParts.join(': ');
      });
      
      const printWindow = window.open('', '_blank');
    if (printWindow) {
      const echantillonCode = qrData['Code'].replace(/-/g, '/');
      
      // Utiliser les données du QR code
      const photoUrl = qrData['Photo'];
      const profondeur = `${qrData['Profondeur début']} - ${qrData['Profondeur fin']}`;
      const nappe = qrData['Nappe phréatique'] || 'Non renseignée';
      const typeSondage = echantillonCree.sondage === 'carotte' ? 'Carotté' : 'Vrac';
      const numeroSondage = echantillonCree.numeroSondage || 'Non renseigné';
      
      printWindow.document.write(`
        <html>
          <head>
            <title>QR Code - ${echantillonCode}</title>
            <style>
              body {
                font-family: Arial, sans-serif;
                text-align: center;
                padding: 20px;
                max-width: 700px;
                margin: 0 auto;
              }
              .header {
                margin-bottom: 15px;
              }
              .header h1 {
                color: #003366;
                margin-bottom: 5px;
                font-size: 20px;
              }
              .header p {
                font-size: 12px;
                margin: 0;
              }
              .qr-container {
                margin: 15px auto;
                padding: 15px;
                background: white;
                border: 2px solid #003366;
                border-radius: 10px;
                display: inline-block;
              }
              .info {
                margin-top: 15px;
                text-align: left;
                background: #f8f9fa;
                padding: 15px;
                border-radius: 10px;
              }
              .info p {
                margin: 5px 0;
                font-size: 12px;
              }
              .info strong {
                color: #003366;
              }
              .photo-container {
                margin: 15px auto;
                max-width: 150px;
              }
              .photo-container h3 {
                font-size: 14px;
                margin-bottom: 10px;
                color: #003366;
              }
              .photo-container img {
                width: 100%;
                max-height: 150px;
                object-fit: contain;
                border-radius: 8px;
                border: 2px solid #ddd;
              }
              .url {
                word-break: break-all;
                font-size: 10px;
                color: #666;
                margin-top: 5px;
              }
              @media print {
                body { 
                  padding: 15px;
                  max-width: 100%;
                }
                button { display: none; }
                .header h1 { font-size: 18px; }
                .photo-container { max-width: 120px; }
                .photo-container img { max-height: 120px; }
              }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>QR Code de l'Échantillon</h1>
              <p style="color: #666;">Scannez ce code pour accéder aux détails</p>
            </div>
            
            <div class="qr-container">
              <div id="qr-code"></div>
            </div>
            
            <div class="info">
              <p><strong>Code :</strong> ${echantillonCode}</p>
              <p><strong>Nature :</strong> ${qrData['Nature'] || 'Sol'}</p>
              <p><strong>Profondeurs :</strong> ${profondeur}</p>
              <p><strong>Nappe phréatique :</strong> ${nappe}</p>
              <p><strong>Type de sondage :</strong> ${typeSondage}</p>
              <p style="margin-top: 10px;"><strong>Essais demandés :</strong> ${qrData['Essais']}</p>
            </div>
            
            <div class="info" style="margin-top: 15px; background: #e3f2fd; padding: 15px; border-radius: 10px;">
              <p style="font-size: 12px; color: #003366; margin-bottom: 10px;"><strong>Photo de l'échantillon :</strong></p>
              ${photoUrl ? `
                <p style="font-size: 11px; margin-bottom: 5px;"><strong>Lien de la photo :</strong></p>
                <a href="${photoUrl}" target="_blank" style="color: #1976D2; text-decoration: underline; font-size: 11px; word-break: break-all; display: block;">${photoUrl}</a>
              ` : `
                <p style="font-size: 11px; color: #856404;">Aucune photo n'a été ajoutée pour cet échantillon</p>
              `}
            </div>
            
            <div class="info" style="margin-top: 15px;">
              <p><strong>Date de retour client :</strong> ${qrData['Date retour client']}</p>
            </div>
            
            <script src="https://unpkg.com/qr-code-styling@1.6.0-rc.1/lib/qr-code-styling.js"></script>
            <script>
              const qrCode = new QRCodeStyling({
                width: 250,
                height: 250,
                data: "${qrCodeGenere}",
                dotsOptions: {
                  color: "#003366",
                  type: "rounded"
                },
                backgroundOptions: {
                  color: "#ffffff"
                },
                cornersSquareOptions: {
                  color: "#003366",
                  type: "extra-rounded"
                },
                cornersDotOptions: {
                  color: "#003366",
                  type: "dot"
                }
              });
              qrCode.append(document.getElementById("qr-code"));
              
              // Attendre que tout soit chargé avant d'imprimer
              window.onload = function() {
                setTimeout(() => {
                  try {
                    window.print();
                    // Fermer la fenêtre après l'impression (avec un délai)
                    setTimeout(() => {
                      window.close();
                    }, 500);
                  } catch (error) {
                    console.error('Erreur impression:', error);
                  }
                }, 1500);
              };
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
    } catch (error) {
      console.error('Erreur lors de l\'impression:', error);
      toast.error('Erreur lors de l\'impression');
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
              <Select value={selectedClient} onValueChange={setSelectedClient} required>
                <SelectTrigger id="client" disabled={loadingClients}>
                  <SelectValue placeholder={loadingClients ? "Chargement..." : "Sélectionner un client"} />
                </SelectTrigger>
                <SelectContent>
                  {Array.isArray(clients) && clients.length > 0 ? (
                    clients.map((client) => (
                      <SelectItem key={client.id} value={client.code}>
                        {client.code} - {client.nom}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="no-client" disabled>
                      {loadingClients ? "Chargement..." : "Aucun client disponible"}
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nature">Nature de l'échantillon *</Label>
                <Select value={formData.nature} onValueChange={(value) => setFormData({ ...formData, nature: value })} required>
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
                <Label htmlFor="numeroSondage">Numéro de sondage</Label>
                <Input
                  id="numeroSondage"
                  value={formData.numeroSondage}
                  onChange={(e) => setFormData({ ...formData, numeroSondage: e.target.value })}
                  placeholder="Ex: SC-01"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="nappe">Nappe phréatique *</Label>
                <Input
                  id="nappe"
                  value={formData.nappe}
                  onChange={(e) => setFormData({ ...formData, nappe: e.target.value })}
                  placeholder="Ex: Non rencontrée ou 3.5m"
                  required
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
                        // Stocker le fichier pour l'upload
                        setPhotoFile(file);
                        // Créer un aperçu
                        const reader = new FileReader();
                        reader.onload = (e) => {
                          const result = e.target?.result as string;
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
              <Button type="submit" style={{ backgroundColor: '#003366' }} disabled={loading || loadingClients}>
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Enregistrement...
                  </>
                ) : (
                  <>
                    <QrCodeIcon className="h-4 w-4 mr-2" />
                    Créer l'échantillon
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* QR Code généré */}
      {qrCodeGenere && (
        <Card>
          <CardHeader>
            <CardTitle>QR Code généré avec succès !</CardTitle>
            <CardDescription>Scannez ce code pour accéder aux détails de l'échantillon</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-center p-6 rounded-lg bg-white border-2" style={{ borderColor: '#003366' }}>
                <div className="text-center space-y-4">
                  {/* QR Code visuel */}
                  <div className="inline-block p-4 bg-white rounded-lg">
                    <QRCode value={qrCodeGenere} size={200} />
                  </div>
                  
                  {/* URL du QR Code */}
                  <div className="space-y-2">
                    <p className="text-sm font-medium" style={{ color: '#003366' }}>
                      URL de l'échantillon :
                    </p>
                    <p className="text-xs font-mono break-all px-4" style={{ color: '#6C757D' }}>
                      {qrCodeGenere}
                    </p>
                  </div>
                </div>
              </div>

              {/* Boutons d'action */}
              <div className="flex gap-3 justify-center">
                <Button 
                  onClick={handlePrintQR} 
                  style={{ backgroundColor: '#003366' }}
                  className="flex-1 max-w-xs"
                >
                  <Printer className="h-4 w-4 mr-2" />
                  Imprimer le QR Code
                </Button>
                
                <Button 
                  onClick={() => {
                    window.open(qrCodeGenere, '_blank');
                  }}
                  variant="outline"
                  className="flex-1 max-w-xs"
                >
                  <QrCodeIcon className="h-4 w-4 mr-2" />
                  Voir la page
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}