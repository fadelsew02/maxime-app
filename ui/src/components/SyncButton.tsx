import React, { useState } from 'react';
import { Button } from './ui/button';
import { apiService } from '../services/apiService';
import { Database, CheckCircle, XCircle, X } from 'lucide-react';

export function SyncButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [syncResult, setSyncResult] = useState<any>(null);

  const handleSync = async () => {
    setIsLoading(true);
    setSyncResult(null);
    try {
      const result = await apiService.syncLocalStorageData();
      setSyncResult(result);
      if (result.success) {
        setTimeout(() => window.location.reload(), 1500);
      }
    } catch (error) {
      setSyncResult({ success: false, error });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative">
      <Button 
        onClick={() => setIsOpen(true)} 
        variant="outline"
        size="sm"
        className="flex items-center gap-2"
      >
        <Database className="h-4 w-4" />
        Sync Backend
      </Button>
      
      {isOpen && (
        <div className="absolute top-12 right-0 bg-white border rounded-lg shadow-lg p-4" style={{width: '320px'}}>
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-semibold">Synchronisation</h3>
            <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          <p className="text-sm text-gray-600 mb-4">
            Synchroniser localStorage avec le backend
          </p>
          
          {syncResult && (
            <div className="mb-4 p-2 rounded">
              {syncResult.success ? (
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="h-4 w-4" />
                  <span className="text-sm">{syncResult.syncCount} éléments synchronisés</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-red-600">
                  <XCircle className="h-4 w-4" />
                  <span className="text-sm">Erreur de synchronisation</span>
                </div>
              )}
            </div>
          )}
          
          <Button 
            onClick={handleSync} 
            disabled={isLoading}
            className="w-full"
            style={{ backgroundColor: '#003366' }}
          >
            {isLoading ? 'Synchronisation...' : 'Démarrer'}
          </Button>
        </div>
      )}
    </div>
  );
}