import { useState } from 'react';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Database, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { migrateAllLocalStorageData, displayMigrationReport } from '../utils/migrateLocalStorageToBackend';

export function MigrationButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMigrating, setIsMigrating] = useState(false);
  const [results, setResults] = useState<any>(null);

  const handleMigrate = async () => {
    setIsMigrating(true);
    toast.info('Migration en cours...');

    try {
      const migrationResults = await migrateAllLocalStorageData();
      setResults(migrationResults);
      displayMigrationReport(migrationResults);

      const totalSuccess = 
        migrationResults.rapports.success + 
        migrationResults.essais.success + 
        migrationResults.planifications.success;
      
      const totalErrors = 
        migrationResults.rapports.errors + 
        migrationResults.essais.errors + 
        migrationResults.planifications.errors;

      if (totalErrors === 0) {
        toast.success(`Migration réussie ! ${totalSuccess} éléments migrés`);
      } else {
        toast.warning(`Migration terminée avec ${totalErrors} erreurs. ${totalSuccess} éléments migrés.`);
      }
    } catch (error) {
      console.error('Erreur migration:', error);
      toast.error('Erreur lors de la migration');
    } finally {
      setIsMigrating(false);
    }
  };

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        variant="outline"
        size="sm"
        style={{ borderColor: '#003366', color: '#003366' }}
      >
        <Database className="h-4 w-4 mr-2" />
        Migrer localStorage → Backend
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Migration localStorage vers Backend</DialogTitle>
            <DialogDescription>
              Transférer toutes les données localStorage vers la base de données backend
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="p-4 rounded-lg" style={{ backgroundColor: '#FFF3CD', border: '1px solid #FFC107' }}>
              <p className="text-sm" style={{ color: '#856404' }}>
                ⚠️ Cette opération va transférer toutes les données actuellement stockées dans localStorage vers le backend.
                Les données ne seront pas supprimées de localStorage.
              </p>
            </div>

            {!results && !isMigrating && (
              <div className="space-y-3">
                <h3 className="font-semibold">Données à migrer:</h3>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" style={{ color: '#28A745' }} />
                    Rapports en validation (sent_to_chef_*, sent_to_directeur_*, sent_to_marketing_*)
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" style={{ color: '#28A745' }} />
                    Données d'essais (CODE_TYPE)
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" style={{ color: '#28A745' }} />
                    Planifications (plan_*)
                  </li>
                </ul>
              </div>
            )}

            {isMigrating && (
              <div className="flex flex-col items-center justify-center py-8">
                <Loader2 className="h-12 w-12 animate-spin" style={{ color: '#003366' }} />
                <p className="mt-4 text-sm" style={{ color: '#6C757D' }}>
                  Migration en cours... Veuillez patienter
                </p>
              </div>
            )}

            {results && !isMigrating && (
              <div className="space-y-4">
                <h3 className="font-semibold">Résultats de la migration:</h3>
                
                <div className="space-y-3">
                  {/* Rapports */}
                  <div className="p-3 rounded-lg" style={{ backgroundColor: '#F5F5F5' }}>
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium">📄 Rapports de validation</span>
                      <div className="flex gap-2">
                        <span className="text-sm" style={{ color: '#28A745' }}>
                          ✅ {results.rapports.success}
                        </span>
                        {results.rapports.errors > 0 && (
                          <span className="text-sm" style={{ color: '#DC3545' }}>
                            ❌ {results.rapports.errors}
                          </span>
                        )}
                      </div>
                    </div>
                    {results.rapports.details.length > 0 && (
                      <div className="max-h-32 overflow-y-auto text-xs" style={{ color: '#6C757D' }}>
                        {results.rapports.details.slice(0, 5).map((detail: string, i: number) => (
                          <div key={i}>{detail}</div>
                        ))}
                        {results.rapports.details.length > 5 && (
                          <div>... et {results.rapports.details.length - 5} autres</div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Essais */}
                  <div className="p-3 rounded-lg" style={{ backgroundColor: '#F5F5F5' }}>
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium">🧪 Données d'essais</span>
                      <div className="flex gap-2">
                        <span className="text-sm" style={{ color: '#28A745' }}>
                          ✅ {results.essais.success}
                        </span>
                        {results.essais.errors > 0 && (
                          <span className="text-sm" style={{ color: '#DC3545' }}>
                            ❌ {results.essais.errors}
                          </span>
                        )}
                      </div>
                    </div>
                    {results.essais.details.length > 0 && (
                      <div className="max-h-32 overflow-y-auto text-xs" style={{ color: '#6C757D' }}>
                        {results.essais.details.slice(0, 5).map((detail: string, i: number) => (
                          <div key={i}>{detail}</div>
                        ))}
                        {results.essais.details.length > 5 && (
                          <div>... et {results.essais.details.length - 5} autres</div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Planifications */}
                  <div className="p-3 rounded-lg" style={{ backgroundColor: '#F5F5F5' }}>
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium">📅 Planifications</span>
                      <div className="flex gap-2">
                        <span className="text-sm" style={{ color: '#28A745' }}>
                          ✅ {results.planifications.success}
                        </span>
                        {results.planifications.errors > 0 && (
                          <span className="text-sm" style={{ color: '#DC3545' }}>
                            ❌ {results.planifications.errors}
                          </span>
                        )}
                      </div>
                    </div>
                    {results.planifications.details.length > 0 && (
                      <div className="max-h-32 overflow-y-auto text-xs" style={{ color: '#6C757D' }}>
                        {results.planifications.details.slice(0, 5).map((detail: string, i: number) => (
                          <div key={i}>{detail}</div>
                        ))}
                        {results.planifications.details.length > 5 && (
                          <div>... et {results.planifications.details.length - 5} autres</div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-4 rounded-lg" style={{ backgroundColor: '#D4EDDA', border: '1px solid #28A745' }}>
                  <p className="text-sm font-semibold" style={{ color: '#155724' }}>
                    ✅ Migration terminée ! Consultez la console pour plus de détails.
                  </p>
                </div>
              </div>
            )}

            <div className="flex gap-2 justify-end pt-4">
              {!isMigrating && !results && (
                <>
                  <Button variant="outline" onClick={() => setIsOpen(false)}>
                    Annuler
                  </Button>
                  <Button
                    onClick={handleMigrate}
                    style={{ backgroundColor: '#003366', color: '#FFFFFF' }}
                  >
                    <Database className="h-4 w-4 mr-2" />
                    Lancer la migration
                  </Button>
                </>
              )}
              {results && (
                <Button onClick={() => setIsOpen(false)} style={{ backgroundColor: '#28A745', color: '#FFFFFF' }}>
                  Fermer
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
