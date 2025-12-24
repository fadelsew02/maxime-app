import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { FileText } from 'lucide-react';

export function TraitementTest() {
  const essaisTraitement = [
    {
      echantillonCode: 'S-0001/25',
      essaiType: 'AG',
      clientCode: 'CLI-001',
      dateDecodification: '05/12/2025',
      dateRetourClient: '-',
      dateReception: '02/12/2025',
      operateur: 'MIRACLE',
      dureeEstimee: 5,
      dateDebut: '2025-12-05',
      dateFin: '2025-12-10',
      resultats: {
        pourcent_inf_2mm: '01',
        pourcent_inf_80um: '01',
        coefficient_uniformite: '01'
      },
      commentaires: 'BON',
      fichier: 'code.pdf',
      validationComment: 'bon'
    },
    {
      echantillonCode: 'S-0002/25',
      essaiType: 'Proctor',
      clientCode: 'CLI-002',
      dateDecodification: '05/12/2025',
      dateRetourClient: '-',
      dateReception: '02/12/2025',
      operateur: 'MIRACLE',
      dureeEstimee: 4,
      dateDebut: '2025-12-05',
      dateFin: '2025-12-09',
      resultats: {
        type_proctor: 'Standard',
        densite_opt: '1.85',
        teneur_eau_opt: '12.5'
      },
      commentaires: 'Conforme',
      fichier: 'proctor.pdf',
      validationComment: 'Validé'
    }
  ];

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1>Tableau de bord Traitement</h1>
        <p style={{ color: '#A9A9A9' }}>
          Suivi des traitements
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Essais en traitement</CardTitle>
          <CardDescription>
            2 essai(s) accepté(s) en traitement
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3 font-semibold">Code Client</th>
                  <th className="text-left p-3 font-semibold">Code Échantillon</th>
                  <th className="text-left p-3 font-semibold">Type d'Essai</th>
                  <th className="text-left p-3 font-semibold">Date Décodification</th>
                  <th className="text-left p-3 font-semibold">Fichier</th>
                  <th className="text-left p-3 font-semibold">Date de Retour Client</th>
                </tr>
              </thead>
              <tbody>
                {essaisTraitement.map((essai, index) => (
                  <tr key={`${essai.echantillonCode}_${essai.essaiType}`} className="border-b hover:bg-gray-50">
                    <td className="p-3">
                      <span className="font-medium">{essai.clientCode}</span>
                    </td>
                    <td className="p-3">
                      <span className="font-medium">{essai.echantillonCode}</span>
                    </td>
                    <td className="p-3">
                      <Badge variant="outline" style={{ backgroundColor: '#28A745', color: '#FFFFFF' }}>
                        {essai.essaiType}
                      </Badge>
                    </td>
                    <td className="p-3">
                      <span className="text-sm">{essai.dateDecodification}</span>
                    </td>
                    <td className="p-3">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          let resultatsText = '';
                          if (essai.essaiType === 'AG') {
                            resultatsText = `% passant à 2mm: ${essai.resultats.pourcent_inf_2mm}\n% passant à 80µm: ${essai.resultats.pourcent_inf_80um}\nCoefficient d'uniformité (Cu): ${essai.resultats.coefficient_uniformite}`;
                          } else if (essai.essaiType === 'Proctor') {
                            resultatsText = `Type Proctor: ${essai.resultats.type_proctor}\nDensité sèche optimale: ${essai.resultats.densite_opt} g/cm³\nTeneur en eau optimale: ${essai.resultats.teneur_eau_opt}%`;
                          }
                          
                          const pdfContent = `RAPPORT D'ESSAI ${essai.essaiType}\n\nÉchantillon: ${essai.echantillonCode}\nClient: ${essai.clientCode}\nDate réception: ${essai.dateReception}\nOpérateur: ${essai.operateur}\nDurée estimée: ${essai.dureeEstimee} jours\nDate début: ${essai.dateDebut}\nDate fin: ${essai.dateFin}\n\nRÉSULTATS:\n${resultatsText}\n\nCOMMENTAIRES:\n${essai.commentaires}\n\nVALIDATION:\n${essai.validationComment}\n\nFichier original: ${essai.fichier}`;
                          const blob = new Blob([pdfContent], { type: 'text/plain' });
                          const url = URL.createObjectURL(blob);
                          const link = document.createElement('a');
                          link.href = url;
                          link.download = `Rapport_${essai.essaiType}_${essai.echantillonCode}.txt`;
                          link.click();
                          URL.revokeObjectURL(url);
                        }}
                      >
                        <FileText className="h-4 w-4 mr-1" />
                        Télécharger
                      </Button>
                    </td>
                    <td className="p-3">
                      <span className="text-sm text-gray-500">{essai.dateRetourClient}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}