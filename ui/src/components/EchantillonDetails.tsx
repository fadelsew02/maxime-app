import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { ArrowLeft, Calendar, MapPin, Layers, User } from 'lucide-react';
import QRCode from 'react-qr-code';
import { searchEchantillonByCode, Echantillon as APIEchantillon } from '../lib/echantillonService';
import { getClient, Client as APIClient } from '../lib/clientService';
import { formatDateFr } from '../lib/dateUtils';

export function EchantillonDetails() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const [echantillon, setEchantillon] = useState<APIEchantillon | null>(null);
  const [client, setClient] = useState<APIClient | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPhotoModal, setShowPhotoModal] = useState(false);

  useEffect(() => {
    const loadEchantillon = async () => {
      if (!code) return;
      
      try {
        setLoading(true);
        // Décoder le code (remplacer les tirets par des slashes si nécessaire)
        const decodedCode = code.replace(/-/g, '/');
        const ech = await searchEchantillonByCode(decodedCode);
        
        if (ech) {
          setEchantillon(ech);
          // Charger les informations du client
          const clientData = await getClient(ech.client);
          setClient(clientData);
        } else {
          setError('Échantillon non trouvé');
        }
      } catch (err) {
        console.error('Erreur chargement échantillon:', err);
        setError('Erreur lors du chargement de l\'échantillon');
      } finally {
        setLoading(false);
      }
    };

    loadEchantillon();
  }, [code]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  if (error || !echantillon) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="text-red-600">Erreur</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">{error || 'Échantillon non trouvé'}</p>
            <Button onClick={() => navigate('/')} variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour à l'accueil
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const formatStatut = (statut: string) => {
    const statusMap: Record<string, string> = {
      'attente': 'En attente',
      'stockage': 'Stockage',
      'essais': 'Essais',
      'decodification': 'Décodification',
      'traitement': 'Traitement',
      'validation': 'Validation',
      'valide': 'Validé',
      'rejete': 'Rejeté'
    };
    return statusMap[statut] || statut;
  };

  const getStatusColor = (statut: string) => {
    const colorMap: Record<string, string> = {
      'attente': '#FFC107',
      'stockage': '#17A2B8',
      'essais': '#003366',
      'decodification': '#6F42C1',
      'traitement': '#FD7E14',
      'validation': '#E83E8C',
      'valide': '#28A745',
      'rejete': '#DC3545'
    };
    return colorMap[statut] || '#6C757D';
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* En-tête avec bouton retour */}
        <div className="mb-6">
          <Button onClick={() => navigate('/')} variant="outline" className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">Détails de l'échantillon</h1>
          <p className="text-gray-600 mt-2">Informations complètes de l'échantillon scanné</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Colonne principale */}
          <div className="lg:col-span-2 space-y-6">
            {/* Informations principales */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-2xl">{echantillon.code}</CardTitle>
                  <Badge
                    style={{
                      backgroundColor: getStatusColor(echantillon.statut),
                      color: '#FFFFFF'
                    }}
                  >
                    {formatStatut(echantillon.statut)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Photo de l'échantillon */}
                {echantillon.photo && (
                  <div className="mb-4">
                    <div className="relative group cursor-pointer" onClick={() => setShowPhotoModal(true)}>
                      <img
                        src={echantillon.photo}
                        alt={`Photo de l'échantillon ${echantillon.code}`}
                        className="w-full h-auto rounded-lg border shadow-sm transition-opacity group-hover:opacity-90"
                        style={{ maxHeight: '400px', objectFit: 'cover' }}
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all rounded-lg">
                        <span className="text-white opacity-0 group-hover:opacity-100 font-semibold text-lg">
                          Cliquer pour agrandir
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Informations du client */}
                {client && (
                  <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
                    <h3 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Client
                    </h3>
                    <div className="space-y-1 text-sm">
                      <p><span className="font-medium">Code:</span> {client.code}</p>
                      <p><span className="font-medium">Nom:</span> {client.nom}</p>
                      <p><span className="font-medium">Contact:</span> {client.contact}</p>
                      <p><span className="font-medium">Projet:</span> {client.projet}</p>
                      {client.email && <p><span className="font-medium">Email:</span> {client.email}</p>}
                      {client.telephone && <p><span className="font-medium">Tél:</span> {client.telephone}</p>}
                    </div>
                  </div>
                )}

                {/* Caractéristiques de l'échantillon */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-start gap-3">
                    <Layers className="h-5 w-5 text-gray-500 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-600">Nature</p>
                      <p className="font-medium">{echantillon.nature}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-gray-500 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-600">Profondeur</p>
                      <p className="font-medium">
                        {echantillon.profondeur_debut}m - {echantillon.profondeur_fin}m
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Calendar className="h-5 w-5 text-gray-500 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-600">Date de réception</p>
                      <p className="font-medium">{formatDateFr(echantillon.date_reception)}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="h-5 w-5 text-gray-500 mt-0.5 flex items-center justify-center">
                      <span className="text-xs font-bold">S</span>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Type de sondage</p>
                      <p className="font-medium capitalize">{echantillon.sondage}</p>
                    </div>
                  </div>
                </div>

                {/* Informations supplémentaires */}
                {echantillon.nappe && (
                  <div className="p-3 rounded-lg bg-gray-50">
                    <p className="text-sm text-gray-600">Nappe phréatique</p>
                    <p className="font-medium">{echantillon.nappe}</p>
                  </div>
                )}

                {echantillon.chef_projet && (
                  <div className="p-3 rounded-lg bg-gray-50">
                    <p className="text-sm text-gray-600">Chef de projet</p>
                    <p className="font-medium">{echantillon.chef_projet}</p>
                  </div>
                )}

                {/* Priorité */}
                {echantillon.priorite === 'urgente' && (
                  <Badge variant="destructive" className="text-sm">
                    ÉCHANTILLON URGENT
                  </Badge>
                )}
              </CardContent>
            </Card>

            {/* Essais demandés */}
            {echantillon.essais && echantillon.essais.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Essais demandés</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {echantillon.essais.map((essai: any) => (
                      <Badge key={essai.id || essai} variant="outline" className="text-sm">
                        {typeof essai === 'string' ? essai : essai.type}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Colonne latérale - QR Code */}
          <div className="lg:col-span-1">
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle className="text-center">QR Code</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center space-y-4">
                <div className="bg-white p-4 rounded-lg border">
                  <QRCode value={echantillon.qr_code} size={200} />
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600">Code QR</p>
                  <p className="font-mono text-sm font-medium">{echantillon.qr_code}</p>
                </div>
                <Button
                  onClick={() => {
                    try {
                      window.print();
                    } catch (error) {
                      console.error('Erreur impression:', error);
                    }
                  }}
                  className="w-full"
                  style={{ backgroundColor: '#003366' }}
                >
                  Imprimer cette page
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Modal pour afficher la photo en grand */}
      {showPhotoModal && echantillon?.photo && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4"
          onClick={() => setShowPhotoModal(false)}
        >
          <div className="relative max-w-6xl max-h-full">
            <button
              onClick={() => setShowPhotoModal(false)}
              className="absolute top-4 right-4 bg-white rounded-full p-2 shadow-lg hover:bg-gray-100 z-10"
            >
              <span className="text-2xl font-bold">&times;</span>
            </button>
            <img
              src={echantillon.photo}
              alt={`Photo de l'échantillon ${echantillon.code}`}
              className="max-w-full max-h-screen rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}

      {/* Styles pour l'impression */}
      <style>{`
        @media print {
          .sticky { position: relative !important; }
          button { display: none !important; }
        }
      `}</style>
    </div>
  );
}
