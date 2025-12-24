import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Label } from '../ui/label';

export function ChefProjetRejeteModule() {
  const [essaisRejetes, setEssaisRejetes] = useState<any[]>([]);
  const [filteredRejetes, setFilteredRejetes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState<string>('all');

  const loadEssaisRejetes = () => {
    setLoading(true);
    const rejetes: any[] = [];

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('sent_to_chef_')) {
        const data = localStorage.getItem(key);
        if (data) {
          try {
            const sentData = JSON.parse(data);
            // Vérifier si rejeté par le chef de projet UNIQUEMENT (pas par le chef de service)
            if (sentData.rejected === true && !sentData.rejectedByChefService) {
              const parts = key.replace('sent_to_chef_', '').split('_');
              const essaiType = parts[parts.length - 1];
              const echantillonCode = parts.slice(0, -1).join('_');
              
              rejetes.push({
                echantillonCode,
                essaiType,
                chefProjet: sentData.chefProjet,
                dateSent: sentData.date,
                dateRejected: sentData.dateRejected,
                rejectionReason: sentData.rejectionReason || '-',
                file: sentData.file
              });
            }
          } catch (e) {}
        }
      }
    }

    setEssaisRejetes(rejetes);
    setFilteredRejetes(rejetes);
    setLoading(false);
  };

  const applyDateFilter = (filter: string) => {
    setDateFilter(filter);
    const now = new Date();
    
    if (filter === 'all') {
      setFilteredRejetes(essaisRejetes);
      return;
    }
    
    const filtered = essaisRejetes.filter(essai => {
      const rejectedDate = new Date(essai.dateRejected);
      
      if (filter === 'today') {
        return rejectedDate.toDateString() === now.toDateString();
      } else if (filter === 'month') {
        return rejectedDate.getMonth() === now.getMonth() && 
               rejectedDate.getFullYear() === now.getFullYear();
      } else if (filter === 'year') {
        return rejectedDate.getFullYear() === now.getFullYear();
      }
      return true;
    });
    
    setFilteredRejetes(filtered);
  };

  useEffect(() => {
    loadEssaisRejetes();
  }, []);

  return (
    <div className="p-8 bg-background">
      <div className="mb-8">
        <h1>Rapports rejetés</h1>
        <p style={{ color: '#A9A9A9' }}>
          Rapports rejetés par le chef de projet
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Rapports rejetés</CardTitle>
              <CardDescription>
                {filteredRejetes.length} rapport(s) rejeté(s) sur {essaisRejetes.length} au total
              </CardDescription>
            </div>
            <Button onClick={loadEssaisRejetes} disabled={loading}>
              {loading ? 'Chargement...' : 'Actualiser'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <Label>Filtrer par période</Label>
            <Select value={dateFilter} onValueChange={applyDateFilter}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les périodes</SelectItem>
                <SelectItem value="today">Aujourd'hui</SelectItem>
                <SelectItem value="month">Ce mois</SelectItem>
                <SelectItem value="year">Cette année</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                <p className="mt-2 text-gray-500">Chargement...</p>
              </div>
            ) : filteredRejetes.length === 0 ? (
              <div className="text-center py-12" style={{ color: '#A9A9A9' }}>
                Aucun rapport rejeté pour cette période
              </div>
            ) : (
              filteredRejetes.map((essai, index) => (
                <div
                  key={`${essai.echantillonCode}_${essai.essaiType}_${index}`}
                  className="p-4 rounded-lg"
                  style={{ backgroundColor: '#F5F5F5' }}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="font-semibold">{essai.echantillonCode}</span>
                        <Badge style={{ backgroundColor: '#DC3545', color: '#FFFFFF' }}>
                          {essai.essaiType}
                        </Badge>
                        <Badge variant="outline" style={{ borderColor: '#DC3545', color: '#DC3545' }}>
                          Rejeté ✗
                        </Badge>
                      </div>
                      <div className="text-sm space-y-1" style={{ color: '#6C757D' }}>
                        <p>Chef de projet: {essai.chefProjet}</p>
                        <p>Date d'envoi: {new Date(essai.dateSent).toLocaleString('fr-FR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}</p>
                        <p>Date de rejet: {new Date(essai.dateRejected).toLocaleString('fr-FR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}</p>
                        <p>Raison du rejet: {essai.rejectionReason}</p>
                        <p>Fichier: {essai.file}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
