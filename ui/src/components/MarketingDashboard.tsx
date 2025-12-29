import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';

interface MarketingData {
  clientName: string;
  clientAddress: string;
  clientPhone: string;
  dateRetourClient: string;
}

export function MarketingDashboard() {
  const [data, setData] = useState<MarketingData[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    const marketingData: MarketingData[] = [];

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('sent_to_marketing_')) {
        const rapportData = localStorage.getItem(key);
        if (rapportData) {
          try {
            const rapport = JSON.parse(rapportData);
            if (!rapport.processedByMarketing) {
              let clientAddress = '-';
              let clientPhone = '-';
              let dateRetour = '-';

              try {
                const clientsResponse = await fetch('https://snertp.onrender.com/api/clients/', {
                  headers: {
                    'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
                    'Content-Type': 'application/json',
                  },
                });
                const clientsData = await clientsResponse.json();
                const client = clientsData.results.find((c: any) => c.nom === rapport.clientName);
                if (client) {
                  clientAddress = client.email || client.adresse || '-';
                  clientPhone = client.telephone || '-';
                }
              } catch (error) {
                const clientsLS = localStorage.getItem('clients');
                if (clientsLS) {
                  const clients = JSON.parse(clientsLS);
                  const client = clients.find((c: any) => c.nom === rapport.clientName);
                  if (client) {
                    clientAddress = client.email || client.adresse || '-';
                    clientPhone = client.telephone || '-';
                  }
                }
              }

              try {
                const echResponse = await fetch('https://snertp.onrender.com/api/echantillons/', {
                  headers: {
                    'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
                    'Content-Type': 'application/json',
                  },
                });
                const echData = await echResponse.json();
                const ech = echData.results.find((e: any) => e.code === rapport.code);
                if (ech && ech.date_retour_predite) {
                  dateRetour = new Date(ech.date_retour_predite).toLocaleDateString('fr-FR');
                }
              } catch (error) {}

              marketingData.push({
                clientName: rapport.clientName,
                clientAddress,
                clientPhone,
                dateRetourClient: dateRetour
              });
            }
          } catch (e) {}
        }
      }
    }

    setData(marketingData);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1>Tableau de bord Marketing</h1>
        <p style={{ color: '#A9A9A9' }}>
          Rapports en attente d'envoi aux clients
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Clients à contacter</CardTitle>
              <CardDescription>{data.length} rapport(s) en attente</CardDescription>
            </div>
            <Button onClick={loadData} disabled={loading}>
              {loading ? 'Chargement...' : 'Actualiser'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3 font-semibold">Nom du client</th>
                  <th className="text-left p-3 font-semibold">Adresse</th>
                  <th className="text-left p-3 font-semibold">Numéro</th>
                  <th className="text-left p-3 font-semibold">Date de retour client</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={4} className="p-3 text-center text-gray-500">
                      Chargement...
                    </td>
                  </tr>
                ) : data.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-3 text-center text-gray-500">
                      Aucun rapport en attente
                    </td>
                  </tr>
                ) : (
                  data.map((item, index) => (
                    <tr key={index} className="border-b hover:bg-gray-50">
                      <td className="p-3">
                        <span className="font-medium">{item.clientName}</span>
                      </td>
                      <td className="p-3">
                        <span className="text-sm">{item.clientAddress}</span>
                      </td>
                      <td className="p-3">
                        <span className="text-sm">{item.clientPhone}</span>
                      </td>
                      <td className="p-3">
                        <span className="text-sm">{item.dateRetourClient}</span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
